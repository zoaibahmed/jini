'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { API_URL } from '@/config';
import { 
  Play, 
  Square, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
  FileText,
  Ticket,
  Upload,
  UserCheck,
  Zap,
  MessageSquare,
  Shield,
  FileSpreadsheet,
  Plus,
  Trash2,
  Globe,
  Sliders,
  Database,
  BarChart3,
  RefreshCw,
  X,
  Ban,
  CheckCircle,
  Key,
  Users,
  BookOpen,
  History,
  ShieldAlert,
  Bell,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface DriverProfile {
  name: string;
  driverProfile?: {
    driverType: string;
    languages: string[];
    documentsUploaded: boolean;
  };
  vehicles: Array<{ id: string; make: string; model: string; plate: string }>;
  complianceChecks: Array<{ id: string; title: string; status: string; dueDate: string; description?: string }>;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin Panel states
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'payments' | 'announcements' | 'logs' | 'ai' | 'analytics'>('overview');
  const [businessAnalytics, setBusinessAnalytics] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(null); // profile modal details
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [adminPasswordOverride, setAdminPasswordOverride] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'MAINTENANCE', endsAt: '' });
  const [auditLogs, setAuditLogs] = useState<any>({ adminLogs: [], systemEvents: [] });
  
  // New Admin Panel SaaS & Payments states
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any>(null);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: '', discountAmount: '', expiryDate: '' });

  // AI Monitoring states
  const [aiPrompts, setAiPrompts] = useState<any[]>([]);
  const [aiKnowledge, setAiKnowledge] = useState<any[]>([]);
  const [aiMetrics, setAiMetrics] = useState<any>(null);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '', category: 'DRIVER_SUPPORT', isActive: true });
  const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '', category: 'FAQ', tags: '' });
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [editingPromptName, setEditingPromptName] = useState<string | null>(null);

  // Web-Dialer (Softphone) states
  const [isCallOpen, _setIsCallOpen] = useState(false);
  const [callState, _setCallState] = useState<'idle' | 'connecting' | 'active' | 'speaking' | 'listening' | 'ended'>('idle');
  const [isCallMuted, _setIsCallMuted] = useState(false);
  const [callTranscripts, setCallTranscripts] = useState<Array<{ speaker: 'AI' | 'DRIVER'; text: string }>>([]);
  const [callSid, setCallSid] = useState('');
  const [isMicAccessGranted, setIsMicAccessGranted] = useState(true);

  // Refs to prevent stale closures in event listeners
  const callStateRef = useRef<'idle' | 'connecting' | 'active' | 'speaking' | 'listening' | 'ended'>('idle');
  const isCallOpenRef = useRef(false);
  const isCallMutedRef = useRef(false);

  const setCallState = (s: typeof callState) => {
    callStateRef.current = s;
    _setCallState(s);
  };
  const setIsCallOpen = (o: boolean) => {
    isCallOpenRef.current = o;
    _setIsCallOpen(o);
  };
  const setIsCallMuted = (m: boolean) => {
    isCallMutedRef.current = m;
    _setIsCallMuted(m);
  };

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup synthesizer and recording on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try { synthRef.current.cancel(); } catch(e) {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch(e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch(e) {}
      }
    };
  }, []);


  // Shift simulation retired

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jni_access_token='))
      ?.split('=')[1];

    fetch(`${API_URL}/driver/profile`, {
      headers: {
        'x-driver-id': user?.id || '',
        'Authorization': `Bearer ${token || ''}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Backend offline, using fallback dashboard overview data');
        setProfile({
          name: user?.name || 'Active Driver',
          driverProfile: {
            driverType: 'TLC',
            languages: ['English'],
            documentsUploaded: false,
          },
          vehicles: [],
          complianceChecks: []
        });
        setIsLoading(false);
      });
  }, [user]);

  const pendingChecks = profile?.complianceChecks?.filter(c => c.status !== 'COMPLETED') || [];
  const expiredChecks = pendingChecks.filter(c => c.status === 'EXPIRED');

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  // Web-Dialer voice assistant logic
  const parseTwimlSay = (xmlString: string): string => {
    if (!xmlString) return '';
    try {
      const sayRegex = /<Say[^>]*>([\s\S]*?)<\/Say>/i;
      const match = xmlString.match(sayRegex);
      if (match && match[1]) {
        return match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .trim();
      }
    } catch (e) {
      console.error('Failed to parse TwiML Say tag', e);
    }
    return '';
  };

  const setupAudioVisualizer = (stream: MediaStream) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const width = canvas.width;
        const height = canvas.height;

        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#f5c400');
        grad.addColorStop(0.5, '#ffd700');
        grad.addColorStop(1, '#ff8c00');
        ctx.fillStyle = grad;

        const barWidth = (width / bufferLength) * 1.6;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i] / 255.0;
          const barHeight = val * height * 0.9 + 4;
          const yPos = (height - barHeight) / 2;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, yPos, barWidth - 2, barHeight, 4);
          } else {
            ctx.rect(x, yPos, barWidth - 2, barHeight);
          }
          ctx.fill();
          x += barWidth;
        }
      };
      draw();
    } catch(e) {
      console.warn('Audio Context Visualizer failed:', e);
    }
  };

  const speakMessage = (text: string, onEndCallback: () => void) => {
    if (!synthRef.current) {
      onEndCallback();
      return;
    }
    try {
      synthRef.current.cancel();
      const cleanText = text.replace(/[*#_`~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);

      let langCode = 'en-US';
      if (text.includes('bienvenido') || text.includes('inspección') || text.includes('placa')) langCode = 'es-ES';
      else if (text.includes('स्वागत') || text.includes('निरीक्षण')) langCode = 'hi-IN';
      else if (text.includes('خوش آمدید') || text.includes('تجدید')) langCode = 'ur-PK';
      else if (text.includes('স্বাগতম') || text.includes('পরিদর্শন')) langCode = 'bn-IN';
      utterance.lang = langCode;

      const voices = synthRef.current.getVoices();
      const matchedVoice = voices.find((v: any) => v.lang.startsWith(langCode));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        onEndCallback();
      };
      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        onEndCallback();
      };
      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
      onEndCallback();
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onstart = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('SpeechRecognition stop error:', e);
      }
      recognitionRef.current = null;
    }
  };

  const sendDriverResponse = async (currentCallSid: string, text: string) => {
    setCallState('speaking');
    stopSpeechRecognition();

    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/voice/test-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sid: currentCallSid,
          caller: (user as any)?.phone || '+17185550199',
          speechResult: text,
          action: 'respond'
        })
      });

      if (!res.ok) throw new Error('Response failed');
      const data = await res.json();

      const isTransferred = data.xml.includes('<Dial>');
      const aiResponse = parseTwimlSay(data.xml) || "Connecting you to an agent now.";

      setCallTranscripts(prev => [...prev, { speaker: 'AI', text: aiResponse }]);

      speakMessage(aiResponse, () => {
        if (isTransferred) {
          setCallTranscripts(prev => [...prev, { speaker: 'AI', text: "📞 Call transferred to live operator." }]);
          setTimeout(() => {
            endCall();
          }, 3000);
        } else if (data.xml.includes('<Hangup/>')) {
          setTimeout(() => {
            endCall();
          }, 1500);
        } else {
          setCallState('listening');
          startSpeechRecognition(currentCallSid);
        }
      });
    } catch (e) {
      console.error('Error sending driver response:', e);
      setCallState('listening');
      startSpeechRecognition(currentCallSid);
    }
  };

  const startSpeechRecognition = (currentCallSid: string) => {
    if (typeof window === 'undefined') return;
    stopSpeechRecognition();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Browser SpeechRecognition not supported.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.lang = 'en-US';
      recognitionRef.current = rec;

      rec.onstart = () => {
        console.log('Speech recognition started');
      };

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech Recognition Result:', transcript);
        if (!transcript.trim()) return;

        stopSpeechRecognition();

        setCallTranscripts(prev => [...prev, { speaker: 'DRIVER', text: transcript }]);
        sendDriverResponse(currentCallSid, transcript);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error in call:', e.error);
        if (e.error === 'no-speech' && !isCallMutedRef.current && isCallOpenRef.current) {
          setTimeout(() => {
            if (!isCallMutedRef.current && isCallOpenRef.current && callStateRef.current === 'listening') {
              try { rec.start(); } catch (err) {}
            }
          }, 300);
        }
      };

      rec.onend = () => {
        console.log('Speech recognition ended');
        setTimeout(() => {
          if (!isCallMutedRef.current && isCallOpenRef.current && callStateRef.current === 'listening' && recognitionRef.current === rec) {
            try { rec.start(); } catch (e) {}
          }
        }, 300);
      };

      if (!isCallMutedRef.current) {
        rec.start();
      }
    } catch (e) {
      console.warn('SpeechRecognition start failed:', e);
    }
  };

  const startCall = async () => {
    setIsCallOpen(true);
    setCallState('connecting');
    setCallTranscripts([]);
    setIsCallMuted(false);
    const tempSid = `WEB-CALL-${Date.now()}`;
    setCallSid(tempSid);

    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      synthRef.current.cancel();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicAccessGranted(true);
      setupAudioVisualizer(stream);

      try {
        const token = getCookie('jni_access_token');
        const res = await fetch(`${API_URL}/voice/test-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sid: tempSid,
            caller: (user as any)?.phone || '+17185550199',
            action: 'start'
          })
        });

        if (!res.ok) {
          console.warn('Voice Assistant API returned non-200 status');
          alert('Voice Agent backend is currently offline. Please try again later.');
          setCallState('idle');
          setIsCallOpen(false);
          return;
        }
        const data = await res.json();
        const welcomeText = parseTwimlSay(data.xml) || "Welcome to JNI Solutions. How can I assist you today?";
        
        setCallState('speaking');
        setCallTranscripts([{ speaker: 'AI', text: welcomeText }]);

        speakMessage(welcomeText, () => {
          setCallState('listening');
          startSpeechRecognition(tempSid);
        });
      } catch (apiErr) {
        console.error('Voice Assistant API failed:', apiErr);
        alert('Voice Agent backend is currently offline. Please try again later.');
        setCallState('idle');
        setIsCallOpen(false);
      }
    } catch (err) {
      console.error('Microphone access failed:', err);
      setIsMicAccessGranted(false);
      setCallState('idle');
      alert('Microphone access is required to use the AI Voice Assistant dialer. Please grant permissions and try again.');
      setIsCallOpen(false);
    }
  };

  const endCall = async () => {
    setCallState('ended');
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    stopSpeechRecognition();

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch(e) {}
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      const token = getCookie('jni_access_token');
      await fetch(`${API_URL}/voice/test-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sid: callSid,
          caller: (user as any)?.phone || '+17185550199',
          action: 'end'
        })
      });
    } catch (e) {
      console.warn('Failed to end call on backend:', e);
    }

    setTimeout(() => {
      setIsCallOpen(false);
      setCallState('idle');
    }, 2000);
  };

  const toggleMute = () => {
    if (isCallMutedRef.current) {
      setIsCallMuted(false);
      if (callStateRef.current === 'listening') {
        startSpeechRecognition(callSid);
      }
    } else {
      setIsCallMuted(true);
      stopSpeechRecognition();
    }
  };


  const loadAdminStats = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminStats(data))
      .catch(e => console.warn('Failed to load admin stats'));
  };

  const loadAdminUsers = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/users?search=${userSearch}&role=${userRoleFilter}&status=${userStatusFilter}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminUsers(data))
      .catch(e => console.warn('Failed to load admin users'));
  };

  const loadAnnouncements = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAnnouncements(data))
      .catch(e => console.warn('Failed to load announcements'));
  };

  const loadAuditLogs = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(e => console.warn('Failed to load audit logs'));
  };

  const loadAdminPlans = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/plans`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminPlans(data))
      .catch(e => console.warn('Failed to load admin plans'));
  };

  const loadAdminCoupons = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/coupons`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminCoupons(data))
      .catch(e => console.warn('Failed to load admin coupons'));
  };

  const loadAdminPayments = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/admin/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminPayments(data))
      .catch(e => console.warn('Failed to load admin payments'));
  };

  const loadAiPrompts = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/copilot/admin/prompts`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAiPrompts(Array.isArray(data) ? data : []))
      .catch(e => console.warn('Failed to load prompts'));
  };

  const loadAiKnowledge = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/copilot/admin/knowledge`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAiKnowledge(Array.isArray(data) ? data : []))
      .catch(e => console.warn('Failed to load FAQ knowledge'));
  };

  const loadAiMetrics = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/copilot/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAiMetrics(data))
      .catch(e => console.warn('Failed to load AI metrics'));
  };

  const loadBusinessAnalytics = () => {
    const token = getCookie('jni_access_token');
    fetch(`${API_URL}/crm/analytics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBusinessAnalytics(data))
      .catch(e => console.warn('Failed to load business analytics'));
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/copilot/admin/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPrompt)
      });
      if (res.ok) {
        setIsPromptModalOpen(false);
        setNewPrompt({ name: '', content: '', category: 'DRIVER_SUPPORT', isActive: true });
        setEditingPromptName(null);
        loadAiPrompts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getCookie('jni_access_token');
    try {
      const tagsArray = newKnowledge.tags ? newKnowledge.tags.split(',').map(t => t.trim()) : [];
      const res = await fetch(`${API_URL}/copilot/admin/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newKnowledge, tags: tagsArray })
      });
      if (res.ok) {
        setIsKnowledgeModalOpen(false);
        setNewKnowledge({ title: '', content: '', category: 'FAQ', tags: '' });
        loadAiKnowledge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/copilot/admin/knowledge/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAiKnowledge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPPORT') {
      loadAdminStats();
      loadAdminUsers();
      loadAnnouncements();
      loadAuditLogs();
      loadAdminPlans();
      loadAdminCoupons();
      loadAdminPayments();
      if (adminTab === 'ai') {
        loadAiPrompts();
        loadAiKnowledge();
        loadAiMetrics();
      }
      if (adminTab === 'analytics') {
        loadBusinessAnalytics();
      }
    }
  }, [user, adminTab, userSearch, userRoleFilter, userStatusFilter]);

  const fetchUserProfileDetail = async (userId: string) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAdminUser(data);
      }
    } catch (e) {
      console.error('Failed to load user profile detail', e);
    }
  };

  const handleToggleStatus = async (userId: string, active: boolean) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: active }),
      });
      if (res.ok) {
        loadAdminUsers();
        if (selectedAdminUser && selectedAdminUser.id === userId) {
          fetchUserProfileDetail(userId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        loadAdminUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!adminPasswordOverride.trim()) return;
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: adminPasswordOverride }),
      });
      if (res.ok) {
        setAdminPasswordOverride('');
        alert('Password changed successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefund = async (paymentId: string) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/payments/refund/${paymentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAdminStats();
        alert('Refund processed successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePlan = async (planData: any) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(planData),
      });
      if (res.ok) {
        setSelectedPlanForEdit(null);
        loadAdminPlans();
        alert('Plan saved successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code) return;
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCoupon.code,
          discountPercent: newCoupon.discountPercent ? parseInt(newCoupon.discountPercent) : null,
          discountAmount: newCoupon.discountAmount ? parseFloat(newCoupon.discountAmount) : null,
          expiryDate: newCoupon.expiryDate || null
        }),
      });
      if (res.ok) {
        setNewCoupon({ code: '', discountPercent: '', discountAmount: '', expiryDate: '' });
        loadAdminCoupons();
        alert('Coupon created successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAnnouncement),
      });
      if (res.ok) {
        setNewAnnouncement({ title: '', content: '', type: 'MAINTENANCE', endsAt: '' });
        loadAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Hardcoded statistics representing the summary cards
  const statsSummary = {
    tlcStatus: expiredChecks.length > 0 ? 'Urgent Warning' : 'No data available yet.',
    insuranceStatus: 'No data available yet.',
    registrationStatus: 'No data available yet.',
    supportTickets: 'No data available yet.',
    documentsCount: 'No data available yet.',
    subscriptionPlan: 'Premium' // Simulate premium plan for the current user for testing purposes, assuming real backend integration will replace this.
  };

  const recentUploads: any[] = [];

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isActualAdmin = isSuperAdmin || isAdmin;
  const isSupport = user?.role === 'SUPPORT';

  if (isActualAdmin) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              JNI Operations Center
            </h1>
            <p className="text-muted text-sm font-medium">
              Ecosystem Management Console for {user?.name || 'Administrator'} • Control fleet records, billing layers, AI models, and support cases.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gold-primary text-black font-heading uppercase tracking-wide">
            {user?.role} Access
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: 'overview', label: 'Ecosystem Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Business Analytics', icon: TrendingUp },
            { id: 'users', label: 'Drivers & Staff Directory', icon: Users },
            { id: 'payments', label: 'SaaS Billing & Payments', icon: DollarSign },
            { id: 'ai', label: 'AI Center & Monitoring', icon: Sparkles },
            { id: 'announcements', label: 'Broadcast Banners', icon: Bell },
            { id: 'logs', label: 'Audit & System Logs', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border-0 cursor-pointer ${
                  isTabActive
                    ? 'bg-gold-primary text-black shadow-md shadow-gold-glow'
                    : 'bg-card text-muted hover:text-foreground border border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {adminTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Registered Drivers</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {adminStats?.stats?.totalDrivers ?? 1284}
                </strong>
                <span className="text-[10px] text-emerald-500 font-bold block">+18 this week</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Active Fleet Sessions</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {adminStats?.stats?.activeUsers ?? 342}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Online in last 15m</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Platform Revenue</span>
                <strong className="text-2xl font-heading font-extrabold text-gold-primary">
                  ${(adminStats?.stats?.totalRevenue ?? 12450).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-emerald-500 font-bold block">MRR active growth</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Open Tickets Queue</span>
                <strong className="text-2xl font-heading font-extrabold text-red-500">
                  {adminStats?.stats?.openTickets ?? 1} / {adminStats?.stats?.totalTickets ?? 3}
                </strong>
                <span className="text-[10px] text-amber-500 font-bold block">Requires Agent reply</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">AI Copilot Interactions</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {adminStats?.stats?.totalAiUsage ?? 28}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Tokens processed</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Realtime Call volume</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {adminStats?.stats?.totalCalls ?? 4}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Incoming Twilio calls</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Pending Renewals</span>
                <strong className="text-2xl font-heading font-extrabold text-amber-500">
                  {adminStats?.stats?.pendingRenewals ?? 2}
                </strong>
                <span className="text-[10px] text-amber-500 font-bold block">Woodside / Drug tests</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Vault Documents</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {adminStats?.stats?.totalDocuments ?? 3}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Auto-parsed OCR files</span>
              </div>
            </div>

            {/* Growth Metrics Charts (Pure CSS design system) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Fleet Growth Chart Block */}
              <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                    Driver Onboarding & Signups Growth
                  </h3>
                  <span className="text-xs text-muted font-semibold">Simulated Monthly Data</span>
                </div>
                
                <div className="space-y-4 pt-4">
                  {adminStats?.growth ? (
                    adminStats.growth.map((item: any, idx: number) => {
                      const maxVal = Math.max(...adminStats.growth.map((g: any) => g.drivers));
                      const percentage = maxVal > 0 ? (item.drivers / maxVal) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-foreground font-bold">{item.month}</span>
                            <span className="text-muted">{item.drivers} Drivers registered</span>
                          </div>
                          <div className="h-4 bg-muted-background rounded-full overflow-hidden border border-border">
                            <div 
                              className="h-full bg-gold-primary transition-all duration-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted">No growth metrics loaded.</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground mb-4">
                    Staff Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link href="/dashboard/support" className="block w-full">
                      <Button className="w-full bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border border-border text-xs font-bold h-11 rounded-xl">
                        Open Support Desk Ticket Queue
                      </Button>
                    </Link>
                    <button 
                      onClick={() => setAdminTab('announcements')} 
                      className="w-full bg-gold-primary text-black hover:bg-gold-hover border-0 text-xs font-bold h-11 rounded-xl cursor-pointer"
                    >
                      Broadcast System Alert Banner
                    </button>
                    <button 
                      onClick={() => setAdminTab('payments')} 
                      className="w-full bg-muted-background text-foreground hover:bg-card border border-border text-xs font-bold h-11 rounded-xl cursor-pointer"
                    >
                      Configure Subscription Plan Pricing
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-[10px] text-muted font-medium">
                  JNI Platform Management Core v1.4.2 • PostgreSQL Gateway Status: Connected
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BUSINESS ANALYTICS */}
        {adminTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Monthly Rec. Revenue</span>
                <strong className="text-2xl font-heading font-extrabold text-gold-primary">
                  ${(businessAnalytics?.mrr ?? 3840).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-emerald-500 font-bold block">MRR Active Run-rate</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Annual Rec. Revenue</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  ${(businessAnalytics?.arr ?? 46080).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-emerald-500 font-bold block">ARR Projection</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Average Revenue / User</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  ${(businessAnalytics?.arpu ?? 29.99).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">ARPU Blended</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Customer Lifetime Value</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  ${(businessAnalytics?.ltv ?? 999.67).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <span className="text-[10px] text-emerald-500 font-bold block">LTV Projection</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Churn Rate</span>
                <strong className="text-2xl font-heading font-extrabold text-red-500">
                  {(businessAnalytics?.churnRate ?? 3.0).toFixed(1)}%
                </strong>
                <span className="text-[10px] text-red-500 font-bold block">Monthly cancellation</span>
              </div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscriber growth history */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  Active Subscriber Growth History
                </h3>
                <div className="h-64 flex items-end justify-between pt-6 px-4 border-b border-border pb-2 select-none">
                  {(businessAnalytics?.history?.subscribers ?? [35, 48, 65, 82, 105, 128]).map((val: number, idx: number) => {
                    const months = businessAnalytics?.history?.months ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                    const maxVal = Math.max(...(businessAnalytics?.history?.subscribers ?? [35, 48, 65, 82, 105, 128]));
                    const heightPercent = maxVal > 0 ? (val / maxVal) * 80 : 0;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                        <span className="text-[9px] font-bold text-gold-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {val}
                        </span>
                        <div 
                          className="w-full bg-gold-primary rounded-t-lg transition-all duration-500 shadow-md shadow-gold-glow hover:bg-gold-hover"
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        />
                        <span className="text-[10px] font-bold text-muted mt-1">{months[idx]}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted font-semibold italic text-center">Interactive Subscriber Growth trends tracking SaaS scaling targets.</p>
              </div>

              {/* Monthly Revenue growth history */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  Monthly Revenue Trends (USD)
                </h3>
                <div className="h-64 flex items-end justify-between pt-6 px-4 border-b border-border pb-2 select-none">
                  {(businessAnalytics?.history?.revenue ?? [1050, 1440, 1950, 2460, 3150, 3840]).map((val: number, idx: number) => {
                    const months = businessAnalytics?.history?.months ?? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                    const maxVal = Math.max(...(businessAnalytics?.history?.revenue ?? [1050, 1440, 1950, 2460, 3150, 3840]));
                    const heightPercent = maxVal > 0 ? (val / maxVal) * 80 : 0;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-12 group">
                        <span className="text-[9px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          ${val}
                        </span>
                        <div 
                          className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500 hover:bg-emerald-600"
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        />
                        <span className="text-[10px] font-bold text-muted mt-1">{months[idx]}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted font-semibold italic text-center">Operational Platform MRR growth curves.</p>
              </div>
            </div>

            {/* Extra Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">CRM Lead Conversion Rate</span>
                  <strong className="text-2xl font-heading font-extrabold text-[#F5C400]">
                    {(businessAnalytics?.conversionRate ?? 14.5).toFixed(1)}%
                  </strong>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                  Qualified to Converted
                </span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Confirmed Consultations Booked</span>
                  <strong className="text-2xl font-heading font-extrabold text-foreground">
                    {businessAnalytics?.scheduledBookings ?? 8} Appointments
                  </strong>
                </div>
                <span className="text-xs font-bold text-gold-primary bg-gold-glow/5 border border-gold-primary/20 px-2.5 py-1 rounded-xl">
                  Active Slots
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: USER DIRECTORY */}
        {adminTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters Bar */}
            <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-1/3 relative">
                <input
                  type="text"
                  placeholder="Search user name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-xl px-3 py-2.5 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-xl px-3 py-2.5 text-foreground outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SUPPORT">Support Agent</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">Super Admin</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-xl px-3 py-2.5 text-foreground outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Suspended</option>
                </select>
              </div>
            </div>

            {/* Drivers list table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted-background/40 border-b border-border text-muted font-bold uppercase tracking-wider">
                      <th className="p-4">Name / Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">System Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Registered Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {adminUsers.length > 0 ? (
                      adminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted-background/25 transition-colors">
                          <td className="p-4">
                            <strong className="block text-foreground font-bold">{u.name}</strong>
                            <span className="text-[10px] text-muted">{u.email}</span>
                          </td>
                          <td className="p-4 text-muted font-medium">{u.phone || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'SUPERADMIN' 
                                ? 'bg-red-500/10 text-red-500' 
                                : u.role === 'ADMIN'
                                  ? 'bg-gold-primary/10 text-gold-primary'
                                  : u.role === 'SUPPORT'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {u.isActive ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="p-4 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => fetchUserProfileDetail(u.id)}
                              className="px-3 py-1 bg-gold-primary text-black border-0 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Inspect Profile
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id, !u.isActive)}
                              className={`px-3 py-1 border-0 rounded text-[10px] font-bold cursor-pointer ${
                                u.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              }`}
                            >
                              {u.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted">
                          No users matching search filters found in directory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS & BILLING */}
        {adminTab === 'payments' && (
          <div className="space-y-6 animate-fade-in">
            {/* SaaS Plans manager */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                SaaS Membership Plans Manager
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adminPlans.map((plan) => (
                  <div key={plan.id} className="border border-border rounded-xl p-4 space-y-3 bg-muted-background/30 hover:border-gold-primary/30 transition-all">
                    <div className="flex justify-between items-center">
                      <strong className="text-foreground text-xs font-extrabold uppercase">{plan.name}</strong>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${plan.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xl font-extrabold text-foreground">${plan.priceMonthly}</span>
                      <span className="text-[10px] text-muted"> / month</span>
                      <div className="text-[10px] text-muted">${plan.priceYearly} / year</div>
                    </div>
                    <div className="text-[10px] text-muted space-y-1 pt-2 border-t border-border">
                      <span className="font-bold block uppercase tracking-wider text-[8px]">Enabled Features:</span>
                      {plan.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gold-primary" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedPlanForEdit(plan)}
                      className="w-full mt-2 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary border-0 rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Edit Plan Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Plan Edit Form Overlay Modal */}
              {selectedPlanForEdit && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <h4 className="font-heading font-extrabold text-sm text-foreground uppercase">
                        Edit Plan: {selectedPlanForEdit.name}
                      </h4>
                      <button onClick={() => setSelectedPlanForEdit(null)} className="text-muted hover:text-foreground border-0 bg-transparent cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSavePlan(selectedPlanForEdit);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Plan Name</label>
                        <input
                          type="text"
                          value={selectedPlanForEdit.name}
                          onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, name: e.target.value })}
                          className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Monthly Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={selectedPlanForEdit.priceMonthly}
                            onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, priceMonthly: e.target.value })}
                            className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Yearly Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={selectedPlanForEdit.priceYearly}
                            onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, priceYearly: e.target.value })}
                            className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Trial Duration (Days)</label>
                        <input
                          type="number"
                          value={selectedPlanForEdit.trialDays}
                          onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, trialDays: e.target.value })}
                          className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted block">Active Status</label>
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPlanForEdit.active}
                            onChange={(e) => setSelectedPlanForEdit({ ...selectedPlanForEdit, active: e.target.checked })}
                            className="accent-gold-primary"
                          />
                          <span>Visible to subscribers during checkout</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setSelectedPlanForEdit(null)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-gold-primary text-black hover:bg-gold-hover font-bold">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Coupons and transaction ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coupon Builder Block */}
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  Promo Coupons Creator
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-muted">Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SPECIAL50"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-muted">Discount %</label>
                      <input
                        type="number"
                        placeholder="e.g. 50"
                        value={newCoupon.discountPercent}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value, discountAmount: '' })}
                        className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-muted">Fixed Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 10.00"
                        value={newCoupon.discountAmount}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discountAmount: e.target.value, discountPercent: '' })}
                        className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-muted">Expiry Date</label>
                    <input
                      type="date"
                      value={newCoupon.expiryDate}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                      className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>

                  <button
                    onClick={handleCreateCoupon}
                    className="w-full py-2 bg-gold-primary text-black hover:bg-gold-hover border-0 rounded-lg text-xs font-bold cursor-pointer transition-colors mt-2"
                  >
                    Generate Discount Token
                  </button>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Active Coupon Codes</span>
                  <div className="divide-y divide-border text-[11px] max-h-40 overflow-y-auto pr-1">
                    {adminCoupons.map((c) => (
                      <div key={c.id} className="py-2 flex justify-between">
                        <strong className="text-foreground">{c.code}</strong>
                        <span className="text-gold-primary">
                          {c.discountPercent ? `${c.discountPercent}% Off` : `$${c.discountAmount} Off`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payments ledger block */}
              <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  Subscribers Payments Ledger
                </h3>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border text-muted font-bold uppercase tracking-wider">
                        <th className="pb-3">Driver Name / Email</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Gateway Status</th>
                        <th className="pb-3">Method</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {adminPayments.length > 0 ? (
                        adminPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-muted-background/25">
                            <td className="py-3 pr-2">
                              <strong className="block text-foreground">{p.subscription?.user?.name || 'Unknown'}</strong>
                              <span className="text-[10px] text-muted">{p.subscription?.user?.email || 'N/A'}</span>
                            </td>
                            <td className="py-3 font-bold text-foreground">${p.amount}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                p.status === 'SUCCESS'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : p.status === 'REFUNDED'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-red-500/10 text-red-500'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 text-muted">{p.paymentMethod}</td>
                            <td className="py-3 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
                              {p.status === 'SUCCESS' && (
                                <button
                                  onClick={() => handleRefund(p.id)}
                                  className="px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0 rounded text-[9px] font-bold cursor-pointer transition-colors"
                                >
                                  Refund Duplicate
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted">
                            No payment transactions recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ANNOUNCEMENTS */}
        {adminTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Create Announcement Block */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Broadcast Alert Banner
              </h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted">Banner Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Schedule TLC inspection Woodside downtime"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted">Message Content</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about the alert. Will display at dashboard login."
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted">Alert Severity</label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground outline-none"
                  >
                    <option value="MAINTENANCE">Maintenance Block</option>
                    <option value="UPDATE">Platform Update</option>
                    <option value="PROMOTION">Promotions</option>
                    <option value="ALERT">Alert Warning</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted">Expiration Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newAnnouncement.endsAt}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, endsAt: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-border rounded-lg px-3 py-2 text-foreground outline-none"
                  />
                </div>

                <button
                  onClick={handleCreateAnnouncement}
                  className="w-full py-2.5 bg-gold-primary text-black hover:bg-gold-hover border-0 rounded-xl text-xs font-bold cursor-pointer transition-colors mt-2"
                >
                  Send Broadcast Banner
                </button>
              </div>
            </div>

            {/* Announcements List Block */}
            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Active & Archived Banners
              </h3>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann.id} className="border border-border rounded-xl p-4 space-y-2 bg-muted-background/20 relative">
                      <div className="flex justify-between items-start">
                        <strong className="text-foreground text-xs font-bold">{ann.title}</strong>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          ann.type === 'ALERT'
                            ? 'bg-red-500/10 text-red-500'
                            : ann.type === 'MAINTENANCE'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {ann.type}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{ann.content}</p>
                      <div className="text-[9px] text-muted flex items-center gap-3">
                        <span>Created: {new Date(ann.createdAt).toLocaleString()}</span>
                        {ann.endsAt && (
                          <span className="text-amber-500">Expires: {new Date(ann.endsAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted py-8 text-xs">
                    No system announcement banners active in platform.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM LOGS */}
        {adminTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Audit Trail Logs */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Administrative Audit Trail (Last 100 Actions)
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {auditLogs?.adminLogs?.length > 0 ? (
                  auditLogs.adminLogs.map((log: any) => (
                    <div key={log.id} className="text-[11px] border border-border p-3 rounded-xl bg-muted-background/10 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">{log.user?.name} ({log.user?.role})</span>
                        <span className="text-gold-primary">{log.action}</span>
                      </div>
                      <p className="text-slate-400 font-medium">{log.details}</p>
                      <div className="text-[9px] text-muted flex justify-between">
                        <span>IP: {log.ip || 'N/A'}</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted text-center py-6">No administrative audit logs available.</p>
                )}
              </div>
            </div>

            {/* System Events */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Platform System Events & Errors Logs
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {auditLogs?.systemEvents?.length > 0 ? (
                  auditLogs.systemEvents.map((event: any) => (
                    <div key={event.id} className="text-[11px] border border-border p-3 rounded-xl bg-muted-background/10 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-foreground">{event.source} • {event.eventType}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          event.severity === 'CRITICAL'
                            ? 'bg-red-500/10 text-red-500'
                            : event.severity === 'WARNING'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {event.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 font-medium">{event.message}</p>
                      {event.details && (
                        <pre className="p-2 bg-[#141414] border border-border rounded text-[9px] text-amber-500/80 overflow-x-auto">
                          {event.details}
                        </pre>
                      )}
                      <div className="text-[9px] text-muted text-right">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted text-center py-6">No system event logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AI CENTER & MONITORING */}
        {adminTab === 'ai' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick AI Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total AI Calls</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {aiMetrics?.totalCalls ?? 0}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">All endpoints count</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Prompt Tokens</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {aiMetrics?.totalPromptTokens?.toLocaleString() ?? 0}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Input volume processed</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Completion Tokens</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {aiMetrics?.totalCompletionTokens?.toLocaleString() ?? 0}
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Response output tokens</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total OpenAI Cost</span>
                <strong className="text-2xl font-heading font-extrabold text-gold-primary">
                  ${(aiMetrics?.totalCost ?? 0.0).toFixed(4)}
                </strong>
                <span className="text-[10px] text-emerald-500 font-bold block">USD dynamic billing</span>
              </div>
              <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Avg Latency</span>
                <strong className="text-2xl font-heading font-extrabold text-foreground">
                  {aiMetrics?.avgLatencyMs ?? 0}ms
                </strong>
                <span className="text-[10px] text-slate-400 font-bold block">Model response time</span>
              </div>
            </div>

            {/* Providers & Latency split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Provider Shares list */}
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  AI Model Providers Shares
                </h3>
                <div className="space-y-3">
                  {aiMetrics?.providers?.length > 0 ? (
                    aiMetrics.providers.map((p: any, idx: number) => {
                      const total = aiMetrics.providers.reduce((sum: number, cur: any) => sum + cur.count, 0);
                      const pct = total > 0 ? (p.count / total) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-foreground">{p.provider}</span>
                            <span className="text-muted">{p.count} calls ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2 bg-muted-background rounded-full overflow-hidden border border-border">
                            <div className="h-full bg-gold-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted text-center py-4">No provider share data available.</p>
                  )}
                </div>
              </div>

              {/* System Prompts Column */}
              <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                    System Instruct Prompts
                  </h3>
                  <Button
                    onClick={() => {
                      setNewPrompt({ name: '', content: '', category: 'DRIVER_SUPPORT', isActive: true });
                      setEditingPromptName(null);
                      setIsPromptModalOpen(true);
                    }}
                    className="bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border border-border text-[10px] font-bold h-8 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Prompt
                  </Button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {aiPrompts.length > 0 ? (
                    aiPrompts.map((p: any) => (
                      <div key={p.name} className="text-xs border border-border p-3.5 rounded-xl bg-muted-background/10 flex justify-between items-start gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-foreground text-xs font-bold truncate">{p.name}</strong>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              p.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className="text-[9px] text-muted uppercase font-bold">{p.category}</span>
                          </div>
                          <p className="text-slate-400 font-medium line-clamp-2 mt-1">{p.content}</p>
                        </div>
                        <button
                          onClick={() => {
                            setNewPrompt({ name: p.name, content: p.content, category: p.category, isActive: p.isActive });
                            setEditingPromptName(p.name);
                            setIsPromptModalOpen(true);
                          }}
                          className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-slate-300 hover:text-white rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted text-center py-6">No prompts configured.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Knowledge Base FAQ Section */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                    FAQ Knowledge Base Directory (RAG Injector)
                  </h3>
                  <Button
                    onClick={() => {
                      setNewKnowledge({ title: '', content: '', category: 'FAQ', tags: '' });
                      setIsKnowledgeModalOpen(true);
                    }}
                    className="bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border border-border text-[10px] font-bold h-8 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New FAQ Doc
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {aiKnowledge.length > 0 ? (
                    aiKnowledge.map((doc: any) => (
                      <div key={doc.id} className="py-4 flex justify-between items-start gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-foreground text-xs font-bold">{doc.title}</strong>
                            <span className="text-[9px] text-[#F5C400] bg-[#F5C400]/10 border border-[#F5C400]/20 px-1.5 py-0.5 rounded font-bold uppercase">{doc.category}</span>
                            {doc.tags?.map((t: string, ti: number) => (
                              <span key={ti} className="text-[8px] text-slate-500 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{doc.content}</p>
                          <span className="text-[9px] text-muted block">Created at {new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteKnowledge(doc.id)}
                          className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted text-center py-8">No FAQ documents found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent AI Usage Log Ledger */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                AI Execution Audit Log Ledger
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-zinc-900/40 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Provider</th>
                      <th className="px-4 py-3 text-left">Tokens (Prompt/Comp)</th>
                      <th className="px-4 py-3 text-left">Latency</th>
                      <th className="px-4 py-3 text-left">Cost (Est.)</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-slate-300">
                    {aiMetrics?.recentLogs?.length > 0 ? (
                      aiMetrics.recentLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{log.provider}</td>
                          <td className="px-4 py-3 font-mono">{log.promptTokens} / {log.completionTokens}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{log.durationMs}ms</td>
                          <td className="px-4 py-3 font-bold text-slate-400">${log.cost?.toFixed(5)}</td>
                          <td className="px-4 py-3">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-500 uppercase">
                              Success
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted">No execution logs logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NEW SYSTEM PROMPT MODAL */}
        {isPromptModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  {editingPromptName ? 'Edit System Prompt' : 'Create System Prompt'}
                </h3>
                <button
                  onClick={() => setIsPromptModalOpen(false)}
                  className="p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSavePrompt} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Prompt Identifier Name</label>
                  <input
                    type="text"
                    required
                    disabled={editingPromptName !== null}
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    placeholder="e.g. DRIVER_COPILOT_SYSTEM"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none focus:border-gold-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Prompt Category</label>
                  <select
                    value={newPrompt.category}
                    onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none"
                  >
                    <option value="DRIVER_SUPPORT">Driver Support</option>
                    <option value="VOICE_CALLS">Voice Call Flow</option>
                    <option value="DISPUTE_OCR">Dispute Parser</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Prompt Instruct Content</label>
                  <textarea
                    required
                    rows={6}
                    value={newPrompt.content}
                    onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                    placeholder="You are JNI assistant..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none focus:border-gold-primary resize-none font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="promptActive"
                    checked={newPrompt.isActive}
                    onChange={(e) => setNewPrompt({ ...newPrompt, isActive: e.target.checked })}
                    className="accent-gold-primary"
                  />
                  <label htmlFor="promptActive" className="text-slate-300 font-bold uppercase text-[9px]">Activate immediately (deactivates others in same category)</label>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    onClick={() => setIsPromptModalOpen(false)}
                    className="bg-muted-background text-foreground hover:bg-card border border-border text-[10px] font-bold h-9 rounded-xl px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gold-primary text-black hover:bg-gold-hover border-0 text-[10px] font-bold h-9 rounded-xl px-4"
                  >
                    Save Instruct Prompt
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NEW FAQ KNOWLEDGE MODAL */}
        {isKnowledgeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                  Inject FAQ Knowledge Document
                </h3>
                <button
                  onClick={() => setIsKnowledgeModalOpen(false)}
                  className="p-1 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveKnowledge} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Document Title</label>
                  <input
                    type="text"
                    required
                    value={newKnowledge.title}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                    placeholder="e.g. TLC renewal procedure timelines"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none focus:border-gold-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Category</label>
                  <input
                    type="text"
                    required
                    value={newKnowledge.category}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, category: e.target.value })}
                    placeholder="e.g. TLC_RENEWAL"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none focus:border-gold-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Search Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={newKnowledge.tags}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, tags: e.target.value })}
                    placeholder="e.g. drug test, lars, timing"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none focus:border-gold-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted font-bold uppercase">Document Plain Content</label>
                  <textarea
                    required
                    rows={6}
                    value={newKnowledge.content}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                    placeholder="Provide full details..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-slate-200 outline-none focus:border-gold-primary resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    onClick={() => setIsKnowledgeModalOpen(false)}
                    className="bg-muted-background text-foreground hover:bg-card border border-border text-[10px] font-bold h-9 rounded-xl px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gold-primary text-black hover:bg-gold-hover border-0 text-[10px] font-bold h-9 rounded-xl px-4"
                  >
                    Inject FAQ Document
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SELECTED USER SLIDE-OUT PROFILE INSPECTION DRAWER MODAL */}
        {selectedAdminUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0">
            <div className="bg-card border-l border-border h-full max-w-3xl w-full flex flex-col justify-between shadow-2xl animate-slide-in">
              {/* Drawer Header */}
              <div className="p-6 border-b border-border bg-[#0B0B0B] text-white flex justify-between items-center">
                <div>
                  <h3 className="font-heading font-extrabold text-lg tracking-tight text-white">
                    Driver Profile Drilldown Inspection
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspecting user accounts, digital records, copilot transcripts and phone sessions.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAdminUser(null)}
                  className="p-2 rounded-lg bg-card text-muted hover:text-foreground border border-border cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
                {/* 1. Account Details Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted-background/30 p-4 border border-border rounded-xl space-y-2">
                    <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Personal Profile</span>
                    <strong className="text-foreground text-sm font-bold block">{selectedAdminUser.name}</strong>
                    <span className="block text-muted">{selectedAdminUser.email}</span>
                    <span className="block text-muted">{selectedAdminUser.phone || 'No Phone Registered'}</span>
                    <span className="block text-muted">Pref Lang: {selectedAdminUser.preferredLanguage || 'English'}</span>
                  </div>

                  <div className="bg-muted-background/30 p-4 border border-border rounded-xl space-y-2">
                    <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Access Permissions</span>
                    <span className="block text-foreground font-semibold">User Role: {selectedAdminUser.role}</span>
                    <div className="flex items-center gap-1.5 text-foreground mt-2">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        selectedAdminUser.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {selectedAdminUser.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </div>

                    {/* Change Role Selection */}
                    {isSuperAdmin ? (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[9px] text-muted uppercase">Change Role:</span>
                        <select
                          value={selectedAdminUser.role}
                          onChange={(e) => handleChangeRole(selectedAdminUser.id, e.target.value)}
                          className="bg-[#1A1A1A] border border-border rounded px-2 py-1 text-[10px] text-foreground outline-none"
                        >
                          <option value="DRIVER">DRIVER</option>
                          <option value="SUPPORT">SUPPORT</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                      </div>
                    ) : (
                      <div className="pt-2 flex items-center gap-2 text-[10px] text-muted font-semibold">
                        <span>Role Permissions: {selectedAdminUser.role}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Reset Password Block */}
                {isSuperAdmin && (
                  <div className="bg-muted-background/10 border border-border p-4 rounded-xl space-y-3">
                    <span className="font-bold text-[9px] text-muted uppercase block">Administrative Password Reset Override</span>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Input new secure password override..."
                        value={adminPasswordOverride}
                        onChange={(e) => setAdminPasswordOverride(e.target.value)}
                        className="flex-1 bg-[#1A1A1A] border border-border rounded px-3 py-1.5 text-[11px] text-foreground outline-none"
                      />
                      <button
                        onClick={() => handleResetPassword(selectedAdminUser.id)}
                        className="px-4 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded font-bold cursor-pointer hover:bg-red-500/20"
                      >
                        Override Password
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Vehicles Grid */}
                <div className="space-y-2">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Registered Compliance Vehicles</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedAdminUser.vehicles && selectedAdminUser.vehicles.length > 0 ? (
                      selectedAdminUser.vehicles.map((v: any) => (
                        <div key={v.id} className="border border-border p-3 rounded-xl bg-muted-background/20 space-y-1">
                          <strong className="text-foreground text-xs block font-bold">{v.make} {v.model} ({v.year})</strong>
                          <span className="text-[10px] text-muted block">Plate: {v.plate}</span>
                          <span className="text-[10px] text-muted block">VIN: {v.vin}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted">No vehicles registered for driver.</p>
                    )}
                  </div>
                </div>

                {/* 4. Active Subscription Details */}
                <div className="space-y-3 border-t border-border pt-4">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Subscription & Invoices</span>
                  {selectedAdminUser.subscription ? (
                    <div className="bg-muted-background/10 border border-border p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="block text-muted text-[10px] uppercase font-bold">Active Tier</span>
                          <strong className="text-foreground font-extrabold text-sm">{selectedAdminUser.subscription.plan?.name}</strong>
                        </div>
                        <div>
                          <span className="block text-muted text-[10px] uppercase font-bold">Current Status</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                            {selectedAdminUser.subscription.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-muted flex gap-6">
                        <span>Period: {selectedAdminUser.subscription.billingPeriod}</span>
                        <span>Renews: {new Date(selectedAdminUser.subscription.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted">No active subscription or membership.</p>
                  )}
                </div>

                {/* 5. Uploaded Documents Checklists */}
                <div className="space-y-3 border-t border-border pt-4">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Uploaded Compliance Documents</span>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-muted-background/40 border-b border-border text-muted font-bold">
                          <th className="p-3">Category</th>
                          <th className="p-3">File Name</th>
                          <th className="p-3">OCR Status</th>
                          <th className="p-3">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedAdminUser.documents && selectedAdminUser.documents.length > 0 ? (
                          selectedAdminUser.documents.map((d: any) => (
                            <tr key={d.id} className="hover:bg-muted-background/20">
                              <td className="p-3 font-semibold text-foreground">{d.categoryName}</td>
                              <td className="p-3 text-muted">{d.name}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  d.status === 'SAFE' 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {d.status}
                                </span>
                              </td>
                              <td className="p-3 text-muted">
                                {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted">No documents uploaded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. AI Assistant Copilot History */}
                <div className="space-y-3 border-t border-border pt-4">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">AI Assistant Chat History (Recent 10 Messages)</span>
                  <div className="border border-border rounded-xl p-4 bg-muted-background/10 space-y-3 max-h-48 overflow-y-auto pr-1">
                    {selectedAdminUser.aiChats && selectedAdminUser.aiChats.length > 0 ? (
                      selectedAdminUser.aiChats.map((c: any) => (
                        <div key={c.id} className="space-y-2">
                          <div className="text-[9px] text-muted font-bold uppercase">Chat Session: {c.title}</div>
                          {c.messages && c.messages.map((m: any) => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                              <div className={`p-2 rounded-lg max-w-[80%] ${
                                m.sender === 'USER' 
                                  ? 'bg-gold-primary text-black font-semibold' 
                                  : 'bg-[#1C1C1E] text-slate-300 border border-border'
                              }`}>
                                {m.message}
                              </div>
                              <span className="text-[8px] text-muted mt-0.5">{new Date(m.createdAt).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted">No AI chats logged for user.</p>
                    )}
                  </div>
                </div>

                {/* 7. Voice Calls center history */}
                <div className="space-y-3 border-t border-border pt-4">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Call Center Voice Transcripts</span>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {selectedAdminUser.voiceCalls && selectedAdminUser.voiceCalls.length > 0 ? (
                      selectedAdminUser.voiceCalls.map((call: any) => (
                        <div key={call.id} className="border border-border p-3 rounded-xl bg-muted-background/20 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-foreground">Call Session: {call.sid.substring(0, 10)}...</span>
                            <span className="text-gold-primary">Duration: {call.durationSec}s • {call.language}</span>
                          </div>
                          <div className="text-[9px] text-slate-400">Primary Intent: {call.intent || 'N/A'} • Outcome: {call.outcome || 'N/A'}</div>
                          
                          {/* Call dialog entries */}
                          {call.transcripts && call.transcripts.length > 0 && (
                            <div className="border-t border-border/50 pt-2 space-y-1 text-[10px]">
                              {call.transcripts.map((t: any) => (
                                <div key={t.id} className="flex gap-1.5">
                                  <strong className="text-foreground font-bold shrink-0">{t.speaker}:</strong>
                                  <span className="text-muted">{t.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted">No voice center call logs registered.</p>
                    )}
                  </div>
                </div>

                {/* 8. Driver Tickets History */}
                <div className="space-y-3 border-t border-border pt-4">
                  <span className="font-bold text-[9px] text-muted uppercase tracking-wider block">Support Ticket History</span>
                  <div className="divide-y divide-border">
                    {selectedAdminUser.driverTickets && selectedAdminUser.driverTickets.length > 0 ? (
                      selectedAdminUser.driverTickets.map((t: any) => (
                        <div key={t.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <strong className="block text-foreground font-bold">{t.title}</strong>
                            <span className="text-[9px] text-muted">{t.ticketId} • Category: {t.category} • Priority: {t.priority}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.status === 'OPEN' 
                              ? 'bg-red-500/10 text-red-500' 
                              : t.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted pt-1">No support tickets created by driver.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-border bg-[#0B0B0B] flex justify-end gap-2">
                <Button variant="outline" className="border-border text-white hover:bg-zinc-800" onClick={() => setSelectedAdminUser(null)}>
                  Close Inspection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isSupport) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Support Agent Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              Support Command Hub
            </h1>
            <p className="text-muted text-sm font-medium">
              Welcome back, {user?.name || 'Support Agent'} • Monitor unassigned cases and pending driver inquiries.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-500 font-heading uppercase tracking-wide border border-amber-500/20">
            {user?.role} Access
          </span>
        </div>

        {/* Support Specific Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Unassigned Tickets</span>
            <strong className="text-2xl font-heading font-extrabold text-red-500">
              {adminStats?.stats?.openTickets ?? 1}
            </strong>
            <span className="text-[10px] text-red-400 font-bold block">Awaiting assignment</span>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Total Active Cases</span>
            <strong className="text-2xl font-heading font-extrabold text-foreground">
              {adminStats?.stats?.totalTickets ?? 3}
            </strong>
            <span className="text-[10px] text-slate-400 font-bold block">Currently open in system</span>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Voice Dialer Status</span>
            <strong className="text-2xl font-heading font-extrabold text-emerald-500">
              ONLINE
            </strong>
            <span className="text-[10px] text-emerald-400 font-bold block">Twilio Gateway Connected</span>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl space-y-1.5 hover-card-glow transition-all">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Avg Response Time</span>
            <strong className="text-2xl font-heading font-extrabold text-gold-primary">
              1.2 hours
            </strong>
            <span className="text-[10px] text-emerald-500 font-bold block">78% SLA compliance</span>
          </div>
        </div>

        {/* Support Main Interface Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent active cases queue summary */}
          <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Recent Inquiries Needing Review
              </h3>
              <Link href="/dashboard/support" className="text-xs font-bold text-gold-primary hover:text-gold-hover">
                Open Support Desk &rarr;
              </Link>
            </div>
            
            <div className="divide-y divide-border">
              {adminUsers && adminUsers.length > 0 ? (
                adminUsers.slice(0, 4).map((usr: any, idx: number) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gold-primary/15 border border-gold-primary/25 text-[#F5C400] flex items-center justify-center font-heading font-extrabold">
                        {usr.name ? usr.name.charAt(0) : 'D'}
                      </div>
                      <div>
                        <strong className="block text-foreground font-bold">{usr.name}</strong>
                        <span className="text-[10px] text-muted font-medium">{usr.email} • Lang: {usr.preferredLanguage || 'English'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        usr.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {usr.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                      <Link href="/dashboard/support">
                        <Button className="bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border border-border text-[9px] font-bold h-8 rounded-lg">
                          Inspect Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted">
                  No active driver directory records to display.
                </div>
              )}
            </div>
          </div>

          {/* Quick links & Announcements for Agents */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Agent Command Shortcuts
              </h3>
              <div className="space-y-3">
                <Link href="/dashboard/support" className="block w-full">
                  <Button className="w-full bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border border-border text-xs font-bold h-11 rounded-xl">
                    View Support Queue
                  </Button>
                </Link>
                <Link href="/dashboard/voice" className="block w-full">
                  <Button className="w-full bg-gold-primary text-black hover:bg-gold-hover border-0 text-xs font-bold h-11 rounded-xl">
                    Launch Softphone Dialer
                  </Button>
                </Link>
              </div>
            </div>

            {/* Announcements block */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">
                Staff Broadcasts
              </h3>
              <div className="space-y-3">
                {announcements && announcements.length > 0 ? (
                  announcements.slice(0, 2).map((ann, idx) => (
                    <div key={idx} className="p-3 bg-muted-background/35 border border-border rounded-xl space-y-1.5">
                      <span className="text-[9px] font-bold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded uppercase border border-gold-primary/20">
                        {ann.type}
                      </span>
                      <strong className="block text-foreground text-xs leading-tight">{ann.title}</strong>
                      <p className="text-[10px] text-muted leading-relaxed font-semibold">{ann.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-muted-background/35 border border-border rounded-xl text-center text-[10px] text-muted">
                    No active staff alerts broadcasted.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">Driver Control Center</h1>
          <p className="text-muted text-sm font-medium">Welcome back, {profile?.name || 'Driver'}. Track your compliance checks, booked appointments, and resources.</p>
        </div>
      </div>

      {/* 2. Primary Compliance Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* TLC Status */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">TLC License</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${expiredChecks.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <strong className={`text-xs font-bold font-heading truncate ${expiredChecks.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {expiredChecks.length > 0 ? 'Action Required' : 'Compliant'}
            </strong>
          </div>
        </div>

        {/* Insurance Status */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Insurance</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong className="text-xs font-bold font-heading text-emerald-500 truncate">Active</strong>
          </div>
        </div>

        {/* Registration Status */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Registration</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong className="text-xs font-bold font-heading text-emerald-500 truncate">Valid</strong>
          </div>
        </div>

        {/* Vehicle Inspection Status */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Vehicle Inspection</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong className="text-xs font-bold font-heading text-emerald-500 truncate">Passed</strong>
          </div>
        </div>

        {/* Drug Test Status */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Drug Test</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong className="text-xs font-bold font-heading text-amber-500 truncate">Due Soon</strong>
          </div>
        </div>

      </div>

      {/* 2.5 Secondary Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Support Tickets */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Open Support Tickets</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <strong className="text-xs font-bold font-heading text-foreground truncate">{statsSummary.supportTickets}</strong>
          </div>
        </div>

        {/* Documents Count */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Recent Uploads</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold-primary" />
            <strong className="text-xs font-bold font-heading text-foreground truncate">{statsSummary.documentsCount} documents</strong>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Upcoming Deadlines</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <strong className="text-xs font-bold font-heading text-foreground truncate">{pendingChecks.length} action(s) needed</strong>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-card border border-border p-4 rounded-2xl space-y-1 hover-card-glow transition-all">
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Subscription Status</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold-primary" />
            <strong className="text-xs font-bold font-heading text-foreground truncate">{statsSummary.subscriptionPlan}</strong>
          </div>
        </div>
      </div>

      {/* 3. Analytics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Compliance Warning Card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover-card-glow transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Compliance Items</p>
              <h3 className="text-3xl font-heading font-extrabold mt-1 text-foreground">
                {pendingChecks.length} Pending
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className={`font-bold flex items-center gap-0.5 ${expiredChecks.length > 0 ? 'text-red-500' : 'text-[#D9A300]'}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {expiredChecks.length} expired requirement{expiredChecks.length !== 1 ? 's' : ''}
            </span>
            <Link href="/dashboard/documents" className="text-muted hover:text-foreground flex items-center font-semibold">
              Upload Vault <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Premium Status Card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover-card-glow transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Membership Status</p>
              <h3 className="text-xl font-heading font-extrabold mt-1 text-foreground flex items-center gap-2">
                {statsSummary.subscriptionPlan.toLowerCase() === 'premium' || statsSummary.subscriptionPlan.toLowerCase() === 'premium pro' ? (
                  <>⭐ Premium Driver</>
                ) : (
                  <>Basic Driver</>
                )}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-glow border border-gold-primary/20 text-gold-primary flex items-center justify-center">
              <Star className="w-5 h-5 fill-current text-gold-primary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2 text-[10px] font-semibold">
            {statsSummary.subscriptionPlan.toLowerCase() === 'premium' || statsSummary.subscriptionPlan.toLowerCase() === 'premium pro' ? (
              <>
                <div className="text-xs font-bold text-foreground mb-1">Premium Benefits Active:</div>
                <div className="text-muted flex items-center gap-1.5">✓ AI Voice Assistant</div>
                <div className="text-muted flex items-center gap-1.5">✓ Priority Support</div>
                <div className="text-muted flex items-center gap-1.5">✓ Faster Compliance Assistance</div>
                <div className="text-muted flex items-center gap-1.5">✓ Smart AI Guidance</div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-foreground mb-1">Unlock Premium Features:</div>
                <div className="text-muted flex items-center gap-1.5">✦ AI Voice Assistant</div>
                <div className="text-muted flex items-center gap-1.5">✦ Priority Support</div>
                <Link href="/dashboard/billing" className="text-gold-primary hover:text-gold-hover font-bold flex items-center mt-1">
                  Upgrade Now <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Compliance Rating Card */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover-card-glow transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Compliance Rating</p>
              <h3 className="text-3xl font-heading font-extrabold mt-1 text-foreground">
                {expiredChecks.length > 0 ? '92%' : '100%'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-glow border border-gold-primary/20 text-gold-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold-primary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted font-semibold">
              {expiredChecks.length > 0 ? '1 document needs renewal' : 'All checkpoints secured'}
            </span>
            <Link href="/dashboard/renewals" className="text-gold-primary hover:text-gold-hover font-bold flex items-center">
              Track Renewals <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* 4. Welcome Card and Timeline Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Quick Actions & Renewal checklist */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Actions Widget */}
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider mb-4 text-foreground">Quick Action Console</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <Link href="/dashboard/documents" className="flex flex-col items-center justify-center p-4 bg-muted-background/30 hover:bg-gold-primary/10 border border-border hover:border-gold-primary/45 rounded-xl text-center group transition-all">
                <Upload className="w-6 h-6 text-slate-500 group-hover:text-gold-primary mb-2 transition-colors" />
                <span className="text-xs font-bold text-foreground">Upload File</span>
              </Link>

              <Link href="/dashboard/support" className="flex flex-col items-center justify-center p-4 bg-muted-background/30 hover:bg-gold-primary/10 border border-border hover:border-gold-primary/45 rounded-xl text-center group transition-all">
                <Ticket className="w-6 h-6 text-slate-500 group-hover:text-gold-primary mb-2 transition-colors" />
                <span className="text-xs font-bold text-foreground">Raise Ticket</span>
              </Link>

              <Link href="/dashboard/copilot" className="flex flex-col items-center justify-center p-4 bg-muted-background/30 hover:bg-[#F5C400]/10 border border-border hover:border-[#F5C400]/45 rounded-xl text-center group transition-all animate-pulse">
                <MessageSquare className="w-6 h-6 text-[#F5C400] mb-2 transition-colors" />
                <span className="text-xs font-bold text-foreground">Ask AI Assistant</span>
              </Link>

              <button
                onClick={() => {
                  if (statsSummary.subscriptionPlan.toLowerCase() === 'premium' || statsSummary.subscriptionPlan.toLowerCase() === 'premium pro') {
                    alert('Voice Agent Status: Coming Soon');
                  } else {
                    if (window.confirm('AI Voice Assistant is available only for Premium Drivers.\n\nUpgrade to Premium to access:\n• Voice Support\n• Compliance Guidance\n• Driver Assistance\n• Document Help\n• Priority Support\n\nUpgrade Now?')) {
                      window.location.href = '/dashboard/billing';
                    }
                  }
                }}
                className="flex flex-col items-center justify-center p-4 bg-muted-background/30 hover:bg-gold-primary/10 border border-border hover:border-gold-primary/45 rounded-xl text-center group transition-all cursor-pointer w-full"
              >
                <Phone className="w-6 h-6 text-slate-500 group-hover:text-gold-primary mb-2 transition-colors" />
                <span className="text-xs font-bold text-foreground">Call AI Assistant</span>
              </button>

            </div>
          </div>

          {/* Recent Uploaded Documents list */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">Recent Document Uploads</h3>
              <Link href="/dashboard/documents" className="text-xs font-bold text-gold-primary hover:text-gold-hover">
                Document Intelligence &rarr;
              </Link>
            </div>

            <div className="divide-y divide-border">
              {recentUploads.length > 0 ? recentUploads.map((file, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5C400]/10 border border-[#F5C400]/25 text-[#D9A300] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-foreground font-bold">{file.name}</strong>
                      <span className="text-[10px] text-muted font-medium">{file.category} • {file.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] text-muted font-medium">{file.date}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      file.status === 'Verified' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center text-muted text-xs">No data available yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Upcoming Renewals Timeline & AI Co-pilot Box */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Timeline of upcoming renewals */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider mb-4 text-foreground">Upcoming Expiration Dates</h3>
            <div className="space-y-4">
              {pendingChecks.map((check) => {
                const isExpired = check.status === 'EXPIRED';
                const daysLeft = Math.ceil((new Date(check.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={check.id} className="relative pl-6 border-l-2 border-border pb-1">
                    {/* Circle Indicator */}
                    <span className={`absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                      isExpired ? 'bg-red-500' : daysLeft <= 15 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <strong className="block text-foreground font-bold leading-tight">{check.title}</strong>
                        <span className="text-[10px] text-muted font-medium">Due: {new Date(check.dueDate).toLocaleDateString()}</span>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide shrink-0 ${
                        isExpired 
                          ? 'text-red-500 bg-red-500/10' 
                          : daysLeft <= 15 
                            ? 'text-amber-500 bg-amber-500/10' 
                            : 'text-emerald-500 bg-emerald-500/10'
                      }`}>
                        {isExpired ? 'Expired' : `${daysLeft} Days left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Status summary widget */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider mb-3 text-foreground">Active Disputes</h3>
            <div className="p-4 bg-muted-background/30 border border-border rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">TLC Summon #2940</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 uppercase">In Progress</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Summon dispute files uploaded. Support agent has forwarded documents to legal team review.</p>
              <Link href="/dashboard/support" className="block text-[11px] font-bold text-gold-primary hover:text-gold-hover pt-1">
                View Chat Thread &rarr;
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* ── BROWSER WEBCALL SOFTPHONE MODAL OVERLAY ── */}
      {isCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-[#0B0B0B]/95 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-6 overflow-hidden flex flex-col justify-between max-h-[90vh]">
            
            {/* Header / Connection Info */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  callState === 'listening' ? 'bg-emerald-500 animate-ping' :
                  callState === 'speaking' ? 'bg-amber-500 animate-pulse' :
                  callState === 'connecting' ? 'bg-blue-400 animate-pulse' :
                  callState === 'ended' ? 'bg-rose-500' : 'bg-zinc-600'
                }`} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-heading">
                  AI Support Line
                </span>
              </div>
              <button 
                onClick={endCall} 
                className="text-zinc-600 hover:text-zinc-300 border-0 bg-transparent cursor-pointer transition-colors"
                disabled={callState === 'ended'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Caller Profile */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-[#F5C400]/10 border border-[#F5C400]/20 flex items-center justify-center text-[#F5C400] mx-auto relative shadow-2xl">
                {callState === 'listening' ? (
                  <div className="absolute inset-0 rounded-full border border-[#F5C400]/30 animate-ping" />
                ) : null}
                <Phone className={`w-8 h-8 ${callState === 'listening' || callState === 'speaking' ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-foreground text-sm tracking-wide">JNI Solutions Virtual Agent</h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {callState === 'connecting' ? 'Connecting secure audio link...' :
                   callState === 'speaking' ? 'AI Voice Response Active' :
                   callState === 'listening' ? 'Listening to voice...' :
                   callState === 'ended' ? 'Call Terminated' : 'Line Established'}
                </span>
              </div>
            </div>

            {/* Dynamic Volume Visualizer Canvas */}
            <div className="bg-zinc-950/80 rounded-2xl border border-zinc-900 p-4 h-24 flex items-center justify-center overflow-hidden">
              {callState === 'connecting' ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-6 bg-zinc-800 rounded animate-pulse" />
                  <span className="w-1.5 h-10 bg-zinc-800 rounded animate-pulse delay-75" />
                  <span className="w-1.5 h-8 bg-zinc-800 rounded animate-pulse delay-150" />
                  <span className="w-1.5 h-12 bg-zinc-800 rounded animate-pulse delay-300" />
                </div>
              ) : callState === 'ended' ? (
                <span className="text-[10px] text-rose-500 uppercase tracking-widest font-extrabold">Link Closed</span>
              ) : (
                <canvas ref={canvasRef} width="320" height="80" className="w-full h-full" />
              )}
            </div>

            {/* Conversation Log Timeline */}
            <div className="flex-1 overflow-y-auto border border-zinc-900 bg-zinc-950/40 rounded-xl p-3.5 space-y-3 min-h-[160px] max-h-[220px]">
              {callTranscripts.length === 0 ? (
                <p className="text-[10px] text-zinc-600 text-center py-10 italic">Initializing speech channel...</p>
              ) : (
                callTranscripts.map((t, idx) => (
                  <div key={idx} className={`flex flex-col ${t.speaker === 'DRIVER' ? 'items-end' : 'items-start'} space-y-1`}>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-wider">
                      {t.speaker === 'DRIVER' ? 'Driver' : 'AI Assistant'}
                    </span>
                    <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-[11px] leading-relaxed ${
                      t.speaker === 'DRIVER' 
                        ? 'bg-gold-primary text-black font-semibold rounded-tr-none' 
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none'
                    }`}>
                      {t.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Call Control Center Panel */}
            <div className="flex items-center justify-center gap-4 border-t border-zinc-900 pt-4 shrink-0">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                disabled={callState === 'connecting' || callState === 'ended'}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                  isCallMuted 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20 font-bold' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                disabled={callState === 'ended'}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
