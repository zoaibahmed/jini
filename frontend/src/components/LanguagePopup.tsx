import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';

interface LanguagePopupProps {
  onLanguageSelect: (lang: string) => void;
}

export function LanguagePopup({ onLanguageSelect }: LanguagePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('English');

  const languages = [
    { name: 'English', flag: '🇺🇸', local: 'English' },
    { name: 'Spanish', flag: '🇪🇸', local: 'Español' },
    { name: 'Urdu', flag: '🇵🇰', local: 'اردو' },
    { name: 'Bengali', flag: '🇧🇩', local: 'বাংলা' },
    { name: 'French', flag: '🇫🇷', local: 'Français' },
    { name: 'Mandarin', flag: '🇨🇳', local: '中文' },
  ];

  useEffect(() => {
    // Check if user already has a saved language preference
    const savedLang = localStorage.getItem('jni_lang');
    if (!savedLang) {
      setIsOpen(true);
    } else {
      onLanguageSelect(savedLang);
    }
  }, [onLanguageSelect]);

  const handleSelect = (lang: string) => {
    setSelected(lang);
    localStorage.setItem('jni_lang', lang);
    onLanguageSelect(lang);
    
    // Close with a slight delay for better UX feel
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glass Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Premium Card container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-2xl text-white z-10"
          >
            {/* Ambient gold glow */}
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#F5C400]/15 blur-3xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="text-center space-y-3 mb-6 relative">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center text-[#F5C400] mb-2 animate-bounce">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight font-heading">Choose your language</h2>
              <p className="text-xs text-zinc-400">Select your preferred language to proceed with compliance onboarding</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {languages.map((lang) => {
                const isSelected = selected === lang.name;
                return (
                  <button
                    key={lang.name}
                    onClick={() => handleSelect(lang.name)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-[#F5C400] bg-[#F5C400]/10 text-white font-bold'
                        : 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{lang.flag}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{lang.name}</span>
                        <span className="text-[10px] text-zinc-500">{lang.local}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#F5C400] flex items-center justify-center text-black">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="text-center">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Saved to this device</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
