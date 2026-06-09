'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function SessionExpiredPage() {
  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-heading font-bold text-[#0F172A] dark:text-slate-100">Session Expired</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              For your security, we signed you out after a period of inactivity or because your access credentials expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              No changes to your profile, documents, or logs have been lost. Simply log in again to resume your workflow.
            </p>

            <Link href="/auth/login" passHref className="block w-full">
              <Button className="w-full py-3 flex items-center justify-center space-x-2 text-xs font-bold text-[#0B0B0B]">
                <span>Log In Again</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
