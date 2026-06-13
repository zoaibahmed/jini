'use client';
import Link from 'next/link';

import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { API_URL } from '@/config';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Compass, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  User,
  Plus,
  Trash2,
  Pin,
  ThumbsUp,
  ThumbsDown,
  Check,
  Globe,
  Sliders,
  Database,
  BarChart3,
  RefreshCw,
  X,
  Clipboard,
  Search,
  BookOpen,
  Eye,
  Cpu,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id?: string;
  message: string;
  sender: 'USER' | 'AI';
  timestamp: Date;
  isPinned?: boolean;
  confidenceScore?: number;
  ticketCreated?: any;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface AIPrompt {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  category: string;
}

interface AIKnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export default function DriverCopilot() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'chat' | 'admin'>('chat');
  const [adminSubTab, setAdminSubTab] = useState<'prompts' | 'knowledge' | 'analytics'>('prompts');

  // Chat variables
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Settings
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedProvider, setSelectedProvider] = useState('n8n');

  // Feedback states
  const [ratingMessageId, setRatingMessageId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Admin Prompt state
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [activePromptEdit, setActivePromptEdit] = useState<Partial<AIPrompt>>({
    name: 'JNI_DRIVER_COPILOT_SYSTEM',
    content: '',
    category: 'GENERAL',
    isActive: true,
  });

  // Admin FAQ state
  const [knowledgeDocs, setKnowledgeDocs] = useState<AIKnowledgeDoc[]>([]);
  const [newDoc, setNewDoc] = useState({
    title: '',
    content: '',
    category: 'TLC',
    tagsString: '',
  });

  // Admin Analytics state
  const [metrics, setMetrics] = useState<any>({
    totalCalls: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCost: 0,
    avgLatencyMs: 0,
    providers: [],
    recentLogs: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const [subscription, setSubscription] = useState<any>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Load chat sessions and subscription on mount
  useEffect(() => {
    fetchSessions();
    if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPPORT') {
      fetchAdminData();
    }
    
    // Fetch subscription for premium gating logic
    const token = getCookie('jni_access_token');
    if (token && user) {
      fetch(`${API_URL}/billing/subscription`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setSubscription(data))
      .catch(e => console.warn('Failed to load subscription'));
    }
  }, [user]);

  // Connect socket
  useEffect(() => {
    const token = getCookie('jni_access_token');
    const newSocket = io(`${API_URL}/copilot`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocket(null);
    });

    newSocket.on('streamStart', (data: any) => {
      setIsTyping(false);
      // Ensure placeholder message exists
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, {
          id: data.id,
          message: '',
          sender: 'AI',
          timestamp: new Date(),
        }];
      });
    });

    newSocket.on('streamToken', (data: any) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.id) {
          return { ...m, message: data.text };
        }
        return m;
      }));
    });

    newSocket.on('receiveMessage', (data: any) => {
      setIsTyping(false);
      setMessages(prev => {
        const index = prev.findIndex(m => m.id === data.id);
        const finalMsg: ChatMessage = {
          id: data.id,
          message: data.message,
          sender: data.sender,
          timestamp: new Date(data.timestamp),
          isPinned: data.isPinned,
          confidenceScore: data.confidenceScore,
          ticketCreated: data.ticketCreated,
        };

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = finalMsg;
          return updated;
        } else {
          return [...prev, finalMsg];
        }
      });

      // If a ticket was created, trigger a toast notification
      if (data.ticketCreated) {
        toast.info(`Auto-Escalated: Created Support Case ${data.ticketCreated.ticketId}`);
      }

      // Re-fetch chat sessions to update titles/times
      fetchSessions();
    });

    return () => {
      newSocket.close();
    };
  }, [activeSessionId, selectedLanguage, selectedProvider]);

  // Fetch all chats
  const fetchSessions = async () => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/copilot/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions(data);

      // Auto select first chat if activeSessionId is empty
      if (data.length > 0 && !activeSessionId) {
        selectSession(data[0].id);
      } else if (data.length === 0) {
        // Create initial default chat
        handleCreateSession();
      }
    } catch (e) {
      console.warn('Failed to load chat history.');
    }
  };

  const selectSession = async (id: string) => {
    setActiveSessionId(id);
    setMessages([]);
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/copilot/chats/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.map((m: any) => ({
        id: m.id,
        message: m.message,
        sender: m.sender,
        timestamp: new Date(m.createdAt),
        isPinned: m.isPinned,
        confidenceScore: m.confidenceScore,
      })));
    } catch (e) {
      toast.error('Failed to load messages.');
    }
  };

  const handleCreateSession = async () => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/copilot/chats`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title: `Copilot chat #${sessions.length + 1}` }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions(prev => [data, ...prev]);
      setActiveSessionId(data.id);
      setMessages([]);
      // Default welcome prompt
      setMessages([
        {
          message: "👋 Welcome to JNI Solutions! I am your AI Co-pilot.\n\nAsk me anything about:\n• Airport flight arrivals & surge forecasts (e.g. \"Is JFK busy?\")\n• Your TLC compliance status (e.g. \"What checks do I have due?\")\n• Earnings stats (e.g. \"Show my earnings summary\")",
          sender: 'AI',
          timestamp: new Date(),
        }
      ]);
    } catch (e) {
      toast.error('Failed to start new chat.');
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/copilot/chats/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Chat deleted');
      if (activeSessionId === id) {
        setActiveSessionId('');
        setMessages([]);
      }
      fetchSessions();
    } catch (err) {
      toast.error('Could not delete chat');
    }
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Append User Message to State
    const userMsg: ChatMessage = {
      message: text,
      sender: 'USER',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    if (isConnected && socket) {
      setIsTyping(true);
      socket.emit('sendMessage', {
        message: text,
        chatId: activeSessionId,
        driverId: user?.id,
        language: selectedLanguage,
        provider: selectedProvider,
      });
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          message: '🤖 Assistant Offline Fallback:\n\nPlease check your server socket network connection. Check that the NestJS backend is listening on http://localhost:5000.',
          sender: 'AI',
          timestamp: new Date(),
        }]);
      }, 1000);
    }
  };

  // Actions: Pin Message
  const togglePin = async (msgId: string) => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/copilot/messages/${msgId}/pin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned: updated.isPinned } : m));
      toast.success(updated.isPinned ? 'Message pinned' : 'Message unpinned');
    } catch (e) {
      toast.error('Failed to pin message');
    }
  };

  // Actions: Copy response
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Response copied to clipboard');
  };

  // Actions: Feedback thumbs up/down
  const handleRating = async (msgId: string, rating: 'THUMBS_UP' | 'THUMBS_DOWN') => {
    if (rating === 'THUMBS_DOWN') {
      setRatingMessageId(msgId);
    } else {
      await submitFeedback(msgId, 'THUMBS_UP');
    }
  };

  const submitFeedback = async (msgId: string, rating: string) => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/copilot/messages/${msgId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: feedbackComment || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success('Feedback logged, thank you!');
      setRatingMessageId(null);
      setFeedbackComment('');
    } catch (e) {
      toast.error('Failed to submit feedback');
    }
  };

  // ADMIN CONTROLS FETCH & MUTATIONS
  const fetchAdminData = async () => {
    const token = getCookie('jni_access_token');
    try {
      // Prompts
      const resPrompts = await fetch(`${API_URL}/copilot/admin/prompts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resPrompts.ok) {
        const data = await resPrompts.json();
        setPrompts(data);
        const active = data.find((p: any) => p.isActive);
        if (active) setActivePromptEdit(active);
      }

      // FAQs Knowledge
      const resFAQ = await fetch(`${API_URL}/copilot/admin/knowledge`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resFAQ.ok) {
        const data = await resFAQ.json();
        setKnowledgeDocs(data);
      }

      // Analytics
      const resMetrics = await fetch(`${API_URL}/copilot/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data);
      }
    } catch (e) {
      console.warn('Unauthorized or failed admin data fetch.');
    }
  };

  const handleSavePrompt = async () => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/copilot/admin/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(activePromptEdit),
      });
      if (!res.ok) throw new Error();
      toast.success('AI Prompt configured successfully');
      fetchAdminData();
    } catch (e) {
      toast.error('Could not save prompt config');
    }
  };

  const handleAddKnowledge = async () => {
    const token = getCookie('jni_access_token');
    const tags = newDoc.tagsString.split(',').map(t => t.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API_URL}/copilot/admin/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newDoc.title,
          content: newDoc.content,
          category: newDoc.category,
          tags,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('FAQ Knowledge Document added');
      setNewDoc({ title: '', content: '', category: 'TLC', tagsString: '' });
      fetchAdminData();
    } catch (e) {
      toast.error('Could not save FAQ document');
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    const token = getCookie('jni_access_token');
    try {
      const res = await fetch(`${API_URL}/copilot/admin/knowledge/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Document deleted');
      fetchAdminData();
    } catch (e) {
      toast.error('Failed to delete document');
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedQuestions = [
    { title: 'What documents expire soon?', query: 'What documents expire soon?', icon: AlertTriangle },
    { title: 'How do I renew my TLC license?', query: 'How do I renew my TLC license?', icon: BookOpen },
    { title: 'Show my compliance status.', query: 'Show my compliance status.', icon: ShieldCheck },
    { title: 'Help me upload documents.', query: 'Help me upload documents.', icon: FileText },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPPORT';

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.5rem)] border border-border bg-card rounded-2xl overflow-hidden relative transition-all duration-300">
      
      {/* Header Bar */}
      <div className="glass border-b border-border px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gold-glow border border-gold-primary/20 flex items-center justify-center text-gold-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-sm sm:text-base leading-tight">AI Assistant</h1>
            <span className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5 font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isConnected ? 'Real-time WebSocket Operational' : 'Offline Gateway'}
            </span>
          </div>
        </div>

        {/* Action Button: Call AI Assistant */}
        <button
          onClick={() => {
            const isPremium = subscription?.status === 'ACTIVE' && 
              (subscription?.planId === 'premium' || subscription?.plan?.name?.toLowerCase().includes('premium'));

            if (isPremium) {
              toast.info('AI Voice Support: Coming Soon to your Premium account!');
            } else {
              setShowPremiumModal(true);
            }
          }}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary rounded-xl text-xs font-bold transition-all border border-gold-primary/20"
        >
          <span>📞 Call AI Assistant</span>
        </button>

        {/* Tab Toggle for Admin */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <div className="flex p-0.5 bg-muted-background border border-border rounded-xl">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'chat' 
                    ? 'bg-gold-primary text-black' 
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin' 
                    ? 'bg-gold-primary text-black' 
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>AI Console</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {activeTab === 'chat' ? (
          <>
            {/* LEFT SIDEBAR: Conversations List */}
            <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-muted-background/10 shrink-0">
              {/* Search Bar */}
              <div className="p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl">
                  <Search className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full text-foreground"
                  />
                </div>
              </div>

              {/* Chat Session Listing */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <Button
                  onClick={handleCreateSession}
                  className="w-full justify-start gap-2 bg-muted-background border border-border text-foreground hover:bg-[#F5C400] hover:text-[#0b0b0b] font-bold text-xs py-5 rounded-xl shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Conversation</span>
                </Button>

                <div className="border-t border-border/60 my-3" />

                {filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => selectSession(session.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer group transition-all ${
                        isActive
                          ? 'bg-gold-primary/10 border-gold-primary/30 text-gold-primary'
                          : 'bg-card border-border hover:bg-muted-background/45 text-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <MessageSquare className="w-4 h-4 shrink-0 text-muted" />
                        <span className="text-xs font-bold truncate">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* MIDDLE CHAT WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted-background/5 justify-between">
              {/* Settings selectors */}
              <div className="flex flex-wrap gap-2.5 items-center justify-between px-6 py-2 border-b border-border/60 bg-card text-xs shrink-0 select-none">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-muted">Active Model Engine:</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="bg-muted-background border border-border rounded-lg px-2.5 py-1 font-bold outline-none text-foreground"
                  >
                    <option value="n8n">n8n AI Webhook (Production)</option>
                    <option value="OpenAI">OpenAI GPT-4o (Primary)</option>
                    <option value="Gemini">Gemini 1.5 Pro</option>
                    <option value="Claude">Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Globe className="w-3.5 h-3.5 text-gold-primary" />
                  <span className="font-bold text-muted">Translate assistant:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-muted-background border border-border rounded-lg px-2.5 py-1 font-bold outline-none text-foreground"
                  >
                    <option value="Auto-Detect">Auto-Detect Language</option>
                    <option value="English">English</option>
                    <option value="Urdu">Urdu (اردو)</option>
                    <option value="Bangla">Bangla (বাংলা)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                  </select>
                </div>
              </div>

              {/* Message Streams */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {messages.map((msg, idx) => {
                  const isAI = msg.sender === 'AI';
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-3 max-w-[85%] ${
                        isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border text-xs font-bold ${
                        isAI 
                          ? 'bg-gold-glow border-gold-primary/20 text-gold-primary' 
                          : 'bg-muted-background border-border text-foreground'
                      }`}>
                        {isAI ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1 w-full">
                        <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border relative group ${
                          isAI 
                            ? 'bg-card border-border text-foreground rounded-tl-none font-medium' 
                            : 'bg-gold-primary border-gold-hover text-black rounded-tr-none font-semibold shadow-md shadow-gold-glow'
                        }`}>
                          {/* Pin indicator */}
                          {msg.isPinned && (
                            <span className="absolute top-2 right-2 text-gold-primary" title="Pinned message">
                              <Pin className="w-3 h-3 fill-current rotate-45" />
                            </span>
                          )}

                          {/* Text render */}
                          {msg.message.split('\n').map((line, lIdx) => (
                            <p key={lIdx} className={line ? 'mb-1.5 last:mb-0' : 'h-2'}>{line}</p>
                          ))}

                          {/* Actions overlay for AI */}
                          {isAI && msg.id && (
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => togglePin(msg.id!)}
                                className={`p-1.5 rounded hover:bg-muted-background transition-colors ${
                                  msg.isPinned ? 'text-gold-primary' : 'text-slate-400'
                                }`}
                                title="Pin response"
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => copyToClipboard(msg.message)}
                                className="p-1.5 rounded hover:bg-muted-background text-slate-400 hover:text-white transition-colors"
                                title="Copy text"
                              >
                                <Clipboard className="w-3.5 h-3.5" />
                              </button>
                              <div className="border-l border-border h-4 mx-1" />
                              <button 
                                onClick={() => handleRating(msg.id!, 'THUMBS_UP')}
                                className="p-1.5 rounded hover:bg-muted-background text-slate-400 hover:text-emerald-500 transition-colors"
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleRating(msg.id!, 'THUMBS_DOWN')}
                                className="p-1.5 rounded hover:bg-muted-background text-slate-400 hover:text-rose-500 transition-colors"
                                title="Unhelpful"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>

                              {msg.confidenceScore && (
                                <span className="ml-auto text-[9px] text-muted font-mono font-semibold">
                                  Confidence: {(msg.confidenceScore * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className={`text-[9px] text-muted block mt-0.5 ${
                          isAI ? 'ml-1' : 'text-right mr-1'
                        }`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing animation */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-muted ml-11">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-primary animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Thumbs Down Comments Dialog Overlay */}
              {ratingMessageId && (
                <div className="px-6 py-3 border-t border-border bg-rose-500/5 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between text-xs text-rose-500 font-bold">
                    <span>How can we improve this response?</span>
                    <button onClick={() => setRatingMessageId(null)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Comment e.g., misleading renewal schedule, wrong phone number..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="flex-1 bg-card border border-border text-xs rounded-xl px-3 py-2 outline-none text-foreground"
                    />
                    <Button 
                      onClick={() => submitFeedback(ratingMessageId, 'THUMBS_DOWN')}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                    >
                      Submit Comment
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Actions and Suggested Questions */}
              {messages.length <= 1 && (
                <div className="p-6 bg-card shrink-0 flex flex-col gap-6 overflow-y-auto">
                  
                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider mb-3 text-muted">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Check Compliance Status', 'View Required Documents', 'Subscription Help', 'Contact Support', 'Driver Onboarding Help'].map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(action)}
                          className="px-3 py-1.5 rounded-lg bg-muted-background border border-border hover:border-gold-primary/40 transition-all text-[11px] font-semibold text-foreground flex items-center"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Questions */}
                  <div>
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider mb-3 text-muted">Suggested Questions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {suggestedQuestions.map((preset, idx) => {
                        const Icon = preset.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(preset.query)}
                            className="p-3 rounded-xl border border-border hover:border-gold-primary/40 hover:bg-muted-background transition-all flex items-start gap-3 text-left"
                          >
                            <Icon className="w-4 h-4 text-gold-primary shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-foreground">{preset.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-card shrink-0">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }}
                  className="flex items-center gap-2.5 bg-muted-background/40 border border-border p-1.5 rounded-2xl"
                >
                  <input 
                    type="text" 
                    placeholder="Ask AI Assistant anything..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 outline-none text-xs sm:text-sm px-3 text-foreground"
                  />
                  <button 
                    type="submit"
                    className="w-10 h-10 rounded-xl bg-gold-primary hover:bg-gold-hover text-black flex items-center justify-center transition-all duration-300 shadow-md shadow-gold-glow shrink-0 animate-pulse"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          /* ADMIN/SUPPORT AI CONSOLE VIEW */
          <div className="flex-1 flex overflow-hidden min-h-0 bg-muted-background/10">
            {/* Sidebar for Sub Tabs */}
            <aside className="w-56 border-r border-border flex flex-col p-4 space-y-1.5 shrink-0 bg-card">
              <button
                onClick={() => setAdminSubTab('prompts')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  adminSubTab === 'prompts'
                    ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20'
                    : 'text-muted hover:text-foreground hover:bg-muted-background'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Prompt Config</span>
              </button>

              <button
                onClick={() => setAdminSubTab('knowledge')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  adminSubTab === 'knowledge'
                    ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20'
                    : 'text-muted hover:text-foreground hover:bg-muted-background'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>RAG FAQ docs</span>
              </button>

              <button
                onClick={() => setAdminSubTab('analytics')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  adminSubTab === 'analytics'
                    ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20'
                    : 'text-muted hover:text-foreground hover:bg-muted-background'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Usage Metrics</span>
              </button>
            </aside>

            {/* Admin Content Pane */}
            <div className="flex-1 overflow-y-auto p-8 min-h-0">
              
              {/* SUB TAB: Prompt Configuration */}
              {adminSubTab === 'prompts' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-foreground">AI Assistant Prompt Engine</h2>
                    <p className="text-xs text-muted mt-1">Configure active system instructions and behavior guidelines governing responses.</p>
                  </div>

                  <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted uppercase">Prompt Registry Identifier</label>
                        <input
                          type="text"
                          value={activePromptEdit.name || ''}
                          onChange={(e) => setActivePromptEdit(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="JNI_DRIVER_COPILOT_SYSTEM"
                          className="w-full bg-muted-background border border-border rounded-xl p-3 text-xs font-semibold outline-none focus:border-gold-primary text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted uppercase">Category</label>
                        <select
                          value={activePromptEdit.category || 'GENERAL'}
                          onChange={(e) => setActivePromptEdit(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-muted-background border border-border rounded-xl p-3 text-xs font-bold outline-none text-foreground"
                        >
                          <option value="GENERAL">GENERAL</option>
                          <option value="TLC">TLC</option>
                          <option value="DMV">DMV</option>
                          <option value="BILLING">BILLING</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted uppercase">System Prompt Content</label>
                      <textarea
                        rows={10}
                        value={activePromptEdit.content || ''}
                        onChange={(e) => setActivePromptEdit(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write standard prompt instructions..."
                        className="w-full bg-muted-background border border-border rounded-xl p-4 text-xs font-semibold outline-none focus:border-gold-primary text-foreground resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSavePrompt}
                        className="bg-gold-primary text-black hover:bg-gold-hover font-bold text-xs rounded-xl"
                      >
                        Publish Active Prompt Version
                      </Button>
                    </div>
                  </div>

                  {/* Registered versions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted uppercase">Prompts History</h3>
                    <div className="space-y-2">
                      {prompts.map((p) => (
                        <div key={p.id} className="p-4 border border-border rounded-xl bg-card flex justify-between items-center text-xs">
                          <div>
                            <strong className="text-foreground block">{p.name}</strong>
                            <span className="text-[10px] text-muted font-mono">{p.category}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                            p.isActive 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-muted-background text-muted border border-border'
                          }`}>
                            {p.isActive ? 'Active version' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB TAB: Knowledge FAQ Docs */}
              {adminSubTab === 'knowledge' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-foreground">RAG Knowledge Base & FAQs</h2>
                    <p className="text-xs text-muted mt-1">Manage FAQs and reference pages matched by keywords during the driver co-pilot query pipeline.</p>
                  </div>

                  {/* Add document card */}
                  <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-muted uppercase">Add FAQ Reference Article</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold text-muted uppercase">Article Title</label>
                        <input
                          type="text"
                          value={newDoc.title}
                          onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Woodside Safety inspection details"
                          className="w-full bg-muted-background border border-border rounded-xl p-3 text-xs font-semibold outline-none focus:border-gold-primary text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase">Category</label>
                        <select
                          value={newDoc.category}
                          onChange={(e) => setNewDoc(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-muted-background border border-border rounded-xl p-3 text-xs font-bold outline-none text-foreground"
                        >
                          <option value="TLC">TLC</option>
                          <option value="DMV">DMV</option>
                          <option value="INSURANCE">INSURANCE</option>
                          <option value="BILLING">BILLING</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted uppercase">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={newDoc.tagsString}
                        onChange={(e) => setNewDoc(prev => ({ ...prev, tagsString: e.target.value }))}
                        placeholder="renew, course, deadline"
                        className="w-full bg-muted-background border border-border rounded-xl p-3 text-xs font-semibold outline-none focus:border-gold-primary text-foreground"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted uppercase">Content</label>
                      <textarea
                        rows={4}
                        value={newDoc.content}
                        onChange={(e) => setNewDoc(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write detailed instructions..."
                        className="w-full bg-muted-background border border-border rounded-xl p-4 text-xs font-semibold outline-none focus:border-gold-primary text-foreground resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={handleAddKnowledge}
                        className="bg-gold-primary text-black hover:bg-gold-hover font-bold text-xs rounded-xl"
                      >
                        Publish FAQ Reference
                      </Button>
                    </div>
                  </div>

                  {/* List FAQ documents */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted uppercase">Index Reference docs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {knowledgeDocs.map((doc) => (
                        <div key={doc.id} className="p-5 border border-border rounded-2xl bg-card flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-extrabold text-foreground">{doc.title}</h4>
                              <span className="px-2 py-0.5 rounded bg-gold-primary/10 text-gold-primary border border-gold-primary/20 text-[9px] font-bold">
                                {doc.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted line-clamp-3 leading-relaxed font-semibold">{doc.content}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="bg-muted-background border border-border px-1.5 py-0.5 rounded text-[8px] font-mono text-muted">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end border-t border-border/50 pt-3.5 mt-4">
                            <button
                              onClick={() => handleDeleteKnowledge(doc.id)}
                              className="text-xs text-rose-500 hover:underline font-bold flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB TAB: Usage metrics */}
              {adminSubTab === 'analytics' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-foreground">AI System Usage Metrics</h2>
                    <p className="text-xs text-muted mt-1">Aggregated statistics mapping request costs, response latencies, and token allocations.</p>
                  </div>

                  {/* Summary boxes */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 border border-border bg-card rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">API Calls</span>
                      <strong className="text-xl font-heading font-extrabold block text-foreground">{metrics.totalCalls}</strong>
                    </div>

                    <div className="p-5 border border-border bg-card rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Prompt Tokens</span>
                      <strong className="text-xl font-heading font-extrabold block text-foreground">{metrics.totalPromptTokens}</strong>
                    </div>

                    <div className="p-5 border border-border bg-card rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Completion Tokens</span>
                      <strong className="text-xl font-heading font-extrabold block text-foreground">{metrics.totalCompletionTokens}</strong>
                    </div>

                    <div className="p-5 border border-border bg-card rounded-2xl space-y-1">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Accumulated Cost</span>
                      <strong className="text-xl font-heading font-extrabold block text-emerald-500">${metrics.totalCost.toFixed(4)}</strong>
                    </div>
                  </div>

                  {/* Provider breakout */}
                  <div className="p-6 border border-border bg-card rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-muted uppercase">Distribution by Provider</h3>
                    <div className="space-y-2">
                      {metrics.providers.map((p: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-foreground">{p.provider}</span>
                            <span className="text-muted">{p.count} requests ({((p.count / metrics.totalCalls) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gold-primary h-full rounded-full" 
                              style={{ width: `${(p.count / metrics.totalCalls) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Logs Table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted uppercase">Recent Request Logs</h3>
                    <div className="border border-border rounded-xl overflow-hidden bg-card">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted-background/40 border-b border-border/80 text-muted font-bold">
                            <th className="p-3">Provider</th>
                            <th className="p-3">Model</th>
                            <th className="p-3">Prompt Tokens</th>
                            <th className="p-3">Completion Tokens</th>
                            <th className="p-3">Latency (ms)</th>
                            <th className="p-3">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {metrics.recentLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-muted-background/10 font-medium">
                              <td className="p-3 text-gold-primary font-bold">{log.provider}</td>
                              <td className="p-3 font-mono text-[10px]">{log.modelName}</td>
                              <td className="p-3">{log.promptTokens}</td>
                              <td className="p-3">{log.completionTokens}</td>
                              <td className="p-3 font-mono">{log.durationMs}ms</td>
                              <td className="p-3 text-emerald-500 font-bold">${log.cost.toFixed(5)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="bg-gold-primary p-6 text-black text-center relative overflow-hidden">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-90" />
              <h2 className="text-2xl font-heading font-extrabold tracking-tight">Upgrade to Premium</h2>
              <p className="text-sm font-semibold mt-1 opacity-90">Unlock the full power of JNI AI</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-500 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">AI Voice Support</h4>
                    <p className="text-xs text-muted font-medium mt-0.5">Talk naturally with our AI assistant over a phone call anytime.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-500 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Priority Assistance</h4>
                    <p className="text-xs text-muted font-medium mt-0.5">Skip the queue and get your compliance issues resolved instantly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-500 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Advanced Driver Guidance</h4>
                    <p className="text-xs text-muted font-medium mt-0.5">Get personalized strategies to maximize your earnings and compliance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted-background/30 border-t border-border flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowPremiumModal(false)}
              >
                Maybe Later
              </Button>
              <Link href="/dashboard/billing" className="flex-1">
                <Button className="w-full bg-gold-primary text-black hover:bg-gold-hover border-0">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
