import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiProvider, AiResponse } from './ai-provider.interface';
import { CopilotStore, ChatMessage, AIKnowledgeDoc, AIPrompt } from './copilot.store';
import { OpenAI } from 'openai';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as url from 'url';

// A simple helper for https POST requests
function postJson(targetUrl: string, body: any): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = url.parse(targetUrl);
      const postData = JSON.stringify(body);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, data });
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  
  // Cache for token and response optimization (Key: chatId+query, Value: response)
  private queryCache = new Map<string, { response: any, expiry: number }>();

  // Rate Limiting (Key: userId, Value: count and reset window timestamp)
  private rateLimits = new Map<string, { count: number, resetTime: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    // 1. Seed System Prompts in JSON Store
    const prompts = CopilotStore.getPrompts();
    const defaultPrompt = prompts.find(p => p.name === 'JNI_DRIVER_COPILOT_SYSTEM');

    if (!defaultPrompt) {
      CopilotStore.upsertPrompt({
        name: 'JNI_DRIVER_COPILOT_SYSTEM',
        category: 'GENERAL',
        content: `You are the premium AI Co-pilot assistant for JNI Solutions. 
Your tone is professional, helpful, concise, and reassuring. 
Your target audience is TLC, Uber, Lyft, and commercial drivers in NYC.
Guide drivers with TLC rules, DMV summonses, vehicle inspections, insurance, renewals, and billing queries.
Always reference documents, policies, or FAQs where available.`,
        isActive: true,
      });
      this.logger.log('Default System Prompt seeded in JSON store.');
    }

    // 2. Seed default FAQ Knowledge Docs in JSON Store
    const docs = CopilotStore.getKnowledgeDocs();
    if (docs.length === 0) {
      const defaultDocs = [
        {
          title: 'TLC License Renewal Guidelines',
          category: 'TLC',
          tags: ['renew', 'renewal', 'tlc', 'license', 'requirement'],
          content: `To renew your NYC TLC Driver License:
1. Submit renewal application online via LARS (TLC License Renewal Application System).
2. Take the 24-hour TLC Driver License renewal course.
3. Pass a drug test at an approved TLC facility (expires yearly).
4. Pay the renewal fee.
Ensure you upload proof of your drug screening and course certificate to your JNI documents portal.`,
        },
        {
          title: 'DMV Woodside Safety Inspections',
          category: 'DMV',
          tags: ['inspection', 'woodside', 'dmv', 'vehicle', 'safety'],
          content: `TLC vehicles require safety and emissions inspections every 4 months (3 times a year). 
The primary inspection hub is at DMV Woodside (Queens, NY). 
Please make an appointment via LARS, keep your vehicle clean, and check all lights, tires, and brake pads beforehand. 
Failure to pass leads to an immediate TLC suspension and a $200 fine.`,
        },
        {
          title: 'JNI Subscription Billing Help',
          category: 'BILLING',
          tags: ['billing', 'subscription', 'price', 'payment', 'premium', 'basic'],
          content: `JNI Solutions offers three tiers:
1. Basic Plan ($29/mo) - Document scanner and compliance tracker.
2. Premium Plan ($49/mo) - Adds AI Co-pilot assistant, surge alerts, and template dispatcher.
3. Enterprise Plan ($99/mo) - Fully dedicated support agent dispatch.
Manage payment methods, billing intervals, or cancel your subscription at the Billing Portal.`,
        },
        {
          title: 'Annual Drug Testing Compliance',
          category: 'TLC',
          tags: ['drug', 'test', 'screening', 'annual', 'deadline'],
          content: `All NYC TLC drivers must undergo annual drug screening within 90 days before their license anniversary date. 
Official testing centers include Labcorp and Quest Diagnostics. 
Verify your drug test compliance status under the JNI Compliance Dashboard.`,
        },
      ];

      for (const d of defaultDocs) {
        CopilotStore.createKnowledgeDoc(d);
      }
      this.logger.log('Default Knowledge Base FAQs seeded in JSON store.');
    }
  }

  // Abstraction Factory Pattern - Forced to always use OpenAI API key
  getProvider(providerName: string, sessionId?: string): AiProvider {
    const apiKey = process.env.OPENAI_API_KEY;
    const isKeyConfigured = apiKey && apiKey.trim() !== '' && !apiKey.startsWith('YOUR_');

    if (isKeyConfigured) {
      this.logger.log('Forcing OpenAI Provider using configured API Key');
      return new OpenAiProvider(apiKey!);
    }

    this.logger.log(`Using Fallback Mock Provider for selected engine: ${providerName}`);
    return new MockAiProvider(providerName);
  }

  // RAG Search Logic
  async getRelevantKnowledgeDocs(query: string): Promise<any[]> {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return [];

    // Search local FAQ knowledge docs from JSON store
    const faqDocs = CopilotStore.getKnowledgeDocs();

    // Format all documents to a common search shape
    const combinedDocs = faqDocs.map(d => ({
      title: d.title,
      content: d.content,
      tags: d.tags || [],
      source: 'FAQ'
    }));

    // Score documents by keyword hits in title, content, or tags
    const scored = combinedDocs.map((doc) => {
      let score = 0;
      words.forEach((word) => {
        if (doc.title.toLowerCase().includes(word)) score += 3;
        if (doc.content.toLowerCase().includes(word)) score += 1;
        if (doc.tags.some(tag => tag.toLowerCase().includes(word))) score += 2;
      });
      return { ...doc, score };
    });

    return scored
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }

  // Safety & Abuse checks
  checkSafety(query: string): { isSafe: boolean; warning?: string } {
    const normalized = query.toLowerCase();
    const profanities = ['fuck', 'shit', 'asshole', 'bitch', 'scam', 'fraud', 'abusive'];
    const hasAbuse = profanities.some(word => normalized.includes(word));

    if (hasAbuse) {
      return {
        isSafe: false,
        warning: '⚠️ JNI Safety Advisory: Your message contains phrases violating our terms of service. Please remain professional.',
      };
    }
    return { isSafe: true };
  }

  // Auto Detect Language Logic
  detectLanguage(query: string): string {
    const normalized = query.toLowerCase();
    
    // Arabic/Urdu script range check
    if (/[\u0600-\u06FF]/.test(query)) {
      return 'Urdu';
    }
    // Bengali script range check
    if (/[\u0980-\u09FF]/.test(query)) {
      return 'Bangla';
    }
    // Devanagari/Hindi script range check
    if (/[\u0900-\u097F]/.test(query)) {
      return 'Hindi';
    }
    // Spanish common words list
    const spanishKeywords = ['hola', 'como', 'esta', 'renovar', 'licencia', 'inspección', 'multa', 'documento', 'pago', 'ayuda'];
    if (spanishKeywords.some(word => normalized.includes(word))) {
      return 'Spanish';
    }
    
    return 'English';
  }

  async generateChatTitle(query: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    const isKeyConfigured = apiKey && apiKey.trim() !== '' && !apiKey.startsWith('YOUR_');
    if (isKeyConfigured) {
      try {
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant. Generate a short, descriptive title (maximum 3-5 words, no punctuation, no quotes) for a chat session based on the user\'s first message. Do not include any filler text. Respond ONLY with the title.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
          max_tokens: 15,
        });
        const title = response.choices[0]?.message?.content?.trim();
        if (title) {
          // Remove wrapping quotes if any
          return title.replace(/^["']|["']$/g, '');
        }
      } catch (e) {
        Logger.error('Failed to generate chat title via OpenAI, falling back to substring', e);
      }
    }
    // Fallback
    const words = query.trim().split(/\s+/);
    if (words.length <= 5) {
      return query.trim();
    }
    return words.slice(0, 5).join(' ') + '...';
  }

  // Process message pipeline
  async processQuery(
    driverId: string,
    query: string,
    chatId: string,
    language: string = 'English',
    selectedProvider: string = 'OpenAI',
    onToken?: (token: string, text: string) => void,
    savedAIId: string = crypto.randomUUID(),
    files?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>,
  ): Promise<{ message: ChatMessage; ticketCreated?: any }> {
    // A. Rate Limiter check
    const now = Date.now();
    const userLimit = this.rateLimits.get(driverId);

    if (userLimit && now < userLimit.resetTime) {
      if (userLimit.count >= 15) {
        const rateLimitMsg: ChatMessage = {
          id: savedAIId,
          chatId,
          sender: 'AI',
          message: '⚠️ Rate Limit Exceeded: You have reached the limit of 15 queries per minute. Please try again shortly to avoid token abuse.',
          confidenceScore: 1.0,
          language,
          isPinned: false,
          createdAt: new Date().toISOString(),
        };
        CopilotStore.saveMessage(rateLimitMsg);
        
        if (onToken) {
          onToken(rateLimitMsg.message, rateLimitMsg.message);
        }
        return { message: rateLimitMsg };
      }
      userLimit.count++;
    } else {
      this.rateLimits.set(driverId, { count: 1, resetTime: now + 60000 });
    }

    // B. Language Auto-Detection
    let targetLanguage = language;
    if (language === 'Auto-Detect') {
      targetLanguage = this.detectLanguage(query);
    }

    // C. Cache check for duplicate/repeat prompts in the same chat within 30s
    const cacheKey = `${chatId}:${query.trim().toLowerCase()}:${targetLanguage}:${selectedProvider}`;
    const cachedItem = this.queryCache.get(cacheKey);
    if (cachedItem && now < cachedItem.expiry) {
      this.logger.log(`Cache Hit for prompt: "${query}" in chat ${chatId}`);
      
      const cachedResponseText = cachedItem.response.message + '\n\n*(Optimized: Cached Response)*';
      const savedAICached: ChatMessage = {
        id: savedAIId,
        chatId,
        sender: 'AI',
        message: cachedResponseText,
        confidenceScore: cachedItem.response.confidenceScore,
        language: targetLanguage,
        isPinned: false,
        createdAt: new Date().toISOString(),
      };
      CopilotStore.saveMessage(savedAICached);
      
      if (onToken) {
        // Stream the cached response instantly
        const words = cachedResponseText.split(' ');
        let currentText = '';
        for (let i = 0; i < words.length; i++) {
          currentText += words[i] + (i === words.length - 1 ? '' : ' ');
          onToken(words[i], currentText);
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      }
      return { message: savedAICached };
    }

    // 1. Safety audit
    const safety = this.checkSafety(query);
    if (!safety.isSafe) {
      const warningMsg: ChatMessage = {
        id: savedAIId,
        chatId,
        sender: 'AI',
        message: safety.warning || '',
        confidenceScore: 1.0,
        language,
        isPinned: false,
        createdAt: new Date().toISOString(),
      };
      CopilotStore.saveMessage(warningMsg);
      if (onToken) {
        onToken(warningMsg.message, warningMsg.message);
      }
      return { message: warningMsg };
    }

    // 2. Fetch system prompt
    const activePrompt = CopilotStore.getActivePrompt();
    const systemPromptContent = activePrompt?.content || 'You are the JNI Solutions Co-pilot.';

    // 3. Fetch RAG FAQs context
    const matchedDocs = await this.getRelevantKnowledgeDocs(query);

    // 4. Fetch chat history (last 5 messages) from JSON Store
    const historyDb = CopilotStore.getMessagesByChatId(chatId);
    const history = historyDb
      .slice(-5)
      .map(m => ({ role: m.sender as 'USER' | 'AI', content: m.message }));

    // 5. Generate Response via Abstraction Provider
    const provider = this.getProvider(selectedProvider, chatId);
    const start = Date.now();
    
    const result = await provider.generateResponse(
      query,
      systemPromptContent,
      history,
      matchedDocs,
      targetLanguage,
      onToken,
      files,
    );
    const durationMs = Date.now() - start;

    // 6. Log AI Usage Metrics to JSON Store and Prisma
    const cost = result.tokensUsed.prompt * 0.000005 + result.tokensUsed.completion * 0.000015;
    
    // Create metric log
    CopilotStore.logMetric({
      userId: driverId,
      provider: result.provider,
      modelName: result.model,
      promptTokens: result.tokensUsed.prompt,
      completionTokens: result.tokensUsed.completion,
      durationMs,
      cost,
    });

    // Mirror to Prisma AIUsage placeholder for database consistency if needed
    try {
      await this.prisma.aIUsage.create({
        data: {}
      });
    } catch (e) {
      this.logger.warn('Failed to insert empty placeholder into AIUsage DB');
    }

    // 7. Save AI message
    let finalMessage = result.text;
    let confidence = result.confidence;

    // 8. Low Confidence Escalation (Confidence < 0.4) - Disabled per user request
    let ticketCreated: any = null;

    const savedAI: ChatMessage = {
      id: savedAIId,
      chatId,
      sender: 'AI',
      message: finalMessage,
      confidenceScore: confidence,
      language: targetLanguage,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    CopilotStore.saveMessage(savedAI);

    // Cache the successful response for 30 seconds
    if (confidence >= 0.4) {
      this.queryCache.set(cacheKey, {
        response: savedAI,
        expiry: now + 30000, // 30 seconds
      });
    }

    return { message: savedAI, ticketCreated };
  }
}

// Real OpenAI Provider using openai SDK package
class OpenAiProvider implements AiProvider {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateResponse(
    query: string,
    systemPrompt: string,
    history: { role: 'USER' | 'AI'; content: string }[],
    knowledgeDocs: { title: string; content: string }[],
    language: string,
    onToken?: (token: string, text: string) => void,
    files?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>,
  ): Promise<AiResponse> {
    // Construct system message with RAG context
    const contextStr = knowledgeDocs.map(d => `[${d.title}]: ${d.content}`).join('\n\n');
    const systemInstruction = `${systemPrompt}\n\nLanguage Instruction: Respond in ${language}.\n\nMatched Context Documents:\n${contextStr}`;

    const messages: any[] = [
      { role: 'system', content: systemInstruction },
      ...history.map(h => ({
        role: h.role === 'USER' ? 'user' : 'assistant',
        content: h.content,
      })),
    ];

    const imageAttachments = files?.filter(f => f.mimeType?.startsWith('image/')) || [];

    if (imageAttachments.length > 0) {
      const contents: any[] = [{ type: 'text', text: query }];
      for (const img of imageAttachments) {
        const filePath = path.join(process.cwd(), img.s3Key);
        if (fs.existsSync(filePath)) {
          try {
            const base64Image = fs.readFileSync(filePath).toString('base64');
            contents.push({
              type: 'image_url',
              image_url: {
                url: `data:${img.mimeType};base64,${base64Image}`
              }
            });
          } catch (err) {
            console.error(`Failed to read physical attachment for vision in copilot: ${filePath}`, err);
          }
        }
      }
      messages.push({ role: 'user', content: contents });
    } else {
      messages.push({ role: 'user', content: query });
    }

    let fullText = '';
    let promptTokens = 150 + query.split(/\s+/).length + systemInstruction.split(/\s+/).length;
    let completionTokens = 0;

    try {
      if (onToken) {
        const stream = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          stream: true,
        });

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            completionTokens++;
            onToken(token, fullText);
          }
        }
      } else {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
        });
        fullText = completion.choices[0]?.message?.content || '';
        completionTokens = fullText.split(/\s+/).length;
      }
    } catch (e) {
      Logger.error('OpenAI SDK Completion call failed, falling back to mock response', e);
      // Failsafe Mock call if OpenAI fails at runtime (e.g. rate limit / network error)
      const mock = new MockAiProvider('openai');
      return mock.generateResponse(query, systemPrompt, history, knowledgeDocs, language, onToken, files);
    }

    // Determine confidence score (simple keyword inspection or high default value for LLM)
    let confidence = 0.95;
    const norm = query.toLowerCase();
    if (
      norm.includes('accident') ||
      norm.includes('crash') ||
      norm.includes('injured') ||
      norm.includes('sue') ||
      norm.includes('lawyer') ||
      norm.includes('deactivate') ||
      norm.includes('suspend my account') ||
      norm.includes('where is my money') ||
      norm.length < 5
    ) {
      confidence = 0.3; // Trigger escalation path
    }

    return {
      text: fullText,
      confidence,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
      },
      provider: 'OpenAI',
      model: 'gpt-4o',
    };
  }
}

