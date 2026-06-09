'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, Home } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="flex-1 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800 text-center overflow-hidden">
          <div className="h-2 bg-[#F5C400]" />
          
          <CardContent className="pt-8 pb-8 px-6 space-y-6">
            <div className="mx-auto w-16 h-16 bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] dark:text-[#F5C400] rounded-2xl flex items-center justify-center animate-pulse">
              <Compass className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-[#0F172A] dark:text-white font-heading tracking-tight">404</h1>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-slate-100 font-heading">Page Not Found</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed font-semibold">
                The URL may be typed incorrectly, or the page you are looking for has been moved or archived.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/" passHref className="inline-block w-full">
                <Button className="w-full py-3 flex items-center justify-center space-x-2 text-xs font-bold text-[#0B0B0B]">
                  <Home className="w-4 h-4" />
                  <span>Return to Homepage</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
