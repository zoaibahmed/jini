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

import { translations } from './translations';

export default function JniLandingPage() {
  const { toast } = useToast();
  const { sendOtp, verifyOtp, registerPasskey, loginWithPasskey } = useAuth();

  // Language configuration
  const { language: selectedLanguage, setLanguage: setSelectedLanguage } = useLanguage();
  const t = translations[selectedLanguage] || translations.English;

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
      <section id="home" className="relative overflow-hidden py-20 lg:py-28 border-b border-slate-100 dark:border-zinc-800 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F5C400]/5 via-transparent to-transparent bg-opacity-[0.03] dark:bg-opacity-[0.015] transition-colors duration-300">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-[-5%] left-1/4 w-[500px] h-[500px] bg-[#F5C400]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left Column: Title & Onboarding CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full border border-[#F5C400]/20 bg-[#F5C400]/5 text-[#D9A300] dark:text-[#F5C400] text-xs font-bold tracking-wider uppercase shadow-lg shadow-[#F5C400]/5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{driversCount.toLocaleString()}+ Active Protected Drivers</span>
              </div>

              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-slate-900 dark:text-white">
                {t.heroTitle} <br />
                <span className="block mt-2 sm:mt-3 bg-clip-text text-transparent bg-gradient-to-r from-[#F5C400] via-[#FFE5A3] to-amber-500">
                  {t.heroSubtitle}
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {t.heroDesc}
              </p>

              {/* Hero CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-[#F5C400] text-black hover:bg-[#D9A300] font-extrabold text-sm px-8 py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5">
                    Sign Up
                  </Button>
                </Link>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-slate-900 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/80 font-extrabold text-sm px-8 py-4 rounded-xl transition-transform hover:-translate-y-0.5">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Connect WhatsApp</span>
                  </Button>
                </a>
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
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800/50 pt-4 flex items-center justify-between z-10">
                <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Timeline Auto-Synced</span>
                <span className="text-[10px] text-[#F5C400] font-bold hover:underline cursor-pointer flex items-center gap-1">
                  <span>Open Active Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="py-8 bg-slate-50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-0.5">
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">{driversCount.toLocaleString()}+</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">NYC Drivers Protected</p>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">{docsCount.toLocaleString()}+</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Documents Extracted</p>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">98.4%</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Renewals Verified</p>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">&lt; 5m</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Outbound Callback Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2nd Section: Features Section (TLC Compliance & Support SaaS) */}
      <section className="py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#F5C400]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">JNI Platform Benefits</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              {t.featuresTitle}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              {t.featuresDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.01 }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="group h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg dark:hover:shadow-black/25 hover:border-[#F5C400]/40 dark:hover:border-[#F5C400]/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center text-[#D9A300] dark:text-[#F5C400] group-hover:bg-[#F5C400] group-hover:text-[#0B0B0B] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0B0B0B] dark:text-slate-100 mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3rd Section: Driver Reviews & Testimonials */}
      <section className="py-20 lg:py-24 bg-slate-50 dark:bg-zinc-900/10 border-b border-slate-100 dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-14 space-y-3"
          >
            <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Driver Endorsements</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              {t.reviewsTitle}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01 }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-1 text-[#F5C400]">
                  {Array.from({ length: test.stars }).map((_, sIdx) => (
                    <Star key={sIdx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic font-semibold">&ldquo;{test.quote}&rdquo;</p>
                <div className="flex items-center space-x-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center text-xs font-bold text-[#D9A300]">
                    {test.author.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#111111] dark:text-slate-200">{test.author.split(',')[0]}</h5>
                    <span className="text-[10px] text-slate-400 font-medium">{test.author.split(',')[1]}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4th Section: FAQ Accordions */}
      <section className="py-20 lg:py-24 border-b border-[#E5E5E5] dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center mb-14 space-y-3"
          >
            <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Got Questions?</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Accordion items={faqItems} />
          </motion.div>
        </div>
      </section>

      {/* 5th Section: Services Section (Complete Driver Workflow Coverage) */}
      <section id="services" className="py-20 lg:py-28 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-b border-[#E5E5E5] dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-[#D9A300]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Services Suite</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              {t.servicesTitle}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">
              {t.servicesDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.01 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="group bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 p-6 rounded-2xl hover:shadow-lg dark:hover:shadow-black/25 hover:border-[#F5C400]/40 dark:hover:border-[#F5C400]/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 border border-[#F5C400]/20 text-[#D9A300] dark:text-[#F5C400] flex items-center justify-center group-hover:bg-[#F5C400] group-hover:text-[#0B0B0B] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-[#111111] dark:text-slate-100 group-hover:text-[#F5C400] transition-colors duration-200 mb-3">{service.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6th Section: How It Works (Get Compliant in 5 Simple Steps) */}
      <section className="py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-zinc-800 relative transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider block">Simplified Journey</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              Get Compliant in 5 Simple Steps
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01 }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group space-y-4 relative bg-[#F5F5F5]/30 dark:bg-zinc-900/20 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-[#F5C400]/30 dark:hover:border-[#F5C400]/20 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center space-x-4 md:block">
                  <div className="font-heading font-extrabold text-4xl text-[#F5C400]/40 md:mb-2 group-hover:text-[#F5C400] group-hover:scale-110 transition-all duration-300 origin-left">{step.number}</div>
                  <h4 className="font-heading font-bold text-base text-[#111111] dark:text-slate-100 group-hover:text-[#F5C400] transition-colors duration-200">{step.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7th Section: AI Showcase (Co-pilot Compliance Checks) */}
      <section id="ai-showcase" className="py-20 lg:py-28 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-b border-[#E5E5E5] dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#F5C400]/3 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="lg:col-span-5 space-y-6 text-center lg:text-left"
            >
              <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Interactive AI Demo</span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
                Co-pilot Compliance Checks
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                Ask JNI AI Copilot how to renew your license, check required safety documents, or map out expiration checkups. Send files in real time for parsing and reminders.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button className="flex items-center gap-2 bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] border-0 font-bold px-6 py-2.5">
                    <span>Try Copilot Interface</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <div className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-2xl shadow-xl p-5 space-y-4 transition-colors duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI Co-pilot Online</span>
                </div>

                <div className="h-64 overflow-y-auto space-y-3 p-2 bg-[#F5F5F5]/50 dark:bg-zinc-950/50 rounded-xl border border-slate-100/50 dark:border-zinc-800/50">
                  {chatMessages.map((msg, idx) => {
                    const isAI = msg.sender === 'ai';
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse'}`}
                      >
                        <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold ${isAI ? 'bg-[#F5C400]/20 text-[#D9A300]' : 'bg-slate-200 text-slate-700'
                          }`}>
                          {isAI ? 'AI' : 'D'}
                        </div>
                        <div className={`p-3 rounded-xl text-xs leading-relaxed ${isAI
                            ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 rounded-tl-none font-medium shadow-sm'
                            : 'bg-[#0B0B0B] dark:bg-zinc-950 text-white rounded-tr-none font-semibold border border-[#0B0B0B] dark:border-zinc-800'
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
                    className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-slate-400 dark:text-slate-500"
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
      <section id="pricing" className="py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-12 space-y-4"
          >
            <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Transparent Plans</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              Choose Your Compliance Plan
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">
              Flexible tiers designed to keep individual owner-operators and fleets active.
            </p>

            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 mt-6">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${billingPeriod === 'monthly' ? 'bg-[#F5C400] shadow text-[#0B0B0B]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0B0B0B] dark:hover:text-white'
                  }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'bg-[#F5C400] shadow text-[#0B0B0B]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0B0B0B] dark:hover:text-white'
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
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01 }}
                transition={{ duration: 0.5, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`group bg-white dark:bg-zinc-900 border rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 cursor-pointer ${plan.popular
                    ? 'border-2 border-[#F5C400] dark:border-[#F5C400] shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-[#F5C400]'
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
                    <h4 className={`font-heading font-extrabold text-lg transition-colors duration-200 ${plan.popular ? 'text-[#D9A300] group-hover:text-[#F5C400]' : 'text-slate-700 dark:text-slate-400 group-hover:text-[#F5C400]'}`}>
                      {plan.name}
                    </h4>
                    <div className="mt-4 flex items-baseline">
                      <span className="font-heading font-extrabold text-4xl text-[#111111] dark:text-white">${plan.price}</span>
                      <span className="text-slate-400 text-xs ml-1">/ month</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{plan.description}</p>

                  <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-zinc-800 pt-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#D9A300] dark:text-[#F5C400] shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="font-semibold text-slate-700 dark:text-slate-400">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link href="/auth/login" className="block w-full">
                    <Button
                      className={`w-full font-bold text-xs py-3 border-0 transition-colors ${plan.popular
                          ? 'bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300]'
                          : 'bg-[#0B0B0B] text-white hover:bg-[#F5C400] hover:text-[#0B0B0B]'
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

      {/* 9th Section: Callback Request Form */}
      <section id="callback-request" className="py-20 lg:py-28 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-b border-[#E5E5E5] dark:border-zinc-800 relative transition-colors duration-300">
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-gold-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
            <div className="text-center space-y-3 mb-8">
              <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Outbound Support Dispatch</span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#111111] dark:text-white">
                Request an Outbound Callback
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Submit your contact details and our automated Voice dialer or support agent will call you back within 5 minutes.
              </p>
            </div>

            {callbackSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3"
              >
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">Callback Request Logged</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
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
              <form onSubmit={handleCallbackSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Driver Name..."
                      value={callbackName}
                      onChange={(e) => setCallbackName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-[#F5C400]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Phone number</label>
                    <CountryPhoneInput
                      value={callbackPhone}
                      onChange={(full) => setCallbackPhone(full)}
                      placeholder="Enter phone..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="driver@gmail.com..."
                      value={callbackEmail}
                      onChange={(e) => setCallbackEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-[#F5C400]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Preferred Language</label>
                    <select
                      value={callbackLang}
                      onChange={(e) => setCallbackLang(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-[#F5C400]"
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
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Consultation Notes / Summons Details</label>
                  <textarea
                    placeholder="Briefly describe what you need assistance with..."
                    value={callbackNotes}
                    onChange={(e) => setCallbackNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-[#F5C400]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingCallback}
                  className="bg-[#F5C400] hover:bg-[#D9A300] text-black font-extrabold text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider w-full shadow-lg transition-all duration-300 cursor-pointer"
                >
                  {submittingCallback ? 'Scheduling outbound dispatch...' : 'Submit Callback Request'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 10th Section: Final CTA Banner */}
      <section className="py-20 lg:py-28 bg-slate-50 dark:bg-[#141414] text-slate-900 dark:text-white relative border-t border-slate-200 dark:border-zinc-800 overflow-hidden text-center transition-colors duration-300">
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-[#D9A300]/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 relative space-y-6"
        >
          <h2 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-slate-900 dark:text-white leading-tight">
            {t.readyTitle || 'Ready to Protect Your TLC Profile?'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            {t.readyDesc || 'Launch your compliance dashboard. Upload licenses, access AI copilot, receive SMS reminders, and dispute summonses in real time.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