// High Quality Mock Provider Implementation for Demo & fallbacks
class MockAiProvider implements AiProvider {
  constructor(private readonly providerName: string) {}

  async generateResponse(
    query: string,
    systemPrompt: string,
    history: { role: 'USER' | 'AI'; content: string }[],
    knowledgeDocs: { title: string; content: string }[],
    language: string,
    onToken?: (token: string, text: string) => void,
    files?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>,
  ): Promise<AiResponse> {
    const norm = query.toLowerCase();
    let text = '';
    let confidence = 0.85;

    // Trigger low confidence for ambiguous or problematic keywords
    if (
      norm.includes('accident') ||
      norm.includes('crash') ||
      norm.includes('injured') ||
      norm.includes('sue') ||
      norm.includes('lawyer') ||
      norm.includes('deactivate') ||
      norm.includes('suspend my account') ||
      norm.includes('where is my money') ||
      norm.length < 5
    ) {
      confidence = 0.3;
    }

    // FAQ matching simulation
    if (knowledgeDocs.length > 0) {
      const bestDoc = knowledgeDocs[0];
      text = `📚 **Reference: ${bestDoc.title}**\n\n${bestDoc.content}\n\nHope this helps! Let me know if you need specific details.`;
    } else {
      // Dynamic fallback based on keywords
      if (norm.includes('jfk') || norm.includes('lga') || norm.includes('airport') || norm.includes('surge')) {
        text = `✈️ **Surge Radar Alert (NYC Airports)**:\n\n• **JFK Airport**: High flight arrivals. Surge is currently **4.5x** with a wait queue of under 10 minutes at Terminal 4.\n• **LGA Airport**: Moderate queue. Surge at **2.8x**.\n• **EWR Airport**: Light queue, surge at **1.5x**.\n\n💡 *Tip: Head toward JFK Terminal 4 for optimal hourly yield.*`;
      } else if (norm.includes('compliance') || norm.includes('inspection') || norm.includes('drug')) {
        text = `⚠️ **Compliance Review**:\n\nBased on your profile, you have an upcoming **TLC Woodside Vehicle Inspection** in 15 days and an **Annual Drug Screening** due in 32 days. Make sure to complete them to avoid license suspension.`;
      } else if (norm.includes('earnings') || norm.includes('money') || norm.includes('make')) {
        text = `💰 **Earnings Review**:\n\nYour net earnings for this week totals **$557.50** after deducting gas and toll expenses. Your highest earning shifts are typically Friday and Saturday nights (7 PM - 2 AM).`;
      } else if (confidence < 0.4) {
        text = `Hmm, that seems like a complex case regarding active issues or deactivations. I cannot resolve this directly.`;
      } else {
        text = `👋 Hello! I am your JNI Solutions Co-pilot. I can assist you with your TLC compliance deadlines, airport arrivals & surge warnings, earnings summaries, or document renewals.\n\nWhat can I help you with today?`;
      }
    }

    // Apply translation translations for our requested languages
    if (language !== 'English') {
      text = this.translateMock(text, language);
    }

    if (onToken) {
      const words = text.split(' ');
      let currentText = '';
      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + (i === words.length - 1 ? '' : ' ');
        onToken(words[i], currentText);
        // natural word chunk delay
        await new Promise((resolve) => setTimeout(resolve, Math.max(10, 60 - words[i].length * 4)));
      }
    }

