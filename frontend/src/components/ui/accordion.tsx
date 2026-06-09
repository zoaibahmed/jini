'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div 
            key={item.id}
            className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-zinc-700"
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-full px-5 py-4 flex items-center justify-between text-left font-heading font-semibold text-sm sm:text-base text-[#0F172A] dark:text-slate-100"
            >
              <span>{item.title}</span>
              <ChevronDown 
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#D9A300] dark:text-[#F5C400]' : ''}`} 
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
