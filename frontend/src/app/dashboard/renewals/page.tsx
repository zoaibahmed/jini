'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';


interface RenewalItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: 'TLC' | 'DMV' | 'Insurance' | 'Medical';
  status: 'SAFE' | 'WARNING' | 'URGENT' | 'EXPIRED' | 'COMPLETED';
}

export default function RenewalsTracker() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [renewals, setRenewals] = useState<RenewalItem[]>([
    { id: '1', title: 'Defensive Driving Course', description: '6-hour defensive driving certificate update', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'DMV', status: 'EXPIRED' },
    { id: '2', title: 'TLC Vehicle Inspection (DMV)', description: 'Bi-annual Woodside safety inspection slot', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'DMV', status: 'WARNING' },
    { id: '3', title: 'Annual TLC Drug Screening', description: 'Yearly drug test compliance for license status', dueDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'TLC', status: 'SAFE' },
    { id: '4', title: 'Commercial Liability Insurance Renewal', description: 'Liability policy active coverage update', dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'Insurance', status: 'URGENT' },
    { id: '5', title: 'TLC Driver License Renewal', description: '3-year professional hack license expiration', dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], category: 'TLC', status: 'SAFE' }
  ]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPPORT';

  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-md mx-auto space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            This page is driver-specific for tracking license renewals and drug screenings. Admins and support agents can review all compliance logs directly in the main panel.
          </p>
        </div>
        <Link href="/dashboard" className="w-full">
          <Button className="w-full bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border-0 font-bold py-3">
            Return to Admin Panel
          </Button>
        </Link>
      </div>
    );
  }

  const getDaysLeft = (dueDate: string) => {
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (item: RenewalItem) => {
    const daysLeft = getDaysLeft(item.dueDate);
    
    if (item.status === 'COMPLETED') {
      return {
        colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        dotClass: 'bg-emerald-500',
        label: 'Completed',
        icon: CheckCircle2
      };
    }
    if (daysLeft < 0) {
      return {
        colorClass: 'text-red-500 bg-red-500/10 border-red-500/20',
        dotClass: 'bg-red-500',
        label: 'Expired',
        icon: AlertCircle
      };
    }
    if (daysLeft <= 7) {
      return {
        colorClass: 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse',
        dotClass: 'bg-red-500',
        label: 'Urgent',
        icon: AlertCircle
      };
    }
    if (daysLeft <= 30) {
      return {
        colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        dotClass: 'bg-amber-500',
        label: 'Warning',
        icon: AlertTriangle
      };
    }
    return {
      colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      dotClass: 'bg-emerald-500',
      label: 'Safe',
      icon: ShieldCheck
    };
  };

  const handleMarkCompleted = (id: string, title: string) => {
    setRenewals(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'COMPLETED' };
      }
      return item;
    }));
    toast.success(`Support notified of ${title} completion. Verification will finalize shortly.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">Compliance Renewals Tracker</h1>
        <p className="text-muted text-sm font-medium">Verify countdown states, schedule safety bookings, and keep your license active.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Renewals checklist stream (L) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider mb-6 text-foreground">Upcoming Compliance checklist</h3>
            
            <div className="space-y-4">
              {renewals.map((item) => {
                const config = getStatusConfig(item);
                const StatusIcon = config.icon;
                const daysLeft = getDaysLeft(item.dueDate);
                return (
                  <div 
                    key={item.id} 
                    className="p-5 bg-muted-background/20 border border-border hover:border-gold-primary/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Left icon box */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${config.colorClass}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{item.category} Category</span>
                        <h4 className="font-heading font-extrabold text-sm text-foreground">{item.title}</h4>
                        <p className="text-xs text-slate-500 font-semibold">{item.description}</p>
                      </div>
                    </div>

                    {/* Timeline and Trigger */}
                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto border-t sm:border-0 border-border pt-3 sm:pt-0">
                      <div className="text-xs">
                        <span className="text-muted">Due Date: </span>
                        <strong className="text-foreground font-bold">{item.dueDate}</strong>
                      </div>
                      
                      {item.status !== 'COMPLETED' && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="text-[10px] text-muted font-bold uppercase">
                            {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
                          </span>
                          <button
                            onClick={() => handleMarkCompleted(item.id, item.title)}
                            className="px-3 py-1 rounded bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black text-[10px] font-bold uppercase border-0 transition-colors cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Support guidelines and Bookings info (R) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Woodside schedule support */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-5">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">Woodside DMV Inspection</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              NYC TLC requires all active commercial vehicles to pass physical safety checks twice a year. Late checks carry automatic $200 fines.
            </p>
            <div className="bg-[#F5F5F5] dark:bg-[#161616] p-4 rounded-xl border border-border space-y-2 text-xs">
              <span className="font-bold block text-gold-primary">📍 Woodside Inspection Depot</span>
              <span className="text-[11px] font-semibold text-slate-550 block">120 Woodside Ave, Queens, NY</span>
            </div>
            
            <a 
              href="https://www.nyc.gov/site/tlc/index.page" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full block"
            >
              <Button className="w-full bg-gold-primary text-black hover:bg-gold-hover border-0 text-xs font-bold py-3 flex items-center justify-center gap-1">
                <span>Book Slot on TLC Portal</span>
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Legal Point warnings */}
          <div className="bg-[#0B0B0B] text-white p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C400]/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider">DMV Points Auditing</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Accumulating more than 6 points on your NY driver license leads to automatic TLC suspension. Verify your defensive driving renewal state.
            </p>
            <div className="border-t border-[#222222] pt-3 flex justify-between items-center text-xs">
              <span>Your active points: </span>
              <strong className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">0 Points</strong>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
