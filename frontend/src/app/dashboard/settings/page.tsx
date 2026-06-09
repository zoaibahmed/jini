'use client';

import React, { useState } from 'react';
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
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '../../theme-provider';

export default function SettingsMenu() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Profile fields state
  const [profileForm, setProfileForm] = useState({
    name: 'Alex Mercer',
    email: 'alex.mercer@jnisolutions.com',
    phone: '+1 (718) 555-0199',
    language: 'English'
  });

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
              <User className="w-4.5 h-4.5 text-gold-primary" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="email">Email Address</label>
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
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="phone">Phone Number (SMS Alert Target)</label>
                  <input
                    type="tel"
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3 rounded-xl outline-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="language">Preferred Language</label>
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
              <Bell className="w-4.5 h-4.5 text-gold-primary" />
              <span>Notification Channels</span>
            </h3>

            <div className="space-y-4 text-xs font-semibold text-foreground">
              {/* Channel 1 */}
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

              {/* Channel 2 */}
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

              {/* Channel 3 */}
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
          
          {/* Theme card */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4.5 h-4.5 text-gold-primary" /> : <Sun className="w-4.5 h-4.5 text-gold-primary" />}
              <span>Theme Selector</span>
            </h3>
            
            <button 
              onClick={toggleTheme}
              className="w-full py-2.5 rounded-xl border border-border hover:bg-muted-background transition-colors text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer bg-card text-foreground"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-gold-primary" />
                  <span>Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-gold-primary" />
                  <span>Switch to Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Security credentials form */}
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-2 mb-4">
              <Lock className="w-4.5 h-4.5 text-gold-primary" />
              <span>Account Credentials</span>
            </h3>

            <form onSubmit={handlePasswordSave} className="space-y-4 text-xs font-semibold text-foreground">
              <div className="space-y-1.5">
                <label className="text-slate-700 block" htmlFor="curr_pass">Current Password</label>
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
                <label className="text-slate-700 block" htmlFor="new_pass">New Password</label>
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
                <label className="text-slate-700 block" htmlFor="conf_pass">Confirm Password</label>
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
