'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      toast.error('Reset token is required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password, confirmPassword });
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
            <div className="mx-auto w-12 h-12 bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] dark:text-[#F5C400] rounded-2xl flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription className="text-xs">
              Create a new secure password for your JNI Solutions profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Reset Verification Token</label>
                <input 
                  type="text" 
                  required
                  placeholder="Paste the reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium text-center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 mt-4 font-bold"
                disabled={loading}
              >
                {loading ? 'Changing password...' : 'Update Password'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Return to{' '}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5C400]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
