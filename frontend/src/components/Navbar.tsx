'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, ChevronDown, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/app/theme-provider';
import { useLanguage, Language } from '@/app/language-provider';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const languages: { name: Language; flag: string; local: string }[] = [
    { name: 'English', flag: '🇺🇸', local: 'English' },
    { name: 'Spanish', flag: '🇪🇸', local: 'Español' },
    { name: 'Urdu', flag: '🇵🇰', local: 'اردو' },
    { name: 'Bengali', flag: '🇧🇩', local: 'বাংলা' },
    { name: 'French', flag: '🇫🇷', local: 'Français' },
    { name: 'Mandarin', flag: '🇨🇳', local: '中文' },
  ];

  const currentLang = languages.find(l => l.name === language) || languages[0];

  // Close mobile menu on route change & track scroll depth
  useEffect(() => {
    setMobileMenuOpen(false);

    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 shadow-md' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo container (blends with navbar background color) */}
        <Link href="/" className="flex items-center group">
          <Logo size="md" variant="auto" />
        </Link>
 
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`relative py-1 transition-colors ${
                  isActive ? 'text-[#F5C400]' : 'text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400]'
                } group`}
              >
                <span>{link.name}</span>
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#F5C400] transition-all duration-300 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            );
          })}
        </nav>
 
        {/* CTA Buttons & Theme Toggler */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400] hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all duration-205 cursor-pointer"
              aria-label="Select Language"
            >
              <Globe className="w-4 h-4" />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-20 text-slate-800 dark:text-white"
                  >
                    {languages.map((lang) => (
                      <button
                        type="button"
                        key={lang.name}
                        onClick={() => {
                          setLanguage(lang.name);
                          setLangDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer ${
                          language === lang.name ? 'text-[#F5C400] font-bold' : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        {language === lang.name && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400] hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <Link href="/auth/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400] transition-colors">
            Login
          </Link>
          <Link href="/auth/login">
            <Button size="sm" className="bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] border-0 font-bold">
              Get Started
            </Button>
          </Link>
        </div>
 
        {/* Mobile menu trigger */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* Mobile Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center space-x-1 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400] transition-all duration-200 cursor-pointer"
              aria-label="Select Language"
            >
              <Globe className="w-4 h-4" />
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-20 text-slate-800 dark:text-white"
                  >
                    {languages.map((lang) => (
                      <button
                        type="button"
                        key={lang.name}
                        onClick={() => {
                          setLanguage(lang.name);
                          setLangDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer ${
                          language === lang.name ? 'text-[#F5C400] font-bold' : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        {language === lang.name && <Check className="w-3 h-3 stroke-[2.5]" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400] transition-all duration-200 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:text-[#F5C400] dark:hover:text-[#F5C400] hover:bg-slate-100 dark:hover:bg-zinc-800/50"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
 
      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-zinc-800 px-4 pt-2 pb-6 space-y-3 overflow-hidden"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`block px-3 py-2 rounded-xl text-base font-semibold transition-all ${
                    isActive ? 'bg-[#F5C400]/15 text-[#F5C400]' : 'hover:bg-slate-100 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-4 flex flex-col gap-2">
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800">
                  Login
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] font-bold">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
