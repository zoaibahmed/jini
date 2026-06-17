'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/app/theme-provider';

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer id="contact" className="bg-white dark:bg-[#141414] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-zinc-800 py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 pb-12 border-b border-slate-200 dark:border-zinc-800">
          
          {/* Branding Column */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Logo size="md" variant="auto" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm font-medium">
              Proactive compliance and AI assistant platform optimized for Uber, Lyft, taxi, and commercial drivers.
            </p>
          </div>

          {/* Quick Links 1 */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product</h5>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li><Link href="/" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Home</Link></li>
              <li><Link href="/services" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Services</Link></li>
              <li><Link href="/pricing" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Company</h5>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <li><Link href="/about" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Contact</Link></li>
              <li><Link href="/auth/login" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Driver Dashboard</Link></li>
            </ul>
          </div>

          {/* Support / Contact */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contact Support</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              Email: <a href="mailto:support@jnisolutionsllc.com" className="hover:text-gold-primary transition-colors text-gold-primary">support@jnisolutionsllc.com</a> <br />
              Office: 120 Woodside Ave, Queens, NY
            </p>
          </div>

        </div>

        {/* Disclaimer and Copyright */}
        <div className="pt-8 flex flex-col gap-4 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-400 dark:text-slate-500 font-semibold">
          <div className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500 font-medium">
            <strong>Disclaimer:</strong> JNI Solutions LLC is not a government agency, law firm, insurance carrier, DMV office, or TLC office. JNI Solutions provides driver assistance, document organization, reminders, support guidance, and referral services where applicable.
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} JNI Solutions LLC. All rights reserved. NYC TLC, Uber, Lyft are registered marks of their respective entities.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">TLC Rules</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
  );
}
