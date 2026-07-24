'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, X, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useLanguage } from '@/app/language-provider';
import { useTheme } from '@/app/theme-provider';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { language: selectedLanguage } = useLanguage();
  const { theme } = useTheme();

  const title = selectedLanguage === 'Spanish' ? 'Precios Simples y Transparentes'
    : selectedLanguage === 'Urdu' ? 'سادہ اور شفاف قیمتیں'
    : selectedLanguage === 'Bengali' ? 'সহজ এবং স্বচ্ছ মূল্য নির্ধারণ'
    : selectedLanguage === 'French' ? 'Tarifs Simples et Transparents'
    : selectedLanguage === 'Mandarin' ? '简单透明的定价'
    : 'Simple, Transparent Pricing';

  const subtitle = selectedLanguage === 'Spanish' ? 'Sin Costos Ocultos'
    : selectedLanguage === 'Urdu' ? 'کوئی پوشیدہ اخراجات نہیں'
    : selectedLanguage === 'Bengali' ? 'কোন লুকানো খরচ নেই'
    : selectedLanguage === 'French' ? 'Pas de Frais Cachés'
    : selectedLanguage === 'Mandarin' ? '无隐藏成本'
    : 'No Hidden Costs';

  const desc = selectedLanguage === 'Spanish' ? 'Comience con nuestro nivel gratuito o actualice a Premium para obtener soporte completo de IA y alertas por SMS.'
    : selectedLanguage === 'Urdu' ? 'ہمارے مفت پلان سے شروع کریں یا مکمل اے آئی سپورٹ اور الرٹس کے لیے پریمیم میں اپ گریڈ کریں۔'
    : selectedLanguage === 'Bengali' ? 'আমাদের বিনামূল্যে প্ল্যান দিয়ে শুরু করুন বা সম্পূর্ণ এআই সহায়তা এবং সতর্কতার জন্য প্রিমিয়ামে আপগ্রেড করুন।'
    : selectedLanguage === 'French' ? 'Commencez avec notre forfait gratuit ou passez à Premium pour un support IA complet et des alertes SMS.'
    : selectedLanguage === 'Mandarin' ? '从我们的免费层开始，或升级到高级版以获得完整的 AI 支持和短信提醒。'
    : 'Get started with our free tier or upgrade to Premium for complete AI support, real-time surge tools, and push warning systems.';

  const plans = [
    {
      name: selectedLanguage === 'Spanish' ? 'Soporte Básico' : selectedLanguage === 'Urdu' ? 'بنیادی سپورٹ' : selectedLanguage === 'Bengali' ? 'বেসিক সাপোর্ট' : selectedLanguage === 'French' ? 'Support de Base' : selectedLanguage === 'Mandarin' ? '基础支持' : 'Basic Support',
      price: billingPeriod === 'monthly' ? 0 : 0,
      period: billingPeriod === 'monthly' ? (selectedLanguage === 'Spanish' ? '/mes' : '/mo') : (selectedLanguage === 'Spanish' ? '/año' : '/yr'),
      description: selectedLanguage === 'Spanish' ? 'Seguimiento de cumplimiento esencial y almacenamiento manual de documentos.'
        : selectedLanguage === 'Urdu' ? 'بنیادی تعمیل ٹریکنگ اور دستاویز کا ذخیرہ۔'
        : selectedLanguage === 'Bengali' ? 'প্রয়োজনীয় কমপ্লায়েন্স ট্র্যাকিং এবং নথি সংরক্ষণ।'
        : selectedLanguage === 'French' ? 'Suivi de conformité essentiel et stockage de documents pour les conducteurs.'
        : selectedLanguage === 'Mandarin' ? '为单人运营商提供的基本合规跟踪和文件存储。'
        : 'Essential compliance tracking and document storage for owner-operators.',
      features: selectedLanguage === 'Spanish'
        ? ['Registro de ganancias del turno', 'Calendario de plazos de cumplimiento', 'Carga manual de documentos', 'Soporte por correo electrónico estándar']
        : selectedLanguage === 'Urdu'
        ? ['شفٹ کی آمدنی کا لاگ', 'تعمیل کیلنڈر', 'دستی دستاویز اپ لوڈ', 'معیاری ای میل سپورٹ']
        : selectedLanguage === 'Bengali'
        ? ['শিফটের উপার্জনের লগ', 'কমপ্লায়েন্স ক্যালেন্ডার', 'ম্যানুয়াল নথি আপলোড', 'স্ট্যান্ডার্ড ইমেল সমর্থন']
        : selectedLanguage === 'French'
        ? ['Journal des gains de quart', 'Calendrier des échéances de conformité', 'Téléchargement manuel de documents', 'Support e-mail standard']
        : selectedLanguage === 'Mandarin'
        ? ['班次收入日志', '合规截止日期日历', '手动文档上传', '标准电子邮件支持']
        : ['Shift Earnings Log', 'Compliance Deadlines Calendar', 'Manual Document Uploading', 'Basic Email Support'],
      notIncluded: selectedLanguage === 'Spanish'
        ? ['Pronósticos de picos de vuelo', 'Chat de copiloto de IA en vivo', 'Advertencias de cumplimiento por SMS', 'Guías de inspección Woodside DMV']
        : selectedLanguage === 'Urdu'
        ? ['پرواز کے رش کی پیش گوئی', 'ریئل ٹائم اے آئی کپیلیٹ چیٹ', 'تعمیل کے لیے ایس ایم ایس الرٹس', 'ووڈ سائیڈ تفتیشی گائیڈ']
        : selectedLanguage === 'Bengali'
        ? ['ফ্লাইট পিক পূর্বাভাস', 'রিয়েল-টাইম এআই কো-পাইলট চ্যাট', 'কমপ্লায়েন্স এসএমএস অ্যালার্ট', 'উডসাইড তদন্ত গাইড']
        : selectedLanguage === 'French'
        ? ['Prévisions de pics de vol', 'Chat copilote IA en direct', 'Alertes de conformité SMS', 'Guides d\'inspection Woodside DMV']
        : selectedLanguage === 'Mandarin'
        ? ['航班高峰预测', '实时 AI 协同聊天', '合规短信警报', 'DMV Woodside 检查指南']
        : ['Surge Flight Peak forecasts', 'AI Copilot Live Chat', 'SMS compliance warnings', 'DMV Woodside inspection guides'],
      cta: selectedLanguage === 'Spanish' ? 'Comenzar Gratis' : selectedLanguage === 'Urdu' ? 'مفت شروع کریں' : selectedLanguage === 'Bengali' ? 'বিনামূল্যে শুরু করুন' : selectedLanguage === 'French' ? 'Commencer Gratuitement' : selectedLanguage === 'Mandarin' ? '免费开始' : 'Start Free',
      popular: false,
    },
    {
      name: selectedLanguage === 'Spanish' ? 'Conductor Premium Pro' : selectedLanguage === 'Urdu' ? 'پریمیم ڈرائیور پرو' : selectedLanguage === 'Bengali' ? 'প্রিমিয়াম ড্রাইভার প্রো' : selectedLanguage === 'French' ? 'Conducteur Premium Pro' : selectedLanguage === 'Mandarin' ? '高级职业司机' : 'Premium Driver Pro',
      price: billingPeriod === 'monthly' ? 19 : 14,
      period: billingPeriod === 'monthly' ? (selectedLanguage === 'Spanish' ? '/mes' : '/mo') : (selectedLanguage === 'Spanish' ? '/mes' : '/mo'),
      savings: billingPeriod === 'yearly'
        ? (selectedLanguage === 'Spanish' ? 'Facturado anualmente ($168/año)' : selectedLanguage === 'Urdu' ? 'سالانہ بل ($168/سال)' : selectedLanguage === 'Bengali' ? 'বার্ষিক বিল ($১৬৮/বছর)' : selectedLanguage === 'French' ? 'Facturé annuellement (168 $/an)' : selectedLanguage === 'Mandarin' ? '按年计费（$168/年）' : 'Billed annually ($168/yr)')
        : undefined,
      description: selectedLanguage === 'Spanish' ? 'Copiloto de previsión en tiempo real y seguimiento automático de cumplimiento.'
        : selectedLanguage === 'Urdu' ? 'ریئل ٹائم پیش گوئی کرنے والا کپیلیٹ اور خودکار تعمیل کا ٹریکر۔'
        : selectedLanguage === 'Bengali' ? 'রিয়েল-টাইম পূর্বাভাস কো-পাইলট এবং স্বয়ংক্রিয় কমপ্লায়েন্স ট্র্যাকিং।'
        : selectedLanguage === 'French' ? 'Copilote de prévision en temps réel et suivi automatique de la conformité.'
        : selectedLanguage === 'Mandarin' ? '实时预测协同驾驶和自动文档合规性跟踪。'
        : 'Real-time forecasting copilot and automatic document compliance tracking.',
      features: selectedLanguage === 'Spanish'
        ? ['Registro de ganancias del turno', 'Calendario de plazos de cumplimiento', 'Cargas automáticas por OCR', 'Pronósticos de oleadas de vuelos', 'Chat de copiloto de IA para conductores', 'Avisos de renovación por SMS y correo', 'Alertas de reserva de Woodside', 'Soporte prioritario 24/7']
        : selectedLanguage === 'Urdu'
        ? ['شفٹ کی آمدنی کا لاگ', 'تعمیل کیلنڈر', 'خودکار او سی آر اپ لوڈ', 'پروازوں کے رش کی پیش گوئی', 'اے آئی کپیلیٹ چیٹ', 'ایس ایم ایس اور پش اطلاعات', 'ووڈ سائیڈ تفتیش کے الرٹس', '24/7 ترجیحی سپورٹ']
        : selectedLanguage === 'Bengali'
        ? ['শিফটের উপার্জনের লগ', 'কমপ্লায়েন্স ক্যালেন্ডার', 'স্বয়ংক্রিয় ওসিআর আপলোড', 'ফ্লাইটের পিক পূর্বাভাস', 'এআই কো-পাইলট চ্যাট', 'এসএমএস ও পুশ বিজ্ঞপ্তি', 'উডসাইড তদন্তের অ্যালার্ট', '২৪/৭ অগ্রাধিকার সহায়তা']
        : selectedLanguage === 'French'
        ? ['Journal des gains de quart', 'Calendrier de conformité', 'Téléchargements OCR automatiques', 'Prévisions de vagues de vol', 'Chat copilote IA', 'Alertes de renouvellement SMS & push', 'Alertes de réservation Woodside', 'Support prioritaire 24/7']
        : selectedLanguage === 'Mandarin'
        ? ['班次收入日志', '合规截止日期日历', '自动 OCR 上传', '航班高峰预测', 'AI 司机协同聊天', '短信和推送更新通知', 'DMV Woodside 预订警报', '24/7 优先支持']
        : ['Shift Earnings Log', 'Compliance Deadlines Calendar', 'Automatic OCR Uploads', 'JFK/LGA/EWR Flight Wave forecasting', 'AI Driver Copilot Chat', 'SMS & Push renewal notices', 'DMV Woodside booking alerts', '24/7 Priority Support'],
      notIncluded: [],
      cta: selectedLanguage === 'Spanish' ? 'Suscribirse Pro' : selectedLanguage === 'Urdu' ? 'پرو سبسکرائب کریں' : selectedLanguage === 'Bengali' ? 'প্রো সাবস্ক্রাইব করুন' : selectedLanguage === 'French' ? 'S\'abonner Pro' : selectedLanguage === 'Mandarin' ? '订阅专业版' : 'Subscribe Pro',
      popular: true,
    },
    {
      name: selectedLanguage === 'Spanish' ? 'Flota Enterprise' : selectedLanguage === 'Urdu' ? 'انٹرپرائز فلیٹ' : selectedLanguage === 'Bengali' ? 'এন্টারপ্রাইজ ফ্লিট' : selectedLanguage === 'French' ? 'Flotte Entreprise' : selectedLanguage === 'Mandarin' ? '车队企业版' : 'Enterprise Fleet',
      price: billingPeriod === 'monthly' ? 99 : 79,
      period: billingPeriod === 'monthly' ? (selectedLanguage === 'Spanish' ? '/mes' : '/mo') : (selectedLanguage === 'Spanish' ? '/mes' : '/mo'),
      savings: billingPeriod === 'yearly'
        ? (selectedLanguage === 'Spanish' ? 'Facturado anualmente ($948/año)' : selectedLanguage === 'Urdu' ? 'سالانہ بل ($948/سال)' : selectedLanguage === 'Bengali' ? 'বার্ষিক বিল ($৯৪৮/বছর)' : selectedLanguage === 'French' ? 'Facturé annuellement (948 $/an)' : selectedLanguage === 'Mandarin' ? '按年计费（$948/年）' : 'Billed annually ($948/yr)')
        : undefined,
      description: selectedLanguage === 'Spanish' ? 'Panel de cumplimiento centralizado completo para flotas y operadores.'
        : selectedLanguage === 'Urdu' ? 'ٹیکسی آپریٹرز اور بیڑے کے مالکان کے لیے مکمل ڈیش بورڈ۔'
        : selectedLanguage === 'Bengali' ? 'ট্যাক্সি অপারেটর এবং ফ্লিটদের জন্য সম্পূর্ণ ড্যাশবোর্ড।'
        : selectedLanguage === 'French' ? 'Tableau de bord de conformité centralisé complet pour les flottes.'
        : selectedLanguage === 'Mandarin' ? '适用于出租车运营商和车队的完整集中式合规仪表板。'
        : 'Complete centralized compliance dashboard for taxi operators and fleets.',
      features: selectedLanguage === 'Spanish'
        ? ['Gestionar hasta 10 licencias', 'Alertas de renovación de flota', 'Notificaciones de pruebas de drogas', 'Líneas de soporte prioritario', 'Acceso a integración de API personalizada', 'Representante de cuenta dedicado', 'Informes de auditoría de puntos TLC']
        : selectedLanguage === 'Urdu'
        ? ['10 لائسنسوں کا انتظام', 'فلیٹ کی تجدید کے الرٹس', 'ڈرگ ٹেসٹ کی اطلاعات', 'ترجیحی فون لائنز', 'کسٹم API انٹیگریشن', 'وقف اکاؤنٹ مینیجر', 'TLC پوائنٹ آڈٹ رپورٹس']
        : selectedLanguage === 'Bengali'
        ? ['১০ জন ড্রাইভার লাইসেন্স পরিচালনা', 'ফ্লিট পুনর্নবীকরণ অ্যালার্ট', 'ড্রাগ পরীক্ষার বিজ্ঞপ্তি', 'অগ্রাধিকার ফোন লাইন', 'কাস্টম এপিআই ইন্টিগ্রেশন', 'ডেডিকেটেড অ্যাকাউন্ট প্রতিনিধি', 'TLC পয়েন্ট অডিট রিপোর্ট']
        : selectedLanguage === 'French'
        ? ['Gérer jusqu\'à 10 licences', 'Alertes de renouvellement de flotte', 'Notifications de dépistage de drogues', 'Lignes de support téléphonique prioritaire', 'Accès à l\'intégration API personnalisée', 'Représentant de compte dédié', 'Rapports d\'audit des points TLC']
        : selectedLanguage === 'Mandarin'
        ? ['管理最多 10 个驾驶员执照', '车队更新日志与警报', '自动药检通知', '优先电话支持热线', '自定义 API 集成访问', '专属账户代表', 'TLC 扣分审计报告']
        : ['Manage up to 10 driver licenses', 'Fleet renewal logs & alerts', 'Automated drug screening notifications', 'Priority phone support lines', 'Custom API integration access', 'Dedicated account representative', 'TLC point audit reports'],
      notIncluded: [],
      cta: selectedLanguage === 'Spanish' ? 'Contactar Ventas' : selectedLanguage === 'Urdu' ? 'سیلز سے رابطہ کریں' : selectedLanguage === 'Bengali' ? 'সেলসের সাথে যোগাযোগ করুন' : selectedLanguage === 'French' ? 'Contacter les Ventes' : selectedLanguage === 'Mandarin' ? '联系 sales' : 'Contact Sales',
      popular: false,
    },
  ];

  const featuresComparison = [
    { category: selectedLanguage === 'Spanish' ? 'Soporte Documental' : 'Document Support', name: selectedLanguage === 'Spanish' ? 'Almacenamiento Seguro' : 'Document Safe Storage', basic: 'Up to 5 files', premium: 'Unlimited', enterprise: 'Unlimited' },
    { category: selectedLanguage === 'Spanish' ? 'Soporte Documental' : 'Document Support', name: selectedLanguage === 'Spanish' ? 'Extracción OCR AI' : 'AI OCR Expiration Extraction', basic: false, premium: true, enterprise: true },
    { category: selectedLanguage === 'Spanish' ? 'Cumplimiento' : 'Compliance', name: selectedLanguage === 'Spanish' ? 'Alertas SMS y Correo' : 'SMS & Email Compliance Notices', basic: 'Email only', premium: 'SMS & Email', enterprise: 'SMS, Email & Push' },
    { category: selectedLanguage === 'Spanish' ? 'Cumplimiento' : 'Compliance', name: selectedLanguage === 'Spanish' ? 'Fechas de Pruebas de Drogas' : 'TLC Drug Screening Prompts', basic: true, premium: true, enterprise: true },
    { category: selectedLanguage === 'Spanish' ? 'Cumplimiento' : 'Compliance', name: selectedLanguage === 'Spanish' ? 'Auditoría de Puntos TLC' : 'DMV Points Mitigation Auditing', basic: false, premium: true, enterprise: true },
    { category: selectedLanguage === 'Spanish' ? 'Optimización' : 'Optimizations', name: selectedLanguage === 'Spanish' ? 'Pronósticos de Vuelo' : 'Flight Wave Surge Forecasting', basic: false, premium: true, enterprise: true },
    { category: selectedLanguage === 'Spanish' ? 'Optimización' : 'Optimizations', name: selectedLanguage === 'Spanish' ? 'Chat de Copiloto IA' : 'AI Assistant Copilot Chat', basic: false, premium: 'Unlimited usage', enterprise: 'Unlimited usage' },
    { category: selectedLanguage === 'Spanish' ? 'Soporte' : 'Support & Security', name: selectedLanguage === 'Spanish' ? 'Tiempo de Respuesta SLA' : 'Support Response SLA', basic: '48 Hours', premium: '2 Hours (Priority)', enterprise: 'Instant / Hotline' },
    { category: selectedLanguage === 'Spanish' ? 'Flotas' : 'Fleet Management', name: selectedLanguage === 'Spanish' ? 'Tablero Multiconductor' : 'Multi-Driver Control Board', basic: false, premium: false, enterprise: true },
    { category: selectedLanguage === 'Spanish' ? 'Flotas' : 'Fleet Management', name: selectedLanguage === 'Spanish' ? 'Integraciones API' : 'Custom Developer APIs', basic: false, premium: false, enterprise: true },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        {/* Intro */}
        <section className="relative py-24 lg:py-32 overflow-hidden border-b border-slate-200 dark:border-zinc-900 bg-slate-50 dark:bg-black transition-colors duration-300">
          {/* NYC Background overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 dark:opacity-30 mix-blend-luminosity transition-all duration-300"
            style={{ backgroundImage: "url('/section-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-slate-50 dark:from-zinc-950 dark:via-zinc-950/80 dark:to-zinc-950 transition-colors duration-300" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F5C400]/40 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-heading font-extrabold text-5xl sm:text-6xl tracking-tight text-slate-900 dark:text-white leading-[1.1]"
            >
              {title} <br />
              <span className="text-gold-gradient mt-2 inline-block font-black">{subtitle}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-slate-650 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium"
            >
              {desc}
            </motion.p>

            {/* Toggle Billing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center items-center pt-4"
            >
              <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl flex items-center space-x-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    billingPeriod === 'monthly'
                      ? 'bg-[#F5C400] text-black shadow-md'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    billingPeriod === 'yearly'
                      ? 'bg-[#F5C400] text-black shadow-md'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Yearly billing</span>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    billingPeriod === 'yearly' ? 'bg-black text-[#F5C400]' : 'bg-[#F5C400] text-black'
                  }`}>
                    Save ~20%
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-24 lg:py-32 bg-zinc-50 dark:bg-[#080808]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`rounded-2xl p-8 border flex flex-col justify-between relative transition-all duration-300 ${
                    plan.popular
                      ? 'bg-zinc-950 border-[#F5C400]/40 shadow-2xl shadow-[#F5C400]/5 glow-gold-sm z-10'
                      : 'card-premium'
                  }`}
                >
                  {plan.popular && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F5C400]/8 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F5C400] text-black text-[9px] font-extrabold px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg">⚡ Most Popular</span>
                    </>
                  )}

                  <div className="space-y-6 relative z-10">
                    <div>
                      <h3 className={`font-heading font-bold text-base mb-1 ${
                        plan.popular ? 'text-[#F5C400]' : 'text-zinc-500 dark:text-zinc-400'
                      }`}>{plan.name}</h3>
                      <p className={`text-xs ${
                        plan.popular ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-500'
                      }`}>{plan.description}</p>
                    </div>

                    <div className="flex items-baseline space-x-1 py-2">
                      <span className={`text-5xl font-heading font-extrabold ${
                        plan.popular ? 'text-white' : 'text-zinc-900 dark:text-white'
                      }`}>${plan.price}</span>
                      <span className={`text-xs ${
                        plan.popular ? 'text-zinc-500' : 'text-zinc-400'
                      }`}>{plan.period}</span>
                    </div>

                    {plan.savings && (
                      <p className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border inline-block ${
                        plan.popular
                          ? 'bg-[#F5C400]/10 border-[#F5C400]/20 text-[#F5C400]'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}>
                        {plan.savings}
                      </p>
                    )}

                    <hr className={plan.popular ? 'border-zinc-800' : 'border-zinc-100 dark:border-zinc-800'} />

                    <ul className="space-y-3.5">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-xs font-medium">
                          <div className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center mt-0.5 mr-2.5 ${
                            plan.popular ? 'bg-[#F5C400]/15 text-[#F5C400]' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          </div>
                          <span className={plan.popular ? 'text-zinc-300' : 'text-zinc-700 dark:text-zinc-300'}>{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-xs font-medium text-zinc-400/50 line-through">
                          <X className="w-4 h-4 text-zinc-400/30 mr-2.5 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8 relative z-10">
                    <Link href="/auth/login" className="block w-full">
                      <button className={`w-full font-bold text-sm py-3.5 rounded-xl transition-all duration-200 ${
                        plan.popular
                          ? 'bg-[#F5C400] text-black hover:bg-[#D9A300] shadow-lg shadow-[#F5C400]/20'
                          : 'bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-[#F5C400] hover:text-black border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {plan.cta}
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Matrix Table */}
        <section className="py-24 lg:py-32 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-zinc-900 dark:text-white">Compare Plan Features</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Deep dive comparisons of feature access levels.</p>
            </div>

            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-[#0b0b0b] dark:bg-zinc-950 shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                    <th className="p-5 font-bold uppercase tracking-wider text-[10px]">Feature Name</th>
                    <th className="p-5 font-bold text-center w-1/4 uppercase tracking-wider text-[10px]">Basic</th>
                    <th className="p-5 font-bold text-center w-1/4 uppercase tracking-wider text-[10px] text-[#F5C400]">Premium Pro</th>
                    <th className="p-5 font-bold text-center w-1/4 uppercase tracking-wider text-[10px]">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40 text-zinc-300">
                  {featuresComparison.map((feat, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-5">
                        <span className="block font-bold text-white mb-0.5">{feat.name}</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{feat.category}</span>
                      </td>
                      <td className="p-5 text-center text-zinc-400">
                        {typeof feat.basic === 'boolean' ? (
                          feat.basic ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-zinc-700 mx-auto" />
                        ) : feat.basic}
                      </td>
                      <td className="p-5 text-center text-[#F5C400] font-bold">
                        {typeof feat.premium === 'boolean' ? (
                          feat.premium ? <Check className="w-4 h-4 text-[#F5C400] mx-auto" /> : <X className="w-4 h-4 text-zinc-700 mx-auto" />
                        ) : feat.premium}
                      </td>
                      <td className="p-5 text-center text-zinc-400">
                        {typeof feat.enterprise === 'boolean' ? (
                          feat.enterprise ? <Check className="w-4 h-4 text-zinc-400 mx-auto" /> : <X className="w-4 h-4 text-zinc-700 mx-auto" />
                        ) : feat.enterprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
