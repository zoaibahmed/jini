'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  Globe,
  Clock,
  ShieldCheck,
  Star,
  ArrowRight,
  Send,
  Smartphone,
  CheckCircle,
  KeyRound,
  Fingerprint,
  PhoneIncoming,
  Terminal,
  Activity,
  Users,
  ShieldAlert,
  Scale,
  Ticket,
  Layers
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Preloader } from '@/components/Preloader';
import { LanguagePopup } from '@/components/LanguagePopup';
import { CountryPhoneInput } from '@/components/CountryPhoneInput';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { API_URL } from '@/config';
import { useLanguage } from '@/app/language-provider';
import { useTheme } from '@/app/theme-provider';

import { translations } from './translations';

export default function JniLandingPage() {
  const { toast } = useToast();
  const { sendOtp, verifyOtp, registerPasskey, loginWithPasskey } = useAuth();

  // Language configuration
  const { language: selectedLanguage, setLanguage: setSelectedLanguage } = useLanguage();
  const t = translations[selectedLanguage] || translations.English;
  const { theme } = useTheme();

  // Onboarding state
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'biometricPrompt' | 'success'>('phone');
  const [otpCodeSent, setOtpCodeSent] = useState<string | null>(null);
  const [submittingOtp, setSubmittingOtp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'otp' | 'biometric'>('otp');
  const [userCreated, setUserCreated] = useState<any>(null);

  // Billing cycle toggler
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Stats Counters
  const [driversCount, setDriversCount] = useState(5820);
  const [docsCount, setDocsCount] = useState(108420);

  useEffect(() => {
    const interval = setInterval(() => {
      setDriversCount(prev => prev + Math.floor(Math.random() * 2));
      setDocsCount(prev => prev + Math.floor(Math.random() * 4));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Request Callback Form States
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackEmail, setCallbackEmail] = useState('');
  const [callbackLang, setCallbackLang] = useState('English');
  const [callbackNotes, setCallbackNotes] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState(false);

  // Live Telemetry Event stream
  const [liveEventIndex, setLiveEventIndex] = useState(0);
  const liveEvents = [
    { time: '10:12:05', text: 'Outbound callback qualified: Lead converted to Registered User', status: 'LEAD' },
    { time: '10:12:15', text: 'OpenAI OCR parsed TLC License. Expiry: Dec 12, 2026. Status: SAFE', status: 'OCR' },
    { time: '10:12:28', text: 'Outbound reminders queued for 18 drivers via BullMQ', status: 'QUEUE' },
    { time: '10:12:40', text: 'Defensive Driving Course reminder dispatched via Twilio SMS', status: 'SMS' },
    { time: '10:13:02', text: 'Support Ticket #T-1042 generated: DMV summons dispute (HIGH)', status: 'TICKET' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveEventIndex(prev => (prev + 1) % liveEvents.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // AI Showcase Chat Simulation
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'user', text: 'How do I renew my TLC license?' },
    { sender: 'ai', text: 'Please upload a photo of your TLC driver card. Our OCR engine will parse your expiry date and map out your checklist.' }
  ]);
  const [chatStep, setChatStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setChatStep(prev => {
        const next = (prev + 1) % 3;
        if (next === 0) {
          setChatMessages([
            { sender: 'user', text: 'How do I renew my TLC license?' },
            { sender: 'ai', text: 'Please upload a photo of your TLC driver card. Our OCR engine will parse your expiry date and map out your checklist.' }
          ]);
        } else if (next === 1) {
          setChatMessages(prevMsgs => [
            ...prevMsgs,
            { sender: 'user', text: 'Okay, I just uploaded the image. What does the parser say?' }
          ]);
        } else if (next === 2) {
          setChatMessages(prevMsgs => [
            ...prevMsgs,
            { sender: 'ai', text: 'Parsed successfully! Expiry detected: Dec 12, 2026. I have added your DMV Woodside inspection (Due in 15 days) and Drug screening (Due in 32 days) to your compliance timeline.' }
          ]);
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }
    setSubmittingOtp(true);
    try {
      const res = await sendOtp(phone);
      setOtpStep('otp');
      if (res.codeForTesting) {
        setOtpCodeSent(res.codeForTesting);
        toast.info(`[Demo Mode] OTP Sent: ${res.codeForTesting}`);
      } else {
        toast.success(t.otpSentMsg);
      }
    } catch (err) {
      // Handled by hook toast
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setSubmittingOtp(true);
    try {
      const nameVal = firstName || lastName ? `${firstName} ${lastName}`.trim() : undefined;
      const res = await verifyOtp(phone, otp, nameVal, selectedLanguage);
      setUserCreated(res.user);

      // Prompt WebAuthn biometric enrollment if browser supports it
      if (window.PublicKeyCredential) {
        setOtpStep('biometricPrompt');
      } else {
        setOtpStep('success');
      }
    } catch (err) {
      // Handled by hook toast
    } finally {
      setSubmittingOtp(false);
    }
  };

  const handleRegisterBiometrics = async () => {
    if (!userCreated) return;
    try {
      const success = await registerPasskey(userCreated.id, userCreated.name);
      if (success) {
        toast.success('Passkey registered successfully! You can now log in via biometrics.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOtpStep('success');
    }
  };

  const handleBiometricLogin = async () => {
    if (!phone) {
      toast.error('Please enter your phone number first to locate your passkey credentials');
      return;
    }
    try {
      await loginWithPasskey(phone);
      setOtpStep('success');
    } catch (err) {
      // Handled by hook
    }
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackName || !callbackPhone) return;

    try {
      setSubmittingCallback(true);
      const res = await fetch(`${API_URL}/callback/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: callbackName,
          phone: callbackPhone,
          email: callbackEmail || undefined,
          language: callbackLang,
          notes: callbackNotes || 'Inbound callback request.'
        })
      });

      if (!res.ok) throw new Error('Callback request failed.');

      setCallbackSuccess(true);
      toast.success('Callback requested! Our agents will dial you shortly.');

      setCallbackName('');
      setCallbackPhone('');
      setCallbackEmail('');
      setCallbackNotes('');
    } catch (e) {
      toast.error('Failed to submit callback request. Please try again.');
    } finally {
      setSubmittingCallback(false);
    }
  };

  const featuresListTranslated = t.featuresList || [];
  const featuresIcons = [FileText, ShieldCheck, MessageSquare, Clock, Users, PhoneIncoming, Layers, Ticket];
  const features: any[] = featuresListTranslated.map((item: any, idx: number) => ({
    ...item,
    icon: featuresIcons[idx] || FileText
  }));

  const servicesListTranslated = t.servicesList || [];
  const servicesIcons = [ShieldAlert, Scale, FileText, Clock, MessageSquare, Globe];
  const services: any[] = servicesListTranslated.map((item: any, idx: number) => ({
    ...item,
    icon: servicesIcons[idx] || ShieldAlert
  }));

  const workflowStepsListTranslated = t.workflowStepsList || [];
  const workflowSteps: any[] = workflowStepsListTranslated.map((item: any, idx: number) => ({
    ...item,
    number: (idx + 1).toString().padStart(2, '0')
  }));

  const pricingPlans = [
    {
      name: selectedLanguage === 'Spanish' ? 'Soporte Básico' : selectedLanguage === 'Urdu' ? 'بنیادی سپورٹ' : selectedLanguage === 'Bengali' ? 'বেসিক সাপোর্ট' : selectedLanguage === 'French' ? 'Support de Base' : selectedLanguage === 'Mandarin' ? '基础支持' : 'Basic Support',
      price: billingPeriod === 'monthly' ? 0 : 0,
      description: selectedLanguage === 'Spanish' ? 'Seguimiento de cumplimiento esencial, guías y almacenamiento manual.' : selectedLanguage === 'Urdu' ? 'ضروری تعمیل کا ٹریکر، گائیڈز اور دستی دستاویز کا ذخیرہ۔' : selectedLanguage === 'Bengali' ? 'প্রয়োজনীয় কমপ্লায়েন্স ট্র্যাকিং, গাইড এবং ম্যানুয়াল নথি সংরক্ষণ।' : selectedLanguage === 'French' ? 'Suivi de conformité essentiel, guides et stockage manuel.' : selectedLanguage === 'Mandarin' ? '基本合规追踪、指南和手动文件存储。' : 'Essential compliance tracking, renewal guide articles, and manual document storage.',
      features: selectedLanguage === 'Spanish' 
        ? ['Calendario de cumplimiento centralizado', 'Guías de curso de conducción defensiva', 'Carga manual de documentos y etiquetas', 'Cola de soporte por correo estándar']
        : selectedLanguage === 'Urdu'
        ? ['مرکزی تعمیل کیلنڈر', 'ڈرائیونگ گائیڈز', 'دستی دستاویز اپ لوڈز', 'معیاری ای میل سپورٹ']
        : selectedLanguage === 'Bengali'
        ? ['কেন্দ্রীয় কমপ্লায়েন্স ক্যালেন্ডার', 'ড্রাইভিং গাইড', 'ম্যানুয়াল নথি আপলোড', 'স্ট্যান্ডার্ড ইমেল সমর্থন']
        : selectedLanguage === 'French'
        ? ['Calendrier de conformité centralisé', 'Guides de conduite défensive', 'Téléchargement manuel et étiquettes', 'Support e-mail standard']
        : selectedLanguage === 'Mandarin'
        ? ['集中合规日历', '防御性驾驶课程指南', '手动文档上传与标签', '标准电子邮件支持']
        : ['Centralized Compliance Calendar', 'Defensive driving course guides', 'Manual document uploading & tags', 'Standard Email support queue'],
      cta: selectedLanguage === 'Spanish' ? 'Comenzar Gratis' : selectedLanguage === 'Urdu' ? 'مفت شروع کریں' : selectedLanguage === 'Bengali' ? 'বিনামূল্যে শুরু করুন' : selectedLanguage === 'French' ? 'Commencer Gratuitement' : selectedLanguage === 'Mandarin' ? '免费开始' : 'Start Free',
      popular: false
    },
    {
      name: selectedLanguage === 'Spanish' ? 'Conductor Premium Pro' : selectedLanguage === 'Urdu' ? 'پریمیم ڈرائیور پرو' : selectedLanguage === 'Bengali' ? 'প্রিমিয়াম ড্রাইভার প্রো' : selectedLanguage === 'French' ? 'Conducteur Premium Pro' : selectedLanguage === 'Mandarin' ? '高级职业司机' : 'Premium Driver Pro',
      price: billingPeriod === 'monthly' ? 19 : 14,
      description: selectedLanguage === 'Spanish' ? 'Copiloto de IA, OCR estructurado y alertas por SMS.' : selectedLanguage === 'Urdu' ? 'اے آئی کپیلیٹ، او سی آر اور ایس ایم ایس الرٹس۔' : selectedLanguage === 'Bengali' ? 'এআই কো-পাইলট, ওসিআর এবং এসএমএস সতর্কতা।' : selectedLanguage === 'French' ? 'Copilote IA, OCR structuré et alertes SMS.' : selectedLanguage === 'Mandarin' ? 'AI 协同、OCR 解析和短信提醒。' : 'AI-powered co-pilot assistance, structured OCR document parsing, and Twilio SMS alerts.',
      features: selectedLanguage === 'Spanish'
        ? ['Motor OCR estructurado de OpenAI', 'Copiloto de IA por WebSocket', 'Alertas de vencimiento por SMS y correo', 'Panel de tickets de soporte centralizado', 'Prioridad de inspección Woodside']
        : selectedLanguage === 'Urdu'
        ? ['اوپن اے آئی او سی آر انجن', 'ریئل ٹائم اے آئی کپیلیٹ', 'خودکار ایس ایم ایس الرٹس', 'سپورٹ ٹکٹ ڈیش بورڈ', 'ووڈ سائیڈ تفتیشی ترجیح']
        : selectedLanguage === 'Bengali'
        ? ['ওপেনএআই ওসিআর ইঞ্জিন', 'রিয়েল-টাইম এআই কো-পাইলট', 'স্বয়ংক্রিয় এসএমএস অ্যালার্ট', 'সহায়তা টিকিট ড্যাশবোর্ড', 'উডসাইড তদন্তের অগ্রাধিকার']
        : selectedLanguage === 'French'
        ? ['Moteur OCR structuré OpenAI', 'Copilote IA par WebSocket', 'Alertes d\'expiration SMS et e-mail', 'Tableau de bord de tickets centralisé', 'Priorité d\'inspection Woodside']
        : selectedLanguage === 'Mandarin'
        ? ['OpenAI 结构化 OCR 引擎', '实时 AI 协同助手', '自动短信与邮件过期提醒', '集中工单仪表板', 'Woodside 检查优先时段']
        : ['OpenAI Structured OCR Engine', 'Real-time WebSocket AI Co-pilot', 'Automated SMS & email expiry alerts', 'Centralized support ticket dashboard', 'Woodside inspection priority slots'],
      cta: selectedLanguage === 'Spanish' ? 'Suscribirse Pro' : selectedLanguage === 'Urdu' ? 'پرو سبسکرائب کریں' : selectedLanguage === 'Bengali' ? 'প্রো সাবস্ক্রাইব করুন' : selectedLanguage === 'French' ? 'S\'abonner Pro' : selectedLanguage === 'Mandarin' ? '订阅专业版' : 'Subscribe Pro',
      popular: true
    },
    {
      name: selectedLanguage === 'Spanish' ? 'Flota Enterprise' : selectedLanguage === 'Urdu' ? 'انٹرپرائز فلیٹ' : selectedLanguage === 'Bengali' ? 'এন্টারপ্রাইজ ফ্লিট' : selectedLanguage === 'French' ? 'Flotte Entreprise' : selectedLanguage === 'Mandarin' ? '车队企业版' : 'Enterprise Fleet',
      price: billingPeriod === 'monthly' ? 99 : 79,
      description: selectedLanguage === 'Spanish' ? 'Registro de cumplimiento centralizado para operadores de taxis y flotas.' : selectedLanguage === 'Urdu' ? 'ٹیکسی اور فلیٹ آپریٹرز کے لیے مرکزی تعمیل۔' : selectedLanguage === 'Bengali' ? 'ট্যাক্সি এবং ফ্লিট অপারেটরদের জন্য কেন্দ্রীয় কমপ্লায়েন্স।' : selectedLanguage === 'French' ? 'Suivi centralisé pour les répartiteurs de taxis et les flottes.' : selectedLanguage === 'Mandarin' ? '适用于出租车运营商 and 车队的集中合规注册表。' : 'Central billing and invoice logs managing driver accounts, premium subscriptions, and features access.',
      features: selectedLanguage === 'Spanish'
        ? ['Registro de cumplimiento de flota centralizado', 'Gestión de hasta 10 licencias de conducir', 'Enrutamiento de tickets de soporte centralizado', 'Gestor de cuentas dedicado 24/7', 'Creación de artículos con contexto RAG']
        : selectedLanguage === 'Urdu'
        ? ['مرکزی فلیٹ تعمیل لاگ', '10 ڈرائیور لائسنسوں کا انتظام', 'مرکزی سپورٹ ٹکٹ روٹنگ', '24/7 اکاؤنٹ مینیجر', 'آر اے جی مضمون تخلیق']
        : selectedLanguage === 'Bengali'
        ? ['কেন্দ্রীয় ফ্লিট কমপ্লায়েন্স লগ', '১০ জন ড্রাইভার লাইসেন্স পরিচালনা', 'সহায়তা টিকিট রাউটিং', '২৪/৭ অ্যাকাউন্ট ম্যানেজার', 'আরএজি নিবন্ধ তৈরি']
        : selectedLanguage === 'French'
        ? ['Registre de conformité de flotte centralisé', 'Gérer jusqu\'à 10 licences', 'Routage de tickets centralisé', 'Gestionnaire de compte dédié 24/7', 'Création d\'articles contextuels RAG']
        : selectedLanguage === 'Mandarin'
        ? ['集中车队合规日志', '管理最多 10 个驾驶员执照', '集中支持工单路由', '24/7 专属客户经理', 'RAG 上下文文章创建']
        : ['Centralized Fleet Compliance Log', 'Manage up to 10 driver licenses', 'Centralized support ticket routing', 'Dedicated 24/7 account manager', 'RAG Context articles creation'],
      cta: selectedLanguage === 'Spanish' ? 'Suscribirse Flota' : selectedLanguage === 'Urdu' ? 'فلیٹ سبسکرائب کریں' : selectedLanguage === 'Bengali' ? 'ফ্লিট সাবস্ক্রাইব করুন' : selectedLanguage === 'French' ? 'S\'abonner Flotte' : selectedLanguage === 'Mandarin' ? '订阅车队版' : 'Subscribe Fleet',
      popular: false
    }
  ];

  const testimonials: any[] = (t.testimonialsList || []).map((item: any) => ({
    ...item,
    stars: 5
  }));

  const faqItems: any[] = t.faqItemsList || [];

  const whatsappUrl = `https://wa.me/19177359169?text=Hello%20JNI%20Admin%2C%20I%20want%20to%20connect%20my%20TLC%20driver%20account.`;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Preloader />
      <LanguagePopup onLanguageSelect={(lang) => setSelectedLanguage(lang as any)} />
      <Navbar />

      {/* 1st Section: Hero Section */}
      <section id="home" className="relative overflow-hidden py-20 lg:py-28 transition-colors duration-300">
        {/* NYC Skyline Background – switches between dark and light asset */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-35 transition-all duration-500"
          style={{ backgroundImage: theme === 'dark' ? "url('/hero-bg.png')" : "url('/hero-bg-light.png')" }}
        />
        {/* Gradient overlay to blend the image into the page */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-amber-50/20 dark:from-[#0B0B0B]/90 dark:via-[#0B0B0B]/70 dark:to-transparent transition-colors duration-500" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-[-5%] left-1/4 w-[500px] h-[500px] bg-[#F5C400]/8 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Big Hero Title + CTA Buttons + Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-7 text-center lg:text-left"
            >
              {/* Live badge */}
              <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full border border-[#F5C400]/20 bg-[#F5C400]/5 text-[#D9A300] dark:text-[#F5C400] text-xs font-bold tracking-wider uppercase shadow-lg backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{driversCount.toLocaleString()}+ Active Protected Drivers</span>
              </div>

              {/* Main headline */}
              <h1 className="font-heading font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05] text-slate-900 dark:text-white">
                {selectedLanguage === 'English' ? (
                  <>
                    Centralized <br />
                    Support <br />
                  </>
                ) : (
                  <>
                    {t.heroTitle} <br />
                  </>
                )}
                <span className="block mt-2 text-[#F5C400]">
                  {t.heroSubtitle}
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                {t.heroDesc}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/auth/signup">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 bg-[#F5C400] hover:bg-[#D9A300] text-black font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg shadow-[#F5C400]/20 transition-colors cursor-pointer"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2.5 border-2 border-slate-800 dark:border-zinc-600 text-slate-900 dark:text-zinc-100 hover:bg-slate-50/80 dark:hover:bg-zinc-800/80 font-extrabold text-sm px-8 py-4 rounded-xl transition-all cursor-pointer bg-white/40 dark:bg-transparent backdrop-blur-sm"
                  >
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Connect WhatsApp</span>
                  </motion.button>
                </a>
              </div>

              {/* Social proof row */}
              <div className="flex items-center justify-center lg:justify-start gap-3 pt-1">
                <div className="flex -space-x-2">
                  {['JK', 'MR', 'SA', 'PT', 'DA'].map((initials, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-bold text-zinc-300 shadow-sm"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                  <span className="text-slate-800 dark:text-white font-extrabold">2,000+</span> drivers joined this month
                </p>
              </div>
            </motion.div>
            {/* Right Column: Premium Glowing Dashboard Widget */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="lg:col-span-6 relative w-full max-w-lg aspect-[4/3] rounded-3xl p-6 border border-slate-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/40 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-[#F5C400]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-[#F5C400]/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/50 pb-4 z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center text-[#D9A300]">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">TLC Compliance Monitor</h4>
                    <span className="text-[9px] text-[#25D366] font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      100% Protected
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[9px] font-mono text-zinc-400">
                  <Activity className="w-3 h-3 text-[#F5C400] mr-1 animate-pulse" />
                  <span>Real-time Status</span>
                </div>
              </div>

              <div className="space-y-3.5 my-4 z-10">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/55 border border-slate-100 dark:border-zinc-800/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">TLC License Expiry Verification</span>
                  </div>
                  <span className="text-[10px] text-zinc-405 font-mono font-semibold">Dec 12, 2026</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/55 border border-slate-100 dark:border-zinc-800/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">DMV Safety Woodside Inspection</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono font-semibold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">PASS</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/55 border border-slate-100 dark:border-zinc-800/50 rounded-xl border-dashed border-[#F5C400]/40">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-[#D9A300] animate-spin-slow" />
                    <span className="text-xs font-bold text-[#D9A300]">Drug Screening Timeline</span>
                  </div>
                  <span className="text-[10px] text-[#D9A300] font-mono font-extrabold bg-[#F5C400]/10 px-2 py-0.5 rounded-md">15 Days Left</span>
                </div>

                {/* Live Telemetry Log Row inside widget */}
                <div className="flex items-center justify-between p-3 bg-slate-100/80 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl">
                  <div className="flex items-center space-x-2.5 w-full overflow-hidden text-[9px] sm:text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    <span className="text-[#D9A300] dark:text-[#F5C400] font-bold shrink-0">{liveEvents[liveEventIndex]?.time}</span>
                    <span className="text-zinc-300 dark:text-zinc-700 shrink-0">|</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={liveEventIndex}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.25 }}
                        className="truncate flex-1 text-left"
                      >
                        {liveEvents[liveEventIndex]?.text}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[#D9A300] dark:text-[#F5C400]/80 font-extrabold bg-[#F5C400]/10 px-1 rounded-[3px] text-[8px] tracking-wider shrink-0 uppercase">
                      {liveEvents[liveEventIndex]?.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800/50 pt-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-800 dark:text-zinc-200 leading-tight">Renewals On Track</h5>
                    <span className="text-[8px] text-zinc-400 block">Auto-synced • Just now</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#F5C400] font-bold hover:underline cursor-pointer flex items-center gap-1">
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="py-12 bg-slate-50/50 dark:bg-zinc-950/40 backdrop-blur-sm border-y border-slate-100 dark:border-zinc-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
          >
            {[
              { val: driversCount, label: 'NYC Drivers Protected', suffix: '+' },
              { val: docsCount, label: 'Documents Extracted', suffix: '+' },
              { val: '98.4%', label: 'Renewals Verified', suffix: '' },
              { val: '< 5m', label: 'Outbound Callback Response', suffix: '' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
                }}
                className="group space-y-1 cursor-default"
              >
                <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 dark:text-white transition-colors duration-300 group-hover:text-[#F5C400]">
                  {typeof stat.val === 'number' ? stat.val.toLocaleString() : stat.val}{stat.suffix}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BG GROUP 1: driver-yellow-cab.png (Sections 2 + 3 share one seamless background) ── */}
      <div className="relative transition-colors duration-300" style={{ clipPath: 'inset(0)' }}>
        {/* Single shared fixed background — no seams at all */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0 select-none md:fixed"
          style={{
            backgroundImage: "url('/driver-yellow-cab.png')",
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        />
        {/* Shared backdrop overlay */}
        <div className="absolute inset-0 bg-white/55 dark:bg-zinc-950/90 transition-colors duration-300 pointer-events-none z-10" />

        {/* 2nd Section: Features Section (TLC Compliance & Support SaaS) */}
        <section className="py-24 lg:py-32 relative z-20 overflow-hidden">
          {/* Decorative Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          <div className="absolute right-[-10%] top-[-10%] w-[600px] h-[600px] bg-[#F5C400]/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute left-[-10%] bottom-[-10%] w-[500px] h-[500px] bg-[#F5C400]/3 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-3xl mx-auto mb-20 space-y-5"
            >
              <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900/50">
                JNI PLATFORM BENEFITS
              </div>
              <h2 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 dark:text-white leading-tight">
                {selectedLanguage === 'English' ? (
                  <>
                    TLC Compliance & <br />
                    Support SaaS
                  </>
                ) : (
                  t.featuresTitle
                )}
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-medium max-w-2xl mx-auto">
                {t.featuresDesc}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: (idx % 4) < 2 ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: (idx % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6 }}
                    className="group relative bg-slate-50/70 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl p-7 flex flex-col gap-6 hover:border-[#F5C400] hover:shadow-2xl hover:shadow-[#F5C400]/5 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F5C400]/0 to-[#F5C400]/0 group-hover:from-[#F5C400]/5 group-hover:to-transparent transition-all duration-500 rounded-2xl" />
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-[#D9A300] dark:text-[#F5C400] group-hover:bg-[#F5C400] group-hover:text-[#0B0B0B] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0 relative z-10 shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#D9A300] dark:group-hover:text-[#F5C400] transition-colors duration-200">{feat.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">{feat.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3rd Section: Driver Reviews & Testimonials */}
        <section className="py-24 lg:py-32 border-b border-slate-100 dark:border-zinc-900 relative z-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="text-center max-w-3xl mx-auto mb-16 space-y-4"
            >
              <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/50 dark:bg-zinc-900/50">
                DRIVER ENDORSEMENTS
              </div>
              <h2 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white">
                {t.reviewsTitle}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((test, idx) => (
                <motion.div
                  key={idx}
                  initial={{ 
                    opacity: 0, 
                    x: idx === 0 ? -60 : idx === 2 ? 60 : 0, 
                    y: idx === 1 ? 45 : 0 
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 p-7 rounded-2xl space-y-5 shadow-sm hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex gap-1 text-[#F5C400]">
                      {Array.from({ length: test.stars }).map((_, sIdx) => (
                        <Star key={sIdx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed italic font-medium">
                      &ldquo;{test.quote}&rdquo;
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 dark:border-zinc-800/80 mt-2">
                    <div className="w-9 h-9 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center text-xs font-bold text-[#D9A300]">
                      {test.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {test.author.split(',')[0]}
                        </h5>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{test.author.split(',')[1]}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 4th Section: FAQ Accordions (Split Layout) */}
      <section className="py-24 lg:py-32 transition-colors duration-300 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Got Questions? */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900/50">
                GOT QUESTIONS?
              </div>
              <h2 className="font-heading font-extrabold text-4xl tracking-tight text-slate-900 dark:text-white leading-tight">
                Frequently Asked <br /> Questions
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                Find quick, clear answers to common JNI compliance queries, timelines, and legal support guidelines.
              </p>
              
              <div className="pt-4 p-6 bg-slate-50 dark:bg-zinc-900 border border-slate-200/65 dark:border-zinc-800 rounded-2xl text-left space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Still need help?</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Can't find the answer you are looking for? Reach out to support directly and request a call.
                </p>
                <a href="#callback-request" className="block">
                  <Button size="sm" className="w-full bg-[#F5C400] hover:bg-[#D9A300] text-black font-extrabold text-xs py-2 rounded-xl">
                    Request a Callback
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right Column: Accordion */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-8"
            >
              <Accordion items={faqItems} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BG GROUP 2: compliance-phone-app.png (Sections 5 + 6 share one seamless background) ── */}
      <div className="relative transition-colors duration-300" style={{ clipPath: 'inset(0)' }}>
        {/* Single shared fixed background — no seams at all */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0 select-none md:fixed"
          style={{
            backgroundImage: "url('/compliance-phone-app.png')",
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        />
        {/* Shared backdrop overlay */}
        <div className="absolute inset-0 bg-slate-50/55 dark:bg-zinc-950/90 transition-colors duration-300 pointer-events-none z-10" />

        {/* 5th Section: Services Section (Complete Driver Workflow Coverage) */}
        <section id="services" className="py-24 lg:py-32 relative z-20 overflow-hidden">
          <div className="absolute left-[-5%] bottom-0 w-[400px] h-[400px] bg-[#D9A300]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55 }}
              className="text-center max-w-3xl mx-auto mb-20 space-y-5"
            >
              <div className="inline-flex items-center border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-2 bg-white/50 dark:bg-zinc-900/50">
                SERVICES SUITE
              </div>
              <h2 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 dark:text-white leading-tight">
                {t.servicesTitle}
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base font-medium">
                {t.servicesDesc}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ 
                      opacity: 0, 
                      x: idx === 0 ? -60 : idx === 2 ? 60 : 0, 
                      y: idx === 1 ? 45 : 0 
                    }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.65, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6 }}
                    className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl hover:border-[#F5C400] hover:shadow-2xl hover:shadow-[#F5C400]/5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F5C400]/0 group-hover:from-[#F5C400]/5 to-transparent transition-all duration-500 rounded-2xl" />
                    
                    <div className="space-y-5 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 text-[#D9A300] dark:text-[#F5C400] flex items-center justify-center group-hover:bg-[#F5C400] group-hover:text-[#0B0B0B] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-[#D9A300] dark:group-hover:text-[#F5C400] transition-colors duration-200">{service.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">{service.description}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-zinc-800/80 mt-6 relative z-10">
                      <span className="flex items-center gap-1.5 text-xs text-[#D9A300] dark:text-[#F5C400] font-bold group-hover:gap-3 transition-all duration-200">
                        <span>Learn more</span>
                        <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6th Section: How It Works — Animated Timeline */}
        <section className="py-24 lg:py-32 relative z-20 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,_#F5C40008,transparent)] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto mb-20 space-y-4"
            >
              <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900/50">
                SIMPLIFIED JOURNEY
              </div>
              <h2 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight">
                Get Compliant in 5 Steps
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
                From registration to full TLC compliance — JNI guides every driver through a clear, automated path.
              </p>
            </motion.div>

            {/* Timeline — Desktop: horizontal line with numbered nodes */}
            <div className="relative">
              {/* Horizontal connector line (desktop only) */}
              <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#F5C400]/40 to-transparent z-0" />

              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                {workflowSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: (idx % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex flex-col items-center text-center relative cursor-pointer"
                  >
                    {/* Vertical connector for mobile */}
                    {idx < workflowSteps.length - 1 && (
                      <div className="md:hidden absolute left-1/2 top-[56px] w-0.5 h-8 bg-gradient-to-b from-[#F5C400]/40 to-transparent -translate-x-1/2 z-0" />
                    )}

                    {/* Step circle node */}
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 3 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="relative w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-700 group-hover:border-[#F5C400] group-hover:shadow-xl group-hover:shadow-[#F5C400]/15 transition-all duration-300 flex items-center justify-center mb-5 shadow-sm z-10"
                    >
                      <span className="font-heading font-extrabold text-2xl text-[#F5C400]/50 group-hover:text-[#F5C400] transition-colors duration-300">
                        {step.number}
                      </span>
                      <div className="absolute inset-0 rounded-2xl bg-[#F5C400]/0 group-hover:bg-[#F5C400]/5 transition-all duration-300" />
                    </motion.div>

                    {/* Step content */}
                    <div className="space-y-2 max-w-[160px] group-hover:translate-y-[-2px] transition-transform duration-200">
                      <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#D9A300] dark:group-hover:text-[#F5C400] transition-colors duration-200 leading-snug">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow connector for desktop */}
                    {idx < workflowSteps.length - 1 && (
                      <div className="hidden md:flex absolute top-[21px] right-[-20px] w-10 h-10 items-center justify-center z-20">
                        <ArrowRight className="w-4 h-4 text-[#F5C400]/25 group-hover:text-[#F5C400]/60 transition-colors duration-300" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── BG GROUP 3: section-bg.png (Sections 7 + 8 + 9 share one seamless background) ── */}
      <div className="relative transition-colors duration-300" style={{ clipPath: 'inset(0)' }}>
        {/* Single shared fixed background — no seams at all */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0 select-none md:fixed"
          style={{
            backgroundImage: "url('/section-bg.png')",
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        />
        {/* Shared backdrop overlay */}
        <div className="absolute inset-0 bg-slate-50/55 dark:bg-zinc-950/90 transition-colors duration-300 pointer-events-none z-10" />
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-[100px] pointer-events-none z-10" />

        {/* 7th Section: AI Showcase (Co-pilot Compliance Checks) */}
        <section id="ai-showcase" className="py-24 lg:py-32 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/50 dark:bg-zinc-900/50">
                Interactive AI Demo
              </div>
              <h2 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight">
                Co-pilot Compliance
                <span className="block text-[#F5C400]">Checks</span>
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed font-medium">
                Ask JNI AI Copilot how to renew your license, check required safety documents, or map out expiration checkups. Send files in real time for parsing and reminders.
              </p>
              {/* Topic tag pills */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {['TLC Renewal', 'DMV Inspection', 'Drug Screen', 'Summons Dispute'].map((tag) => (
                  <span key={tag} className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-3 py-1.5 rounded-full hover:border-[#F5C400] hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-all duration-200 cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="pt-2">
                <Link href="/auth/login">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-[#F5C400] hover:bg-[#D9A300] text-[#0B0B0B] font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-[#F5C400]/20 transition-colors cursor-pointer text-sm"
                  >
                    <span>Try Copilot Interface</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">• JNI Copilot • Active Session</span>
                  <div className="w-12" />
                </div>

                <div className="h-64 overflow-y-auto space-y-4 p-3 bg-slate-50 dark:bg-zinc-950/60 rounded-xl border border-slate-200/60 dark:border-zinc-800/80">
                  {chatMessages.map((msg, idx) => {
                    const isAI = msg.sender === 'ai';
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse'}`}
                      >
                        <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          isAI 
                            ? 'bg-[#F5C400]/20 text-[#D9A300]' 
                            : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700'
                        }`}>
                          {isAI ? 'AI' : 'D'}
                        </div>
                        <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                          isAI
                            ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 rounded-tl-none font-medium shadow-sm'
                            : 'bg-[#1C160C] border border-[#F5C400]/20 text-[#F5C400] rounded-tr-none font-semibold'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-typing query..."
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none text-slate-500 dark:text-zinc-400 placeholder-slate-400 dark:placeholder-zinc-700"
                  />
                  <Button size="sm" className="shrink-0 bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300]" disabled>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8th Section: Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 relative z-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900/50">
              TRANSPARENT PLANS
            </div>
            <h2 className="font-heading font-extrabold text-4xl tracking-tight text-slate-900 dark:text-white leading-tight">
              Choose Your Compliance Plan
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 text-sm sm:text-base font-medium">
              Flexible tiers designed to keep individual owner-operators and fleets active.
            </p>

            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 mt-6">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${billingPeriod === 'monthly' ? 'bg-[#F5C400] shadow text-[#0B0B0B]' : 'text-slate-500 dark:text-zinc-400 hover:text-[#0B0B0B] dark:hover:text-white'
                  }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'bg-[#F5C400] shadow text-[#0B0B0B]' : 'text-slate-500 dark:text-zinc-400 hover:text-[#0B0B0B] dark:hover:text-white'
                  }`}
              >
                <span>Yearly Billing</span>
                <span className="bg-[#0B0B0B] text-[#F5C400] text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase">Save 20%</span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ 
                  opacity: 0, 
                  x: idx === 0 ? -60 : idx === 2 ? 60 : 0, 
                  y: idx === 1 ? 45 : 0 
                }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className={`group bg-slate-50 dark:bg-zinc-900 border rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 cursor-pointer ${plan.popular
                    ? 'border-2 border-[#F5C400] dark:border-[#F5C400] shadow-xl shadow-[#F5C400]/5 ring-1 ring-[#F5C400]'
                    : 'border-slate-200 dark:border-zinc-800 hover:shadow-md'
                  }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 bg-[#F5C400] text-[#0B0B0B] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#D9A300]">
                    Popular Option
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h4 className={`font-heading font-extrabold text-lg transition-colors duration-200 ${plan.popular ? 'text-[#D9A300] dark:text-[#F5C400]' : 'text-slate-700 dark:text-zinc-400 group-hover:text-[#D9A300] dark:group-hover:text-[#F5C400]'}`}>
                      {plan.name}
                    </h4>
                    <div className="mt-4 flex items-baseline">
                      <span className="font-heading font-extrabold text-4xl text-slate-900 dark:text-white">${plan.price}</span>
                      <span className="text-slate-400 text-xs ml-1">/ month</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">{plan.description}</p>

                  <ul className="space-y-3.5 text-xs border-t border-slate-200 dark:border-zinc-800 pt-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#D9A300] dark:text-[#F5C400] shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link href="/auth/login" className="block w-full">
                    <Button
                      className={`w-full font-bold text-xs py-3 border-0 transition-colors ${plan.popular
                          ? 'bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300]'
                          : 'bg-slate-200 dark:bg-zinc-850 text-slate-900 dark:text-white hover:bg-[#F5C400] hover:text-[#0B0B0B] dark:hover:bg-[#F5C400] dark:hover:text-[#0B0B0B]'
                        }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9th Section: Callback Request Form (Split Dialer Metrics + Form Card Layout) */}
      <section id="callback-request" className="py-24 lg:py-32 relative z-20 overflow-hidden">
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-[#F5C400]/5 rounded-full blur-[120px] pointer-events-none z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Telephony Metrics */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 text-[#D9A300] dark:text-[#F5C400] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/50 dark:bg-zinc-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                OUTBOUND SUPPORT PORTAL
              </div>
              <h2 className="font-heading font-extrabold text-4xl tracking-tight text-slate-900 dark:text-white leading-tight">
                Connect with our <br />
                Voice AI Dialer
              </h2>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">
                Need answers regarding your TLC license renew checkups or DMV inspections? Submit your name and phone number. Our intelligent Voice dialer or live support representative will ring you back within 5 minutes.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 text-left">
                <div className="p-4 bg-white/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl space-y-1 shadow-sm">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-extrabold block">Average Queue</span>
                  <span className="text-xl font-heading font-extrabold text-[#D9A300] dark:text-[#F5C400] block">&lt; 3.2 Min</span>
                </div>
                <div className="p-4 bg-white/80 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800/80 rounded-xl space-y-1 shadow-sm">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-extrabold block">Dial Accuracy</span>
                  <span className="text-xl font-heading font-extrabold text-emerald-500 block">99.8% Success</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Callback Request Form Card */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
                {callbackSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3"
                  >
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Callback Request Logged</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      Thank you! We have logged a CRM lead, opened a general support ticket, and placed your phone number into our Voice AI dialer dispatch queue. We will dial you shortly.
                    </p>
                    <Button
                      onClick={() => setCallbackSuccess(false)}
                      className="bg-[#0B0B0B] text-white hover:bg-[#F5C400] hover:text-[#0B0B0B] text-xs font-bold px-4 py-2 mt-2 rounded-xl"
                    >
                      Request Another Call
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleCallbackSubmit} className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Your Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Driver Name..."
                          value={callbackName}
                          onChange={(e) => setCallbackName(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#F5C400]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Phone number</label>
                        <CountryPhoneInput
                          value={callbackPhone}
                          onChange={(full) => setCallbackPhone(full)}
                          placeholder="Enter phone..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="driver@gmail.com..."
                          value={callbackEmail}
                          onChange={(e) => setCallbackEmail(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#F5C400]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Preferred Language</label>
                        <select
                          value={callbackLang}
                          onChange={(e) => setCallbackLang(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#F5C400]"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="Urdu">Urdu</option>
                          <option value="Mandarin">Mandarin</option>
                          <option value="Bengali">Bengali</option>
                          <option value="French">French</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-zinc-400 tracking-wider">Consultation Notes / Summons Details</label>
                      <textarea
                        placeholder="Briefly describe what you need assistance with..."
                        value={callbackNotes}
                        onChange={(e) => setCallbackNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:border-[#F5C400]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingCallback}
                      className="bg-[#F5C400] hover:bg-[#D9A300] text-black font-extrabold text-xs px-6 py-4 rounded-xl uppercase tracking-wider w-full shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{submittingCallback ? 'Scheduling outbound dispatch...' : 'Submit Callback Request'}</span>
                      <ArrowRight className="w-4 h-4 animate-pulse" />
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      </div>

      {/* 10th Section: Final CTA Banner */}
      <section className="py-24 lg:py-32 bg-slate-50 dark:bg-zinc-900 overflow-hidden text-center transition-colors duration-300 relative">
        {/* Background Image matching hero section style */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-25 transition-all duration-500 pointer-events-none"
          style={{ backgroundImage: theme === 'dark' ? "url('/hero-bg.png')" : "url('/hero-bg-light.png')" }}
        />
        {/* Gradient overlay to blend background image perfectly */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-amber-50/20 dark:from-zinc-900/95 dark:via-zinc-900/75 dark:to-transparent transition-colors duration-500 pointer-events-none" />
        
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-[#D9A300]/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 relative space-y-6 z-10"
        >
          <h2 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight">
            {t.readyTitle || 'Ready to Protect Your TLC Profile?'}
          </h2>
          <p className="text-slate-650 dark:text-zinc-350 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-semibold">
            {t.readyDesc || 'Launch your compliance dashboard. Upload licenses, access AI copilot, receive SMS reminders, and dispute summonses in real time.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="#home">
              <Button size="lg" className="w-full sm:w-auto bg-[#F5C400] text-black hover:bg-[#D9A300] font-bold border-0 px-8 py-3.5 rounded-xl shadow-md">
                {t.readyCta || 'Get Started Now (Sign Up)'}
              </Button>
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-1.5 bg-transparent">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>{t.connectWhatsapp}</span>
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
