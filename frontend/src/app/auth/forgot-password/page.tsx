'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await forgotPassword(email);
      if (token) {
        setResetToken(token);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Forgot your password?</CardTitle>
            <CardDescription className="text-xs">
              Enter your email address and we will generate a password reset verification link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Email address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 mt-4 font-bold"
                disabled={loading}
              >
                {loading ? 'Sending Code...' : 'Send Reset Link'}
              </Button>
            </form>

            {/* Test Helper Reset Token Display */}
            {resetToken && (
              <div className="mt-4 p-3 bg-[#F5C400]/10 border border-[#F5C400]/25 rounded-xl flex items-start gap-2.5 text-xs text-[#D9A300] dark:text-[#F5C400] font-medium leading-relaxed">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Test Reset Token Generated:</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Use this token on the Reset Password page.
                  </p>
                  <code className="bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-[#F5C400]/25 block text-center font-bold text-xs select-all mt-1.5">
                    {resetToken}
                  </code>
                  <Link 
                    href={`/auth/reset-password?token=${resetToken}`}
                    className="block text-center font-bold underline text-[11px] mt-2 text-[#D9A300] dark:text-[#F5C400] hover:text-[#F5C400]"
                  >
                    Go directly to Reset Password screen →
                  </Link>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-[#D9A300] dark:text-[#F5C400] hover:underline font-bold">
                Log in
              </Link>
            </p>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
