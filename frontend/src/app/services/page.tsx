'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Scale, 
  FileText, 
  Clock, 
  Sparkles, 
  Ticket,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  AlertTriangle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useLanguage } from '@/app/language-provider';

export default function ServicesPage() {
  const { language: selectedLanguage } = useLanguage();

  const title = selectedLanguage === 'Spanish' ? 'Servicios de Soporte Diseñados'
    : selectedLanguage === 'Urdu' ? 'سپورٹ سروسز جو آپ کے لیے ہیں'
    : selectedLanguage === 'Bengali' ? 'আপনার জন্য উপযুক্ত সমর্থন পরিষেবা'
    : selectedLanguage === 'French' ? 'Services de Support Adaptés'
    : selectedLanguage === 'Mandarin' ? '量身定制的支持服务'
    : 'Support Services Tailored';

  const subtitle = selectedLanguage === 'Spanish' ? 'Para Conductores de NYC'
    : selectedLanguage === 'Urdu' ? 'NYC ڈرائیورز کے لیے'
    : selectedLanguage === 'Bengali' ? 'NYC ড্রাইভারদের জন্য'
    : selectedLanguage === 'French' ? 'Pour les Chauffeurs de NYC'
    : selectedLanguage === 'Mandarin' ? '为纽约市司机服务'
    : 'For NYC Drivers';

  const desc = selectedLanguage === 'Spanish' ? 'Desde papeleo de TLC y fechas de inspección de Woodside hasta análisis de vuelos en tiempo real, JNI Solutions le brinda herramientas para mantenerse al día.'
    : selectedLanguage === 'Urdu' ? 'TLC کاغذی کارروائی، ووڈ سائیڈ تفتیش سے لے کر پروازوں کے رش کے تجزیہ تک، جے این آئی آپ کو باخبر رکھتا ہے۔'
    : selectedLanguage === 'Bengali' ? 'TLC কাগজপত্র, উডসাইড তদন্তের তারিখ থেকে ফ্লাইটের পিক পূর্বাভাস পর্যন্ত, JNI আপনাকে আপডেট রাখে।'
    : selectedLanguage === 'French' ? 'Qu\'il s\'agisse de paperasse TLC, d\'inspections Woodside ou d\'analyses de vol en temps réel, JNI Solutions vous donne les outils pour rester organisé.'
    : selectedLanguage === 'Mandarin' ? '从复杂的 TLC 文件和 Woodside 检查日期到实时航班高峰分析，JNI Solutions 为网约车司机提供了保持井井有条的工具。'
    : 'From complex TLC paperwork and Woodside inspection dates to real-time flight peak analytics, JNI Solutions gives ride-share drivers the tools to stay organized and track compliance milestones.';

  const services = [
    {
      title: selectedLanguage === 'Spanish' ? 'Soporte de Cumplimiento TLC'
        : selectedLanguage === 'Urdu' ? 'TLC تعمیل سپورٹ'
        : selectedLanguage === 'Bengali' ? 'TLC কমপ্লায়েন্স সহায়তা'
        : selectedLanguage === 'French' ? 'Support de Conformité TLC'
        : selectedLanguage === 'Mandarin' ? 'TLC 合规支持'
        : 'TLC Compliance Support',
      description: selectedLanguage === 'Spanish' ? 'Nunca se quede fuera por cambios en las reglas de la ciudad. Monitoreamos el estado de su licencia y renovaciones de TLC.'
        : selectedLanguage === 'Urdu' ? 'شہر کے قوانین کی تبدیلیوں سے کبھی پریشان نہ ہوں۔ ہم لائسنس کی حیثیت اور تجدید کی نگرانی کرتے ہیں۔'
        : selectedLanguage === 'Bengali' ? 'শহরের নিয়মের পরিবর্তনে কখনই অসচেতন হবেন না। আমরা লাইসেন্সের স্থিতি এবং পুনর্নবীকরণ পর্যবেক্ষণ করি।'
        : selectedLanguage === 'French' ? 'Ne soyez jamais pris au dépourvu par les changements de règles. Nous surveillons l\'état de votre licence TLC et les mises à jour.'
        : selectedLanguage === 'Mandarin' ? '绝不会因城市规则变化而措手不及。我们监控活跃的 TLC 司机规则、执照状态和更新。'
        : 'Never get caught off guard by city rule changes. We monitor active TLC driver rules, license standing, and renewal updates, keeping you in good standing.',
      icon: ShieldAlert,
      bullets: selectedLanguage === 'Spanish'
        ? ['Monitoreo de estado de licencia TLC', 'Recordatorios automáticos de pruebas de drogas', 'Verificación de permisos FHV', 'Plantillas de defensa ante citaciones']
        : selectedLanguage === 'Urdu'
        ? ['TLC لائسنس کی نگرانی', 'ڈرگ ٹیسٹ کی خودکار یاد دہانیاں', 'FHV پرمٹ کی تصدیق', 'سمن دفاعی ٹیمپلیٹس']
        : selectedLanguage === 'Bengali'
        ? ['TLC লাইসেন্সের স্থিতি পর্যবেক্ষণ', 'ড্রাগ টেস্টের স্বয়ংক্রিয় অনুস্মারক', 'FHV পারমিট যাচাইকরণ', 'সমন বিরোধ নথি টেমপ্লেট']
        : selectedLanguage === 'French'
        ? ['Surveillance de licence TLC', 'Rappels automatiques de dépistage', 'Vérification de permis FHV', 'Modèles de défense pour citations']
        : selectedLanguage === 'Mandarin'
        ? ['TLC 执照状态监控', '自动药检提醒', 'FHV 车辆许可验证', '传票申辩文件模板']
        : [
          'TLC license status monitoring',
          'Automatic drug screening reminders',
          'FHV vehicle permit verification',
          'Summon defense document templates'
        ]
    },
    {
      title: selectedLanguage === 'Spanish' ? 'Inspecciones Woodside DMV'
        : selectedLanguage === 'Urdu' ? 'DMV ووڈ سائیڈ تفتیش'
        : selectedLanguage === 'Bengali' ? 'DMV উডসাইড তদন্ত'
        : selectedLanguage === 'French' ? 'Inspections Woodside DMV'
        : selectedLanguage === 'Mandarin' ? 'DMV Woodside 检查'
        : 'DMV Woodside Inspections',
      description: selectedLanguage === 'Spanish' ? 'Evite el estrés de reservar las fechas de inspección de Woodside. Coordinamos espacios disponibles y enviamos alertas.'
        : selectedLanguage === 'Urdu' ? 'ووڈ سائیڈ تفتیش کی تاریخوں کی بکنگ کی پریشانی سے بچیں۔ ہم الرٹس بھیجتے ہیں تاکہ آپ وقت پر تاریخ بک کریں۔'
        : selectedLanguage === 'Bengali' ? 'উডসাইড তদন্তের তারিখ বুকিংয়ের ঝামেলা এড়ান। আমরা অ্যালার্ট পাঠাই যাতে আপনি সময়মতো স্লট বুক করেন।'
        : selectedLanguage === 'French' ? 'Évitez le stress de la réservation des inspections Woodside. Nous coordonnons les créneaux et envoyons des alertes.'
        : selectedLanguage === 'Mandarin' ? '免去预订 Woodside 检查日期的压力。我们的平台协调空闲时段并发送警报，以便您按时完成检查。'
        : 'Skip the stress of booking Woodside inspection dates. Our platform coordinates slot availability and sends alerts so you secure your bi-annual checks in time.',
      icon: Scale,
      bullets: selectedLanguage === 'Spanish'
        ? ['Alertas de programación de Woodside', 'Guías de listas de verificación previas', 'Soporte de auditoría de puntos DMV', 'Seguimiento de estado de inspección']
        : selectedLanguage === 'Urdu'
        ? ['ووڈ سائیڈ شیڈولنگ الرٹس', 'تفتیش سے پہلے کے رہنما اصول', 'DMV پوائنٹس آڈٹ سپورٹ', 'تفتیش کی حیثیت کا پتہ لگانا']
        : selectedLanguage === 'Bengali'
        ? ['উডসাইড শিডিউলিং অ্যালার্ট', 'তদন্তের আগের চেকলিস্ট গাইড', 'DMV পয়েন্ট অডিট সমর্থন', 'তদন্তের স্থিতি ট্র্যাকিং']
        : selectedLanguage === 'French'
        ? ['Alertes de planification Woodside', 'Checklists de pré-inspection', 'Audit des points du DMV', 'Suivi de l\'état de l\'inspection']
        : selectedLanguage === 'Mandarin'
        ? ['Woodside 预订警报', '检查前清单指南', 'DMV 扣分审计支持', '检查状态跟踪']
        : [
          'Woodside scheduling alerts',
          'Pre-inspection checklist guides',
          'DMV points audit support',
          'Inspection status tracking'
        ]
    },
    {
      title: selectedLanguage === 'Spanish' ? 'Asistencia de Documentos IA'
        : selectedLanguage === 'Urdu' ? 'اے آئی دستاویز اسسٹنس'
        : selectedLanguage === 'Bengali' ? 'এআই নথি সহায়তা'
        : selectedLanguage === 'French' ? 'Assistance Documentaire IA'
        : selectedLanguage === 'Mandarin' ? 'AI 文档协助'
        : 'AI Document Assistance',
      description: selectedLanguage === 'Spanish' ? 'Deje de escribir detalles del auto manualmente. Tome una foto de su tarjeta TLC o registro DMV y la IA extraerá los datos.'
        : selectedLanguage === 'Urdu' ? 'گاڑی کی تفصیلات دستی طور پر درج کرنا بند کریں۔ تصویر لیں اور ہماری اے آئی تاریخیں خود نکال لے گی۔'
        : selectedLanguage === 'Bengali' ? 'ম্যানুয়ালি গাড়ির বিবরণ টাইপ করা বন্ধ করুন। ছবি তুলুন এবং এআই স্বয়ংক্রিয়ভাবে মেয়াদ শেষের তারিখ সংগ্রহ করবে।'
        : selectedLanguage === 'French' ? 'Arrêtez de saisir manuellement les détails du véhicule. Prenez une photo de votre TLC ou DMV, l\'IA extrait les dates.'
        : selectedLanguage === 'Mandarin' ? '无需手动输入车辆详细信息。拍摄 TLC 驾驶卡、DMV 注册或保险证书，让 AI 自动提取过期时间。'
        : 'Stop typing vehicle details manually. Snap a photo of your TLC driver card, DMV registration, or insurance certificate, and let our AI extract expiry dates.',
      icon: FileText,
      bullets: selectedLanguage === 'Spanish'
        ? ['Extracción OCR de seguros', 'Escaneo y análisis de tarjetas TLC', 'Sincronización automática de vencimientos', 'Bóveda de archivos PDF segura y cifrada']
        : selectedLanguage === 'Urdu'
        ? ['انشورنس کی او سی آر معلومات', 'TLC کارڈ اسکین اور تجزیہ', 'خودکار میعاد ختم ہونے کا مطابقت', 'محفوظ پی ڈی ایف والٹ']
        : selectedLanguage === 'Bengali'
        ? ['বীমা পলিসির OCR নিষ্কাশন', 'TLC কার্ড স্ক্যান এবং বিশ্লেষণ', 'স্বয়ংক্রিয় মেয়াদ শেষ সিঙ্ক', 'সুরক্ষিত পিডিএফ ভল্ট']
        : selectedLanguage === 'French'
        ? ['Extraction OCR d\'assurance', 'Numérisation de carte TLC', 'Synchro auto d\'expiration', 'Coffre-fort PDF sécurisé']
        : selectedLanguage === 'Mandarin'
        ? ['OCR 保险提取', 'TLC 驾驶卡扫描与解析', '自动过期数据库同步', '安全加密的 PDF 保险箱']
        : [
          'OCR insurance extraction',
          'TLC card scanning & parsing',
          'Automatic expiration database sync',
          'Safe encrypted PDF vaults'
        ]
    },
    {
      title: selectedLanguage === 'Spanish' ? 'Seguimiento de Renovación Proactivo'
        : selectedLanguage === 'Urdu' ? 'فعال تجدید ٹریکنگ'
        : selectedLanguage === 'Bengali' ? 'সক্রিয় পুনর্নবীকরণ ট্র্যাকিং'
        : selectedLanguage === 'French' ? 'Suivi Proactif des Renouvellements'
        : selectedLanguage === 'Mandarin' ? '主动更新跟踪'
        : 'Proactive Renewal Tracking',
      description: selectedLanguage === 'Spanish' ? 'Ayuda a los conductores a seguir plazos. Enviamos alertas multicanal (SMS, correo y notificaciones push).'
        : selectedLanguage === 'Urdu' ? 'ڈرائیوروں کو تاریخیں یاد رکھنے میں مدد کرتا ہے۔ ہم ایس ایم ایس، ای میل اور پش اطلاعات بھیجتے ہیں۔'
        : selectedLanguage === 'Bengali' ? 'ড্রাইভারদের সময়সীমা মনে রাখতে সহায়তা করে। আমরা এসএমএস, ইমেল এবং পুশ অ্যালার্ট পাঠাই।'
        : selectedLanguage === 'French' ? 'Aide les conducteurs à suivre les délais. Alertes multicanaux (SMS, e-mail, notifications push).'
        : selectedLanguage === 'Mandarin' ? '帮助司机跟踪最后期限并保持活跃状态。我们根据过期剩余天数的紧急程度发送主动的多渠道警报（短信、电子邮件和推送通知）。'
        : 'Helps drivers track deadlines and stay active. We send proactive multi-channel alerts (SMS, email, and push notifications) depending on the severity of the remaining days before expiration.',
      icon: Clock,
      bullets: selectedLanguage === 'Spanish'
        ? ['Alertas de cumplimiento por SMS', 'Notificaciones push en móvil', 'Paneles de despachador compartidos', 'Calculadora de períodos de gracia']
        : selectedLanguage === 'Urdu'
        ? ['ایس ایم ایس تعمیل الرٹس', 'موبائل پر پش اطلاعات', 'شیئرڈ ڈسپیچر ڈیش بورڈز', 'رعایتی مدت کے کیلکولیٹر']
        : selectedLanguage === 'Bengali'
        ? ['এসএমএস কমপ্লায়েন্স অ্যালার্ট', 'মোবাইলে পুশ বিজ্ঞপ্তি', 'শেয়ার্ড ডিসপ্যাচার ড্যাশবোর্ড', 'গ্রেস পিরিয়ড ক্যালকুলেটর']
        : selectedLanguage === 'French'
        ? ['Alertes de conformité SMS', 'Notifications push mobiles', 'Tableaux de bord partagés', 'Calculateurs de période de grâce']
        : selectedLanguage === 'Mandarin'
        ? ['短信合规警报', '手机推送通知', '共享调度员仪表板', '宽限期计算器']
        : [
          'SMS compliance alerts',
          'Push notifications on mobile',
          'Shared dispatcher dashboards',
          'Grace period calculators'
        ]
    },
    {
      title: selectedLanguage === 'Spanish' ? 'Copiloto de IA y Radar de Tarifa'
        : selectedLanguage === 'Urdu' ? 'اے آئی کپیلیٹ اور رڈار'
        : selectedLanguage === 'Bengali' ? 'এআই কো-পাইলট ও রাডার'
        : selectedLanguage === 'French' ? 'Copilote IA & Radar de Course'
        : selectedLanguage === 'Mandarin' ? 'AI 协同与高峰雷达'
        : 'AI Copilot & Surge Radar',
      description: selectedLanguage === 'Spanish' ? 'Conduzca más inteligente, gane más. Nuestro copiloto proyecta oleadas de pasajeros en aeropuertos JFK, LGA y EWR.'
        : selectedLanguage === 'Urdu' ? 'بہتر گاڑی چلائیں، زیادہ کمائیں۔ ہمارا کپیلیٹ JFK، LGA اور EWR پر پروازوں کے رش کی پیش گوئی کرتا ہے۔'
        : selectedLanguage === 'Bengali' ? 'বুদ্ধিমানের সাথে গাড়ি চালান, বেশি আয় করুন। আমাদের কো-পাইলট JFK, LGA এবং EWR-এ ফ্লাইট পিকের পূর্বাভাস দেয়।'
        : selectedLanguage === 'French' ? 'Roulez plus intelligemment, gagnez plus. Prévision des vagues de passagers aux terminaux JFK, LGA et EWR.'
        : selectedLanguage === 'Mandarin' ? '更聪明地驾车，赚取更多收益。我们的实时 AI 协同助手可预测肯尼迪 (JFK)、拉瓜迪亚 (LGA) 和纽瓦克 (EWR) 航站楼的旅客到达高峰。'
        : 'Drive smarter, earn more. Our real-time AI copilot projects passenger arrival waves at JFK, LGA, and EWR terminals to help you schedule shifts.',
      icon: Sparkles,
      bullets: selectedLanguage === 'Spanish'
        ? ['Picos de vuelos por hora', 'Mapas de predicción de tarifas', 'Asistente de voz manos libres', 'Registro de optimización de ganancias']
        : selectedLanguage === 'Urdu'
        ? ['پروازوں کے فی گھنٹہ رش', 'کرایوں کی پیش گوئی کے نقشے', 'ہینڈز فری آواز اسسٹنٹ', 'آمدنی کے لاگز کا انتظام']
        : selectedLanguage === 'Bengali'
        ? ['প্রতি ঘণ্টার ফ্লাইট পিক', 'ভাড়ার পূর্বাভাসের মানচিত্র', 'হ্যান্ডস-ফ্রি ভয়েস সহকারী', 'আয় অপ্টিমাইজার লগ']
        : selectedLanguage === 'French'
        ? ['Pics de vols horaires', 'Cartes de prédiction de tarifs', 'Assistant vocal mains libres', 'Optimiseur de gains']
        : selectedLanguage === 'Mandarin'
        ? ['每小时航班高峰', '高峰预测地图', '免提语音助手', '收益优化日志']
        : [
          'Flight wave hourly peaks',
          'Surge prediction maps',
          'Hands-free voice assistant',
          'Earnings optimizer logs'
        ]
    },
    {
      title: selectedLanguage === 'Spanish' ? 'Gestión de Multas y Citaciones'
        : selectedLanguage === 'Urdu' ? 'سمن اور ٹکٹوں کا انتظام'
        : selectedLanguage === 'Bengali' ? 'সমন ও টিকিটের ব্যবস্থা'
        : selectedLanguage === 'French' ? 'Gestion des Citations & Contraventions'
        : selectedLanguage === 'Mandarin' ? '传票与罚单管理'
        : 'Citation & Summon Management',
      description: selectedLanguage === 'Spanish' ? 'Disputas rápidas para multas de estacionamiento y carriles. Obtenga recomendaciones inmediatas generadas por IA.'
        : selectedLanguage === 'Urdu' ? 'پارکنگ ٹکٹوں اور خلاف ورزیوں پر فوری اعتراض۔ اے آئی کے ذریعے اعتراضات تیار کریں۔'
        : selectedLanguage === 'Bengali' ? 'পার্কিং টিকিট এবং নিয়ম লঙ্ঘনের দ্রুত বিরোধ। এআই-এর মাধ্যমে তাত্ক্ষণিক সুপারিশ পান।'
        : selectedLanguage === 'French' ? 'Contestation rapide des contraventions de stationnement et de voies. Recommandations générées par IA.'
        : selectedLanguage === 'Mandarin' ? '快速争议停车传票、清洁罚单和车道违章。获取由 AI 生成的即时申辩建议。'
        : 'Fast disputes for parking summonses, clean-up tickets, and lane violations. Get immediate AI-generated recommendations for disputing unjust charges.',
      icon: Ticket,
      bullets: selectedLanguage === 'Spanish'
        ? ['Categorización de citaciones', 'Plantillas de disputas por IA', 'Asistente de violaciones de Woodside', 'Conexión con asesores legales']
        : selectedLanguage === 'Urdu'
        ? ['سمن کی درجہ بندی', 'اے آئی اعتراض کے ٹیمپلیٹس', 'ووڈ سائیڈ خلاف ورزی اسسٹنٹ', 'قانونی مشیروں سے رابطہ']
        : selectedLanguage === 'Bengali'
        ? ['সমন শ্রেণীবদ্ধকরণ', 'এআই বিরোধ টেমপ্লেট', 'উডসাইড লঙ্ঘন সহকারী', 'আইনি পরামর্শদাতাদের সাথে সংযোগ']
        : selectedLanguage === 'French'
        ? ['Catégorisation des citations', 'Modèles de litiges IA', 'Assistant d\'infraction Woodside', 'Liaison d\'aide juridique']
        : selectedLanguage === 'Mandarin'
        ? ['传票分类', 'AI 申辩模板', 'Woodside 违规助手', '法律咨询专线连接']
        : [
          'Summons categorization',
          'AI dispute templates',
          'Woodside violation helper',
          'Legal helpline connections'
        ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero Banner */}
        <section className="relative py-20 bg-[radial-gradient(#f5c400_1px,transparent_1px)] [background-size:32px_32px] bg-opacity-[0.03] dark:bg-opacity-[0.015] border-b border-slate-100 dark:border-zinc-800 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5C400]/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#F5C400]/20 bg-[#F5C400]/5 text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider"
            >
              <ShieldCheck className="w-4 h-4 text-[#F5C400]" />
              <span>Full compliance & optimization suite</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#111111] dark:text-white leading-tight"
            >
              {title} <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-2 text-[#0B0B0B] dark:text-[#F5C400]">{subtitle}</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#F5C400]/80 dark:bg-[#F5C400]/20 -rotate-1 z-0 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
            >
              {desc}
            </motion.p>
          </div>
        </section>

        {/* Services Matrix Grid */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={cardVariants}
                    className="bg-slate-50/50 dark:bg-zinc-900/30 border border-[#E5E5E5] dark:border-zinc-800 p-8 rounded-2xl flex flex-col justify-between hover:shadow-lg hover:border-[#F5C400]/40 dark:hover:border-[#F5C400]/20 transition-all duration-300 group"
                  >
                    <div className="space-y-6">
                      <div className="w-12 h-12 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] flex items-center justify-center group-hover:bg-[#F5C400] group-hover:text-[#0B0B0B] transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="font-heading font-extrabold text-xl text-[#0B0B0B] dark:text-white">{service.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{service.description}</p>
                      </div>

                      <ul className="space-y-2.5 pt-2">
                        {service.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-center text-xs font-semibold text-[#111111] dark:text-zinc-200">
                            <CheckCircle2 className="w-4 h-4 text-[#F5C400] mr-2 flex-shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-8">
                      <Link href="/auth/login" className="w-full">
                        <Button className="w-full bg-[#0B0B0B] dark:bg-zinc-800 text-white hover:bg-[#F5C400] dark:hover:bg-[#F5C400] hover:text-[#0B0B0B] dark:hover:text-[#0B0B0B] border-0 transition-colors font-bold text-xs">
                          Activate Service
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Smart Renewal Alerts Section */}
        <section className="py-20 bg-slate-50/50 dark:bg-zinc-900/10 border-t border-b border-[#E5E5E5] dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
          <div className="absolute left-0 bottom-0 w-80 h-80 bg-gold-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">
                {selectedLanguage === 'Spanish' ? 'Plazos Inteligentes' : selectedLanguage === 'Urdu' ? 'ذہین وقت کی حدود' : selectedLanguage === 'Bengali' ? 'বুদ্ধিমান সময়সীমা' : selectedLanguage === 'French' ? 'Délais Intelligents' : selectedLanguage === 'Mandarin' ? '智能截止日期' : 'Intelligent Deadlines'}
              </span>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
                {selectedLanguage === 'Spanish' ? 'Alertas de Renovación Inteligentes' : selectedLanguage === 'Urdu' ? 'ذہین تجدید کے الرٹس' : selectedLanguage === 'Bengali' ? 'স্মার্ট পুনর্নবীকরণ অ্যালার্ট' : selectedLanguage === 'French' ? 'Alertes de Renouvellement Intelligentes' : selectedLanguage === 'Mandarin' ? '智能更新警报' : 'Smart Renewal Alerts'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                {selectedLanguage === 'Spanish' ? 'JNI Solutions separa los documentos normales válidos de los plazos urgentes reales. Si su documento vence dentro de años, se marca como seguro. Cuando se acerca un plazo, el sistema actualiza el estado a próximo, advertencia, urgente o crítico.' 
                 : selectedLanguage === 'Urdu' ? 'جے این آئی سلوشنز عام درست دستاویزات کو حقیقی فوری آخری تاریخوں سے الگ کرتا ہے۔ اگر آپ کا دستاویز سالوں بعد ختم ہوتا ہے تو یہ محفوظ نشان زد رہتا ہے۔ جیسے جیسے کوئی آخری تاریخ قریب آتی ہے، نظام اسٹیٹس کو اپ گریڈ کرتا ہے۔'
                 : selectedLanguage === 'Bengali' ? 'JNI সলিউশন সাধারণ বৈধ নথিকে প্রকৃত জরুরি সময়সীমা থেকে আলাদা করে। আপনার নথির মেয়াদ যদি কয়েক বছর পর শেষ হয়, তবে এটি নিরাপদ থাকে। সময়সীমা কাছে এলে সিস্টেমটি আসন্ন, সতর্কতা, জরুরি বা গুরুত্বর অবস্থায় উন্নীত করে।'
                 : selectedLanguage === 'French' ? 'JNI Solutions sépare les documents valides des délais urgents. Si votre document expire dans plusieurs années, il reste marqué comme sécurisé. Quand un délai approche, le statut change en à venir, avertissement, urgent ou critique.'
                 : selectedLanguage === 'Mandarin' ? 'JNI Solutions 将正常的有效证件与真正紧急的截止日期区分开来。如果您的文件在几年后才过期，它将保持安全状态。当截止日期临近时，系统会将状态升级为即将到来、警告、紧急或关键。'
                 : 'JNI Solutions separates normal valid documents from real urgent deadlines. If your document expires years from now, it stays marked as safe. When a deadline gets closer, the system upgrades the status from upcoming to warning, urgent, or critical.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              {[
                {
                  badge: selectedLanguage === 'Spanish' ? 'Seguro / Info' : selectedLanguage === 'Urdu' ? 'محفوظ / معلومات' : selectedLanguage === 'Bengali' ? 'নিরাপদ / তথ্য' : selectedLanguage === 'French' ? 'Sécurisé / Info' : selectedLanguage === 'Mandarin' ? '安全 / 信息' : 'Safe / Info',
                  badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                  borderClass: 'border-emerald-500/20',
                  title: selectedLanguage === 'Spanish' ? 'Licencia TLC vence en 4 años' : selectedLanguage === 'Urdu' ? 'TLC لائسنس 4 سال میں ختم ہو رہا ہے' : selectedLanguage === 'Bengali' ? 'TLC লাইসেন্স ৪ বছরে শেষ হচ্ছে' : selectedLanguage === 'French' ? 'Licence TLC expirant dans 4 ans' : selectedLanguage === 'Mandarin' ? 'TLC 执照将在 4 年后过期' : 'TLC License expiring in 4 years',
                  desc: selectedLanguage === 'Spanish' ? 'El estado sigue siendo Seguro/Info. Placa verde, solo en el tablero de control, sin alertas de SMS/WhatsApp/correo.' : selectedLanguage === 'Urdu' ? 'حیثیت محفوظ/معلومات رہے گی۔ سبز بیج، صرف ڈیش بورڈ پر، کوئی ایس ایم ایس/واٹس ایپ/ای میل الرٹ نہیں کیا جائے گا۔' : selectedLanguage === 'Bengali' ? 'স্থিতি নিরাপদ/তথ্য থাকবে। সবুজ ব্যাজ, শুধুমাত্র ড্যাশবোর্ডে, কোন এসএমএস/হোয়াটসঅ্যাপ/ইমেল অ্যালার্ট থাকবে না।' : selectedLanguage === 'French' ? 'Le statut reste Sécurisé/Info. Badge vert, tableau de bord uniquement, pas d\'alertes SMS/WhatsApp/e-mail.' : selectedLanguage === 'Mandarin' ? '状态保持“安全/信息”。绿色徽章，仅仪表板显示，无短信/WhatsApp/电子邮件警报。' : 'Status remains Safe/Info. Green badge, dashboard only, no SMS/WhatsApp/email alerts.'
                },
                {
                  badge: selectedLanguage === 'Spanish' ? 'Próximo' : selectedLanguage === 'Urdu' ? 'آنے والا' : selectedLanguage === 'Bengali' ? 'আসন্ন' : selectedLanguage === 'French' ? 'À venir' : selectedLanguage === 'Mandarin' ? '即将到来' : 'Upcoming',
                  badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                  borderClass: 'border-blue-500/20',
                  title: selectedLanguage === 'Spanish' ? 'Registro DMV vence en 45 días' : selectedLanguage === 'Urdu' ? 'DMV رجسٹریشن 45 دن میں ختم ہو رہی ہے' : selectedLanguage === 'Bengali' ? 'DMV রেজিস্ট্রেশন ৪৫ দিনে শেষ হচ্ছে' : selectedLanguage === 'French' ? 'Enregistrement DMV expirant dans 45 jours' : selectedLanguage === 'Mandarin' ? 'DMV 注册将在 45 天后过期' : 'DMV Registration expiring in 45 days',
                  desc: selectedLanguage === 'Spanish' ? 'El estado pasa a ser Próximo. Placa azul, recordatorio solo en el tablero, correo opcional si está activado.' : selectedLanguage === 'Urdu' ? 'حیثیت آنے والا ہو جائے گی۔ نیلا بیج، صرف ڈیش بورڈ پر یاد دہانی، فعال ہونے پر ای میل کی جا سکتی ہے۔' : selectedLanguage === 'Bengali' ? 'স্থিতি আসন্ন হবে। নীল ব্যাজ, শুধুমাত্র ড্যাশবোর্ডে অনুস্মারক, সক্রিয় থাকলে ঐচ্ছিক ইমেল।' : selectedLanguage === 'French' ? 'Le statut devient À venir. Badge bleu, rappel sur tableau de bord uniquement, e-mail facultatif si activé.' : selectedLanguage === 'Mandarin' ? '状态变为“即将到来”。蓝色徽章，仅仪表板提醒，如果启用则发送可选电子邮件。' : 'Status becomes Upcoming. Blue badge, dashboard reminder only, optional email if enabled.'
                },
                {
                  badge: selectedLanguage === 'Spanish' ? 'Advertencia' : selectedLanguage === 'Urdu' ? 'انتباہ' : selectedLanguage === 'Bengali' ? 'সতর্কতা' : selectedLanguage === 'French' ? 'Avertissement' : selectedLanguage === 'Mandarin' ? '警告' : 'Warning',
                  badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                  borderClass: 'border-amber-500/20',
                  title: selectedLanguage === 'Spanish' ? 'Seguro vence en 20 días' : selectedLanguage === 'Urdu' ? 'انشورنس 20 دن میں ختم ہو رہی ہے' : selectedLanguage === 'Bengali' ? 'বীমা ২০ দিনে শেষ হচ্ছে' : selectedLanguage === 'French' ? 'Assurance expirant dans 20 jours' : selectedLanguage === 'Mandarin' ? '保险将在 20 天后过期' : 'Insurance expiring in 20 days',
                  desc: selectedLanguage === 'Spanish' ? 'El estado pasa a ser Advertencia. Placa amarilla, recordatorio en el tablero + alerta proactiva por correo.' : selectedLanguage === 'Urdu' ? 'حیثیت انتباہ ہو جائے گی۔ پیلا بیج، ڈیش بورڈ یاد دہانی + فعال ای میل الرٹ۔' : selectedLanguage === 'Bengali' ? 'স্থিতি সতর্কতা হবে। হলুদ ব্যাজ, ড্যাশবোর্ড অনুস্মারক + সক্রিয় ইমেল অ্যালার্ট।' : selectedLanguage === 'French' ? 'Le statut devient Avertissement. Badge jaune, rappel sur tableau de bord + alerte e-mail proactive.' : selectedLanguage === 'Mandarin' ? '状态变为“警告”。黄色徽章，仪表板提醒 + 主动电子邮件警报。' : 'Status becomes Warning. Yellow badge, dashboard reminder + proactive email alert.'
                },
                {
                  badge: selectedLanguage === 'Spanish' ? 'Urgente' : selectedLanguage === 'Urdu' ? 'فوری' : selectedLanguage === 'Bengali' ? 'জরুরী' : selectedLanguage === 'French' ? 'Urgent' : selectedLanguage === 'Mandarin' ? '紧急' : 'Urgent',
                  badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                  borderClass: 'border-orange-500/20',
                  title: selectedLanguage === 'Spanish' ? 'Prueba de drogas vence en 5 días' : selectedLanguage === 'Urdu' ? 'ڈرگ ٹیسٹ 5 دن میں ختم ہو رہا ہے' : selectedLanguage === 'Bengali' ? 'ড্রাগ টেস্ট ৫ দিনে শেষ হচ্ছে' : selectedLanguage === 'French' ? 'Dépistage de drogues expirant dans 5 jours' : selectedLanguage === 'Mandarin' ? '药检将在 5 天后过期' : 'Drug test expiring in 5 days',
                  desc: selectedLanguage === 'Spanish' ? 'El estado pasa a ser Urgente. Placa naranja, tablero + correo + mensajes de SMS/WhatsApp de Twilio.' : selectedLanguage === 'Urdu' ? 'حیثیت فوری ہو جائے گی۔ نارنجی بیج، ڈیش بورڈ + ای میل + ٹویلیو ایس ایم ایس/واٹس ایپ الرٹس۔' : selectedLanguage === 'Bengali' ? 'স্থিতি জরুরী হবে। কমলা ব্যাজ, ড্যাশবোর্ড + ইমেল + টুইলিও এসএমএস/হোয়াটসঅ্যাপ বার্তা।' : selectedLanguage === 'French' ? 'Le statut devient Urgent. Badge orange, tableau de bord + e-mail + messages SMS/WhatsApp Twilio.' : selectedLanguage === 'Mandarin' ? '状态变为“紧急”。橙色徽章，仪表板 + 电子邮件 + Twilio 短信/WhatsApp 消息。' : 'Status becomes Urgent. Orange badge, dashboard + email + Twilio SMS/WhatsApp messages.'
                },
                {
                  badge: selectedLanguage === 'Spanish' ? 'Crítico' : selectedLanguage === 'Urdu' ? 'انتہائی اہم' : selectedLanguage === 'Bengali' ? 'গুরুতর' : selectedLanguage === 'French' ? 'Critique' : selectedLanguage === 'Mandarin' ? '关键/严重' : 'Critical',
                  badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
                  borderClass: 'border-red-500/20',
                  title: selectedLanguage === 'Spanish' ? 'Documento vencido' : selectedLanguage === 'Urdu' ? 'میعاد ختم دستاویز' : selectedLanguage === 'Bengali' ? 'মেয়াদোত্তীর্ণ নথি' : selectedLanguage === 'French' ? 'Document expiré' : selectedLanguage === 'Mandarin' ? '证件已过期' : 'Expired document',
                  desc: selectedLanguage === 'Spanish' ? 'El estado pasa a ser Crítico. Placa roja, tablero + correo + alertas de SMS/WhatsApp, bandera de revisión de administrador.' : selectedLanguage === 'Urdu' ? 'حیثیت انتہائی اہم ہو جائے گی۔ لال بیج، ڈیش بورڈ + ای میل + ایس ایم ایس/واٹس ایپ الرٹس، ایڈمن ریویو فلیگ۔' : selectedLanguage === 'Bengali' ? 'স্থিতি গুরুতর হবে। লাল ব্যাজ, ড্যাশবোর্ড + ইমেল + এসএমএস/হোয়াটসঅ্যাপ অ্যালার্ট, অ্যাডমিন পর্যালোচনা ফ্ল্যাগ।' : selectedLanguage === 'French' ? 'Le statut devient Critique. Badge rouge, tableau de bord + e-mail + alertes SMS/WhatsApp, drapeau de révision administrateur.' : selectedLanguage === 'Mandarin' ? '状态变为“关键”。红色徽章，仪表板 + 电子邮件 + 短信/WhatsApp 警报，管理员人工审查队列标志。' : 'Status becomes Critical. Red badge, dashboard + email + SMS/WhatsApp alerts, admin review queue flag.'
                },
                {
                  badge: selectedLanguage === 'Spanish' ? 'Requiere Revisión' : selectedLanguage === 'Urdu' ? 'جائزے کی ضرورت ہے' : selectedLanguage === 'Bengali' ? 'পর্যালোচনা প্রয়োজন' : selectedLanguage === 'French' ? 'À réviser' : selectedLanguage === 'Mandarin' ? '需要审查' : 'Needs Review',
                  badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                  borderClass: 'border-purple-500/20',
                  title: selectedLanguage === 'Spanish' ? 'Documento desconocido / Baja confianza de OCR' : selectedLanguage === 'Urdu' ? 'نامعلوم دستاویز / کم او سی آر اعتماد' : selectedLanguage === 'Bengali' ? 'অজানা নথি / কম ওসিআর আত্মবিশ্বাস' : selectedLanguage === 'French' ? 'Document inconnu / Confiance OCR faible' : selectedLanguage === 'Mandarin' ? '未知 / 低 OCR 置信度文件' : 'Unknown / Low OCR Confidence document',
                  desc: selectedLanguage === 'Spanish' ? 'El estado pasa a ser Requiere Revisión. Placa morada, se requiere revisión manual del administrador.' : selectedLanguage === 'Urdu' ? 'حیثیت جائزے کی ضرورت ہو جائے گی۔ جامنی بیج، ایڈمن کا دستی جائزہ لازمی ہو گا۔' : selectedLanguage === 'Bengali' ? 'স্থিতি পর্যালোচনা প্রয়োজন হবে। বেগুনি ব্যাজ, অ্যাডমিন ম্যানুয়াল পর্যালোচনা আবশ্যক।' : selectedLanguage === 'French' ? 'Le statut devient À réviser. Badge violet, révision manuelle de l\'administrateur requise.' : selectedLanguage === 'Mandarin' ? '状态变为“需要审查”。灰色/紫色徽章，在安排提醒前需要管理员进行人工审查。' : 'Status becomes Needs Review. Gray/purple badge, admin manual review required before reminder scheduling.'
                }
              ].map((card, cIdx) => (
                <div key={cIdx} className={`bg-white dark:bg-zinc-900 border ${card.borderClass} rounded-2xl p-6 flex flex-col justify-start items-start gap-2 h-full`}>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border self-start ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                  <h4 className="font-bold text-foreground min-h-[2.5rem] flex items-center">{card.title}</h4>
                  <p className="text-muted leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Banner Info Section */}
        <section className="py-16 bg-[#0B0B0B] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5C400]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl">
              Failing TLC Compliance Audits Costs Over $1,200 Annually
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed font-medium">
              City rules are constantly updated, and late renewal fees pile up. JNI helps you track your checkpoints and sends proactive reminders straight to your smartphone.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] font-bold border-0 px-8">
                  Sign Up & Secure License
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 font-bold px-8">
                  Speak to an Expert
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
