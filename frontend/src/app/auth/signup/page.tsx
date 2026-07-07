'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Logo } from '@/components/ui/Logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CountryPhoneInput } from '@/components/CountryPhoneInput';
import { KeyRound, CheckCircle, Fingerprint, Smartphone } from 'lucide-react';

export default function SignupPage() {
  const { sendOtp, verifyOtp, registerPasskey } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'biometricPrompt' | 'success'>('phone');
  const [otpCodeSent, setOtpCodeSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userCreated, setUserCreated] = useState<any>(null);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (otpStep !== 'otp') return;
    setTimer(600);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpStep]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!agreedToTerms) {
      toast.error('You must accept the Terms and Conditions');
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendOtp(phone);
      setOtpStep('otp');
      if (res.codeForTesting) {
        setOtpCodeSent(res.codeForTesting);
        if (res.twilioError) {
          toast.error(`Twilio delivery failed (limit reached). Fallback Code: ${res.codeForTesting}`);
        } else {
          toast.info(`[Demo Mode] OTP Code: ${res.codeForTesting}`);
        }
      } else {
        toast.success('Verification code dispatched to your phone.');
      }
    } catch (err) {
      // Handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setSubmitting(true);
    try {
      const res = await sendOtp(phone);
      setTimer(600);
      if (res.codeForTesting) {
        setOtpCodeSent(res.codeForTesting);
        if (res.twilioError) {
          toast.error(`Twilio delivery failed (limit reached). Fallback Code: ${res.codeForTesting}`);
        } else {
          toast.info(`[Demo Mode] New OTP Code: ${res.codeForTesting}`);
        }
      } else {
        toast.success('A new verification code has been sent to your phone.');
      }
    } catch (err) {
      // Handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    if (timer === 0) {
      toast.error('Your verification code has expired. Please request a new one.');
      return;
    }
    setSubmitting(true);
    try {
      const nameVal = `${firstName} ${lastName}`.trim() || 'Driver';
      const res = await verifyOtp(phone, otp, nameVal, undefined, true);
      setUserCreated(res.user);

      // Bypass biometrics/passkey registration prompt for now, go straight to success
      setOtpStep('success');
      /*
      if (window.PublicKeyCredential) {
        setOtpStep('biometricPrompt');
      } else {
        setOtpStep('success');
      }
      */
    } catch (err) {
      // Handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterBiometrics = async () => {
    if (!userCreated) return;
    try {
      const success = await registerPasskey(userCreated.id, userCreated.name);
      if (success) {
        toast.success('Device biometrics successfully registered!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOtpStep('success');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-zinc-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:24px_24px] transition-colors duration-300">
      
      {/* Back to landing */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-[#F5C400] transition-colors">
          <span>← Back to landing</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        <div className="flex justify-center items-center">
          <Logo size="md" variant="auto" />
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Driver Account</CardTitle>
            <CardDescription className="text-xs">
              Onboard with your phone number instantly. No password required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {otpStep === 'phone' && (
                <motion.form 
                  key="phone-input"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">First Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Last Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-[#F5C400] transition-colors text-slate-700 dark:text-slate-200 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                    <CountryPhoneInput 
                      value={phone}
                      onChange={(full) => setPhone(full)}
                      placeholder="Enter phone..."
                    />
                  </div>

                  <label className="flex items-start space-x-2 text-xs text-zinc-400 font-semibold cursor-pointer py-1">
                    <input 
                      type="checkbox" 
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      className="rounded border-zinc-700 text-[#F5C400] focus:ring-[#F5C400] mt-0.5"
                    />
                    <span>I agree to the JNI Terms of Service and Privacy Policy</span>
                  </label>

                  <Button 
                    type="submit" 
                    disabled={submitting || !agreedToTerms}
                    className="w-full py-3 mt-4 font-bold text-xs bg-[#F5C400] hover:bg-[#D9A300] text-black rounded-xl uppercase tracking-wider"
                  >
                    {submitting ? 'Sending code...' : 'Send Verification OTP'}
                  </Button>
                </motion.form>
              )}

              {otpStep === 'otp' && (
                <motion.form 
                  key="otp-verify"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleVerifyOtp} 
                  className="space-y-4"
                >
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-xs font-bold text-[#D9A300] flex items-center justify-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>Enter Verification Code</span>
                    </h4>
                    {timer === 0 ? (
                      <p className="text-[10px] text-red-500 font-extrabold">The verification code has expired. Please click Resend Code below.</p>
                    ) : (
                      <p className="text-[10px] text-zinc-400">
                        Enter the 6-digit OTP code sent to your phone. (Expires in {formatTime(timer)})
                      </p>
                    )}
                    {otpCodeSent && (
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#F5C400]/10 border border-[#F5C400]/25 rounded text-[10px] text-[#F5C400] font-mono font-bold mt-1">
                        <span>Code: {otpCodeSent}</span>
                      </div>
                    )}
                  </div>

                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-foreground focus:outline-none focus:border-[#F5C400]"
                  />

                  <div className="text-center text-[10px] font-bold text-slate-500">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={submitting}
                      className="text-[#F5C400] hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setOtpStep('phone')}
                      className="flex-1 text-xs py-3 border-border rounded-xl font-bold"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-[2] bg-[#F5C400] hover:bg-[#D9A300] text-black font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider"
                    >
                      {submitting ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Comment out biometric prompt for now
              otpStep === 'biometricPrompt' && (
                <motion.div
                  key="biometric-enrollment"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 space-y-4"
                >
                  <Fingerprint className="w-12 h-12 text-[#F5C400] mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Secure Biometric Login</h4>
                    <p className="text-[10px] text-zinc-400 max-w-xs mx-auto mt-1">
                      Would you like to register your device's fingerprint or Face ID scanner to sign in faster next time?
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleRegisterBiometrics}
                      className="w-full bg-[#F5C400] hover:bg-[#D9A300] text-black font-bold text-xs py-3 rounded-xl"
                    >
                      Yes, Register Passkey
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setOtpStep('success')}
                      className="w-full text-zinc-400 hover:text-zinc-350 text-xs py-2"
                    >
                      Skip for now
                    </Button>
                  </div>
                </motion.div>
              )
              */}

              {otpStep === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4 space-y-4"
                >
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Welcome to JNI Solutions!</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Account successfully registered and secured.</p>
                  </div>
                  <Link href="/dashboard" className="block w-full">
                    <Button className="w-full bg-[#F5C400] hover:bg-[#D9A300] text-black font-bold text-xs py-3 rounded-xl uppercase tracking-wider">
                      Go to Dashboard
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#D9A300] hover:underline font-bold">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
