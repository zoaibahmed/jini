import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ChatSession {
  id: string;
  driverId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'USER' | 'AI';
  message: string;
  language: string;
  confidenceScore?: number;
  isPinned: boolean;
  createdAt: string;
  attachments?: Array<{ name: string; s3Key: string; sizeBytes: number; mimeType: string }>;
  feedback?: {
    id: string;
    rating: 'THUMBS_UP' | 'THUMBS_DOWN';
    comment?: string;
    createdAt: string;
  };
}

export interface AIPrompt {
  id: string;
  name: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIKnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIUsage {
  id: string;
  userId: string;
  provider: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  cost: number;
  createdAt: string;
}

export interface AIFeedback {
  id: string;
  messageId: string;
  rating: 'THUMBS_UP' | 'THUMBS_DOWN';
  comment?: string;
  createdAt: string;
}

export class CopilotStore {
  private static readonly chatsPath = path.join(process.cwd(), 'data', 'copilot_chats.json');
  private static readonly messagesPath = path.join(process.cwd(), 'data', 'copilot_messages.json');
  private static readonly promptsPath = path.join(process.cwd(), 'data', 'copilot_prompts.json');
  private static readonly knowledgePath = path.join(process.cwd(), 'data', 'copilot_knowledge.json');
  private static readonly metricsPath = path.join(process.cwd(), 'data', 'copilot_metrics.json');

  private static ensureFileExists(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
  }

