'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Award, ShieldCheck, Heart } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function AboutPage() {
  const stats = [
    { label: 'NYC Drivers Active', value: '12,800+' },
    { label: 'Compliance Audits Seeded', value: '48k+' },
    { label: 'DMV Points Saved', value: '99.8%' },
    { label: 'AI Responses / Day', value: '15,000+' }
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Platform Inception',
      description: 'Launched the first version of the JNI Solutions compliance calendar specifically for NYC TLC drivers.'
    },
    {
      year: '2025',
      title: 'AI OCR Document Scanning',
      description: 'Integrated neural OCR text extraction to let drivers upload images of cards and pull expiration dates instantly.'
    },
    {
      year: '2026',
      title: 'JFK/LGA Wave Radars',
      description: 'Released the airport flight wave surge forecast engine, matching arrival counts to optimized driver scheduling.'
    }
  ];

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
              <span>Built by New Yorkers, for New Yorkers</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#111111] dark:text-white leading-tight"
            >
              Keeping NYC Mobile & <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-2 text-[#0B0B0B] dark:text-[#F5C400]">Drivers Protected</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#F5C400]/80 dark:bg-[#F5C400]/20 -rotate-1 z-0 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed"
            >
              JNI Solutions is an NYC-based mobility tech company. We build proactive regulatory assistance modules and optimization algorithms that keep ride-share, taxi, and commercial drivers compliant, active, and profitable.
            </motion.p>
          </div>
        </section>

        {/* Corporate Mission */}
        <section className="py-20 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="font-heading font-extrabold text-3xl text-[#0B0B0B] dark:text-white">The Driver Uptime Mission</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  NYC TLC regulations are some of the most rigorous in the world. Between bi-annual Woodside safety inspections, annual drug testing, license points audits, and commercial insurance compliance, drivers spend days dealing with administrative burden.
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  We believe technology should work for drivers, not against them. By utilizing intelligent AI OCR document parsing, multi-channel reminder feeds, and predictive JFK/LGA terminal flight wave radars, we turn regulatory headaches into automated backend routines.
                </p>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-2 gap-4 bg-slate-100/50 dark:bg-zinc-900/40 p-8 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-5 rounded-xl text-center space-y-1">
                    <strong className="text-2xl font-heading font-extrabold text-[#0B0B0B] dark:text-white block">{stat.value}</strong>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">{stat.label}</span>
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
              <h2 className="font-heading font-extrabold text-3xl text-[#0B0B0B] dark:text-white">Our Journey</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold">How we grew to support thousands of professional taxi and FHV operators.</p>
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
                  <h3 className="font-heading font-extrabold text-xl text-[#0B0B0B] dark:text-white">Queens Operations Hub</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                    JNI Solutions Inc. <br />
                    120 Woodside Ave, Queens, NY 11377
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Situated just minutes away from the official TLC Woodside safety inspection depot, our Queens workspace provides in-person walk-in compliance guidance and support services.
                </p>
              </div>

              <div className="space-y-6">
                <div className="w-10 h-10 rounded-lg bg-[#F5C400]/10 border border-[#F5C400]/20 text-[#D9A300] dark:text-[#F5C400] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-[#0B0B0B] dark:text-white">NYC Mobility Partner</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  We collaborate closely with fleet dispatchers, driver safety networks, and defensive driving schools in New York City. This integration keeps our notification engine updated with real-time feedback loops.
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
