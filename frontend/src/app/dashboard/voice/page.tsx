'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/config';
import {
  PhoneCall, PhoneOff, Phone, PhoneIncoming, PhoneMissed,
  Mic, MicOff, UserCheck, Clock, Globe, Ticket,
  TrendingUp, BarChart2, PieChart, Activity,
  Search, Filter, Download, RefreshCw, ChevronDown,
  MessageSquare, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, ArrowUpRight, User, Volume2, Radio,
  Headphones, PhoneForwarded, StickyNote, Eye, X,
  CalendarDays, Zap, Shield
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface VoiceCall {
  id: string;
  sid: string;
  caller: string;
  status: string;
  durationSec: number;
  language: string;
  intent?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
  ticket?: { ticketId: string; title: string };
  transcripts?: VoiceTranscript[];
}

interface VoiceTranscript {
  id: string;
  speaker: 'DRIVER' | 'AI' | 'AGENT';
  text: string;
  timestamp: string;
}

interface Analytics {
  summary: {
    totalCalls: number;
    activeCalls: number;
    completedCalls: number;
    transferredCalls: number;
    failedCalls: number;
    avgDurationSeconds: number;
    resolutionRate: number;
    transferRate: number;
  };
  callsPerDay: { date: string; count: number }[];
  languages: { language: string; count: number }[];
  intents: { intent: string; count: number }[];
  outcomes: { outcome: string; count: number }[];
}

// ── Mock data for when API is not yet available ────────────────────────────────
const MOCK_CALLS: VoiceCall[] = [
  {
    id: '1', sid: 'CA001', caller: '+17185551001', status: 'ACTIVE',
    durationSec: 0, language: 'English', intent: 'TLC_RENEWAL',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    transcripts: [
      { id: 't1', speaker: 'AI', text: 'Welcome to JNI Solutions. How can I assist you today?', timestamp: new Date().toISOString() },
      { id: 't2', speaker: 'DRIVER', text: 'I need to renew my TLC license', timestamp: new Date().toISOString() },
      { id: 't3', speaker: 'AI', text: 'To renew your TLC license, submit your application via LARS online, complete the 24-hour renewal course, and pass your annual drug screening.', timestamp: new Date().toISOString() },
    ]
  },
  {
    id: '2', sid: 'CA002', caller: '+17185551002', status: 'ACTIVE',
    durationSec: 0, language: 'Spanish', intent: 'APPOINTMENT',
    createdAt: new Date(Date.now() - 120000).toISOString(), updatedAt: new Date().toISOString(),
    transcripts: [
      { id: 't4', speaker: 'AI', text: 'Bienvenido a JNI Solutions. ¿En qué puedo ayudarle hoy?', timestamp: new Date().toISOString() },
      { id: 't5', speaker: 'DRIVER', text: 'Necesito agendar una inspección', timestamp: new Date().toISOString() },
    ]
  },
];

const MOCK_LOGS: VoiceCall[] = [
  { id: '3', sid: 'CA003', caller: '+17185551003', status: 'COMPLETED', durationSec: 187, language: 'English', intent: 'DMV_COMPLIANCE', outcome: 'RESOLVED', createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), ticket: { ticketId: 'JNI-V-1001', title: 'DMV Summons Query' } },
  { id: '4', sid: 'CA004', caller: '+17185551004', status: 'TRANSFERRED', durationSec: 94, language: 'Hindi', intent: 'BILLING', outcome: 'TRANSFERRED_TO_HUMAN', createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', sid: 'CA005', caller: '+17185551005', status: 'COMPLETED', durationSec: 312, language: 'Bangla', intent: 'TLC_RENEWAL', outcome: 'APPOINTMENT_BOOKED', createdAt: new Date(Date.now() - 10800000).toISOString(), updatedAt: new Date().toISOString(), ticket: { ticketId: 'JNI-V-1002', title: 'Voice Booking: Woodside Inspection' } },
  { id: '6', sid: 'CA006', caller: '+17185551006', status: 'COMPLETED', durationSec: 56, language: 'Urdu', intent: 'GENERAL', outcome: 'RESOLVED', createdAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', sid: 'CA007', caller: '+17185551007', status: 'COMPLETED', durationSec: 445, language: 'English', intent: 'DRUG_TEST', outcome: 'RESOLVED', createdAt: new Date(Date.now() - 18000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', sid: 'CA008', caller: '+17185551008', status: 'FAILED', durationSec: 0, language: 'Spanish', intent: undefined, outcome: 'ABANDONED', createdAt: new Date(Date.now() - 21600000).toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_ANALYTICS: Analytics = {
  summary: { totalCalls: 284, activeCalls: 2, completedCalls: 231, transferredCalls: 38, failedCalls: 13, avgDurationSeconds: 214, resolutionRate: 81, transferRate: 13 },
  callsPerDay: [
    { date: '2026-05-17', count: 8 }, { date: '2026-05-18', count: 12 }, { date: '2026-05-19', count: 9 },
    { date: '2026-05-20', count: 15 }, { date: '2026-05-21', count: 11 }, { date: '2026-05-22', count: 7 },
    { date: '2026-05-23', count: 14 }, { date: '2026-05-24', count: 18 }, { date: '2026-05-25', count: 22 },
    { date: '2026-05-26', count: 16 },
  ],
  languages: [{ language: 'English', count: 142 }, { language: 'Spanish', count: 58 }, { language: 'Hindi', count: 34 }, { language: 'Urdu', count: 28 }, { language: 'Bangla', count: 22 }],
  intents: [{ intent: 'TLC_RENEWAL', count: 89 }, { intent: 'DMV_COMPLIANCE', count: 64 }, { intent: 'APPOINTMENT', count: 48 }, { intent: 'BILLING', count: 37 }, { intent: 'DRUG_TEST', count: 28 }, { intent: 'GENERAL', count: 18 }],
  outcomes: [{ outcome: 'RESOLVED', count: 231 }, { outcome: 'TRANSFERRED_TO_HUMAN', count: 38 }, { outcome: 'APPOINTMENT_BOOKED', count: 28 }, { outcome: 'CALLBACK_REQUESTED', count: 14 }],
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const API = API_URL;

function formatDuration(sec: number): string {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': case 'RINGING': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25';
    case 'COMPLETED': return 'text-slate-400 bg-slate-400/10 border-slate-400/25';
    case 'TRANSFERRED': return 'text-blue-400 bg-blue-400/10 border-blue-400/25';
    case 'FAILED': return 'text-red-400 bg-red-400/10 border-red-400/25';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/25';
  }
}

function getIntentBadge(intent?: string): string {
  switch (intent) {
    case 'TLC_RENEWAL': return 'text-[#F5C400] bg-[#F5C400]/10 border-[#F5C400]/25';
    case 'DMV_COMPLIANCE': return 'text-purple-400 bg-purple-400/10 border-purple-400/25';
    case 'APPOINTMENT': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25';
    case 'BILLING': return 'text-blue-400 bg-blue-400/10 border-blue-400/25';
    case 'DRUG_TEST': return 'text-orange-400 bg-orange-400/10 border-orange-400/25';
    case 'ESCALATION': return 'text-red-400 bg-red-400/10 border-red-400/25';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/25';
  }
}

function getLangFlag(lang: string): string {
  switch (lang) {
    case 'Spanish': return '🇪🇸';
    case 'Hindi': return '🇮🇳';
    case 'Urdu': return '🇵🇰';
    case 'Bangla': return '🇧🇩';
    default: return '🇺🇸';
  }
}

// ── Mini Bar Chart (calls per day) ─────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
          <div
            className="w-full bg-[#F5C400]/20 hover:bg-[#F5C400]/60 rounded-t transition-all duration-300 relative"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: 4 }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-[9px] px-1 py-0.5 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {d.date.slice(5)}: {d.count}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const r = 40, cx = 50, cy = 50, stroke = 14;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
        {data.map((d, i) => {
          const pct = total > 0 ? d.value / total : 0;
          const dash = pct * circumference;
          const offset = -(cum / total) * circumference;
          cum += d.value;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          );
        })}
        <text x="50" y="54" textAnchor="middle" fontSize="10" fill="#a1a1aa" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-1 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-400 truncate">{d.label}</span>
            <span className="text-slate-300 font-bold ml-auto">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Call Timer ────────────────────────────────────────────────────────────
function LiveTimer({ startIso }: { startIso: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startIso).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  return <span className="font-mono text-emerald-400 text-xs font-bold">{formatDuration(elapsed)}</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function VoiceCenterPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'logs' | 'analytics' | 'transcripts'>('queue');
  const [liveQueue, setLiveQueue] = useState<VoiceCall[]>(MOCK_CALLS);
  const [callLogs, setCallLogs] = useState<VoiceCall[]>(MOCK_LOGS);
  const [analytics, setAnalytics] = useState<Analytics>(MOCK_ANALYTICS);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterIntent, setFilterIntent] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const getHeaders = useCallback(() => {
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jni_access_token='))
      ?.split('=')[1] || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const r = await fetch(`${API}/voice/queue`, { headers: getHeaders() });
      if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setLiveQueue(d); }
    } catch { /* use mock */ }
  }, [getHeaders]);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (searchQuery) params.set('search', searchQuery);
      if (filterLang) params.set('language', filterLang);
      if (filterIntent) params.set('intent', filterIntent);
      const r = await fetch(`${API}/voice/calls?${params}`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setCallLogs(d.calls || MOCK_LOGS);
        setTotalPages(d.pages || 1);
      }
    } catch { /* use mock */ }
  }, [page, searchQuery, filterLang, filterIntent, getHeaders]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const r = await fetch(`${API}/voice/analytics`, { headers: getHeaders() });
      if (r.ok) { const d = await r.json(); setAnalytics(d); }
    } catch { /* use mock */ }
  }, [getHeaders]);

  const fetchTranscript = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${API}/voice/calls/${id}/transcript`, { headers: getHeaders() });
      if (r.ok) { const d = await r.json(); if (d) setSelectedCall(d); }
    } catch { /* use current */ }
  }, [getHeaders]);

  useEffect(() => { fetchQueue(); fetchAnalytics(); }, [fetchQueue, fetchAnalytics]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Auto-refresh live queue every 8s
  useEffect(() => {
    const id = setInterval(fetchQueue, 8000);
    return () => clearInterval(id);
  }, [fetchQueue]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCall?.transcripts?.length]);

  const refresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchQueue(), fetchLogs(), fetchAnalytics()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleTransfer = async (sid: string) => {
    try {
      await fetch(`${API}/voice/transfer/${sid}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ note: 'Manual agent transfer from dashboard' }) });
      fetchQueue();
    } catch { }
  };

  const handleAddNote = async (callId: string) => {
    if (!noteInput.trim()) return;
    try {
      await fetch(`${API}/voice/calls/${callId}/note`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ note: noteInput }) });
      setNoteInput('');
      if (selectedCall?.id === callId) fetchTranscript(callId);
    } catch { }
  };

  const tabs = [
    { id: 'queue',       label: 'Live Queue',   icon: Radio,      badge: liveQueue.length },
    { id: 'logs',        label: 'Call Logs',    icon: PhoneCall,  badge: null },
    { id: 'analytics',  label: 'Analytics',    icon: BarChart2,  badge: null },
    { id: 'transcripts', label: 'Transcripts',  icon: MessageSquare, badge: null },
  ] as const;

  const summary = analytics?.summary || MOCK_ANALYTICS.summary;
  const callsPerDay = analytics?.callsPerDay || MOCK_ANALYTICS.callsPerDay;
  const languages = analytics?.languages || MOCK_ANALYTICS.languages;
  const intents = analytics?.intents || MOCK_ANALYTICS.intents;
  const outcomes = analytics?.outcomes || MOCK_ANALYTICS.outcomes;

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Calls', value: summary.totalCalls.toLocaleString(), icon: PhoneCall, color: 'text-[#F5C400]', bg: 'bg-[#F5C400]/10' },
    { label: 'Active Now', value: summary.activeCalls, icon: Radio, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Avg Duration', value: formatDuration(summary.avgDurationSeconds), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Resolution Rate', value: `${summary.resolutionRate}%`, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Transfer Rate', value: `${summary.transferRate}%`, icon: PhoneForwarded, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Completed', value: summary.completedCalls.toLocaleString(), icon: CheckCircle, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[#F5C400]" />
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-foreground tracking-tight">
              Voice Call Center
            </h1>
            {summary.activeCalls > 0 && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {summary.activeCalls} LIVE
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            AI-powered telephony center — Twilio + GPT-4o + Multilingual TTS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 text-slate-400 hover:text-white text-xs rounded-xl transition-all duration-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              const csv = ['Caller,Status,Duration,Language,Intent,Outcome,Date',
                ...callLogs.map(c => `${c.caller},${c.status},${formatDuration(c.durationSec)},${c.language},${c.intent || ''},${c.outcome || ''},${formatTime(c.createdAt)}`)
              ].join('\n');
              const b = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'jni_calls.csv'; a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] text-xs font-bold rounded-xl transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="bg-card border border-border rounded-2xl p-4 space-y-2"
          >
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
              <p className={`font-heading font-extrabold text-lg ${s.color}`}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-[#F5C400] text-[#0B0B0B] shadow'
                : 'text-slate-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.badge !== null && t.badge > 0 && (
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-[#0B0B0B]/20 text-[#0B0B0B]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1 — LIVE QUEUE
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'queue' && (
          <motion.div key="queue" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {liveQueue.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-16 text-center">
                <Phone className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No active calls in queue</p>
                <p className="text-slate-600 text-sm mt-1">Calls will appear here in real-time</p>
              </div>
            ) : (
              liveQueue.map((call, idx) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-card border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden"
                >
                  {/* Pulse border for active */}
                  <div className="absolute inset-0 rounded-2xl border border-emerald-500/10 animate-pulse pointer-events-none" />

                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left: call info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                          <Mic className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-sm text-foreground font-mono">{call.caller}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                          {call.intent && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getIntentBadge(call.intent)}`}>
                              {call.intent.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{getLangFlag(call.language)} {call.language}</span>
                          <span>•</span>
                          <LiveTimer startIso={call.createdAt} />
                          <span>•</span>
                          <span>SID: {call.sid}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { setSelectedCall(call); setActiveTab('transcripts'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-slate-300 text-xs rounded-lg transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        Transcript
                      </button>
                      <button
                        onClick={() => handleTransfer(call.sid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 text-xs font-bold rounded-lg transition-all"
                      >
                        <PhoneForwarded className="w-3 h-3" />
                        Transfer
                      </button>
                    </div>
                  </div>

                  {/* Mini transcript preview */}
                  {call.transcripts && call.transcripts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                      {call.transcripts.slice(-2).map((t, ti) => (
                        <div key={ti} className={`flex gap-2 items-start ${t.speaker === 'DRIVER' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[8px] font-bold ${t.speaker === 'AI' ? 'bg-[#F5C400]/20 text-[#F5C400]' : t.speaker === 'AGENT' ? 'bg-blue-400/20 text-blue-400' : 'bg-zinc-700 text-slate-300'}`}>
                            {t.speaker === 'AI' ? 'AI' : t.speaker === 'AGENT' ? 'A' : 'D'}
                          </div>
                          <p className={`text-[11px] px-2.5 py-1.5 rounded-xl max-w-md ${t.speaker === 'DRIVER' ? 'bg-zinc-800 text-slate-200 rounded-tr-none' : t.speaker === 'AGENT' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-[#F5C400]/8 text-slate-300 border border-[#F5C400]/10 rounded-tl-none'}`}>
                            {t.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2 — CALL LOGS
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search caller number..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-foreground placeholder:text-slate-600 outline-none focus:border-[#F5C400]/50 transition-colors"
                />
              </div>
              <select
                value={filterLang}
                onChange={e => setFilterLang(e.target.value)}
                className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-slate-300 outline-none"
              >
                <option value="">All Languages</option>
                {['English', 'Spanish', 'Hindi', 'Urdu', 'Bangla'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select
                value={filterIntent}
                onChange={e => setFilterIntent(e.target.value)}
                className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-slate-300 outline-none"
              >
                <option value="">All Intents</option>
                {['TLC_RENEWAL', 'DMV_COMPLIANCE', 'APPOINTMENT', 'BILLING', 'DRUG_TEST', 'GENERAL', 'ESCALATION'].map(i => (
                  <option key={i} value={i}>{i.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-zinc-900/40">
                      {['Caller', 'Status', 'Duration', 'Language', 'Intent', 'Outcome', 'Ticket', 'Date', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {callLogs.map((call, idx) => (
                      <motion.tr
                        key={call.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                        onClick={() => { setSelectedCall(call); setActiveTab('transcripts'); fetchTranscript(call.id); }}
                      >
                        <td className="px-4 py-3 font-mono text-slate-200 font-medium whitespace-nowrap">{call.caller}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">{formatDuration(call.durationSec)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{getLangFlag(call.language)} {call.language}</td>
                        <td className="px-4 py-3">
                          {call.intent ? (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getIntentBadge(call.intent)}`}>
                              {call.intent.replace('_', ' ')}
                            </span>
                          ) : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{call.outcome?.replace('_', ' ') || '—'}</td>
                        <td className="px-4 py-3">
                          {call.ticket ? (
                            <span className="text-[#F5C400] text-[10px] font-bold">{call.ticket.ticketId}</span>
                          ) : <span className="text-slate-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTime(call.createdAt)}</td>
                        <td className="px-4 py-3">
                          <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-[#F5C400] transition-colors" />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-xs rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-colors">Prev</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-xs rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-colors">Next</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3 — ANALYTICS
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">

            {/* Calls per day */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Call Volume</p>
                  <h3 className="font-heading font-bold text-base text-foreground">Calls Per Day (Last 30 Days)</h3>
                </div>
                <TrendingUp className="w-5 h-5 text-[#F5C400]" />
              </div>
              <MiniBarChart data={callsPerDay} />
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
                <span>{callsPerDay[0]?.date}</span>
                <span>{callsPerDay[callsPerDay.length - 1]?.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Language breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Languages</p>
                    <h3 className="font-heading font-bold text-sm text-foreground">Call Language Split</h3>
                  </div>
                  <Globe className="w-4 h-4 text-[#F5C400]" />
                </div>
                <DonutChart
                  data={languages.map(l => ({ label: `${getLangFlag(l.language)} ${l.language}`, value: l.count }))}
                  colors={['#F5C400', '#34d399', '#818cf8', '#f97316', '#ec4899']}
                />
              </div>

              {/* Intent breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Intents</p>
                    <h3 className="font-heading font-bold text-sm text-foreground">Top Caller Intents</h3>
                  </div>
                  <Zap className="w-4 h-4 text-[#F5C400]" />
                </div>
                <div className="space-y-2">
                  {intents.slice(0, 5).map((item, i) => {
                    const maxVal = intents[0]?.count || 1;
                    const pct = (item.count / maxVal) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getIntentBadge(item.intent)}`}>{item.intent.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#F5C400]/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Outcome breakdown */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Outcomes</p>
                    <h3 className="font-heading font-bold text-sm text-foreground">Call Outcomes</h3>
                  </div>
                  <Activity className="w-4 h-4 text-[#F5C400]" />
                </div>
                <DonutChart
                  data={outcomes.map(o => ({ label: o.outcome.replace(/_/g, ' '), value: o.count }))}
                  colors={['#34d399', '#818cf8', '#F5C400', '#f97316']}
                />
              </div>
            </div>

            {/* Resolution metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'AI Resolution Rate', value: summary.resolutionRate, color: '#34d399', icon: CheckCircle, desc: 'Calls resolved without agent transfer' },
                { label: 'Agent Transfer Rate', value: summary.transferRate, color: '#818cf8', icon: PhoneForwarded, desc: 'Calls escalated to live agents' },
              ].map((m, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5">
                  <div className="w-16 h-16 shrink-0 relative">
                    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                      <circle cx="32" cy="32" r="24" fill="none" stroke="#27272a" strokeWidth="8" />
                      <circle cx="32" cy="32" r="24" fill="none" stroke={m.color} strokeWidth="8"
                        strokeDasharray={`${(m.value / 100) * 2 * Math.PI * 24} ${2 * Math.PI * 24}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-extrabold font-heading" style={{ color: m.color }}>{m.value}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{m.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4 — TRANSCRIPTS
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'transcripts' && (
          <motion.div key="transcripts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Call list panel */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Call</p>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-border max-h-[500px]">
                {(() => {
                  const seen = new Set();
                  return [...liveQueue, ...callLogs].filter((call) => {
                    if (!call.id || seen.has(call.id)) return false;
                    seen.add(call.id);
                    return true;
                  });
                })().map((call) => (
                  <button
                    key={call.id}
                    onClick={() => { setSelectedCall(call); fetchTranscript(call.id); }}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-900/60 transition-colors ${selectedCall?.id === call.id ? 'bg-[#F5C400]/5 border-l-2 border-[#F5C400]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-xs text-slate-200 font-medium">{call.caller}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${getStatusColor(call.status)}`}>{call.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <span>{getLangFlag(call.language)}</span>
                      <span>{call.language}</span>
                      {call.intent && <span>• {call.intent.replace('_', ' ')}</span>}
                    </div>
                    <p className="text-[10px] text-slate-700 mt-0.5">{formatTime(call.createdAt)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript viewer */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
              {!selectedCall ? (
                <div className="flex-1 flex items-center justify-center p-16 text-center">
                  <div>
                    <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Select a call to view its transcript</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Call header */}
                  <div className="px-5 py-4 border-b border-border bg-zinc-900/30">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/25 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#F5C400]" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground font-mono">{selectedCall.caller}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{getLangFlag(selectedCall.language)} {selectedCall.language}</span>
                            <span>•</span>
                            <span>{formatDuration(selectedCall.durationSec)}</span>
                            {selectedCall.ticket && (
                              <>
                                <span>•</span>
                                <span className="text-[#F5C400] font-bold">{selectedCall.ticket.ticketId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(selectedCall.status)}`}>
                          {selectedCall.status}
                        </span>
                        {selectedCall.intent && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getIntentBadge(selectedCall.intent)}`}>
                            {selectedCall.intent.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[380px]">
                    {(!selectedCall.transcripts || selectedCall.transcripts.length === 0) ? (
                      <p className="text-center text-slate-600 text-sm py-8">No transcript available</p>
                    ) : (
                      selectedCall.transcripts.map((t, i) => {
                        const isDriver = t.speaker === 'DRIVER';
                        const isAgent = t.speaker === 'AGENT';
                        return (
                          <motion.div
                            key={t.id || i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className={`flex items-start gap-2.5 ${isDriver ? 'flex-row-reverse' : ''}`}
                          >
                            <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${isDriver ? 'bg-zinc-700 text-slate-200' : isAgent ? 'bg-blue-500/20 text-blue-400' : 'bg-[#F5C400]/20 text-[#F5C400]'}`}>
                              {isDriver ? 'D' : isAgent ? 'A' : 'AI'}
                            </div>
                            <div className={`max-w-[75%] space-y-0.5 ${isDriver ? 'items-end' : ''} flex flex-col`}>
                              <span className="text-[9px] text-slate-600 px-1">
                                {t.speaker} • {new Date(t.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed font-medium ${
                                isDriver
                                  ? 'bg-zinc-800 text-slate-200 rounded-tr-none'
                                  : isAgent
                                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-tl-none'
                                  : 'bg-[#F5C400]/8 text-slate-300 border border-[#F5C400]/10 rounded-tl-none'
                              }`}>
                                {t.text}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                    <div ref={transcriptEndRef} />
                  </div>

                  {/* Agent note input */}
                  <div className="px-5 py-4 border-t border-border bg-zinc-900/30">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <StickyNote className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={noteInput}
                          onChange={e => setNoteInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddNote(selectedCall.id); }}
                          placeholder="Add agent note to call transcript..."
                          className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs outline-none focus:border-[#F5C400]/50 text-slate-300 placeholder:text-slate-600 transition-colors"
                        />
                      </div>
                      <button
                        onClick={() => handleAddNote(selectedCall.id)}
                        className="px-3 py-2 bg-[#F5C400] text-[#0B0B0B] hover:bg-[#D9A300] rounded-xl text-xs font-bold transition-colors shrink-0"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Outbound Call Modal Trigger ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <OutboundCallButton getHeaders={getHeaders} />
      </div>
    </div>
  );
}

// ── Outbound Call Floating Button ──────────────────────────────────────────────
function OutboundCallButton({ getHeaders }: { getHeaders: () => Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('Hello! This is JNI Solutions calling to assist you.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const dial = async () => {
    if (!number) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/voice/outbound`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ toNumber: number, message })
      });
      const d = await r.json();
      setResult(d.success ? `✅ Call initiated: ${d.sid}` : `❌ ${d.error}`);
    } catch {
      setResult('❌ Network error. Check Twilio credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="w-12 h-12 bg-[#F5C400] text-[#0B0B0B] rounded-full shadow-xl shadow-[#F5C400]/20 flex items-center justify-center hover:bg-[#D9A300] transition-colors"
      >
        <Phone className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm text-white">Outbound Call</p>
              <button onClick={() => { setOpen(false); setResult(''); }} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="tel" value={number} onChange={e => setNumber(e.target.value)} placeholder="+1 718 555 0199"
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#F5C400]/50"
              />
              <textarea
                value={message} onChange={e => setMessage(e.target.value)} rows={2}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 outline-none resize-none focus:border-[#F5C400]/50"
              />
              {result && <p className="text-xs text-slate-400">{result}</p>}
              <button
                onClick={dial} disabled={loading || !number}
                className="w-full py-2.5 bg-[#F5C400] text-[#0B0B0B] rounded-xl text-sm font-bold hover:bg-[#D9A300] transition-colors disabled:opacity-50"
              >
                {loading ? 'Dialing…' : 'Dial Now'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