  // --- Chats ---
  static getChatsByDriverId(driverId: string): ChatSession[] {
    this.ensureFileExists(this.chatsPath);
    try {
      const content = fs.readFileSync(this.chatsPath, 'utf8');
      const list: ChatSession[] = JSON.parse(content);
      return list.filter(c => c.driverId === driverId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch {
      return [];
    }
  }

  static getChatById(id: string): ChatSession | undefined {
    this.ensureFileExists(this.chatsPath);
    try {
      const content = fs.readFileSync(this.chatsPath, 'utf8');
      const list: ChatSession[] = JSON.parse(content);
      return list.find(c => c.id === id);
    } catch {
      return undefined;
    }
  }

  static createChat(driverId: string, title?: string): ChatSession {
    this.ensureFileExists(this.chatsPath);
    const list: ChatSession[] = JSON.parse(fs.readFileSync(this.chatsPath, 'utf8'));
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      driverId,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newChat);
    fs.writeFileSync(this.chatsPath, JSON.stringify(list, null, 2), 'utf8');
    return newChat;
  }

  static updateChatTimestamp(id: string) {
    this.ensureFileExists(this.chatsPath);
    const list: ChatSession[] = JSON.parse(fs.readFileSync(this.chatsPath, 'utf8'));
    const index = list.findIndex(c => c.id === id);
    if (index > -1) {
      list[index].updatedAt = new Date().toISOString();
      fs.writeFileSync(this.chatsPath, JSON.stringify(list, null, 2), 'utf8');
    }
  }

  static updateChatTitle(id: string, title: string): boolean {
    this.ensureFileExists(this.chatsPath);
    const list: ChatSession[] = JSON.parse(fs.readFileSync(this.chatsPath, 'utf8'));
    const index = list.findIndex(c => c.id === id);
    if (index > -1) {
      list[index].title = title;
      list[index].updatedAt = new Date().toISOString();
      fs.writeFileSync(this.chatsPath, JSON.stringify(list, null, 2), 'utf8');
      return true;
    }
    return false;
  }

  static deleteChat(id: string): boolean {
    this.ensureFileExists(this.chatsPath);
    const list: ChatSession[] = JSON.parse(fs.readFileSync(this.chatsPath, 'utf8'));
    const index = list.findIndex(c => c.id === id);
    if (index > -1) {
      list.splice(index, 1);
      fs.writeFileSync(this.chatsPath, JSON.stringify(list, null, 2), 'utf8');
      // Clean up messages for this chat
      this.deleteMessagesByChatId(id);
      return true;
    }
    return false;
  }

  // --- Messages ---
  static getMessagesByChatId(chatId: string): ChatMessage[] {
    this.ensureFileExists(this.messagesPath);
    try {
      const content = fs.readFileSync(this.messagesPath, 'utf8');
      const list: ChatMessage[] = JSON.parse(content);
      return list.filter(m => m.chatId === chatId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } catch {
      return [];
    }
  }

  static getMessageById(id: string): ChatMessage | undefined {
    this.ensureFileExists(this.messagesPath);
    try {
      const content = fs.readFileSync(this.messagesPath, 'utf8');
      const list: ChatMessage[] = JSON.parse(content);
      return list.find(m => m.id === id);
    } catch {
      return undefined;
    }
  }

  static saveMessage(msg: ChatMessage) {
    this.ensureFileExists(this.messagesPath);
    const list: ChatMessage[] = JSON.parse(fs.readFileSync(this.messagesPath, 'utf8'));
    const index = list.findIndex(m => m.id === msg.id);
    if (index > -1) {
      list[index] = msg;
    } else {
      list.push(msg);
    }
    fs.writeFileSync(this.messagesPath, JSON.stringify(list, null, 2), 'utf8');
  }

  static deleteMessagesByChatId(chatId: string) {
    this.ensureFileExists(this.messagesPath);
    const list: ChatMessage[] = JSON.parse(fs.readFileSync(this.messagesPath, 'utf8'));
    const filtered = list.filter(m => m.chatId !== chatId);
    fs.writeFileSync(this.messagesPath, JSON.stringify(filtered, null, 2), 'utf8');
  }

  // --- Prompts ---
  static getPrompts(): AIPrompt[] {
    this.ensureFileExists(this.promptsPath);
    try {
      const content = fs.readFileSync(this.promptsPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  static getActivePrompt(): AIPrompt | undefined {
    const list = this.getPrompts();
    return list.find(p => p.isActive);
  }

  static upsertPrompt(prompt: Partial<AIPrompt> & { name: string }): AIPrompt {
    this.ensureFileExists(this.promptsPath);
    const list: AIPrompt[] = JSON.parse(fs.readFileSync(this.promptsPath, 'utf8'));
    
    // If setting active, deactivate others in the same category
    if (prompt.isActive) {
      list.forEach(p => {
        if (p.category === prompt.category) {
          p.isActive = false;
        }
      });
    }

    const index = list.findIndex(p => p.name === prompt.name);
    let result: AIPrompt;
    
    if (index > -1) {
      result = {
        ...list[index],
        ...prompt,
        updatedAt: new Date().toISOString(),
      };
      list[index] = result;
    } else {
      result = {
        id: crypto.randomUUID(),
        name: prompt.name,
        content: prompt.content || '',
        category: prompt.category || 'GENERAL',
        isActive: prompt.isActive !== undefined ? prompt.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.push(result);
    }
    
    fs.writeFileSync(this.promptsPath, JSON.stringify(list, null, 2), 'utf8');
    return result;
  }

  // --- Knowledge Docs ---
  static getKnowledgeDocs(): AIKnowledgeDoc[] {
    this.ensureFileExists(this.knowledgePath);
    try {
      const content = fs.readFileSync(this.knowledgePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  static createKnowledgeDoc(doc: Omit<AIKnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): AIKnowledgeDoc {
    this.ensureFileExists(this.knowledgePath);
    const list: AIKnowledgeDoc[] = JSON.parse(fs.readFileSync(this.knowledgePath, 'utf8'));
    const newDoc: AIKnowledgeDoc = {
      ...doc,
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newDoc);
    fs.writeFileSync(this.knowledgePath, JSON.stringify(list, null, 2), 'utf8');
    return newDoc;
  }

  static deleteKnowledgeDoc(id: string): boolean {
    this.ensureFileExists(this.knowledgePath);
    const list: AIKnowledgeDoc[] = JSON.parse(fs.readFileSync(this.knowledgePath, 'utf8'));
    const index = list.findIndex(d => d.id === id);
    if (index > -1) {
      list.splice(index, 1);
      fs.writeFileSync(this.knowledgePath, JSON.stringify(list, null, 2), 'utf8');
      return true;
    }
    return false;
  }

  // --- Metrics ---
  static getMetrics(): AIUsage[] {
    this.ensureFileExists(this.metricsPath);
    try {
      const content = fs.readFileSync(this.metricsPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  static logMetric(usage: Omit<AIUsage, 'id' | 'createdAt'>): AIUsage {
    this.ensureFileExists(this.metricsPath);
    const list: AIUsage[] = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
    const newUsage: AIUsage = {
      ...usage,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    list.push(newUsage);
    fs.writeFileSync(this.metricsPath, JSON.stringify(list, null, 2), 'utf8');
    return newUsage;
  }

  static getUsageMetrics() {
    const usages = this.getMetrics().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const totalCalls = usages.length;
    
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCost = 0;
    let totalDuration = 0;
    
    const providersMap = new Map<string, number>();

    usages.forEach(u => {
      totalPromptTokens += u.promptTokens || 0;
      totalCompletionTokens += u.completionTokens || 0;
      totalCost += u.cost || 0;
      totalDuration += u.durationMs || 0;
      providersMap.set(u.provider, (providersMap.get(u.provider) || 0) + 1);
    });

    const providers = Array.from(providersMap.entries()).map(([provider, count]) => ({
      provider,
      count,
    }));

    return {
      totalCalls,
      totalPromptTokens,
      totalCompletionTokens,
      totalCost,
      avgLatencyMs: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      providers,
      recentLogs: usages.slice(0, 100),
    };
  }
}
