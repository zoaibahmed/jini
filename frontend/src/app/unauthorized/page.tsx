'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft, LifeBuoy } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-heading font-bold text-[#0F172A] dark:text-slate-100">Access Denied</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              You do not have the required permissions to access this directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              If you believe this is an error, please ensure you are logged into the correct account, or reach out to your system administrator or support agent.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard" passHref className="flex-1">
                <Button className="w-full py-2.5 flex items-center justify-center space-x-2 text-xs font-bold text-[#0B0B0B]">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              
              <Link href="/#faq" passHref className="flex-1">
                <Button variant="outline" className="w-full py-2.5 flex items-center justify-center space-x-2 text-xs font-bold border-slate-200 dark:border-zinc-800 text-slate-750 dark:text-slate-200">
                  <LifeBuoy className="w-4 h-4 text-slate-400" />
                  <span>Help Center</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
