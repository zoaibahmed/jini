'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'English' | 'Spanish' | 'Urdu' | 'Bengali' | 'French' | 'Mandarin';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');

  useEffect(() => {
    const savedLang = localStorage.getItem('jni_lang') as Language | null;
    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('jni_lang', lang);
    // Dispatch a custom event to notify other components/pages instantly
    window.dispatchEvent(new Event('jni_lang_changed'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
