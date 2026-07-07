'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Lock, 
  Bell, 
  Languages, 
  ShieldCheck, 
  Sun, 
  Moon,
  Save,
  Key,
  Fingerprint,
  Phone,
  Smartphone,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '../../theme-provider';
import { useAuth } from '@/hooks/useAuth';
import { CountryPhoneInput } from '@/components/CountryPhoneInput';
import { API_URL } from '@/config';

export default function SettingsMenu() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user, sendOtp, verifyOtp, registerPasskey, loginWithPasskey, updateUserPhone } = useAuth();

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'Alex Mercer',
    email: user?.email || 'alex.mercer@jnisolutions.com',
    phone: user?.phone || '+1 (718) 555-0199',
    language: 'English'
  });

  // Sync profileForm if user context updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        language: 'English'
      });
    }
  }, [user]);

  // Phone number change flow state
  const [showPhoneFlow, setShowPhoneFlow] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'current' | 'new'>('current');
  const [currentPhoneInput, setCurrentPhoneInput] = useState('');
  const [currentOtp, setCurrentOtp] = useState('');
  const [currentVerified, setCurrentVerified] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [newOtp, setNewOtp] = useState('');
  
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [otpSentDemo, setOtpSentDemo] = useState<string | null>(null);

  // Biometrics flow state
  const [hasPasskey, setHasPasskey] = useState(false);
  const [checkingPasskey, setCheckingPasskey] = useState(true);
  const [biometricFlow, setBiometricFlow] = useState<'idle' | 'otpVerify' | 'biometricVerify' | 'registerNew' | 'success'>('idle');
  const [biometricOtp, setBiometricOtp] = useState('');

  // Fetch biometric status on mount / user change
  useEffect(() => {
    if (user?.id) {
      fetch(`${API_URL}/auth/webauthn/check/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setHasPasskey(data.hasPasskey);
          setCheckingPasskey(false);
        })
        .catch(err => {
          console.error('Error checking passkey:', err);
          setCheckingPasskey(false);
        });
    }
  }, [user?.id, biometricFlow]);

  // Notification channels state
  const [channels, setChannels] = useState({
    emailRenewals: true,
    smsRenewals: true,
    pushRenewals: false,
    emailTickets: true,
    smsTickets: false,
    systemAlerts: true
  });

  // Password fields state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Your details have been saved to JNI driver profile logs.');
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password confirmation does not match.');
      return;
    }
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Your account password has been updated successfully.');
  };

  // Change phone number logic
  const handleSendCurrentPhoneOtp = async () => {
    if (!currentPhoneInput) {
      toast.error('Please enter your current phone number');
      return;
    }
    if (currentPhoneInput !== user?.phone) {
      toast.error('The number entered does not match your active JNI profile number');
      return;
    }
    setSendingCode(true);
    try {
      const res = await sendOtp(currentPhoneInput);
      if (res.codeForTesting) {
        setOtpSentDemo(res.codeForTesting);
        toast.info(`[Demo Mode] OTP: ${res.codeForTesting}`);
      } else {
        toast.success('Verification code dispatched to your current phone.');
      }
    } catch (e) {
      // Toast handled by hook
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCurrentPhoneOtp = async () => {
    if (!currentOtp) return;
    setVerifyingCode(true);
    try {
      // Verify OTP without redirecting to dashboard
      await verifyOtp(currentPhoneInput, currentOtp, undefined, undefined, true);
      setCurrentVerified(true);
      setPhoneStep('new');
      setOtpSentDemo(null);
      toast.success('Current number verified! Now enter your new phone number.');
    } catch (e) {
      // Handled by hook
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSendNewPhoneOtp = async () => {
    if (!newPhoneInput) {
      toast.error('Please enter your new phone number');
      return;
    }
    setSendingCode(true);
    try {
      const res = await sendOtp(newPhoneInput);
      if (res.codeForTesting) {
        setOtpSentDemo(res.codeForTesting);
        toast.info(`[Demo Mode] OTP: ${res.codeForTesting}`);
      } else {
        toast.success('Verification code dispatched to your new phone number.');
      }
    } catch (e) {
      // Handled by hook
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndChangePhone = async () => {
    if (!newOtp || !user?.id) return;
    setVerifyingCode(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPhone: currentPhoneInput,
          currentOtp,
          newPhone: newPhoneInput,
          newOtp
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update phone number');
      }

      const data = await res.json();
      updateUserPhone(data.phone);
      toast.success('Phone number successfully updated!');
      setShowPhoneFlow(false);
      setPhoneStep('current');
      setCurrentPhoneInput('');
      setCurrentOtp('');
      setCurrentVerified(false);
      setNewPhoneInput('');
      setNewOtp('');
      setOtpSentDemo(null);
    } catch (e: any) {
      toast.error(e.message || 'OTP verification failed');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Add / Update Passkey Biometrics Logic
  const handleStartBiometricSetup = () => {
    if (hasPasskey) {
      // Already has a passkey -> require biometric verification first
      setBiometricFlow('biometricVerify');
    } else {
      // No passkey -> verify phone OTP first
      setBiometricFlow('otpVerify');
    }
  };

  const handleSendBiometricOtp = async () => {
    if (!user?.phone) return;
    setSendingCode(true);
    try {
      const res = await sendOtp(user.phone);
      if (res.codeForTesting) {
        setOtpSentDemo(res.codeForTesting);
        toast.info(`[Demo Mode] OTP: ${res.codeForTesting}`);
      } else {
        toast.success('Verification OTP code sent to your phone.');
      }
    } catch (e) {
      // Handled
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyBiometricOtp = async () => {
    if (!biometricOtp || !user?.phone) return;
    setVerifyingCode(true);
    try {
      await verifyOtp(user.phone, biometricOtp, undefined, undefined, true);
      setBiometricFlow('registerNew');
      setOtpSentDemo(null);
      toast.success('OTP Verified! Ready to register your biometric key.');
    } catch (e) {
      // Handled
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleVerifyCurrentBiometric = async () => {
    if (!user?.phone) return;
    setVerifyingCode(true);
    try {
      await loginWithPasskey(user.phone);
      setBiometricFlow('registerNew');
      toast.success('Biometric Identity Verified! Please scan your new fingerprint now.');
    } catch (e) {
      // Handled
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleRegisterNewBiometric = async () => {
    if (!user?.id) return;
    setVerifyingCode(true);
    try {
      const nameVal = user.name || 'Driver';
      const success = await registerPasskey(user.id, nameVal);
      if (success) {
        setBiometricFlow('success');
        setHasPasskey(true);
      }
    } catch (e) {
      // Handled
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">Account Settings</h1>
        <p className="text-muted text-sm font-medium font-heading">Manage profile contact details, SMS preferences, and client preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings categories (L) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Profile details card */}
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2 mb-6">
              <User className="w-4.5 h-4.5 text-[#F5C400]" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-400 block" htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-400 block" htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-400 block">Phone Number (Active Alert Target)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      disabled
                      value={profileForm.phone}
                      className="flex-1 bg-[#F5F5F5]/60 dark:bg-[#1A1A1A]/60 border border-border text-xs font-mono p-3 rounded-xl outline-none text-zinc-400"
                    />
                    <Button 
                      type="button" 
                      onClick={() => setShowPhoneFlow(!showPhoneFlow)}
                      className="bg-[#0B0B0B] dark:bg-zinc-800 text-white hover:bg-zinc-700 text-xs py-3 px-4 rounded-xl border-0 font-bold"
                    >
                      Change Number
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-400 block" htmlFor="language">Preferred Language</label>
                  <select
                    id="language"
                    value={profileForm.language}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3 rounded-xl outline-none"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>Urdu</option>
                    <option>Bengali</option>
                    <option>French</option>
                    <option>Mandarin</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Phone Change verification flow */}
              {showPhoneFlow && (
                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-850 p-5 rounded-2xl space-y-4 transition-all">
                  <div className="flex items-center space-x-2 text-slate-800 dark:text-zinc-200">
                    <Smartphone className="w-4 h-4 text-[#F5C400]" />
                    <span className="font-extrabold text-xs">Secured Phone Modification Flow</span>
                  </div>

                  {phoneStep === 'current' ? (
                    <div className="space-y-3.5">
                      <p className="text-[10px] text-zinc-400">Step 1: Enter your current profile number to verify identity via SMS code.</p>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="Confirm current number e.g. +1..."
                          value={currentPhoneInput}
                          onChange={(e) => setCurrentPhoneInput(e.target.value)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-border p-3 rounded-xl outline-none"
                        />
                        <Button 
                          type="button" 
                          onClick={handleSendCurrentPhoneOtp}
                          disabled={sendingCode}
                          className="bg-[#F5C400] hover:bg-[#D9A300] text-black font-bold px-4 rounded-xl text-[10px]"
                        >
                          {sendingCode ? 'Sending...' : 'Send OTP'}
                        </Button>
                      </div>

                      {otpSentDemo && (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-[#F5C400]/15 border border-[#F5C400]/25 rounded text-[10px] text-[#F5C400] font-mono font-bold">
                          <span>Demo Code: {otpSentDemo}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit code..."
                          value={currentOtp}
                          onChange={(e) => setCurrentOtp(e.target.value)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-border p-3 rounded-xl outline-none text-center font-mono tracking-widest"
                        />
                        <Button 
                          type="button" 
                          onClick={handleVerifyCurrentPhoneOtp}
                          disabled={verifyingCode || !currentOtp}
                          className="bg-[#0B0B0B] text-white hover:bg-zinc-800 font-bold px-4 rounded-xl text-[10px]"
                        >
                          {verifyingCode ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <p className="text-[10px] text-zinc-400">Step 2: Verification of current number successful. Enter your new phone number.</p>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">New Phone Number</label>
                        <div className="flex gap-2 items-stretch">
                          <CountryPhoneInput 
                            value={newPhoneInput}
                            onChange={(full) => setNewPhoneInput(full)}
                            placeholder="Enter phone..."
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            onClick={handleSendNewPhoneOtp}
                            disabled={sendingCode}
                            className="bg-[#F5C400] hover:bg-[#D9A300] text-black font-bold px-4 rounded-xl text-[10px]"
                          >
                            {sendingCode ? 'Sending...' : 'Send Code'}
                          </Button>
                        </div>
                      </div>

                      {otpSentDemo && (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-[#F5C400]/15 border border-[#F5C400]/25 rounded text-[10px] text-[#F5C400] font-mono font-bold">
                          <span>Demo Code: {otpSentDemo}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter verification code..."
                          value={newOtp}
                          onChange={(e) => setNewOtp(e.target.value)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-border p-3 rounded-xl outline-none text-center font-mono tracking-widest"
                        />
                        <Button 
                          type="button" 
                          onClick={handleVerifyAndChangePhone}
                          disabled={verifyingCode || !newOtp}
                          className="bg-[#0B0B0B] text-white hover:bg-zinc-800 font-bold px-4 rounded-xl text-[10px]"
                        >
                          {verifyingCode ? 'Updating...' : 'Confirm & Update'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="bg-[#0B0B0B] hover:bg-gold-primary hover:text-black font-bold text-xs py-2 px-5 rounded-xl border-0 transition-colors cursor-pointer flex items-center gap-1.5 text-white">
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Alert Notification Channels card */}
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2 mb-6">
              <Bell className="w-4.5 h-4.5 text-[#F5C400]" />
              <span>Notification Channels</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold text-foreground">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <span className="font-bold block">TLC Compliance Expiry Alerts</span>
                  <span className="text-[10px] text-muted font-medium">Critical warning alerts sent when driver credentials expire.</span>
                </div>
                <div className="flex space-x-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={channels.emailRenewals}
                      onChange={() => setChannels(p => ({ ...p, emailRenewals: !p.emailRenewals }))}
                      className="accent-[#F5C400]"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={channels.smsRenewals}
                      onChange={() => setChannels(p => ({ ...p, smsRenewals: !p.smsRenewals }))}
                      className="accent-[#F5C400]"
                    />
                    <span>SMS</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <span className="font-bold block">Support disputes warnings</span>
                  <span className="text-[10px] text-muted font-medium">Alerts triggers when legal assistants reply to summons.</span>
                </div>
                <div className="flex space-x-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={channels.emailTickets}
                      onChange={() => setChannels(p => ({ ...p, emailTickets: !p.emailTickets }))}
                      className="accent-[#F5C400]"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={channels.smsTickets}
                      onChange={() => setChannels(p => ({ ...p, smsTickets: !p.smsTickets }))}
                      className="accent-[#F5C400]"
                    />
                    <span>SMS</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="font-bold block">JNI System and surge updates</span>
                  <span className="text-[10px] text-muted font-medium">Notifications on JFK peaks, airport waves and traffic.</span>
                </div>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={channels.systemAlerts}
                    onChange={() => setChannels(p => ({ ...p, systemAlerts: !p.systemAlerts }))}
                    className="accent-[#F5C400]"
                  />
                  <span>Enabled</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security & theme adjustments (R) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Biometrics Management Card commented out for now
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              <Fingerprint className="w-4.5 h-4.5 text-[#F5C400]" />
              <span>Biometric Security</span>
            </h3>

            {checkingPasskey ? (
              <p className="text-[10px] text-zinc-400">Loading passkey status...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-400">Device Fingerprint:</span>
                  {hasPasskey ? (
                    <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="text-amber-500 font-extrabold">Not Configured</span>
                  )}
                </div>

                {biometricFlow === 'idle' && (
                  <Button 
                    onClick={handleStartBiometricSetup}
                    className="w-full bg-[#F5C400] text-black hover:bg-[#D9A300] font-bold text-xs py-2.5 rounded-xl uppercase flex items-center justify-center gap-1.5"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{hasPasskey ? 'Update Passkey' : 'Add Fingerprint'}</span>
                  </Button>
                )}

                {biometricFlow === 'otpVerify' && (
                  <div className="space-y-3 pt-2 bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-border">
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Security step: Verify via phone OTP first to authorize biometrics setup.
                    </p>
                    <Button 
                      type="button" 
                      onClick={handleSendBiometricOtp}
                      disabled={sendingCode}
                      className="w-full bg-[#0B0B0B] text-white hover:bg-zinc-800 text-xs py-2 rounded-lg font-bold"
                    >
                      {sendingCode ? 'Sending...' : 'Send OTP to Phone'}
                    </Button>

                    {otpSentDemo && (
                      <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-[#F5C400]/15 border border-[#F5C400]/25 rounded text-[10px] text-[#F5C400] font-mono font-bold w-full justify-center">
                        <span>Demo Code: {otpSentDemo}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter code..."
                        value={biometricOtp}
                        onChange={(e) => setBiometricOtp(e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-border p-2 rounded-lg text-center font-mono tracking-widest text-xs outline-none"
                      />
                      <Button 
                        type="button" 
                        onClick={handleVerifyBiometricOtp}
                        disabled={verifyingCode || !biometricOtp}
                        className="bg-[#F5C400] hover:bg-[#D9A300] text-black font-bold px-3 rounded-lg text-xs"
                      >
                        {verifyingCode ? 'Verifying...' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                )}

                {biometricFlow === 'biometricVerify' && (
                  <div className="space-y-3 pt-2 bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-border">
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Security step: Please scan your current fingerprint to verify identity.
                    </p>
                    <Button 
                      onClick={handleVerifyCurrentBiometric}
                      disabled={verifyingCode}
                      className="w-full bg-[#0B0B0B] text-white hover:bg-zinc-800 text-xs py-2 rounded-lg font-bold flex items-center justify-center gap-1.5"
                    >
                      <Fingerprint className="w-4 h-4 text-[#F5C400]" />
                      <span>{verifyingCode ? 'Verifying...' : 'Scan Current Biometric'}</span>
                    </Button>
                  </div>
                )}

                {biometricFlow === 'registerNew' && (
                  <div className="space-y-3 pt-2 bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-border">
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Identity verified successfully. Scan your new biometric / fingerprint key to enroll.
                    </p>
                    <Button 
                      onClick={handleRegisterNewBiometric}
                      disabled={verifyingCode}
                      className="w-full bg-[#F5C400] hover:bg-[#D9A300] text-black text-xs py-2.5 rounded-lg font-bold flex items-center justify-center gap-1.5"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>{verifyingCode ? 'Registering...' : 'Scan & Register Biometric'}</span>
                    </Button>
                  </div>
                )}

                {biometricFlow === 'success' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-center space-y-2">
                    <p className="text-[10px] text-emerald-600 font-bold">Biometrics updated successfully!</p>
                    <Button 
                      onClick={() => setBiometricFlow('idle')}
                      className="bg-[#0B0B0B] text-white hover:bg-zinc-800 text-xs py-1 px-3 rounded-lg"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          */}

          {/* Theme card */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4.5 h-4.5 text-[#F5C400]" /> : <Sun className="w-4.5 h-4.5 text-[#F5C400]" />}
              <span>Theme Selector</span>
            </h3>
            
            <button 
              onClick={toggleTheme}
              className="w-full py-2.5 rounded-xl border border-border hover:bg-muted-background transition-colors text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer bg-card text-foreground"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-[#F5C400]" />
                  <span>Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#F5C400]" />
                  <span>Switch to Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Security credentials form */}
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
              <Lock className="w-4.5 h-4.5 text-[#F5C400]" />
              <span>Account Credentials</span>
            </h3>

            <form onSubmit={handlePasswordSave} className="space-y-4 text-xs font-semibold text-foreground">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-zinc-400 block" htmlFor="curr_pass">Current Password</label>
                <input
                  type="password"
                  id="curr_pass"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-zinc-400 block" htmlFor="new_pass">New Password</label>
                <input
                  type="password"
                  id="new_pass"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] p-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-zinc-400 block" htmlFor="conf_pass">Confirm Password</label>
                <input
                  type="password"
                  id="conf_pass"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] p-2.5 rounded-xl outline-none"
                />
              </div>

              <Button type="submit" className="w-full bg-[#0B0B0B] hover:bg-gold-primary hover:text-black font-bold py-2 border-0 rounded-xl transition-colors cursor-pointer text-white">
                Update Password
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
