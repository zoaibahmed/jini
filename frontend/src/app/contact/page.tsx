'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, PhoneCall, Mail, MapPin, CheckCircle, HelpCircle } from 'lucide-react';
import { API_URL } from '@/config';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Compliance Inquiry',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/copilot/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Inquiry submission failed');
      }
      setFormSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Connection lost. Please retry.');
    } finally {
      setLoading(false);
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactFaq = [
    {
      q: 'How quickly will JNI support review my summons?',
      a: 'Summonses uploaded to JNI Solutions are scanned by our AI instantly. If you require legal assistance routing or custom dispute templates, our driver support desk typically completes the review and exports documentation within 2 to 4 hours.'
    },
    {
      q: 'Can I drop in to the Queens Office without booking?',
      a: 'Yes, our operations hub at 120 Woodside Ave, Queens, welcomes walk-in drivers. We are open Monday through Friday, 9:00 AM to 5:00 PM, to help you resolve active suspensions and inspect vehicles before DMV checks.'
    },
    {
      q: 'Is my document data encrypted and safe?',
      a: 'Absolutely. We use bank-grade AES-256 encryption keys to store driver license PDFs and insurance card scans. Your files are accessible only to you and verified JNI audit tools.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-[#F5C400]/25 selection:text-[#0B0B0B] transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        {/* Banner Hero */}
        <section className="relative py-20 bg-[radial-gradient(#f5c400_1px,transparent_1px)] [background-size:32px_32px] bg-opacity-[0.03] dark:bg-opacity-[0.015] border-b border-slate-100 dark:border-zinc-800 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5C400]/5 to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#111111] dark:text-white leading-tight"
            >
              Get In Touch With <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 px-2 text-[#0B0B0B] dark:text-[#F5C400]">Driver Support</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#F5C400]/80 dark:bg-[#F5C400]/20 -rotate-1 z-0 rounded-sm" />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium"
            >
              Have questions about DMV points mitigation, TLC safety screenings, or subscription setup? Contact our Queens operations team.
            </motion.p>
          </div>
        </section>

        {/* Content Panel */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Form Block (L) */}
              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm transition-colors duration-300">
                  {formSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-heading font-extrabold text-[#0B0B0B] dark:text-white">Message Transmitted Successfully</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold max-w-md mx-auto">
                        Thank you for contacting JNI Solutions. A driver support representative will review your message and reply via email or phone within 2 hours.
                      </p>
                      <Button
                        onClick={() => setFormSubmitted(false)}
                        className="bg-[#0B0B0B] text-white hover:bg-[#F5C400] hover:text-[#0B0B0B] border-0 mt-6 font-bold text-xs"
                      >
                        Submit another request
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <h3 className="font-heading font-extrabold text-xl text-[#0B0B0B] dark:text-white mb-2">Submit Support Case</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block" htmlFor="name">Full Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none transition-all text-[#111111] dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block" htmlFor="email">Email Address</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="driver@example.com"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none transition-all text-[#111111] dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block" htmlFor="phone">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 (718) 555-0199"
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none transition-all text-[#111111] dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block" htmlFor="subject">Request Type</label>
                          <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none transition-all text-[#111111] dark:text-white appearance-none"
                          >
                            <option>General Compliance Inquiry</option>
                            <option>TLC Woodside Booking Dispute</option>
                            <option>Drug Screening Timeline Audit</option>
                            <option>Account Billing / Subscription</option>
                            <option>Technical Platform bug</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-350 block" htmlFor="message">Message</label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Please provide details about your TLC ticket, vehicle vin, plate status, or DMV inquiry..."
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-[#F5C400] focus:ring-1 focus:ring-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none transition-all text-[#111111] dark:text-white resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] font-bold text-xs py-3.5 border-0 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* Sidebar Info (R) */}
              <div className="lg:col-span-5 space-y-8">
                
                {/* Visual Location block */}
                <div className="bg-[#0B0B0B] text-white p-8 rounded-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C400]/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <h3 className="font-heading font-extrabold text-xl">Direct Coordinates</h3>
                  
                  <div className="space-y-4 font-semibold text-xs text-slate-300">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-[#F5C400] shrink-0" />
                      <div>
                        <strong className="text-white block font-bold text-sm">Queens Office Hub</strong>
                        <span className="text-[11px] block mt-1 leading-relaxed">120 Woodside Ave, Queens, NY 11377</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <PhoneCall className="w-5 h-5 text-[#F5C400] shrink-0" />
                      <div>
                        <strong className="text-white block font-bold text-sm">Phone Line Support</strong>
                        <span className="text-[11px] block mt-1">+1 (718) 555-0199</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-[#F5C400] shrink-0" />
                      <div>
                        <strong className="text-white block font-bold text-sm">Email Mailbox</strong>
                        <span className="text-[11px] block mt-1 hover:text-[#F5C400] transition-colors">support@jnisolutions.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Styled CSS Map Container */}
                  <div className="border border-[#222222] rounded-xl overflow-hidden relative h-40 bg-[#161616] flex items-center justify-center">
                    {/* Visual Vector Grid resembling Woodside Queens */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(245,196,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,196,0,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                    
                    {/* Simulated Map Streets */}
                    <div className="absolute w-[2px] h-full bg-[#333333] left-1/3 rotate-12" />
                    <div className="absolute w-[2px] h-full bg-[#333333] left-2/3 -rotate-12" />
                    <div className="absolute w-full h-[2px] bg-[#333333] top-1/2" />
                    <div className="absolute w-full h-[2px] bg-[#333333] top-1/4 -rotate-3" />
                    
                    {/* Woodside TLC Marker */}
                    <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-ping absolute" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white relative" />
                      <span className="text-[7px] text-slate-400 font-bold bg-[#0B0B0B] border border-[#333333] px-1 py-0.5 rounded mt-1">Woodside TLC Depot</span>
                    </div>

                    {/* JNI Solutions Marker */}
                    <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <span className="w-4 h-4 rounded-full bg-[#F5C400]/40 animate-ping absolute" />
                      <span className="w-3 h-3 rounded-full bg-[#F5C400] border border-white relative z-10" />
                      <span className="text-[8px] text-[#0B0B0B] font-extrabold bg-[#F5C400] px-1.5 py-0.5 rounded mt-1 shadow-md">JNI Office Hub</span>
                    </div>
                  </div>
                </div>

                {/* Dispute FAQ list */}
                <div className="space-y-4">
                  <h4 className="font-heading font-extrabold text-base text-[#0B0B0B] dark:text-white flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#D9A300]" />
                    <span>Frequently Asked Questions</span>
                  </h4>
                  <div className="divide-y divide-slate-200 dark:divide-zinc-800">
                    {contactFaq.map((faq, idx) => (
                      <div key={idx} className="py-3 space-y-1.5">
                        <strong className="block text-xs font-bold text-[#0B0B0B] dark:text-white">{faq.q}</strong>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
