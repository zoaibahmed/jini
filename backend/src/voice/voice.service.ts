// @ts-nocheck
// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../copilot/ai.service';
import { TicketCategory, TicketStatus, TicketPriority } from '@prisma/client';

// ── Intent Labels ─────────────────────────────────────────────────────────────
const INTENTS = {
  TLC_RENEWAL: 'TLC_RENEWAL',
  DMV_COMPLIANCE: 'DMV_COMPLIANCE',
  APPOINTMENT: 'APPOINTMENT',
  BILLING: 'BILLING',
  DOCUMENT: 'DOCUMENT',
  INSURANCE: 'INSURANCE',
  DRUG_TEST: 'DRUG_TEST',
  CALLBACK: 'CALLBACK',
  ESCALATION: 'ESCALATION',
  GENERAL: 'GENERAL',
};

// ── Language Config ───────────────────────────────────────────────────────────
const LANG_CONFIG: Record<string, { polly: string; twilio: string; greeting: string; elevenlabs?: string }> = {
  English:  { polly: 'Polly.Joanna-Neural', twilio: 'en-US',  greeting: 'Welcome to JNI Solutions. How can I assist you today?' },
  Spanish:  { polly: 'Polly.Lupe-Neural',   twilio: 'es-US',  greeting: 'Bienvenido a JNI Solutions. ¿En qué puedo ayudarle hoy?' },
  Hindi:    { polly: 'Polly.Kajal-Neural',   twilio: 'hi-IN',  greeting: 'JNI Solutions में आपका स्वागत है। मैं आपकी किस प्रकार सहायता कर सकता हूँ?' },
  Urdu:     { polly: 'Polly.Joanna-Neural',  twilio: 'ur-PK',  greeting: 'JNI Solutions میں آپ کا خیرمقدم ہے۔ میں آپ کی کس طرح مدد کر سکتا ہوں؟' },
  Bangla:   { polly: 'Polly.Joanna-Neural',  twilio: 'bn-IN',  greeting: 'JNI Solutions-এ আপনাকে স্বাগতম। আমি আজ আপনাকে কীভাবে সাহায্য করতে পারি?' },
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly backendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {
    this.backendUrl = this.config.get<string>('BACKEND_URL') || 'http://localhost:5000';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. INCOMING CALL HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  async handleIncomingCall(sid: string, caller: string): Promise<string> {
    this.logger.log(`📞 Incoming call SID=${sid} From=${caller}`);

    // Try to identify driver by phone number
    const driver = await this.resolveDriverByCaller(caller);

    await this.prisma.voiceCall.upsert({
      where: { sid },
      update: { status: 'ACTIVE' },
      create: { sid, caller, status: 'ACTIVE', language: 'English' },
    });

    const currentNode = driver ? 'WELCOME' : 'LEAD_QUAL_NAME';

    await this.prisma.voiceSession.upsert({
      where: { sid },
      update: { currentNode, collectedData: JSON.stringify({ driverName: driver?.name }), detectedLang: 'English' },
      create: { sid, currentNode, collectedData: JSON.stringify({ driverName: driver?.name }), detectedLang: 'English' },
    });

    const greeting = driver
      ? `Welcome back to JNI Solutions, ${driver.name}. How can I help you today?`
      : 'Welcome to JNI Solutions, the premier TLC driver support and compliance platform. Before we get started, may I please have your full name?';

    return this.buildTwiML(
      `<Gather input="speech" action="${this.backendUrl}/voice/respond" speechTimeout="auto" language="en-US">
        <Say voice="${LANG_CONFIG.English.polly}">${greeting}</Say>
       </Gather>
       <Say voice="${LANG_CONFIG.English.polly}">We did not receive any input. Goodbye.</Say>
       <Hangup/>`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CALL RESPONSE STATE MACHINE
  // ═══════════════════════════════════════════════════════════════════════════
  async handleCallResponse(sid: string, speechResult: string): Promise<string> {
    this.logger.log(`🎤 SID=${sid} Speech="${speechResult}"`);

    const call = await this.prisma.voiceCall.findUnique({ where: { sid } });
    const session = await this.prisma.voiceSession.findUnique({ where: { sid } });

    if (!call || !session) {
      return this.buildTwiML(`<Say voice="${LANG_CONFIG.English.polly}">Session error. Please call again.</Say><Hangup/>`);
    }

    // Save driver transcript
    await this.prisma.voiceTranscript.create({
      data: { callId: call.id, speaker: 'DRIVER', text: speechResult },
    });

    // Language detection
    const detectedLang = this.aiService.detectLanguage(speechResult);
    let currentLang = session.detectedLang;
    if (detectedLang !== 'English' && detectedLang !== currentLang) {
      currentLang = detectedLang;
      await this.prisma.voiceSession.update({ where: { sid }, data: { detectedLang: currentLang } });
      await this.prisma.voiceCall.update({ where: { sid }, data: { language: currentLang } });
    }

    const langCfg = LANG_CONFIG[currentLang] || LANG_CONFIG.English;
    const collected: Record<string, any> = JSON.parse(session.collectedData);
    const norm = speechResult.toLowerCase();
    let nextNode = session.currentNode;
    let replyText = '';
    let isEscalating = false;

    // ── Lead Qualification Flow ──
    if (nextNode === 'LEAD_QUAL_NAME') {
      collected.name = speechResult;
      await this.prisma.voiceSession.update({
        where: { sid },
        data: {
          currentNode: 'LEAD_QUAL_INTEREST',
          collectedData: JSON.stringify(collected)
        }
      });
      replyText = `Thank you, ${speechResult}. What kind of support are you looking for? You can say: TLC renewal assistance, DMV mitigation, drug screening, or defensive driving course.`;
      await this.saveAiTranscript(call.id, replyText);
      return this.buildTwiML(
        `<Gather input="speech" action="${this.backendUrl}/voice/respond" speechTimeout="auto" language="en-US">
          <Say voice="${langCfg.polly}">${this.sanitizeXml(replyText)}</Say>
         </Gather>
         <Say voice="${langCfg.polly}">We did not receive any input. Goodbye.</Say>
         <Hangup/>`
      );
    }

    if (nextNode === 'LEAD_QUAL_INTEREST') {
      collected.interest = speechResult;
      
      // Create lead in CRM!
      await this.prisma.lead.create({
        data: {
          name: collected.name || 'Voice Prospect',
          phone: call.caller,
          source: 'PHONE',
          status: 'QUALIFIED',
          notes: `Qualified via Voice AI. Prospect stated interest: "${speechResult}"`,
        }
      });

      // Send admin notification about new qualified lead
      await this.prisma.notification.create({
        data: {
          userId: (await this.prisma.user.findFirst({ where: { role: 'SUPERADMIN' } }))?.id || '',
          title: 'New Lead via Voice AI',
          message: `New prospect ${collected.name} qualified over phone. Interest: ${speechResult}`,
          body: `Qualified prospect: ${collected.name}`,
          type: 'INFO',
          read: false,
          isRead: false
        }
      });

      replyText = `Excellent! I have recorded your interest in "${speechResult}" and registered you as a qualified lead in our CRM. A support agent will call you back shortly. Thank you for calling JNI Solutions!`;
      await this.saveAiTranscript(call.id, replyText);
      await this.prisma.voiceSession.update({
        where: { sid },
        data: {
          currentNode: 'ENDED',
          collectedData: JSON.stringify(collected)
        }
      });
      return this.buildTwiML(`<Say voice="${langCfg.polly}">${this.sanitizeXml(replyText)}</Say><Hangup/>`);
    }

    // ── Escalation triggers ──
    const escalationPhrases = ['agent','transfer','human','person','operator','speak to someone','representative','help me','emergency','urgent'];
    if (escalationPhrases.some(p => norm.includes(p))) {
      nextNode = 'ESCALATION';
    }

    // ── Callback request ──
    if (norm.includes('call me back') || norm.includes('callback') || norm.includes('call back')) {
      await this.requestCallback(call.id, call.caller);
      replyText = this.getLocalizedText(currentLang, {
        English: 'I have registered a callback request. A JNI agent will call you back within 30 minutes. Thank you.',
        Spanish: 'He registrado una solicitud de devolución de llamada. Un agente JNI le llamará en 30 minutos.',
        Hindi: 'मैंने कॉलबैक अनुरोध दर्ज किया है। एक JNI एजेंट 30 मिनट के भीतर आपसे संपर्क करेगा।',
        Urdu: 'میں نے کال بیک درخواست رجسٹر کی ہے۔ ایک JNI ایجنٹ 30 منٹ میں آپ سے رابطہ کرے گا۔',
        Bangla: 'আমি একটি কলব্যাক অনুরোধ নিবন্ধন করেছি। একজন JNI এজেন্ট ৩০ মিনিটের মধ্যে আপনাকে কল করবে।',
      });
      await this.saveAiTranscript(call.id, replyText);
      await this.prisma.voiceSession.update({ where: { sid }, data: { currentNode: nextNode, collectedData: JSON.stringify(collected) } });
      return this.buildTwiML(`<Say voice="${langCfg.polly}" language="${langCfg.twilio}">${this.sanitizeXml(replyText)}</Say><Hangup/>`);
    }

    // ── STATE MACHINE ─────────────────────────────────────────────────────────
    if (nextNode === 'ESCALATION') {
      isEscalating = true;
      replyText = this.getLocalizedText(currentLang, {
        English: 'Understood. Connecting you to a live JNI Solutions support agent now. Please hold.',
        Spanish: 'Entendido. Conectándole con un agente en vivo ahora. Por favor espere.',
        Hindi: 'समझ गया। अभी आपको एक लाइव JNI सपोर्ट एजेंट से जोड़ रहा हूँ। कृपया प्रतीक्षा करें।',
        Urdu: 'سمجھ گیا۔ ابھی آپ کو ایک لائیو JNI سپورٹ ایجنٹ سے جوڑ رہا ہوں۔ براہ کرم انتظار کریں۔',
        Bangla: 'বুঝেছি। এখন আপনাকে একজন লাইভ JNI সাপোর্ট এজেন্টের সাথে সংযুক্ত করছি।',
      });

    } else if (nextNode === 'APPOINTMENT_FLOW') {
      // Multi-step appointment booking
      const step = collected.step || 1;
      if (step === 1) {
        collected.name = speechResult;
        collected.step = 2;
        replyText = this.getLocalizedText(currentLang, {
          English: `Got it, ${speechResult}. What is your vehicle license plate number?`,
          Spanish: `Entendido, ${speechResult}. ¿Cuál es el número de placa de su vehículo?`,
          Hindi: `समझ गया, ${speechResult}। आपके वाहन की लाइसेंस प्लेट नंबर क्या है?`,
          Urdu: `سمجھ گیا، ${speechResult}۔ آپ کے گاڑی کا لائسنس پلیٹ نمبر کیا ہے؟`,
          Bangla: `বুঝেছি, ${speechResult}। আপনার গাড়ির লাইসেন্স প্লেট নম্বর কী?`,
        });
      } else if (step === 2) {
        collected.plate = speechResult;
        collected.step = 3;
        replyText = this.getLocalizedText(currentLang, {
          English: 'Perfect. What date and time would you like for your DMV Woodside safety inspection?',
          Spanish: 'Perfecto. ¿Qué fecha y hora desea para su inspección de seguridad en DMV Woodside?',
          Hindi: 'बढ़िया। आप DMV Woodside सुरक्षा निरीक्षण के लिए कौन सी तारीख और समय चाहते हैं?',
          Urdu: 'بہترین۔ آپ DMV Woodside سیفٹی انسپیکشن کے لیے کونسی تاریخ اور وقت چاہتے ہیں؟',
          Bangla: 'চমৎকার। আপনি DMV Woodside নিরাপত্তা পরিদর্শনের জন্য কোন তারিখ ও সময় চান?',
        });
      } else if (step >= 3) {
        collected.date = speechResult;
        const ticket = await this.createVoiceTicket({
          callId: call.id,
          callSid: sid,
          caller: call.caller,
          title: `Voice Booking: Woodside Inspection`,
          description: `Auto-booked via AI Voice.\nDriver: ${collected.name}\nPlate: ${collected.plate}\nDate: ${collected.date}`,
          category: TicketCategory.VEHICLE_REGISTRATION,
          priority: TicketPriority.MEDIUM,
          intent: INTENTS.APPOINTMENT,
          outcome: 'APPOINTMENT_BOOKED',
        });
        replyText = this.getLocalizedText(currentLang, {
          English: `Your Woodside inspection is confirmed for ${collected.date}. Your case ID is ${ticket.ticketId}. Is there anything else I can help you with?`,
          Spanish: `Su inspección en Woodside está confirmada para ${collected.date}. Su ID de caso es ${ticket.ticketId}.`,
          Hindi: `${collected.date} के लिए Woodside निरीक्षण की पुष्टि हो गई है। आपका केस ID ${ticket.ticketId} है।`,
          Urdu: `${collected.date} کے لیے Woodside انسپیکشن کی تصدیق ہو گئی ہے۔ آپ کا کیس ID ${ticket.ticketId} ہے۔`,
          Bangla: `${collected.date} এর জন্য Woodside পরিদর্শন নিশ্চিত হয়েছে। আপনার কেস ID ${ticket.ticketId}।`,
        });
        nextNode = 'MENU';
        collected.step = 0;
      }

    } else {
      // ── WELCOME / MENU ─────────────────────────────────────────────────────
      // GPT-4o intent detection via knowledge base RAG
      const knowledgeMatch = await this.aiService.getRelevantKnowledgeDocs(speechResult);
      const intent = this.detectIntent(norm);

      if (intent === INTENTS.APPOINTMENT || norm.includes('inspection') || norm.includes('woodside') || norm.includes('appointment')) {
        nextNode = 'APPOINTMENT_FLOW';
        collected.step = 1;
        await this.prisma.voiceCall.update({ where: { sid }, data: { intent: INTENTS.APPOINTMENT } });
        replyText = this.getLocalizedText(currentLang, {
          English: 'I can schedule that for you. First, what is your full name?',
          Spanish: 'Puedo programar eso para usted. Primero, ¿cuál es su nombre completo?',
          Hindi: 'मैं आपके लिए यह शेड्यूल कर सकता हूँ। पहले, आपका पूरा नाम क्या है?',
          Urdu: 'میں آپ کے لیے یہ شیڈول کر سکتا ہوں۔ پہلے، آپ کا پورا نام کیا ہے؟',
          Bangla: 'আমি আপনার জন্য এটি নির্ধারণ করতে পারি। প্রথমে, আপনার পুরো নাম কী?',
        });

      } else if (intent === INTENTS.TLC_RENEWAL) {
        await this.prisma.voiceCall.update({ where: { sid }, data: { intent: INTENTS.TLC_RENEWAL } });
        replyText = this.getLocalizedText(currentLang, {
          English: 'To renew your TLC license, submit your application via LARS online, complete the 24-hour renewal course, and pass your annual drug screening. Would you like me to create a support ticket to guide you through this process?',
          Spanish: 'Para renovar su licencia TLC, envíe su solicitud a través de LARS en línea, complete el curso de renovación de 24 horas y apruebe su prueba de drogas anual.',
          Hindi: 'TLC लाइसेंस नवीनीकरण के लिए, LARS ऑनलाइन के माध्यम से आवेदन जमा करें, 24 घंटे का नवीनीकरण कोर्स पूरा करें, और वार्षिक ड्रग स्क्रीनिंग पास करें।',
          Urdu: 'TLC لائسنس کی تجدید کے لیے، LARS آن لائن کے ذریعے درخواست جمع کریں، 24 گھنٹے کا تجدید کورس مکمل کریں، اور سالانہ ڈرگ سکریننگ پاس کریں۔',
          Bangla: 'TLC লাইসেন্স নবায়ন করতে, LARS অনলাইনে আবেদন জমা দিন, ২৪ ঘন্টার নবায়ন কোর্স সম্পন্ন করুন এবং বার্ষিক ড্রাগ স্ক্রিনিং পাস করুন।',
        });

      } else if (intent === INTENTS.DMV_COMPLIANCE) {
        await this.prisma.voiceCall.update({ where: { sid }, data: { intent: INTENTS.DMV_COMPLIANCE } });
        replyText = this.getLocalizedText(currentLang, {
          English: 'For DMV summons and point mitigation, upload your notice to the JNI documents portal. Our AI will compile your dispute template automatically. Would you like agent assistance?',
          Spanish: 'Para citaciones del DMV y mitigación de puntos, suba su aviso al portal de documentos JNI. Nuestro AI compilará su plantilla de disputa automáticamente.',
          Hindi: 'DMV समन और पॉइंट शमन के लिए, JNI दस्तावेज़ पोर्टल पर अपना नोटिस अपलोड करें।',
          Urdu: 'DMV سمن اور پوائنٹ کمی کے لیے، JNI دستاویزات پورٹل پر اپنا نوٹس اپ لوڈ کریں۔',
          Bangla: 'DMV সমন এবং পয়েন্ট প্রশমনের জন্য, JNI ডকুমেন্ট পোর্টালে আপনার নোটিশ আপলোড করুন।',
        });

      } else if (intent === INTENTS.BILLING) {
        await this.prisma.voiceCall.update({ where: { sid }, data: { intent: INTENTS.BILLING } });
        replyText = this.getLocalizedText(currentLang, {
          English: 'JNI Solutions offers three subscription plans: Basic at zero cost, Premium Driver Pro at nineteen dollars per month, and Enterprise Fleet at ninety-nine dollars per month. You can manage billing at your JNI dashboard.',
          Spanish: 'JNI Solutions ofrece tres planes: Básico gratis, Premium Pro a 19 dólares al mes y Enterprise Fleet a 99 dólares al mes.',
          Hindi: 'JNI Solutions तीन योजनाएं प्रदान करता है: बेसिक मुफ्त, प्रीमियम प्रो 19 डॉलर प्रति माह, और एंटरप्राइज़ फ्लीट 99 डॉलर प्रति माह।',
          Urdu: 'JNI Solutions تین منصوبے پیش کرتا ہے: بیسک مفت، پریمیم پرو 19 ڈالر فی ماہ، اور انٹرپرائز فلیٹ 99 ڈالر فی ماہ۔',
          Bangla: 'JNI Solutions তিনটি পরিকল্পনা অফার করে: বেসিক বিনামূল্যে, প্রিমিয়াম প্রো মাসে ১৯ ডলার, এবং এন্টারপ্রাইজ ফ্লিট মাসে ৯৯ ডলার।',
        });

      } else if (intent === INTENTS.DRUG_TEST) {
        await this.prisma.voiceCall.update({ where: { sid }, data: { intent: INTENTS.DRUG_TEST } });
        replyText = this.getLocalizedText(currentLang, {
          English: 'All TLC drivers must complete annual drug screening within 90 days before their license anniversary. Approved centers include Labcorp and Quest Diagnostics. Check your compliance dashboard for your exact deadline.',
          Spanish: 'Todos los conductores TLC deben completar la prueba de drogas anual dentro de los 90 días anteriores al aniversario de su licencia.',
          Hindi: 'सभी TLC ड्राइवरों को अपने लाइसेंस वर्षगांठ से 90 दिन पहले वार्षिक ड्रग स्क्रीनिंग पूरी करनी होगी।',
          Urdu: 'تمام TLC ڈرائیوروں کو لائسنس کی سالگرہ سے 90 دن پہلے سالانہ ڈرگ سکریننگ مکمل کرنی ہوگی۔',
          Bangla: 'সকল TLC চালকদের লাইসেন্স বার্ষিকীর ৯০ দিন আগে বার্ষিক ড্রাগ স্ক্রিনিং সম্পন্ন করতে হবে।',
        });

      } else if (knowledgeMatch.length > 0) {
        const doc = knowledgeMatch[0];
        replyText = this.getLocalizedText(currentLang, {
          English: `I found information about ${doc.title}. ${doc.content.split('\n')[0]}. Would you like more details or agent assistance?`,
          Spanish: `Encontré información sobre ${doc.title}. ¿Le gustaría más detalles?`,
          Hindi: `मुझे ${doc.title} के बारे में जानकारी मिली। क्या आप अधिक विवरण चाहते हैं?`,
          Urdu: `مجھے ${doc.title} کے بارے میں معلومات ملی۔ کیا آپ مزید تفصیلات چاہتے ہیں؟`,
          Bangla: `আমি ${doc.title} সম্পর্কে তথ্য পেয়েছি। আপনি কি আরও বিবরণ চান?`,
        });

      } else {
        // Low confidence → escalate
        nextNode = 'ESCALATION';
        isEscalating = true;
        replyText = this.getLocalizedText(currentLang, {
          English: 'I am having trouble resolving that query. Let me transfer you to a JNI Solutions support specialist now.',
          Spanish: 'Tengo dificultades para resolver esa consulta. Le transfiero con un especialista ahora.',
          Hindi: 'मुझे उस क्वेरी को हल करने में कठिनाई हो रही है। अभी आपको एक JNI सपोर्ट विशेषज्ञ से जोड़ रहा हूँ।',
          Urdu: 'مجھے اس سوال کو حل کرنے میں دشواری ہو رہی ہے۔ آپ کو ابھی JNI سپورٹ ماہر سے جوڑ رہا ہوں۔',
          Bangla: 'সেই প্রশ্নটি সমাধান করতে আমার সমস্যা হচ্ছে। আপনাকে এখন একজন JNI সাপোর্ট বিশেষজ্ঞের সাথে সংযুক্ত করছি।',
        });
      }
    }

    // Save session state
    await this.prisma.voiceSession.update({
      where: { sid },
      data: { currentNode: nextNode, collectedData: JSON.stringify(collected) },
    });

    // Save AI transcript
    await this.saveAiTranscript(call.id, replyText);

    // Build TwiML
    if (isEscalating) {
      const ticket = await this.createVoiceTicket({
        callId: call.id,
        callSid: sid,
        caller: call.caller,
        title: `Voice Escalation: ${call.intent || 'General Query'}`,
        description: `Call auto-escalated.\nCaller: ${call.caller}\nLast input: "${speechResult}"`,
        category: TicketCategory.GENERAL,
        priority: TicketPriority.HIGH,
        intent: INTENTS.ESCALATION,
        outcome: 'TRANSFERRED_TO_HUMAN',
      });
      const agentNumber = this.config.get<string>('AGENT_PHONE') || '+17185550199';
      return this.buildTwiML(
        `<Say voice="${langCfg.polly}" language="${langCfg.twilio}">${this.sanitizeXml(replyText)}</Say>
         <Dial>${agentNumber}</Dial>`,
      );
    }

    return this.buildTwiML(
      `<Gather input="speech" action="${this.backendUrl}/voice/respond" speechTimeout="auto" language="${langCfg.twilio}">
         <Say voice="${langCfg.polly}" language="${langCfg.twilio}">${this.sanitizeXml(replyText)}</Say>
       </Gather>
       <Say voice="${langCfg.polly}" language="${langCfg.twilio}">We did not hear anything. Thank you for calling JNI Solutions. Goodbye.</Say>
       <Hangup/>`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. OUTBOUND CALL (Future-ready)
  // ═══════════════════════════════════════════════════════════════════════════
  async initiateOutboundCall(toNumber: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
      const fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER');

      if (!accountSid || !authToken || !fromNumber) {
        return { success: false, error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env' };
      }

      // Dynamic import to avoid hard dependency
      const twilio = await import('twilio').then(m => m.default || m);
      const client = twilio(accountSid, authToken);

      const twiml = `<Response><Say voice="${LANG_CONFIG.English.polly}">${this.sanitizeXml(message)}</Say><Hangup/></Response>`;
      const call = await client.calls.create({
        to: toNumber,
        from: fromNumber,
        twiml,
      });

      const newSid = `OUTBOUND-${Date.now()}`;
      await this.prisma.voiceCall.create({
        data: { sid: call.sid || newSid, caller: toNumber, status: 'RINGING', language: 'English' },
      });

      return { success: true, sid: call.sid };
    } catch (err: any) {
      this.logger.error(`Outbound call failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CALLBACK REQUEST
  // ═══════════════════════════════════════════════════════════════════════════
  async requestCallback(callId: string, callerPhone: string): Promise<void> {
    this.logger.log(`📲 Callback requested from ${callerPhone}`);
    await this.prisma.voiceCall.updateMany({
      where: { id: callId },
      data: { outcome: 'CALLBACK_REQUESTED', intent: INTENTS.CALLBACK },
    });
    // Create a support ticket for callback tracking
    const fallbackDriver = await this.prisma.user.findFirst({ where: { role: 'DRIVER' } });
    if (fallbackDriver) {
      const ticketCount = await this.prisma.ticket.count();
      await this.prisma.ticket.create({
        data: {
          ticketId: `JNI-CB-${1001 + ticketCount}`,
          title: `Callback Request: ${callerPhone}`,
          description: `Driver requested a callback.\nPhone: ${callerPhone}\nCall ID: ${callId}`,
          category: TicketCategory.GENERAL,
          priority: TicketPriority.HIGH,
          status: TicketStatus.OPEN,
          driverId: fallbackDriver.id,
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MANUAL AGENT TRANSFER
  // ═══════════════════════════════════════════════════════════════════════════
  async transferToAgent(sid: string, agentNote?: string): Promise<{ success: boolean }> {
    await this.prisma.voiceCall.updateMany({
      where: { sid },
      data: { status: 'TRANSFERRED', outcome: 'TRANSFERRED_TO_HUMAN' },
    });
    if (agentNote) {
      const call = await this.prisma.voiceCall.findUnique({ where: { sid } });
      if (call) {
        await this.prisma.voiceTranscript.create({
          data: { callId: call.id, speaker: 'AGENT', text: `[AGENT NOTE] ${agentNote}` },
        });
      }
    }
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. EXTENDED ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════
  async getFullAnalytics() {
    const [total, active, completed, transferred, failed, avgDur, languages, intents, outcomes] = await Promise.all([
      this.prisma.voiceCall.count(),
      this.prisma.voiceCall.count({ where: { status: 'ACTIVE' } }),
      this.prisma.voiceCall.count({ where: { status: 'COMPLETED' } }),
      this.prisma.voiceCall.count({ where: { status: 'TRANSFERRED' } }),
      this.prisma.voiceCall.count({ where: { status: 'FAILED' } }),
      this.prisma.voiceCall.aggregate({ _avg: { durationSec: true } }),
      this.prisma.voiceCall.groupBy({ by: ['language'], _count: { language: true } }),
      this.prisma.voiceCall.groupBy({ by: ['intent'], _count: { intent: true } }),
      this.prisma.voiceCall.groupBy({ by: ['outcome'], _count: { outcome: true } }),
    ]);

    // Calls per day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCalls = await this.prisma.voiceCall.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const callsPerDay: Record<string, number> = {};
    recentCalls.forEach(c => {
      const day = c.createdAt.toISOString().split('T')[0];
      callsPerDay[day] = (callsPerDay[day] || 0) + 1;
    });

    const resolutionRate = total > 0 ? Math.round(((completed) / total) * 100) : 0;
    const transferRate = total > 0 ? Math.round((transferred / total) * 100) : 0;

    return {
      summary: {
        totalCalls: total,
        activeCalls: active,
        completedCalls: completed,
        transferredCalls: transferred,
        failedCalls: failed,
        avgDurationSeconds: Math.round(avgDur._avg.durationSec || 0),
        resolutionRate,
        transferRate,
      },
      callsPerDay: Object.entries(callsPerDay).map(([date, count]) => ({ date, count })),
      languages: languages.map(l => ({ language: l.language || 'Unknown', count: l._count.language })),
      intents: intents.filter(i => i.intent).map(i => ({ intent: i.intent!, count: i._count.intent })),
      outcomes: outcomes.filter(o => o.outcome).map(o => ({ outcome: o.outcome!, count: o._count.outcome })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. LIVE QUEUE
  // ═══════════════════════════════════════════════════════════════════════════
  async getLiveQueue() {
    return this.prisma.voiceCall.findMany({
      where: { status: { in: ['ACTIVE', 'RINGING'] } },
      include: {
        transcripts: { orderBy: { timestamp: 'desc' }, take: 2 },
        ticket: { select: { ticketId: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. CALL LOGS (paginated)
  // ═══════════════════════════════════════════════════════════════════════════
  async getCallLogs(page = 1, limit = 20, search?: string, language?: string, intent?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.caller = { contains: search };
    if (language) where.language = language;
    if (intent) where.intent = intent;

    const [calls, total] = await Promise.all([
      this.prisma.voiceCall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transcripts: { orderBy: { timestamp: 'asc' } },
          ticket: { select: { ticketId: true, title: true } },
        },
      }),
      this.prisma.voiceCall.count({ where }),
    ]);

    return { calls, total, page, pages: Math.ceil(total / limit) };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  private buildTwiML(inner: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  ${inner}\n</Response>`;
  }

  private sanitizeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getLocalizedText(lang: string, texts: Record<string, string>): string {
    return texts[lang] || texts.English;
  }

  private detectIntent(norm: string): string {
    if (norm.includes('renew') || norm.includes('tlc') || norm.includes('license') || norm.includes('lars')) return INTENTS.TLC_RENEWAL;
    if (norm.includes('dmv') || norm.includes('points') || norm.includes('summons') || norm.includes('fine')) return INTENTS.DMV_COMPLIANCE;
    if (norm.includes('appointment') || norm.includes('inspection') || norm.includes('woodside') || norm.includes('schedule')) return INTENTS.APPOINTMENT;
    if (norm.includes('billing') || norm.includes('payment') || norm.includes('subscription') || norm.includes('price') || norm.includes('plan')) return INTENTS.BILLING;
    if (norm.includes('document') || norm.includes('upload') || norm.includes('file') || norm.includes('paper')) return INTENTS.DOCUMENT;
    if (norm.includes('insurance') || norm.includes('liability') || norm.includes('coverage')) return INTENTS.INSURANCE;
    if (norm.includes('drug') || norm.includes('test') || norm.includes('screening') || norm.includes('labcorp')) return INTENTS.DRUG_TEST;
    return INTENTS.GENERAL;
  }

  private async resolveDriverByCaller(phone: string) {
    return this.prisma.user.findFirst({
      where: { phone, role: 'DRIVER' },
      select: { id: true, name: true, phone: true },
    });
  }

  private async saveAiTranscript(callId: string, text: string) {
    await this.prisma.voiceTranscript.create({
      data: { callId, speaker: 'AI', text },
    });
  }

  private async createVoiceTicket(params: {
    callId: string;
    callSid: string;
    caller: string;
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    intent: string;
    outcome: string;
  }) {
    const fallbackDriver = await this.prisma.user.findFirst({ where: { role: 'DRIVER' } });
    const driverId = fallbackDriver?.id || '';
    const ticketCount = await this.prisma.ticket.count();
    const ticketId = `JNI-V-${1001 + ticketCount}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketId,
        title: params.title,
        description: params.description,
        category: params.category,
        priority: params.priority,
        status: TicketStatus.OPEN,
        driverId,
        statusHistory: {
          create: { newStatus: TicketStatus.OPEN, changedById: driverId, comment: 'Created by AI Voice System' },
        },
      },
    });

    await this.prisma.voiceCall.update({
      where: { sid: params.callSid },
      data: { ticketId: ticket.id, intent: params.intent, outcome: params.outcome },
    });

    return ticket;
  }
}

