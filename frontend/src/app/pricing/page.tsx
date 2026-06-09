'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle, X, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Basic Support',
      price: billingPeriod === 'monthly' ? 0 : 0,
      period: billingPeriod === 'monthly' ? '/mo' : '/yr',
      description: 'Essential compliance tracking and document storage for owner-operators.',
      features: [
        'Shift Earnings Log',
        'Compliance Deadlines Calendar',
        'Manual Document Uploading',
        'Basic Email Support',
      ],
      notIncluded: [
        'Surge Flight Peak forecasts',
        'AI Copilot Live Chat',
        'SMS compliance warnings',
        'DMV Woodside inspection guides',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Premium Driver Pro',
      price: billingPeriod === 'monthly' ? 19 : 14,
      period: billingPeriod === 'monthly' ? '/mo' : '/mo',
      savings: billingPeriod === 'yearly' ? 'Billed annually ($168/yr)' : undefined,
      description: 'Real-time forecasting copilot and automatic document compliance tracking.',
      features: [
        'Shift Earnings Log',
        'Compliance Deadlines Calendar',
        'Automatic OCR Uploads',
        'JFK/LGA/EWR Flight Wave forecasting',
        'AI Driver Copilot Chat',
        'SMS & Push renewal notices',
        'DMV Woodside booking alerts',
        '24/7 Priority Support',
      ],
      notIncluded: [],
      cta: 'Subscribe Pro',
      popular: true,
    },
    {
      name: 'Enterprise Fleet',
      price: billingPeriod === 'monthly' ? 99 : 79,
      period: billingPeriod === 'monthly' ? '/mo' : '/mo',
      savings: billingPeriod === 'yearly' ? 'Billed annually ($948/yr)' : undefined,
      description: 'Complete centralized compliance dashboard for taxi operators and fleets.',
      features: [
        'Manage up to 10 driver licenses',
        'Fleet renewal logs & alerts',
        'Automated drug screening notifications',
        'Priority phone support lines',
        'Custom API integration access',
        'Dedicated account representative',
        'TLC point audit reports',
      ],
      notIncluded: [],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const featuresComparison = [
    { category: 'Document Support', name: 'Document Safe Storage', basic: 'Up to 5 files', premium: 'Unlimited', enterprise: 'Unlimited' },
    { category: 'Document Support', name: 'AI OCR Expiration Extraction', basic: false, premium: true, enterprise: true },
    { category: 'Compliance', name: 'SMS & Email Compliance Notices', basic: 'Email only', premium: 'SMS & Email', enterprise: 'SMS, Email & Push' },
    { category: 'Compliance', name: 'TLC Drug Screening Prompts', basic: true, premium: true, enterprise: true },
    { category: 'Compliance', name: 'DMV Points Mitigation Auditing', basic: false, premium: true, enterprise: true },
    { category: 'Optimizations', name: 'Flight Wave Surge Forecasting', basic: false, premium: true, enterprise: true },
    { category: 'Optimizations', name: 'AI Assistant Copilot Chat', basic: false, premium: 'Unlimited usage', enterprise: 'Unlimited usage' },
    { category: 'Support & Security', name: 'Support Response SLA', basic: '48 Hours', premium: '2 Hours (Priority)', enterprise: 'Instant / Hotline' },
    { category: 'Fleet Management', name: 'Multi-Driver Control Board', basic: false, premium: false, enterprise: true },
    { category: 'Fleet Management', name: 'Custom Developer APIs', basic: false, premium: false, enterprise: true },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        {/* Intro */}
        <section className="relative py-20 bg-[radial-gradient(#f5c400_1px,transparent_1px)] [background-size:32px_32px] bg-opacity-[0.03] dark:bg-opacity-[0.015] border-b border-slate-100 dark:border-zinc-800 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5C400]/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#111111] dark:text-white leading-tight"
            >
              Simple, Transparent Pricing <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-2 text-[#0B0B0B] dark:text-[#F5C400]">No Hidden Costs</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#F5C400]/80 dark:bg-[#F5C400]/20 -rotate-1 z-0 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium"
            >
              Get started with our free tier or upgrade to Premium for complete AI support, real-time surge tools, and push warning systems.
            </motion.p>

            {/* Toggle Billing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center items-center pt-4"
            >
              <div className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1 rounded-xl flex items-center space-x-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    billingPeriod === 'monthly'
                      ? 'bg-white dark:bg-zinc-800 text-[#0B0B0B] dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-[#0B0B0B] dark:hover:text-white'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    billingPeriod === 'yearly'
                      ? 'bg-white dark:bg-zinc-800 text-[#0B0B0B] dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-[#0B0B0B] dark:hover:text-white'
                  }`}
                >
                  <span>Yearly billing</span>
                  <span className="bg-[#F5C400] text-[#0B0B0B] text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    Save ~20%
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`rounded-2xl p-8 border flex flex-col justify-between relative transition-all duration-300 ${
                    plan.popular
                      ? 'border-2 border-[#F5C400] dark:border-[#F5C400] bg-white dark:bg-zinc-900 shadow-xl shadow-black/5 dark:shadow-black/20 scale-105 z-10'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 hover:border-[#F5C400]/40'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute top-0 right-8 -translate-y-1/2 bg-[#F5C400] text-[#0B0B0B] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#D9A300]">
                      Popular Option
                    </span>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg text-[#0B0B0B] dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline space-x-1 py-2">
                      <span className="text-4xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">${plan.price}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">{plan.period}</span>
                    </div>

                    {plan.savings && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 inline-block">
                        {plan.savings}
                      </p>
                    )}

                    <hr className="border-slate-200 dark:border-zinc-850" />

                    <ul className="space-y-3.5">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center text-xs font-semibold text-[#111111] dark:text-zinc-200">
                          <Check className="w-4 h-4 text-[#F5C400] mr-2.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center text-xs font-semibold text-slate-400 line-through">
                          <X className="w-4 h-4 text-slate-300 mr-2.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Link href="/auth/login" className="w-full">
                      <Button
                        className={`w-full font-bold text-xs py-3 rounded-xl border-0 transition-colors ${
                          plan.popular
                            ? 'bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300]'
                            : 'bg-[#0B0B0B] dark:bg-zinc-800 text-white hover:bg-[#F5C400] dark:hover:bg-[#F5C400] hover:text-[#0B0B0B] dark:hover:text-[#0B0B0B]'
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

        {/* Feature Comparison Matrix Table */}
        <section className="py-20 bg-[#F5F5F5]/40 dark:bg-zinc-900/10 border-t border-slate-200 dark:border-zinc-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0B0B0B] dark:text-white">Compare Plan Features</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Deep dive comparisons of feature access levels.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm transition-colors duration-300">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-[#0B0B0B] text-white">
                    <th className="p-4 font-bold">Feature Name</th>
                    <th className="p-4 font-bold text-center w-1/4">Basic</th>
                    <th className="p-4 font-bold text-center w-1/4">Premium Pro</th>
                    <th className="p-4 font-bold text-center w-1/4">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                  {featuresComparison.map((feat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                      <td className="p-4">
                        <span className="block font-bold text-[#111111] dark:text-zinc-200">{feat.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium">{feat.category}</span>
                      </td>
                      <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                        {typeof feat.basic === 'boolean' ? (
                          feat.basic ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                        ) : feat.basic}
                      </td>
                      <td className="p-4 text-center text-[#0B0B0B] dark:text-white font-bold">
                        {typeof feat.premium === 'boolean' ? (
                          feat.premium ? <Check className="w-4 h-4 text-[#D9A300] mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
                        ) : feat.premium}
                      </td>
                      <td className="p-4 text-center text-slate-700 dark:text-slate-300">
                        {typeof feat.enterprise === 'boolean' ? (
                          feat.enterprise ? <Check className="w-4 h-4 text-slate-600 dark:text-slate-400 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />
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
