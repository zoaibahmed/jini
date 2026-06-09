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

export default function ServicesPage() {
  const services = [
    {
      title: 'TLC Compliance Support',
      description: 'Never get caught off guard by city rule changes. We monitor active TLC driver rules, license standing, and renewal updates, keeping you in good standing.',
      icon: ShieldAlert,
      bullets: [
        'TLC license status monitoring',
        'Automatic drug screening reminders',
        'FHV vehicle permit verification',
        'Summon defense document templates'
      ]
    },
    {
      title: 'DMV Woodside Inspections',
      description: 'Skip the stress of booking Woodside inspection dates. Our platform coordinates slot availability and sends alerts so you secure your bi-annual checks in time.',
      icon: Scale,
      bullets: [
        'Woodside scheduling alerts',
        'Pre-inspection checklist guides',
        'DMV points audit support',
        'Inspection status tracking'
      ]
    },
    {
      title: 'AI Document Assistance',
      description: 'Stop typing vehicle details manually. Snap a photo of your TLC driver card, DMV registration, or insurance certificate, and let our AI extract expiry dates.',
      icon: FileText,
      bullets: [
        'OCR insurance extraction',
        'TLC card scanning & parsing',
        'Automatic expiration database sync',
        'Safe encrypted PDF vaults'
      ]
    },
    {
      title: 'Proactive Renewal Tracking',
      description: 'Maintain 100% active shift status. We send critical multi-channel alerts (SMS, email, and push notifications) 30, 15, and 5 days prior to expiration dates.',
      icon: Clock,
      bullets: [
        'SMS compliance alerts',
        'Push notifications on mobile',
        'Shared dispatcher dashboards',
        'Grace period calculators'
      ]
    },
    {
      title: 'AI Copilot & Surge Radar',
      description: 'Drive smarter, earn more. Our real-time AI copilot projects passenger arrival waves at JFK, LGA, and EWR terminals to help you schedule shifts.',
      icon: Sparkles,
      bullets: [
        'Flight wave hourly peaks',
        'Surge prediction maps',
        'Hands-free voice assistant',
        'Earnings optimizer logs'
      ]
    },
    {
      title: 'Citation & Summon Management',
      description: 'Fast disputes for parking summonses, clean-up tickets, and lane violations. Get immediate AI-generated recommendations for disputing unjust charges.',
      icon: Ticket,
      bullets: [
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
              Support Services Tailored <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-2 text-[#0B0B0B] dark:text-[#F5C400]">For NYC Drivers</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#F5C400]/80 dark:bg-[#F5C400]/20 -rotate-1 z-0 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
            >
              From complex TLC paperwork and Woodside inspection dates to real-time flight peak analytics, JNI Solutions gives ride-share drivers the tools to maximize uptime and stay compliant.
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

        {/* Support Banner Info Section */}
        <section className="py-16 bg-[#0B0B0B] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5C400]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl">
              Failing TLC Compliance Audits Costs Over $1,200 Annually
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed font-medium">
              City rules are constantly updated, and late renewal fees pile up. Don't risk suspension. Our active system tracks checkpoints and sends direct reminders straight to your smartphone.
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