    return {
      text,
      confidence,
      tokensUsed: {
        prompt: 120 + query.split(' ').length,
        completion: text.split(' ').length,
      },
      provider: this.providerName,
      model: this.providerName === 'openai' ? 'gpt-4o' : this.providerName === 'gemini' ? 'gemini-1.5-pro' : 'claude-3-5-sonnet',
    };
  }

  private translateMock(englishText: string, language: string): string {
    switch (language) {
      case 'Urdu':
        return `🌐 [Urdu Translation Enabled]\n\nمحترم ڈرائیور! جے این آئی کو پائلٹ کی طرف سے خوش آمدید۔\n\n${englishText.replace(/•/g, '▪')}`;
      case 'Bangla':
        return `🌐 [Bangla Translation Enabled]\n\nজেএনআই ড্রাইভার কো-পাইলট আপনাকে স্বাগতম।\n\n${englishText}`;
      case 'Hindi':
        return `🌐 [Hindi Translation Enabled]\n\nजेएनआई ड्राइवर को-पायलट में आपका स्वागत है।\n\n${englishText}`;
      case 'Spanish':
        return `🌐 [Spanish Translation Enabled]\n\nHola, bienvenido al asistente virtual JNI Co-pilot.\n\n${englishText}`;
      default:
        return englishText;
    }
  }
}

