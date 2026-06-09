'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  MessageSquare, 
  Globe, 
  Clock, 
  PhoneCall, 
  Layers, 
  Ticket, 
  Bell, 
  ShieldAlert, 
  Scale, 
  Star, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Send,
  ShieldCheck,
  Activity,
  Terminal,
  PhoneIncoming,
  Volume2,
  MapPin,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Preloader } from '@/components/Preloader';
import { AntigravityItem } from '@/components/AntigravityItem';
import { API_URL } from '@/config';
import { useToast } from '@/components/ui/toast';

export default function JniLandingPage() {
  const { toast } = useToast();
  
  // Billing cycle toggler
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Live Telemetry Event stream (compliance focused)
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

  // AI Showcase Chat Simulation (compliance focused)
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

  // Metrics Counters
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

  // Sticky bottom navigation bar visbility
  const [showStickyNav, setShowStickyNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyNav(true);
      } else {
        setShowStickyNav(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          notes: callbackNotes || 'Inbound callback request from landing page.'
        })
      });

      if (!res.ok) throw new Error('Callback request failed.');
      
      setCallbackSuccess(true);
      toast.success('Callback requested! Our agents will dial you shortly.');
      
      // Reset
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

  const features = [
    { title: 'Compliance Vault', description: 'Store and secure TLC driver licenses, DMV logs, commercial insurance certificates, and medical checkup forms.', icon: FileText },
    { title: 'OpenAI Structured OCR', description: 'Snap photos of documents. Our OCR engine parses name, license number, expiry, and issue dates automatically.', icon: ShieldCheck },
    { title: 'Interactive RAG Copilot', description: 'Ask the smart assistant anything. Uses JNI Guides, renewal policies, and FAQs as context vectors.', icon: MessageSquare },
    { title: 'Automated SMS Alerts', description: 'Never miss inspection timelines. BullMQ and Twilio automatically schedule alerts 30, 15, and 5 days prior.', icon: Clock },
    { title: 'CRM Lead Conversion', description: 'Track qualified drivers and inbound callback requests directly on our team Kanban boards.', icon: Users },
    { title: 'Voice AI Dialer', description: 'Intelligent Twilio telephony routing qualifies driver calls and queues outbound callbacks hands-free.', icon: PhoneCall },
    { title: 'Subscription SaaS Core', description: '中央 billing and invoice logs managing driver accounts, premium subscriptions, and features access.', icon: Layers },
    { title: 'Support Ticket System', description: 'Log DMV summons disputes, defensive driving courses updates, and plate registration issues with support agents.', icon: Ticket },
  ];

  const services = [
    { title: 'TLC Renewal Guide', description: 'NYC TLC application instructions, drug screening fast-track coordination, and compliance timelines verification.', icon: ShieldAlert },
    { title: 'DMV Summons Assistance', description: 'Hearing representation guidelines, defensive driving point mitigation, and Woodside safety inspection schedules.', icon: Scale },
    { title: 'Document Intelligence', description: 'Automated OCR metadata extraction tags files and sets expiry check jobs.', icon: FileText },
    { title: 'Reminders Scheduler', description: 'Twilio SMS logs send critical alerts. Rest easy knowing you are 100% active.', icon: Clock },
    { title: 'Agent Live Chat', description: 'Communicate in real-time. Direct access to support agents and specialized legal compliance advisors.', icon: MessageSquare },
    { title: 'Multilingual Support', description: 'Guides, chats, and calls supported in English, Spanish, Urdu, Bengali, French, and Mandarin.', icon: Globe },
  ];

  const workflowSteps = [
    { number: '01', title: 'Submit Consultation', description: 'Book a consultation slot or submit a callback request to get matched with a JNI advisor.' },
    { number: '02', title: 'Upload TLC Documents', description: 'Take photos of licenses, DMV registrations, or checkup slips. The AI populates metadata.' },
    { number: '03', title: 'Monitor Compliance Checklist', description: 'Check your active dashboard checklists. Green items indicate verified safe compliance.' },
    { number: '04', title: 'Rely on Automated Reminders', description: 'Receive SMS, email, and socket push alerts before critical dates arrive to prevent suspensions.' },
    { number: '05', title: 'Resolve Disputes Fast', description: 'Log parking tickets and TLC summonses into the support queue for legal guidelines representation.' },
  ];

  const pricingPlans = [
    {
      name: 'Basic Support',
      price: billingPeriod === 'monthly' ? 0 : 0,
      description: 'Essential compliance tracking, renewal guide articles, and manual document storage.',
      features: [
        'Centralized Compliance Calendar',
        'Defensive driving course guides',
        'Manual document uploading & tags',
        'Standard Email support queue',
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Premium Driver Pro',
      price: billingPeriod === 'monthly' ? 19 : 14,
      description: 'AI-powered co-pilot assistance, structured OCR document parsing, and Twilio SMS alerts.',
      features: [
        'OpenAI Structured OCR Engine',
        'Real-time WebSocket AI Co-pilot',
        'Automated SMS & email expiry alerts',
        'Centralized support ticket dashboard',
        'Woodside inspection priority slots',
      ],
      cta: 'Subscribe Pro',
      popular: true
    },
    {
      name: 'Enterprise Fleet',
      price: billingPeriod === 'monthly' ? 99 : 79,
      description: ' CENTRAL fleet compliance registry for dispatch taxi operators and livery services.',
      features: [
        'Centralized Fleet Compliance Log',
        'Manage up to 10 driver licenses',
        'Centralized support ticket routing',
        'Dedicated 24/7 account manager',
        'RAG Context articles creation',
      ],
      cta: 'Subscribe Fleet',
      popular: false
    }
  ];

  const testimonials = [
    { quote: "JNI Solutions saved my TLC license! I forgot about my drug test date. The automated SMS alert arrived 15 days prior, leaving me plenty of time to book. An absolute lifesaver.", author: "Luis R., NYC Uber Driver", stars: 5 },
    { quote: "The structured OCR parser is amazing. I uploaded my DMV registration, and it instantly updated my checklist. Proactive alerts keep my vehicle active.", author: "Arif K., Green Cab Owner-Operator", stars: 5 },
    { quote: "Outstanding summons dispute guidance. Submitting a ticket connected me with an agent who prepared my DMV hearing papers. Highly recommended.", author: "Samantha T., Taxi Dispatch Agent", stars: 5 }
  ];

  const faqItems = [
    { id: '1', title: 'How does JNI help with TLC compliance?', content: 'We monitor official TLC renewal requirements, safety inspections, and drug screening deadlines. Our automated reminders ensure you complete each step before critical dates arrive to prevent sudden license suspension.' },
    { id: '2', title: 'What is OpenAI Structured OCR?', content: 'When you upload documents (TLC license, DMV registration, drug test, insurance), our advanced OCR uses GPT-4o structured extraction to automatically parse name, license number, and dates, updating your compliance status immediately.' },
    { id: '3', title: 'What languages does JNI support?', content: 'Our AI Co-pilot, RAG articles, support queue, and Voice AI call center routing support English, Spanish, Urdu, Bengali, French, and Mandarin.' },
    { id: '4', title: 'How do JNI support tickets work?', content: 'If you receive a summons, you can submit a support ticket under DMV or TLC categories. Our agents guide you through dispute procedures and hearing representation steps.' }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Preloader />
      <Navbar />
  
      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden py-24 lg:py-32 border-b border-slate-100 dark:border-zinc-800 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-primary/5 via-transparent to-transparent bg-opacity-[0.03] dark:bg-opacity-[0.015] transition-colors duration-300">
        
        {/* Futuristic Background Grids & Ambient Lights */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-[-5%] left-1/4 w-[500px] h-[500px] bg-gold-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-8 text-center lg:text-left"
            >
              <AntigravityItem repulsionStrength={1.2} driftScale={0.3} maxOffset={25}>
                <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full border border-gold-primary/20 bg-gold-primary/5 text-gold-primary text-xs font-bold tracking-wider uppercase shadow-lg shadow-gold-primary/5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{driversCount.toLocaleString()}+ Active Subscribers Protected</span>
                </div>
              </AntigravityItem>
  
              <AntigravityItem repulsionStrength={1.6} driftScale={0.4} maxOffset={40}>
                <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-slate-900 dark:text-white">
                  Centralized Support <br />
                  <span className="block mt-2 sm:mt-3 bg-clip-text text-transparent bg-gradient-to-r from-gold-primary via-[#FFE5A3] to-amber-500">
                    For NYC TLC Drivers
                  </span>
                </h1>
              </AntigravityItem>
  
              <AntigravityItem repulsionStrength={1.4} driftScale={0.35} maxOffset={30}>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Centralize your TLC license renewals, DMV safety compliance, and checkup timelines. Protect your profile with OpenAI OCR document extraction and automated Twilio reminders.
                </p>
              </AntigravityItem>
  
              <AntigravityItem repulsionStrength={1.3} driftScale={0.3} maxOffset={25}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/auth/login" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full bg-gradient-to-r from-gold-primary to-amber-500 hover:from-gold-hover hover:to-amber-600 text-black font-extrabold text-sm px-9 py-4 rounded-xl shadow-lg shadow-gold-primary/10 hover:shadow-gold-primary/20 transition-all duration-300">
                      Launch Portal Dashboard
                    </Button>
                  </Link>
                  <a href="#callback-request" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full flex items-center justify-center gap-2 border-2 border-slate-900 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800/80 font-bold text-sm px-8 py-4 rounded-xl transition-all duration-300">
                      <PhoneIncoming className="w-4 h-4 text-gold-primary" />
                      <span>Request a Callback</span>
                    </Button>
                  </a>
                </div>
              </AntigravityItem>
            </motion.div>
  
            {/* Right Side: High-Tech Glassmorphic Telemetry Center */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="lg:col-span-6 relative"
            >
              <AntigravityItem repulsionStrength={2.0} driftScale={0.4} maxOffset={50}>
                {/* Visual backlighting */}
                <div className="absolute inset-0 bg-gradient-to-tr from-gold-primary/20 to-emerald-500/10 rounded-3xl filter blur-2xl opacity-40 dark:opacity-20 pointer-events-none" />
                
                <div className="border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#151516]/80 backdrop-blur-xl text-slate-900 dark:text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
                  
                  {/* Glass Card Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-850">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/90 shadow-sm" />
                        <span className="w-3 h-3 rounded-full bg-gold-primary/95 shadow-sm" />
                        <span className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-sm" />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wider">JNI-COMPLIANCE-SECURE</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest font-mono">timeline sync</span>
                    </div>
                  </div>
  
                  {/* Widget 1: Real-time Operations Live Feed Terminal */}
                  <div className="bg-black/90 dark:bg-[#070708] border border-slate-200 dark:border-zinc-900 rounded-xl p-4 font-mono text-[10px] text-zinc-300 space-y-3 shadow-inner relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <Terminal className="w-3.5 h-3.5 text-gold-primary" />
                        <span>Live Operations Stream</span>
                      </div>
                      <span className="text-[8px] text-zinc-655">BULLMQ LOGS</span>
                    </div>
                    <div className="space-y-2 min-h-[92px] flex flex-col justify-end">
                      {liveEvents.map((evt, idx) => {
                        const distance = (idx - liveEventIndex + liveEvents.length) % liveEvents.length;
                        const isVisible = distance < 3; // Show most recent 3 items
                        if (!isVisible) return null;
                        
                        const isLatest = idx === liveEventIndex;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: isLatest ? 1 : 0.45, x: 0 }}
                            transition={{ duration: 0.35 }}
                            className={`flex items-start gap-1.5 ${isLatest ? 'text-gold-primary' : 'text-zinc-400'}`}
                          >
                            <span className="text-zinc-600 shrink-0 select-none">[{evt.time}]</span>
                            <span className="font-medium break-all">{evt.text}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
  
                  {/* Widget 2: Dual Column Compliance Shield */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Annual Renewals Chart */}
                    <div className="p-4 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-[#1a1a1c]/40 rounded-2xl relative overflow-hidden space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-gold-primary" />
                          <span>Renewals Growth</span>
                        </span>
                        <span className="text-[10px] text-gold-primary font-bold bg-gold-primary/10 px-1.5 py-0.5 rounded border border-gold-primary/20">
                          98.4% RATE
                        </span>
                      </div>
                      
                      {/* Premium Mini Chart */}
                      <div className="h-14 w-full flex items-end pt-1 relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
                          <path 
                            d="M 0,22 Q 10,21 20,15 T 40,18 T 60,11 T 80,6 T 100,2" 
                            fill="none" 
                            stroke="#e3c37e" 
                            strokeWidth="2" 
                          />
                          <path 
                            d="M 0,22 Q 10,21 20,15 T 40,18 T 60,11 T 80,6 T 100,2 L 100,24 L 0,24 Z" 
                            fill="url(#chartGradientHero)"
                            className="opacity-10 dark:opacity-20"
                          />
                          <circle cx="80" cy="6" r="2" fill="#e3c37e" className="animate-ping" />
                          <circle cx="80" cy="6" r="1.5" fill="#e3c37e" />
                          <defs>
                            <linearGradient id="chartGradientHero" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e3c37e" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#e3c37e" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-semibold uppercase">
                        <span>Active: {driversCount}</span>
                        <span>Files: {docsCount.toLocaleString()}</span>
                      </div>
                    </div>
  
                    {/* Compliance progress */}
                    <div className="p-4 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-[#1a1a1c]/40 rounded-2xl flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Compliance Shield</span>
                        </span>
                        <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          92% SAFE
                        </span>
                      </div>
  
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                          <span>Timeline Checklist</span>
                          <span>3/4 Done</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }} />
                        </div>
                      </div>
  
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal font-semibold">TLC renewal requirements fully mapped. Expiration alerts set.</p>
                    </div>
  
                  </div>
  
                  {/* Widget 3: Live Telephony Call Tracker */}
                  <div className="flex justify-between items-center bg-slate-50/50 dark:bg-[#1a1a1c]/30 border border-slate-100 dark:border-zinc-900/50 p-4 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gold-primary/10 border border-gold-primary/25 flex items-center justify-center text-gold-primary animate-pulse">
                        <PhoneCall className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Voice AI Call Routing</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Outbound callback scheduling automation.</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-[10px] font-extrabold text-gold-primary bg-gold-primary/10 border border-gold-primary/20 uppercase tracking-wider font-mono">
                      qualified leads
                    </span>
                  </div>
  
                </div>
              </AntigravityItem>
            </motion.div>
            
          </div>
        </div>
      </section>
  
      {/* Trusted By / Metrics */}
      <section className="py-12 bg-slate-50 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-1">
              <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">
                {driversCount.toLocaleString()}+
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">NYC Drivers Protected</p>
            </div>
 
            <div className="space-y-1">
              <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">
                {docsCount.toLocaleString()}+
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Documents Extracted</p>
            </div>
 
            <div className="space-y-1">
              <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">
                98.4%
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Renewals Verified</p>
            </div>
 
            <div className="space-y-1">
              <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A] dark:text-slate-100">
                &lt; 5m
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Outbound Callback Response</p>
            </div>
  
          </div>
        </div>
      </section>
  
      {/* Features Section */}
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
              TLC Compliance & Support SaaS
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              We package automated compliance checklists, structured OCR uploads, and outbound callback routing to keep you active.
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
                  whileHover={{ y: -6, scale: 1.025 }}
                  className="group h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg dark:hover:shadow-black/25 hover:border-[#F5C400]/40 dark:hover:border-[#F5C400]/30 transition-shadow transition-colors duration-300 cursor-pointer"
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
  
      {/* Services Section */}
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
              Complete Driver Workflow Coverage
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium">
              Find guides, dispute parking summonses, and track drug testing locations.
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
                  whileHover={{ y: -6, scale: 1.025 }}
                  className="group bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 p-6 rounded-2xl hover:shadow-lg dark:hover:shadow-black/25 hover:border-[#F5C400]/40 dark:hover:border-[#F5C400]/30 transition-shadow transition-colors duration-300 cursor-pointer"
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
  
      {/* How It Works */}
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
                whileHover={{ y: -5, scale: 1.03 }}
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
  
      {/* AI Showcase */}
      <section id="ai-showcase" className="py-20 lg:py-28 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-b border-[#E5E5E5] dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#F5C400]/3 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text description */}
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
 
            {/* AI Mockup Box */}
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
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI Co-pilot Daemon Online</span>
                </div>
 
                <div className="h-64 overflow-y-auto space-y-3 p-2 bg-[#F5F5F5]/50 dark:bg-zinc-950/50 rounded-xl border border-slate-100/50 dark:border-zinc-800/50">
                  {chatMessages.map((msg, idx) => {
                    const isAI = msg.sender === 'ai';
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2.5 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse'}`}
                      >
                        <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          isAI ? 'bg-[#F5C400]/20 text-[#D9A300]' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isAI ? 'AI' : 'D'}
                        </div>
                        <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                          isAI 
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
  
      {/* Pricing Section */}
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
 
            {/* Toggle periods */}
            <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-zinc-800 p-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 mt-6">
              <button 
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  billingPeriod === 'monthly' ? 'bg-[#F5C400] shadow text-[#0B0B0B]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0B0B0B] dark:hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'yearly' ? 'bg-[#F5C400] shadow text-[#0B0B0B]' : 'text-slate-500 dark:text-slate-400 hover:text-[#0B0B0B] dark:hover:text-white'
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
                whileHover={{ y: -8, scale: 1.03 }}
                className={`group bg-white dark:bg-zinc-900 border rounded-2xl p-8 flex flex-col justify-between relative transition-all duration-300 cursor-pointer ${
                  plan.popular 
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
                      className={`w-full font-bold text-xs py-3 border-0 transition-colors ${
                        plan.popular
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
  
      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-b border-[#E5E5E5] dark:border-zinc-800 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          >
            <span className="text-[#D9A300] dark:text-[#F5C400] text-xs font-bold uppercase tracking-wider block">Driver Reviews</span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight text-[#111111] dark:text-white">
              Endorsed by NYC TLC Drivers
            </h2>
          </motion.div>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01 }}
                transition={{ duration: 0.5, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
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
  
      {/* FAQ Accordions */}
      <section className="py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center mb-16 space-y-4"
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

      {/* REQUEST CALLBACK FORM SECTION */}
      <section id="callback-request" className="py-20 lg:py-28 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-b border-[#E5E5E5] dark:border-zinc-800 relative transition-colors duration-300">
        <div className="absolute left-0 bottom-0 w-80 h-80 bg-gold-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
            <div className="text-center space-y-3 mb-8">
              <span className="text-gold-primary text-xs font-bold uppercase tracking-wider block">Outbound Support Dispatch</span>
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
                  className="bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black text-xs font-bold px-4 py-2 mt-2 rounded-xl"
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
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Phone number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+1 (718) 555-0199..."
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-gold-primary"
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
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Preferred Language</label>
                    <select
                      value={callbackLang}
                      onChange={(e) => setCallbackLang(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-gold-primary"
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
                    placeholder="Briefly describe what you need assistance with (e.g. DMV summons dispute, defensive driving certificate issue, etc.)..."
                    value={callbackNotes}
                    onChange={(e) => setCallbackNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-3 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submittingCallback}
                  className="bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider w-full shadow-lg shadow-gold-primary/10 hover:shadow-gold-primary/20 transition-all duration-300 cursor-pointer"
                >
                  {submittingCallback ? 'Scheduling outbound dispatch...' : 'Submit Callback Request'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
  
      {/* Final CTA Banner */}
      <section className="py-20 lg:py-28 bg-[#141414] text-white relative border-t border-zinc-800 overflow-hidden text-center transition-colors duration-300">
        {/* Background visual accents */}
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-[#F5C400]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-[#D9A300]/5 rounded-full blur-[120px] pointer-events-none" />
  
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 relative space-y-8"
        >
          <h2 className="font-heading font-extrabold text-4xl sm:text-5xl tracking-tight text-white leading-tight">
            Ready to Protect Your TLC Profile?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            Launch your compliance dashboard. Upload licenses, access AI copilot, receive SMS reminders, and dispute summonses in real time.
          </p>
  
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="w-full sm:w-auto bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] font-bold border-0 px-8 py-3.5 rounded-xl shadow-md shadow-gold-glow">Get Started Now</Button>
            </Link>
            <a href="#callback-request">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-3.5 rounded-xl">
                Request Callback
              </Button>
            </a>
          </div>
        </motion.div>
      </section>
  
      <Footer />

      {/* STICKY BOTTOM NAVIGATION BAR FOR GUEST VISITORS */}
      <AnimatePresence>
        {showStickyNav && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-4 left-4 right-4 z-40 bg-white/85 dark:bg-[#141414]/85 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4 max-w-lg mx-auto shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gold-primary animate-ping" />
              <span className="text-[10px] sm:text-xs font-bold text-foreground">Need Consultation?</span>
            </div>
            
            <div className="flex gap-2">
              <a href="#callback-request" className="shrink-0">
                <Button size="sm" variant="outline" className="border-border text-xs font-bold px-3 py-1.5 rounded-xl">
                  Callback
                </Button>
              </a>
              <Link href="/auth/login" className="shrink-0">
                <Button size="sm" className="bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] text-xs font-bold px-4 py-1.5 rounded-xl">
                  Book Slot
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
