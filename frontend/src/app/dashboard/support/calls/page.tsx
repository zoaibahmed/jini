'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { API_URL } from '@/config';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  MessageSquare,
  Play,
  Calendar,
  User,
  Search,
  RefreshCw,
  BarChart3,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceTranscript {
  id: string;
  speaker: 'DRIVER' | 'AI' | 'AGENT';
  text: string;
  timestamp: string;
}

interface VoiceCall {
  id: string;
  sid: string;
  caller: string;
  status: string; // "RINGING" | "ACTIVE" | "COMPLETED" | "FAILED" | "TRANSFERRED"
  durationSec: number;
  language: string;
  intent?: string;
  outcome?: string;
  ticketId?: string;
  ticket?: {
    ticketId: string;
    title: string;
  };
  transcripts: VoiceTranscript[];
  createdAt: string;
}

export default function CallCenterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Simulated Test Dial Sandbox State
  const [testSid, setTestSid] = useState(`TEST-SID-${Math.floor(1000 + Math.random() * 9000)}`);
  const [testCaller, setTestCaller] = useState('+17185550199');
  const [testSpeech, setTestSpeech] = useState('');
  const [simXml, setSimXml] = useState('');
  const [simStatus, setSimStatus] = useState('OFFLINE'); // OFFLINE, RINGING, ACTIVE, TRANSFERRED, COMPLETED

  // Voice Analytics Metrics
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    activeCalls: 0,
    completedCalls: 0,
    transferredCalls: 0,
    avgDurationSeconds: 0,
    languages: [] as Array<{ language: string; count: number }>,
    intents: [] as Array<{ intent: string; count: number }>,
  });

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };


  useEffect(() => {
    loadCallData();
  }, []);

  const loadCallData = async () => {
    setLoading(true);
    const token = getCookie('jni_access_token');
    try {
      const resCalls = await fetch(`${API_URL}/voice/calls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resCalls.ok) {
        const data = await resCalls.json();
        setCalls(data);
        if (data.length > 0 && !selectedCallId) {
          setSelectedCallId(data[0].id);
        }
      }

      const resMetrics = await fetch(`${API_URL}/voice/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data);
      }
    } catch (e) {
      toast.error('Failed to resolve Call Center logs.');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Call Actions
  const handleTestCallAction = async (action: 'start' | 'respond' | 'end') => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/voice/test-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sid: testSid,
          caller: testCaller,
          speechResult: action === 'respond' ? testSpeech : undefined,
          action,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (action === 'start') {
          setSimStatus('ACTIVE');
          setSimXml(data.xml);
          toast.success('Simulated call initiated.');
        } else if (action === 'end') {
          setSimStatus('COMPLETED');
          setTestSid(`TEST-SID-${Math.floor(1000 + Math.random() * 9000)}`);
          setTestSpeech('');
          setSimXml('');
          toast.info('Simulated call terminated.');
        } else {
          setSimXml(data.xml);
          setTestSpeech('');
          if (data.call?.status === 'TRANSFERRED') {
            setSimStatus('TRANSFERRED');
            toast.info('Call auto-escalated to agent queue.');
          }
        }
        loadCallData();
      }
    } catch (e) {
      toast.error('Telephony sandbox failed.');
    }
  };

  const selectedCall = calls.find((c) => c.id === selectedCallId);

  const filteredCalls = calls.filter((c) =>
    c.caller.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.intent && c.intent.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)] border border-border bg-card rounded-2xl overflow-hidden transition-all duration-300">
      
      {/* Analytics Dashboard Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-6 border-b border-border bg-muted-background/20 p-4 gap-4 shrink-0">
        <div className="p-3.5 border border-border bg-card rounded-xl text-center">
          <span className="text-[9px] font-bold text-muted uppercase block">Total Phone Calls</span>
          <strong className="text-lg font-heading font-extrabold text-foreground">{metrics.totalCalls}</strong>
        </div>
        <div className="p-3.5 border border-border bg-card rounded-xl text-center">
          <span className="text-[9px] font-bold text-muted uppercase block">Active Lines</span>
          <strong className="text-lg font-heading font-extrabold text-emerald-500">{metrics.activeCalls}</strong>
        </div>
        <div className="p-3.5 border border-border bg-card rounded-xl text-center">
          <span className="text-[9px] font-bold text-muted uppercase block">Transferred (Escalated)</span>
          <strong className="text-lg font-heading font-extrabold text-amber-500">{metrics.transferredCalls}</strong>
        </div>
        <div className="p-3.5 border border-border bg-card rounded-xl text-center">
          <span className="text-[9px] font-bold text-muted uppercase block">Completed Callouts</span>
          <strong className="text-lg font-heading font-extrabold text-slate-400">{metrics.completedCalls}</strong>
        </div>
        <div className="p-3.5 border border-border bg-card rounded-xl text-center col-span-2">
          <span className="text-[9px] font-bold text-muted uppercase block">Average Call Duration</span>
          <strong className="text-lg font-heading font-extrabold text-gold-primary">
            {Math.floor(metrics.avgDurationSeconds / 60)}m {metrics.avgDurationSeconds % 60}s
          </strong>
        </div>
      </div>

      {/* Main Call Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Call Logs Registry */}
        <aside className="w-80 border-r border-border bg-muted-background/5 flex flex-col shrink-0 min-w-0">
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl flex-1 mr-2">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search phone logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-foreground"
              />
            </div>
            <button
              onClick={loadCallData}
              className="p-2 border border-border bg-card rounded-xl text-slate-400 hover:text-foreground hover:bg-muted-background transition-colors shrink-0"
              title="Refresh Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredCalls.map((call) => {
              const isActive = call.id === selectedCallId;
              return (
                <div
                  key={call.id}
                  onClick={() => setSelectedCallId(call.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-gold-primary/10 border-gold-primary/30 text-gold-primary'
                      : 'bg-card border-border hover:bg-muted-background/45 text-foreground'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <strong className="text-xs font-bold block">{call.caller}</strong>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                      call.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                        : call.status === 'TRANSFERRED'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                        : 'bg-muted-background text-muted border-border'
                    }`}>
                      {call.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted font-semibold">
                    <span>Lang: {call.language}</span>
                    <span>Dur: {call.durationSec}s</span>
                  </div>

                  {call.intent && (
                    <div className="flex items-center justify-between text-[9px] font-bold pt-1.5 border-t border-border/50">
                      <span className="text-gold-primary font-mono font-semibold">Intent: {call.intent}</span>
                      {call.ticket && (
                        <span className="text-slate-400 bg-muted-background px-1.5 py-0.5 rounded border border-border">
                          {call.ticket.ticketId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: Transcript Explorer + Telephony Sandbox */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-muted-background/5">
          
          {/* Dial Sandbox (L) */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-5 flex flex-col justify-between shrink-0 bg-card">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gold-glow flex items-center justify-center text-gold-primary">
                  <Phone className="w-4 h-4" />
                </div>
                <strong className="text-xs font-bold uppercase tracking-wider text-foreground">Sandbox Dialer</strong>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Phone SID</label>
                  <input
                    type="text"
                    value={testSid}
                    onChange={(e) => setTestSid(e.target.value)}
                    disabled={simStatus === 'ACTIVE'}
                    className="w-full bg-muted-background border border-border rounded-xl p-2.5 text-xs font-semibold outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase">Caller Number</label>
                  <input
                    type="text"
                    value={testCaller}
                    onChange={(e) => setTestCaller(e.target.value)}
                    disabled={simStatus === 'ACTIVE'}
                    className="w-full bg-muted-background border border-border rounded-xl p-2.5 text-xs font-semibold outline-none text-foreground"
                  />
                </div>

                {simStatus === 'ACTIVE' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase">Driver speech input</label>
                    <textarea
                      rows={4}
                      value={testSpeech}
                      onChange={(e) => setTestSpeech(e.target.value)}
                      placeholder="e.g. I need to book a woodside inspection..."
                      className="w-full bg-muted-background border border-border rounded-xl p-3 text-xs font-semibold outline-none focus:border-gold-primary text-foreground resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/80">
              {simStatus === 'ACTIVE' ? (
                <>
                  <Button
                    onClick={() => handleTestCallAction('respond')}
                    className="w-full bg-gold-primary hover:bg-gold-hover text-black font-bold text-xs py-5 rounded-xl border-0 shadow-md shadow-gold-glow"
                  >
                    Simulate Speech Result
                  </Button>
                  <Button
                    onClick={() => handleTestCallAction('end')}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-5 rounded-xl border-0"
                  >
                    Hangup Call
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleTestCallAction('start')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 rounded-xl border-0 flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  <span>Initiate Call Session</span>
                </Button>
              )}

              {simXml && (
                <div className="bg-muted-background border border-border rounded-xl p-3 mt-4 text-[9px] font-mono text-muted max-h-32 overflow-y-auto">
                  <span className="block font-bold mb-1 uppercase text-slate-400">Response TwiML XML:</span>
                  {simXml}
                </div>
              )}
            </div>
          </div>

          {/* Transcript Viewer (R) */}
          <div className="flex-1 flex flex-col min-h-0 bg-muted-background/5">
            <div className="px-6 py-4 border-b border-border bg-card flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-gold-primary" />
                <strong className="text-xs font-bold text-foreground">Interactive Transcript Timeline</strong>
              </div>
              {selectedCall?.ticket && (
                <span className="text-[10px] bg-gold-primary/10 text-gold-primary border border-gold-primary/20 px-2 py-0.5 rounded font-bold">
                  Escalated ticket: {selectedCall.ticket.ticketId}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedCall ? (
                selectedCall.transcripts.length > 0 ? (
                  selectedCall.transcripts.map((t) => {
                    const isAI = t.speaker === 'AI';
                    return (
                      <div
                        key={t.id}
                        className={`flex items-start gap-2.5 max-w-[80%] ${
                          isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border text-[10px] font-bold ${
                          isAI 
                            ? 'bg-gold-glow border-gold-primary/20 text-gold-primary' 
                            : 'bg-muted-background border-border text-foreground'
                        }`}>
                          {isAI ? 'AI' : 'DR'}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs sm:text-sm border shadow-sm leading-relaxed ${
                          isAI 
                            ? 'bg-card border-border text-foreground rounded-tl-none font-medium' 
                            : 'bg-gold-primary border-gold-hover text-black rounded-tr-none font-semibold'
                        }`}>
                          {t.text}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted font-bold">
                    No transcript exchanges logged for this call session.
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted font-bold">
                  Please select a call record from the left column to view transcripts.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
