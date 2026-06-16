'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password, rememberMe });
    } catch (err) {
      setLoading(false);
    }
  };

  const handleFillDemo = (role: 'driver' | 'support' | 'admin') => {
    setEmail(`${role}@jnisolutions.com`);
    setPassword('ZS3045987');
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
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription className="text-xs">
              AI-powered driver yield optimizations and TLC support
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

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                  <Link href="/auth/forgot-password" className="text-[10px] text-[#D9A300] dark:text-[#F5C400] hover:underline font-semibold">
                    Forgot password?
                  </Link>
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-200 dark:border-zinc-800 text-[#F5C400] focus:ring-[#F5C400]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 mt-4 font-bold"
                disabled={loading}
              >
                {loading ? 'Verifying Account...' : 'Sign In'}
              </Button>
            </form>



            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-[#D9A300] dark:text-[#F5C400] hover:underline font-bold">
                Sign up
              </Link>
            </p>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
