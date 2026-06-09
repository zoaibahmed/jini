'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Info } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function SignupPage() {
  const { signup } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'English',
    country: 'US',
    acceptTerms: false
  });
  
  const [loading, setLoading] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validations
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (!form.acceptTerms) {
      toast.error('You must accept the Terms and Conditions');
      return;
    }

    setLoading(true);
    try {
      const token = await signup(form);
      if (token) {
        setDemoToken(token);
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
            <CardTitle className="text-xl">Create your driver account</CardTitle>
            <CardDescription className="text-xs">
              Stay compliant and optimize your earnings in one platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Min 8 characters"
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Language</label>
                  <select 
                    value={form.preferredLanguage}
                    onChange={(e) => setForm({...form, preferredLanguage: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Bangla">Bangla</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Country</label>
                  <input 
                    type="text" 
                    required
                    placeholder="US"
                    value={form.country}
                    onChange={(e) => setForm({...form, country: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={(e) => setForm({...form, acceptTerms: e.target.checked})}
                  className="rounded border-slate-200 dark:border-zinc-800 text-[#F5C400] focus:ring-[#F5C400]"
                />
                <label htmlFor="acceptTerms" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer leading-normal">
                  I accept the <a href="#" className="text-[#D9A300] dark:text-[#F5C400] hover:underline">Terms of Service</a> and <a href="#" className="text-[#D9A300] dark:text-[#F5C400] hover:underline">Privacy Policy</a>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 mt-4 font-bold"
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : 'Sign Up'}
              </Button>
            </form>

            {/* Test Helpers Display */}
            {demoToken && (
              <div className="mt-4 p-3 bg-[#F5C400]/10 border border-[#F5C400]/25 rounded-xl flex items-start gap-2.5 text-xs text-[#D9A300] dark:text-[#F5C400] font-medium leading-relaxed">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Test Verification Token Generated:</p>
                  <code className="bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-[#F5C400]/25 block text-center font-bold text-xs select-all mt-1">
                    {demoToken}
                  </code>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Copy this code to paste into the email verify screen.</p>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Already have an account?{' '}
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