// N8N Webhook Integration Provider
class N8nProvider implements AiProvider {
  private readonly webhookUrl = 'https://taha456987458945.app.n8n.cloud/webhook/jni-driver-assistant';

  constructor(private readonly sessionId: string) {}

  async generateResponse(
    query: string,
    systemPrompt: string,
    history: { role: 'USER' | 'AI'; content: string }[],
    knowledgeDocs: { title: string; content: string }[],
    language: string,
    onToken?: (token: string, text: string) => void,
  ): Promise<AiResponse> {
    let responseText = '';
    let responseStatus = 200;
    try {
      const response = await postJson(this.webhookUrl, {
        message: query,
        sessionId: this.sessionId || 'default-session',
      });
      responseStatus = response.status;
      responseText = response.data;

      if (responseStatus < 200 || responseStatus >= 300) {
        throw new Error(`Webhook responded with status ${responseStatus}: ${responseText}`);
      }
    } catch (e) {
      Logger.error('N8N Webhook Call connection/HTTP error, falling back to mock response', e);
      try {
        const errorLogPath = path.join(process.cwd(), 'data', 'n8n_errors.log');
        const dir = path.dirname(errorLogPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(
          errorLogPath,
          `${new Date().toISOString()} - Error: ${e.message}\nStack: ${e.stack}\n\n`
        );
      } catch (err) {}
      const mock = new MockAiProvider('n8n');
      return mock.generateResponse(query, systemPrompt, history, knowledgeDocs, language, onToken);
    }

    // Process the response text safely
    let text = '';
    if (responseText && responseText.trim()) {
      try {
        const data = JSON.parse(responseText);
        text = data.response || data.text || (typeof data === 'string' ? data : JSON.stringify(data));
      } catch (err) {
        text = responseText;
      }
    } else {
      text = `Webhook returned status ${responseStatus} with an empty response body. Please ensure your n8n workflow is active, receives the message, and returns a JSON response containing a 'response' or 'text' key.`;
    }

    if (onToken) {
      // Simulate a smooth typing streaming effect for n8n webhook response
      const words = text.split(' ');
      let currentText = '';
      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + (i === words.length - 1 ? '' : ' ');
        onToken(words[i], currentText);
        await new Promise(resolve => setTimeout(resolve, Math.max(5, 30 - words[i].length * 2)));
      }
    }

    return {
      text,
      confidence: 0.95,
      tokensUsed: {
        prompt: query.split(/\s+/).length,
        completion: text.split(/\s+/).length,
      },
      provider: 'n8n',
      model: 'n8n-webhook',
    };
  }
}
