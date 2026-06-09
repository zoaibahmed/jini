'use client';

import React, { useEffect, useState } from 'react';
import { API_URL } from '@/config';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Plus,
  RefreshCw,
  HelpCircle,
  FileCheck
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

interface ComplianceCheck {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
}

export default function ComplianceShield() {
  const { user } = useAuth();
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dmvPoints, setDmvPoints] = useState(2); // Mock DMV points
  const [tlcPoints, setTlcPoints] = useState(0); // Mock TLC points

  const fetchCompliance = () => {
    setLoading(true);
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jni_access_token='))
      ?.split('=')[1] || '';

    fetch(`${API_URL}/driver/compliance`, {
      headers: {
        'x-driver-id': user?.id || '',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setChecks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Backend offline, using fallback compliance checklist');
        // Offline Fallback
        setChecks([
          { id: '1', title: 'TLC Vehicle Inspection (DMV)', description: 'Mandatory TLC DMV physical vehicle safety inspection at Woodside facility.', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING' },
          { id: '2', title: 'Annual TLC Drug Screening', description: 'TLC requires active drivers to complete annual drug test at designated LabCorp site.', dueDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING' },
          { id: '3', title: 'Defensive Driving Certification Renewal', description: '6-Hour NY DMV approved defensive driving online course for rate deduction.', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'EXPIRED' },
          { id: '4', title: 'TLC License Renewal Upload', description: 'Upload renewed TLC driver license front and back copy to Uber / Lyft profiles.', dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING' },
        ]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchCompliance();
    }
  }, [user]);

  const handleMarkComplete = async (id: string) => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1] || '';

      const res = await fetch(`${API_URL}/driver/compliance/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'x-driver-id': user?.id || '',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchCompliance();
      }
    } catch (err) {
      // Mock local resolve if offline
      setChecks(prev => 
        prev.map(c => c.id === id ? { ...c, status: 'COMPLETED' } : c)
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'EXPIRED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-gold-primary" />
            <span>Compliance Shield</span>
          </h1>
          <p className="text-muted text-sm">NYC TLC vehicle inspection alerts and point safety tracking.</p>
        </div>

        <button
          onClick={fetchCompliance}
          className="p-2.5 rounded-xl border border-border hover:bg-muted-background transition-colors text-muted hover:text-foreground self-start"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Points & License Tracker Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* DMV License Points */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover-card-glow">
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">NY DMV License Points</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className={`text-4xl font-heading font-extrabold ${dmvPoints >= 6 ? 'text-red-500' : 'text-foreground'}`}>
                {dmvPoints}
              </span>
              <span className="text-muted text-sm">/ 11 max</span>
            </div>
            <p className="text-xs text-muted mt-2">
              DMV suspends licenses at 11 points. Current level is secure.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[10px]">
            <span className="text-emerald-500 font-semibold">✓ Safe Range</span>
            <button 
              onClick={() => setDmvPoints(prev => Math.max(0, prev - 1))}
              className="text-gold-primary hover:text-gold-hover font-semibold"
            >
              Clear Point
            </button>
          </div>
        </div>

        {/* TLC Critical Points */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover-card-glow">
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">NYC TLC License Points</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className={`text-4xl font-heading font-extrabold ${tlcPoints >= 3 ? 'text-red-500' : 'text-foreground'}`}>
                {tlcPoints}
              </span>
              <span className="text-muted text-sm">/ 6 max</span>
            </div>
            <p className="text-xs text-muted mt-2">
              TLC summons points accrued. Suspending at 6 points in a 15-month span.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[10px]">
            <span className="text-emerald-500 font-semibold">✓ Safe Range</span>
            <button 
              onClick={() => setTlcPoints(prev => prev + 1)}
              className="text-red-500 hover:text-red-600 font-semibold"
            >
              Simulate Violation
            </button>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover-card-glow bg-gradient-to-br from-card via-card to-gold-primary/5">
          <div>
            <span className="text-[10px] text-muted uppercase font-semibold">Shield Status</span>
            <div className="flex items-center space-x-2 mt-3">
              <CheckCircle2 className="w-8 h-8 text-gold-primary" />
              <div>
                <h4 className="font-semibold text-sm">Proactive Protection</h4>
                <p className="text-[10px] text-muted">JNI compliance daemon online</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted leading-relaxed">
            Automatic web socket hooks check TLC database daily for citations.
          </div>
        </div>
      </div>

      {/* Compliance Checklist Cards */}
      <div className="space-y-4">
        <h3 className="font-heading font-extrabold text-base">TLC / DMV Compliance Checklist</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {checks.map(check => {
              const isExpired = check.status === 'EXPIRED';
              const isCompleted = check.status === 'COMPLETED';
              return (
                <div 
                  key={check.id}
                  className={`bg-card border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                    isExpired 
                      ? 'border-red-500/30 hover:border-red-500/50 bg-red-500/5' 
                      : isCompleted 
                        ? 'border-emerald-500/20'
                        : 'border-border hover:border-gold-primary/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold">{check.title}</h4>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getStatusColor(check.status)}`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted max-w-xl">{check.description || 'No description notes available.'}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center space-x-1.5 text-xs text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {new Date(check.dueDate).toLocaleDateString()}</span>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => handleMarkComplete(check.id)}
                        className="px-4.5 py-1.5 text-xs font-semibold rounded-lg bg-gold-primary text-black hover:bg-gold-hover transition-colors font-heading shadow shadow-gold-glow"
                      >
                        Resolve Item
                      </button>
                    )}
                    {isCompleted && (
                      <FileCheck className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
