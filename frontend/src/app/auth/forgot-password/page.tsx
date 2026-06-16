'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck, Mail, KeyRound, Info } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'EMAIL' | 'CODE' | 'RESET'>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [correctToken, setCorrectToken] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const token = await forgotPassword(email);
      if (token) {
        setCorrectToken(token);
      }
      setStep('CODE');
      toast.success('A reset code has been dispatched to your email.');
    } catch (err) {
      // Error is handled in hook toast
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (code.trim() === correctToken) {
      setStep('RESET');
      toast.success('Identity verified. Please set your new password.');
    } else {
      toast.error('Invalid verification code. Please check your email inbox.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

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
      await resetPassword({ token: code, password, confirmPassword });
      // Redirect is handled inside the resetPassword hook
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      
      {/* Back to landing */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-[#D9A300] dark:hover:text-[#F5C400] transition-colors">
          <span>← Back to landing</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            {step === 'EMAIL' && (
              <>
                <CardTitle className="text-xl">Forgot your password?</CardTitle>
                <CardDescription className="text-xs">
                  Enter your email address and we will generate a password reset verification link.
                </CardDescription>
              </>
            )}
            {step === 'CODE' && (
              <>
                <div className="mx-auto w-12 h-12 bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] dark:text-[#F5C400] rounded-2xl flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Enter Verification Code</CardTitle>
                <CardDescription className="text-xs">
                  We have dispatched a reset code to <span className="font-bold text-foreground">{email}</span>. Please enter it below.
                </CardDescription>
              </>
            )}
            {step === 'RESET' && (
              <>
                <div className="mx-auto w-12 h-12 bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] dark:text-[#F5C400] rounded-2xl flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Reset Password</CardTitle>
                <CardDescription className="text-xs">
                  Your identity has been verified. Create a new secure password for your JNI profile.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            
            {step === 'EMAIL' && (
              <form onSubmit={handleSendCode} className="space-y-4">
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
            )}

            {step === 'CODE' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Verification Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Paste/Type the code here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium text-center font-mono tracking-widest text-lg"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-3 mt-4 font-bold"
                  disabled={loading}
                >
                  Verify Code
                </Button>
                
                <button
                  type="button"
                  onClick={() => setStep('EMAIL')}
                  className="w-full text-center text-xs font-bold text-slate-400 hover:text-foreground mt-2 block"
                >
                  ← Go Back
                </button>
              </form>
            )}

            {step === 'RESET' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
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
