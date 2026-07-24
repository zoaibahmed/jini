'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
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
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div 
            key={item.id}
            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
              isOpen
                ? 'bg-zinc-950/20 dark:bg-zinc-950/40 border-[#F5C400]/40 shadow-xl shadow-black/5 dark:shadow-black/30'
                : 'bg-white dark:bg-zinc-900/60 border-border/30 hover:border-border/60'
            }`}
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-full px-6 py-5 flex items-center justify-between text-left font-heading font-semibold text-sm sm:text-base text-zinc-800 dark:text-zinc-100 active:scale-[0.995] transition-all"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? 'text-[#F5C400]' : 'text-zinc-400'}`} />
                <span>{item.title}</span>
              </span>
              <ChevronDown 
                className={`w-4.5 h-4.5 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#F5C400]' : ''}`} 
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-zinc-550 dark:text-zinc-405 leading-relaxed border-t border-border/20">
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

