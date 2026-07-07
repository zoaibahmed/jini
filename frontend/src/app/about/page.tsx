'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Award, ShieldCheck, Heart } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/app/language-provider';

export default function AboutPage() {
  const { language: selectedLanguage } = useLanguage();

  const stats = [
    { 
      label: selectedLanguage === 'Spanish' ? 'Diseñado para Conductores de TLC'
        : selectedLanguage === 'Urdu' ? 'TLC ڈرائیوروں کے لیے خاص'
        : selectedLanguage === 'Bengali' ? 'TLC ড্রাইভারদের জন্য তৈরি'
        : selectedLanguage === 'French' ? 'Conçu pour Chauffeurs TLC'
        : selectedLanguage === 'Mandarin' ? '专为 TLC 司机打造'
        : 'Built for NYC TLC Drivers', 
      value: 'TLC Focus' 
    },
    { 
      label: selectedLanguage === 'Spanish' ? 'Listo para Uber y Lyft'
        : selectedLanguage === 'Urdu' ? 'اوبر اور لفٹ کے لیے تیار'
        : selectedLanguage === 'Bengali' ? 'উবার এবং লিফটের জন্য প্রস্তুত'
        : selectedLanguage === 'French' ? 'Prêt pour Uber & Lyft'
        : selectedLanguage === 'Mandarin' ? '支持 Uber 与 Lyft'
        : 'Designed for Uber & Lyft', 
      value: 'Livery Ready' 
    },
    { 
      label: selectedLanguage === 'Spanish' ? 'Soporte de Renovación de Documentos IA'
        : selectedLanguage === 'Urdu' ? 'اے آئی دستاویز تجدید سپورٹ'
        : selectedLanguage === 'Bengali' ? 'এআই নথি পুনর্নবীকরণ সহায়তা'
        : selectedLanguage === 'French' ? 'Support de Documents IA'
        : selectedLanguage === 'Mandarin' ? 'AI 文档更新支持'
        : 'AI Document Renewal Support', 
      value: 'AI Assisted' 
    },
    { 
      label: selectedLanguage === 'Spanish' ? 'Automatización del Cumplimiento de Conductores'
        : selectedLanguage === 'Urdu' ? 'ڈرائیور تعمیل آٹومیشن'
        : selectedLanguage === 'Bengali' ? 'ড্রাইভার কমপ্লায়েন্স অটোমেশন'
        : selectedLanguage === 'French' ? 'Conformité Automatisée'
        : selectedLanguage === 'Mandarin' ? '司机合规自动化'
        : 'Driver Compliance Automation', 
      value: 'Automation' 
    }
  ];

  const milestones = [
    {
      year: '2024',
      title: selectedLanguage === 'Spanish' ? 'Inicio de la Plataforma'
        : selectedLanguage === 'Urdu' ? 'پلیٹ فارم کا آغاز'
        : selectedLanguage === 'Bengali' ? 'প্ল্যাটফর্মের সূচনা'
        : selectedLanguage === 'French' ? 'Inception de la Plateforme'
        : selectedLanguage === 'Mandarin' ? '平台创立'
        : 'Platform Inception',
      description: selectedLanguage === 'Spanish' ? 'Lanzamos la primera versión del calendario de cumplimiento de JNI Solutions diseñado para conductores de TLC de NYC.'
        : selectedLanguage === 'Urdu' ? 'نیو یارک سٹی کے TLC ڈرائیوروں کے لیے تعمیل کیلنڈر کا پہلا ورژن لانچ کیا گیا۔'
        : selectedLanguage === 'Bengali' ? 'নিউ ইয়র্ক সিটির TLC ড্রাইভারদের জন্য কমপ্লায়েন্স ক্যালেন্ডারের প্রথম সংস্করণ চালু করা হয়েছে।'
        : selectedLanguage === 'French' ? 'Lancement de la première version du calendrier de conformité JNI Solutions pour les chauffeurs TLC de NYC.'
        : selectedLanguage === 'Mandarin' ? '推出专为纽约市 TLC 司机设计的首个 JNI Solutions 合规日历版本。'
        : 'Launched the first version of the JNI Solutions compliance calendar specifically for NYC TLC drivers.'
    },
    {
      year: '2025',
      title: selectedLanguage === 'Spanish' ? 'Escaneo de Documentos OCR con IA'
        : selectedLanguage === 'Urdu' ? 'اے آئی او سی آر اسکیننگ'
        : selectedLanguage === 'Bengali' ? 'এআই ওসিআর নথি স্ক্যানিং'
        : selectedLanguage === 'French' ? 'Numérisation OCR IA'
        : selectedLanguage === 'Mandarin' ? 'AI OCR 文档扫描'
        : 'AI OCR Document Scanning',
      description: selectedLanguage === 'Spanish' ? 'Integramos la extracción de texto OCR neuronal para permitir a los conductores cargar imágenes y rastrear fechas de vencimiento.'
        : selectedLanguage === 'Urdu' ? 'نیورل او سی آر کو شامل کیا گیا تاکہ ڈرائیور تصاویر اپ لوڈ کر کے تاریخیں ٹریک کر سکیں۔'
        : selectedLanguage === 'Bengali' ? 'নিউরাল ওসিআর টেক্সট নিষ্কাশন সংহত করা হয়েছে যাতে চালকরা ছবি আপলোড করে মেয়াদ শেষের তারিখ ট্র্যাক করতে পারে।'
        : selectedLanguage === 'French' ? 'Intégration de l\'extraction de texte OCR pour permettre aux chauffeurs d\'importer des images et de suivre les expirations.'
        : selectedLanguage === 'Mandarin' ? '集成神经 OCR 文本提取，允许司机上传证件图像并跟踪过期日期。'
        : 'Integrated neural OCR text extraction to let drivers upload images of cards and track expiration dates.'
    },
    {
      year: '2026',
      title: selectedLanguage === 'Spanish' ? 'Radares de Oleadas de JFK/LGA'
        : selectedLanguage === 'Urdu' ? 'JFK/LGA رش کے رڈار'
        : selectedLanguage === 'Bengali' ? 'JFK/LGA পিক রাডার'
        : selectedLanguage === 'French' ? 'Radars JFK/LGA'
        : selectedLanguage === 'Mandarin' ? 'JFK/LGA 高峰雷达'
        : 'JFK/LGA Wave Radars',
      description: selectedLanguage === 'Spanish' ? 'Lanzamos el motor de pronóstico de oleadas de vuelos en aeropuertos, optimizando la programación de turnos de los conductores.'
        : selectedLanguage === 'Urdu' ? 'ایئرپورٹ پروازوں کے رش کی پیش گوئی کا انجن جاری کیا، جس سے ڈرائیور کے نظام الاوقات کو بہتر بنایا گیا۔'
        : selectedLanguage === 'Bengali' ? 'এয়ারপোর্টের ফ্লাইটের পিক পূর্বাভাসের ইঞ্জিন প্রকাশ করা হয়েছে, যা ড্রাইভারের সময়সূচীকে অপ্টিমাইজ করে।'
        : selectedLanguage === 'French' ? 'Sortie du moteur de prévision des vagues de vols d\'aéroports pour optimiser les plannings des chauffeurs.'
        : selectedLanguage === 'Mandarin' ? '发布机场航班进港高峰预测引擎，将到达人数与最佳司机排班相结合。'
        : 'Released the airport flight wave surge forecast engine, matching arrival counts to optimized driver scheduling.'
    }
  ];

  const badgeText = selectedLanguage === 'Spanish' ? 'Creado por Neoyorquinos, para Neoyorquinos'
    : selectedLanguage === 'Urdu' ? 'نیویارک والوں کی طرف سے، نیویارک والوں کے لیے'
    : selectedLanguage === 'Bengali' ? 'নিউ ইয়র্কবাসীদের দ্বারা, নিউ ইয়র্কবাসীদের জন্য'
    : selectedLanguage === 'French' ? 'Créé par des New-Yorkais, pour des New-Yorkais'
    : selectedLanguage === 'Mandarin' ? '纽约人打造，服务纽约人'
    : 'Built by New Yorkers, for New Yorkers';

  const heading1 = selectedLanguage === 'Spanish' ? 'Manteniendo NYC Móvil y'
    : selectedLanguage === 'Urdu' ? 'نیویارک سٹی کو متحرک رکھنا اور'
    : selectedLanguage === 'Bengali' ? 'নিউ ইয়র্ক সিটি গতিশীল রাখা এবং'
    : selectedLanguage === 'French' ? 'Garder NYC Mobile &'
    : selectedLanguage === 'Mandarin' ? '保持纽约市的流动性与'
    : 'Keeping NYC Mobile &';

  const headingHighlight = selectedLanguage === 'Spanish' ? 'Conductores Apoyados'
    : selectedLanguage === 'Urdu' ? 'ڈرائیوروں کی مدد'
    : selectedLanguage === 'Bengali' ? 'চালকদের সমর্থন'
    : selectedLanguage === 'French' ? 'Chauffeurs Soutenus'
    : selectedLanguage === 'Mandarin' ? '司机支持'
    : 'Drivers Supported';

  const aboutText = selectedLanguage === 'Spanish' ? 'JNI Solutions es una empresa de tecnología de movilidad con sede en NYC. Desarrollamos módulos de asistencia regulatoria y algoritmos de optimización para ayudar a los conductores de viajes compartidos, taxis y vehículos comerciales a mantenerse organizados y cumplir con las normas.'
    : selectedLanguage === 'Urdu' ? 'JNI سلوشنز نیویارک پر مبنی موبائل ٹیک کمپنی ہے۔ ہم تعمیل کی معاونت اور آپٹیمائزیشن کے الگورتھم بناتے ہیں جو ٹیکسی، رائیڈ شیئر اور کمرشل ڈرائیورز کی مدد کرتے ہیں۔'
    : selectedLanguage === 'Bengali' ? 'JNI সলিউশনস একটি নিউ ইয়র্ক সিটি ভিত্তিক গতিশীলতা প্রযুক্তি কোম্পানি। আমরা কমপ্লায়েন্স সহায়তা এবং অপ্টিমাইজেশান অ্যালগরিদম তৈরি করি যা ট্যাক্সি এবং বাণিজ্যিক ড্রাইভারদের সহায়তা করে।'
    : selectedLanguage === 'French' ? 'JNI Solutions est une entreprise de technologie de mobilité basée à NYC. Nous développons des modules d\'assistance réglementaire et des algorithmes d\'optimisation.'
    : selectedLanguage === 'Mandarin' ? 'JNI Solutions 是一家总部位于纽约的出行科技公司。我们构建合规辅助模块和优化算法，帮助网约车、出租车和商业司机保持井井有条，跟踪合规里程碑。'
    : 'JNI Solutions is an NYC-based mobility tech company. We build regulatory assistance modules and optimization algorithms that help ride-share, taxi, and commercial drivers stay organized and track compliance milestones.';

  const missionTitle = selectedLanguage === 'Spanish' ? 'La Misión de Tiempo de Actividad del Conductor'
    : selectedLanguage === 'Urdu' ? 'ڈرائیور اپ ٹائم مشن'
    : selectedLanguage === 'Bengali' ? 'ড্রাইভার আপটাইম মিশন'
    : selectedLanguage === 'French' ? 'La Mission de Disponibilité des Chauffeurs'
    : selectedLanguage === 'Mandarin' ? '司机正常运营使命'
    : 'The Driver Uptime Mission';

  const missionP1 = selectedLanguage === 'Spanish' ? 'Las regulaciones de TLC en NYC son de las más estrictas del mundo. Entre las inspecciones de seguridad de Woodside, las pruebas anuales de drogas y el seguro, los conductores lidian con una carga administrativa pesada.'
    : selectedLanguage === 'Urdu' ? 'نیو یارک سٹی کے TLC قوانین دنیا میں سب سے سخت ہیں۔ ووڈ سائیڈ تفتیش، سالانہ ڈرگ ٹیسٹ، اور انشورنس کے درمیان، ڈرائیوروں کو انتظامی بوجھ کا سامنا کرنا پڑتا ہے۔'
    : selectedLanguage === 'Bengali' ? 'নিউ ইয়র্ক সিটির TLC নিয়মগুলো বিশ্বের মধ্যে অন্যতম কঠোর। উডসাইড নিরাপত্তা তদন্ত, বার্ষিক ড্রাগ পরীক্ষা এবং বীমার মধ্যে চালকদের প্রচুর প্রশাসনিক কাজ করতে হয়।'
    : selectedLanguage === 'French' ? 'Les réglementations de la TLC à NYC sont parmi les plus strictes au monde. Entre les inspections Woodside, le dépistage de drogues et les assurances, les chauffeurs font face à un lourd fardeau administratif.'
    : selectedLanguage === 'Mandarin' ? '纽约市的 TLC 法规是世界上最严格的法规之一。在两年一次的 Woodside 安全检查、一年一次的药检、执照扣分审计以及商业保险合规之间，司机们花费了大量时间处理行政事务。'
    : 'NYC TLC regulations are some of the most rigorous in the world. Between bi-annual Woodside safety inspections, annual drug testing, license points auditing, and commercial insurance compliance, drivers spend days dealing with administrative burden.';

  const missionP2 = selectedLanguage === 'Spanish' ? 'Creemos que la tecnología debe ayudar a organizar. Mediante el uso de herramientas de análisis de documentos OCR con IA, alertas multicanal y radares de JFK/LGA, convertimos los problemas regulatorios en rastreadores automatizados.'
    : selectedLanguage === 'Urdu' ? 'ہم سمجھتے ہیں کہ ٹیکنالوجی کو ڈرائیوروں کی مدد کرنی چاہیے۔ اے آئی او سی آر، ایس ایم ایس الرٹس اور ایئرپورٹ رڈار کے ذریعے ہم انتظامی مسائل کو خودکار بناتے ہیں۔'
    : selectedLanguage === 'Bengali' ? 'আমরা বিশ্বাস করি প্রযুক্তি চালকদের সাহায্য করবে। এআই ওসিআর, এসএমএস অ্যালার্ট এবং এয়ারপোর্ট রাডারের মাধ্যমে আমরা প্রশাসনিক ঝামেলাগুলোকে স্বয়ংক্রিয় করি।'
    : selectedLanguage === 'French' ? 'Nous pensons que la technologie doit aider les chauffeurs. Grâce à l\'OCR IA, aux alertes multicanaux et aux radars JFK/LGA, nous transformons les tracas réglementaires en suivis automatisés.'
    : selectedLanguage === 'Mandarin' ? '我们相信技术应该帮助司机。通过利用 AI OCR 文档解析工具、多渠道提醒源以及预测性肯尼迪 (JFK)/拉瓜迪亚 (LGA) 航站楼航班高峰雷达，我们将监管烦恼转化为自动化跟踪器。'
    : 'We believe technology should help drivers organize. By utilizing AI OCR document parsing tools, multi-channel reminder feeds, and predictive JFK/LGA terminal flight wave radars, we turn regulatory headaches into automated trackers.';

  const journeyTitle = selectedLanguage === 'Spanish' ? 'Nuestra Trayectoria'
    : selectedLanguage === 'Urdu' ? 'ہمارا سفر'
    : selectedLanguage === 'Bengali' ? 'আমাদের যাত্রা'
    : selectedLanguage === 'French' ? 'Notre Parcours'
    : selectedLanguage === 'Mandarin' ? '我们的历程'
    : 'Our Journey';

  const journeySubtitle = selectedLanguage === 'Spanish' ? 'Cómo crecimos para apoyar a los operadores de taxis y vehículos de alquiler (FHV) con sus necesidades administrativas.'
    : selectedLanguage === 'Urdu' ? 'ہم نے ٹیکسی اور FHV آپریٹرز کے انتظامی کاموں میں مدد کے لیے کس طرح ترقی کی'
    : selectedLanguage === 'Bengali' ? 'আমরা কীভাবে ট্যাক্সি এবং FHV অপারেটরদের প্রশাসনিক কাজে সহায়তা করার জন্য বড় হয়েছি'
    : selectedLanguage === 'French' ? 'Comment nous avons grandi pour soutenir les opérateurs de taxi et de FHV dans leurs démarches administratives.'
    : selectedLanguage === 'Mandarin' ? '我们如何发展以支持出租车和 FHV 运营商의 行政需求。'
    : 'How we grew to support taxi and FHV operators with their administrative needs.';

  const hubTitle = selectedLanguage === 'Spanish' ? 'Centro de Operaciones de Queens'
    : selectedLanguage === 'Urdu' ? 'کوئینز آپریشنز ہب'
    : selectedLanguage === 'Bengali' ? 'কুইন্স অপারেশনস হাব'
    : selectedLanguage === 'French' ? 'Centre d\'Opérations de Queens'
    : selectedLanguage === 'Mandarin' ? '皇后区运营中心'
    : 'Queens Operations Hub';

  const hubDesc = selectedLanguage === 'Spanish' ? 'Situado a pocos minutos del depósito oficial de inspección de seguridad de TLC Woodside, nuestro espacio en Queens ofrece asistencia en persona.'
    : selectedLanguage === 'Urdu' ? 'سرکاری TLC ووڈ سائیڈ تفتیشی ڈپو سے چند منٹ کی دوری پر واقع ہمارا کوئینز ہب ڈرائیورز کی ذاتی رہنمائی کرتا ہے۔'
    : selectedLanguage === 'Bengali' ? 'অফিসিয়াল TLC উডসাইড নিরাপত্তা তদন্ত ডিপো থেকে মাত্র কয়েক মিনিটের দূরত্বে অবস্থিত আমাদের কুইন্স হাব চালকদের সরাসরি সহায়তা করে।'
    : selectedLanguage === 'French' ? 'Situé à quelques minutes du dépôt d\'inspection officiel de la TLC à Woodside, notre espace à Queens propose une assistance physique.'
    : selectedLanguage === 'Mandarin' ? '我们的皇后区工作空间距离 TLC Woodside 官方安全检查站仅数分钟路程，提供现场面对面的合规指导和支持服务。'
    : 'Situated just minutes away from the official TLC Woodside safety inspection depot, our Queens workspace provides in-person walk-in compliance guidance and support services.';

  const partnerTitle = selectedLanguage === 'Spanish' ? 'Socio de Movilidad de NYC'
    : selectedLanguage === 'Urdu' ? 'نیو یارک سٹی کا موبلٹی پارٹنر'
    : selectedLanguage === 'Bengali' ? 'নিউ ইয়র্ক সিটির গতিশীলতা অংশীদার'
    : selectedLanguage === 'French' ? 'Partenaire de Mobilité de NYC'
    : selectedLanguage === 'Mandarin' ? '纽约市出行合作伙伴'
    : 'NYC Mobility Partner';

  const partnerDesc = selectedLanguage === 'Spanish' ? 'Colaboramos estrechamente con despachadores de flotas, redes de seguridad de conductores y escuelas de conducción defensiva en la ciudad de Nueva York.'
    : selectedLanguage === 'Urdu' ? 'ہم نیویارک سٹی میں فلیٹ ڈسپیچرز اور ڈرائیور سیفٹی نیٹ ورکس کے ساتھ مل کر کام کرتے ہیں۔'
    : selectedLanguage === 'Bengali' ? 'আমরা নিউ ইয়র্ক সিটিতে ফ্লিট ডিসপ্যাচার এবং ড্রাইভার সেফটি নেটওয়ার্কের সাথে ঘনিষ্ঠভাবে কাজ করি।'
    : selectedLanguage === 'French' ? 'Nous collaborons étroitement avec les répartiteurs de flottes, les réseaux de sécurité et les écoles de conduite défensive de New York.'
    : selectedLanguage === 'Mandarin' ? '我们与纽约市的车队调度员、司机安全网络和防御性驾驶学校密切合作。这种整合使我们的通知引擎能够获得实时反馈。'
    : 'We collaborate closely with fleet dispatchers, driver safety networks, and defensive driving schools in New York City. This integration keeps our notification engine updated with real-time feedback loops.';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        {/* Banner Hero */}
        <section className="relative py-24 bg-[radial-gradient(#f5c400_1px,transparent_1px)] [background-size:32px_32px] bg-opacity-[0.03] dark:bg-opacity-[0.015] border-b border-slate-100 dark:border-zinc-800 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5C400]/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#F5C400]/20 bg-[#F5C400]/5 text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider"
            >
              <Heart className="w-4 h-4 text-[#F5C400]" />
              <span>{badgeText}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#111111] dark:text-white leading-tight"
            >
              {heading1} <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-2 text-[#0B0B0B] dark:text-[#F5C400]">{headingHighlight}</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#F5C400]/80 dark:bg-[#F5C400]/20 -rotate-1 z-0 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
            >
              {aboutText}
            </motion.p>
          </div>
        </section>

        {/* Corporate Mission */}
        <section className="py-20 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="font-heading font-extrabold text-3xl text-[#0B0B0B] dark:text-white">{missionTitle}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {missionP1}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {missionP2}
                </p>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-2 gap-4 bg-slate-100/50 dark:bg-zinc-900/40 p-8 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 p-5 rounded-xl text-center space-y-1">
                    <strong className="text-sm font-heading font-extrabold text-[#0B0B0B] dark:text-white block">{stat.value}</strong>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-tight">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Corporate Milestones Timeline */}
        <section className="py-20 bg-slate-50/50 dark:bg-zinc-900/20 border-t border-b border-slate-200 dark:border-zinc-800 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-3">
              <h2 className="font-heading font-extrabold text-3xl text-[#0B0B0B] dark:text-white">{journeyTitle}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">{journeySubtitle}</p>
            </div>

            <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-4 md:ml-32 pl-8 space-y-12">
              {milestones.map((milestone, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="relative group"
                >
                  {/* Timeline point */}
                  <span className="absolute -left-12 top-1.5 w-6 h-6 rounded-full bg-[#0B0B0B] dark:bg-zinc-800 border-4 border-white dark:border-zinc-950 flex items-center justify-center group-hover:bg-[#F5C400] transition-colors z-10" />
                  
                  <span className="absolute -left-28 top-2 text-xs font-bold text-slate-400 dark:text-slate-500 hidden md:block w-20 text-right">
                    {milestone.year}
                  </span>

                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl space-y-2 hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-bold text-[#D9A300] uppercase tracking-widest md:hidden block">
                      {milestone.year}
                    </span>
                    <h4 className="font-heading font-extrabold text-lg text-[#0B0B0B] dark:text-white">{milestone.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{milestone.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Queens Hub */}
        <section className="py-20 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 p-8 rounded-2xl space-y-6">
                <div className="w-10 h-10 rounded-lg bg-[#0B0B0B] dark:bg-zinc-800 text-[#F5C400] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-heading font-extrabold text-xl text-[#0B0B0B] dark:text-white">{hubTitle}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                    JNI Solutions LLC <br />
                    120 Woodside Ave, Queens, NY 11377
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {hubDesc}
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 border border-[#F5C400]/20 text-[#D9A300] dark:text-[#F5C400] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-[#0B0B0B] dark:text-white">{partnerTitle}</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {partnerDesc}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
