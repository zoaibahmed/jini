'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';
import { API_URL, getSocketConfig } from '@/config';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText,
  Clock,
  Ticket,
  Sparkles,
  DollarSign,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  X,
  Menu,
  ChevronDown,
  MessageSquare,
  Send,
  User,
  PhoneCall,
  BookOpen,
  Calendar,
  Users
} from 'lucide-react';
import { useTheme } from '../theme-provider';
import { useAuth } from '@/hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { io } from 'socket.io-client';
import { useToast } from '@/components/ui/toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Floating AI Widget State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id?: string; sender: 'USER' | 'AI'; text: string }>>([
    { sender: 'AI', text: 'Hello! I am your JNI AI Assistant. How can I help you with your TLC compliance check, drug test schedules, or summons disputes today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Real-time Notification State
  const [unreadCount, setUnreadCount] = useState(0);

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  useEffect(() => {
    if (!user) return;

    const token = getCookie('jni_access_token');
    
    // Fetch initial count of unread notifications
    fetch(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const unread = data.filter((n: any) => !n.readAt && !n.read && !n.isRead).length;
          setUnreadCount(unread);
        }
      })
      .catch((err) => console.warn('Failed to fetch notifications:', err));

    // Connect to Notifications Namespace
    const socketCfg = getSocketConfig('notifications');
    const newSocket = io(socketCfg.url, socketCfg.options);

    newSocket.on('connect', () => {
      newSocket.emit('register', { userId: user.id });
      if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        newSocket.emit('joinAdminRoom');
      }
    });

    newSocket.on('notification', (notification: any) => {
      setUnreadCount((prev) => prev + 1);
      toast.info(`🔔 ${notification.title}: ${notification.message}`);
    });

    return () => {
      newSocket.close();
    };
  }, [user]);



  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isSupport = user?.role === 'SUPPORT';
  const isStaff = isSuperAdmin || isAdmin || isSupport;
  const isActualAdmin = isSuperAdmin || isAdmin;

  const navigation = [
    { 
      name: isActualAdmin 
        ? 'Admin Panel' 
        : isSupport 
          ? 'Support Dashboard' 
          : 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard 
    },
    ...(!isStaff ? [
      { name: 'My Documents', href: '/dashboard/documents', icon: FileText },
      { name: 'Renewals', href: '/dashboard/renewals', icon: Clock },
    ] : []),
    { name: isStaff ? 'Support Queue' : 'Support Center', href: '/dashboard/support', icon: Ticket },
    // { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    ...(isActualAdmin ? [
      { name: 'CRM & Leads', href: '/dashboard/crm', icon: Users },
    ] : []),
    // ...(isStaff ? [
    //   { name: 'Voice Center', href: '/dashboard/voice', icon: PhoneCall },
    //   { name: 'WhatsApp Inbox', href: '/dashboard/whatsapp', icon: MessageSquare },
    // ] : []),
    { name: 'AI Assistant', href: '/dashboard/copilot', icon: Sparkles },
    // { name: 'Learning Center', href: '/dashboard/resources', icon: BookOpen },
    ...(!isStaff ? [
      { name: 'Billing', href: '/dashboard/billing', icon: DollarSign },
    ] : []),
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'D';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initials = getInitials(user?.name);
  const displayName = user?.name || 'Active Driver';
  const roleDisplay = user?.role ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Profile` : 'Active Shift';

  // Floating AI responses via Socket.io
  const [copilotSocket, setCopilotSocket] = useState<any>(null);

  useEffect(() => {
    if (!isAiOpen || !user) {
      if (copilotSocket) {
        copilotSocket.disconnect();
        setCopilotSocket(null);
      }
      return;
    }

    const token = getCookie('jni_access_token');
    const socketCfg = getSocketConfig('copilot');
    const newSocket = io(socketCfg.url, socketCfg.options);

    newSocket.on('connect', () => {
      console.log('Floating AI widget connected to copilot socket');
    });

    newSocket.on('streamStart', (data: any) => {
      setIsTyping(false);
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, { id: data.id, sender: 'AI', text: '' }];
      });
    });

    newSocket.on('streamToken', (data: any) => {
      setMessages(prev => prev.map(m => {
        if (m.id === data.id) {
          return { ...m, text: data.text };
        }
        return m;
      }));
    });

    newSocket.on('receiveMessage', (data: any) => {
      setIsTyping(false);
      setMessages(prev => {
        const index = prev.findIndex(m => m.id === data.id);
        const finalMsg = { id: data.id, sender: 'AI' as const, text: data.message };
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = finalMsg;
          return updated;
        } else {
          return [...prev, finalMsg];
        }
      });
    });

    setCopilotSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAiOpen, user]);

  const handleSendAiMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { sender: 'USER', text }]);
    setInput('');
    setIsTyping(true);

    if (copilotSocket && copilotSocket.connected) {
      copilotSocket.emit('sendMessage', {
        message: text,
        driverId: user?.id,
        language: (user as any)?.preferredLanguage || 'English',
        provider: 'OpenAI',
      });
    } else {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          sender: 'AI', 
          text: '🤖 Assistant Offline Fallback:\n\nPlease check your server socket network connection. Check that the NestJS backend is listening on http://localhost:5000.' 
        }]);
      }, 1000);
    }
  };


  useEffect(() => {
    if (isAiOpen) {
      aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiOpen, isTyping]);

  const logoBlendClass = theme === 'dark' ? 'mix-blend-normal' : 'mix-blend-multiply';
  const logoFilterClass = theme === 'dark' ? 'invert hue-rotate-180' : '';
  const isCopilotRoute = pathname === '/dashboard/copilot';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground md:flex-row transition-all duration-300">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-border shrink-0 sticky top-0 h-screen p-5 justify-between z-20">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Logo size="md" variant="auto" />
          </Link>

          {/* User Profile Summary */}
          <div className="flex items-center space-x-3 p-3 bg-muted-background/40 border border-border rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-gold-primary/15 border border-gold-primary/30 flex items-center justify-center text-[#F5C400] font-heading font-extrabold text-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate text-foreground">{displayName}</h4>
              <span className="text-[10px] text-muted flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {roleDisplay}
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-gold-primary text-[#0B0B0B] font-extrabold shadow-md shadow-gold-glow' 
                      : 'text-muted hover:text-foreground hover:bg-muted-background'
                  }`}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </span>
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#0B0B0B] text-gold-primary' : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-2 pt-4 border-t border-border">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-muted-background transition-colors"
          >
            <span className="flex items-center space-x-3">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </span>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors w-full text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-16 glass border-b border-border sticky top-0 z-30">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Logo size="sm" variant="auto" />
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/dashboard/notifications" className="relative p-1.5 text-muted hover:text-foreground transition-colors mr-1">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="w-8 h-8 rounded bg-gold-primary/10 flex items-center justify-center text-[10px] font-bold text-[#F5C400] border border-gold-primary/20">
              {initials}
            </div>
          </div>
        </header>

        {/* Main Dashboard Pages Slot */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom Nav Bar for Mobile Viewports */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass border-t border-border flex items-center justify-around px-2 z-30">
        {navigation.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-[#F5C400]' 
                  : 'text-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] mt-1 font-semibold truncate max-w-full">{item.name.replace('Support Center', 'Support').replace('Support Queue', 'Support')}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Floating AI Assistant Widget */}
      {!isCopilotRoute && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
          <AnimatePresence>
            {isAiOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-80 h-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between mb-3"
              >
                {/* Drawer Header */}
                <div className="bg-[#0B0B0B] text-white p-3.5 flex justify-between items-center border-b border-border">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#F5C400]" />
                    <span className="text-xs font-bold font-heading">AI Assistant</span>
                  </div>
                  <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted-background/10 text-xs">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-2 ${msg.sender === 'AI' ? '' : 'flex-row-reverse ml-auto'}`}>
                      <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[9px] font-bold border ${
                        msg.sender === 'AI' ? 'bg-gold-glow border-gold-primary/20 text-[#F5C400]' : 'bg-muted-background border-border text-foreground'
                      }`}>
                        {msg.sender === 'AI' ? 'AI' : initials}
                      </div>
                      <div className={`p-2.5 rounded-xl leading-relaxed border max-w-[80%] whitespace-pre-line ${
                        msg.sender === 'AI' ? 'bg-card border-border text-foreground' : 'bg-gold-primary text-black font-semibold border-gold-hover'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-1.5 ml-8 text-[10px] text-muted">
                      <span className="w-1 h-1 rounded-full bg-gold-primary animate-ping" />
                      <span>AI writing...</span>
                    </div>
                  )}
                  <div ref={aiChatEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="p-2 border-t border-border flex gap-1 overflow-x-auto bg-muted-background/20 select-none no-scrollbar">
                  <button onClick={() => handleSendAiMessage('check inspections due')} className="shrink-0 px-2 py-1 rounded bg-card border border-border text-[9px] font-semibold text-muted hover:text-foreground">
                    Inspections Due
                  </button>
                  <button onClick={() => handleSendAiMessage('how to renew tlc')} className="shrink-0 px-2 py-1 rounded bg-card border border-border text-[9px] font-semibold text-muted hover:text-foreground">
                    TLC Renewal
                  </button>
                  <button onClick={() => handleSendAiMessage('dispute a summons')} className="shrink-0 px-2 py-1 rounded bg-card border border-border text-[9px] font-semibold text-muted hover:text-foreground">
                    Dispute Summons
                  </button>
                </div>

                {/* Input form */}
                <div className="p-2 border-t border-border bg-card">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(input); }} className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Ask AI Assistant..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-lg px-2.5 py-1.5 outline-none"
                    />
                    <Button type="submit" size="sm" className="bg-[#F5C400] text-black hover:bg-[#D9A300] border-0 h-7 w-7 p-0 flex items-center justify-center">
                      <Send className="w-3 h-3" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger Icon */}
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="w-12 h-12 rounded-full bg-gold-primary text-black hover:bg-gold-hover flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-105 active:scale-95"
            aria-label="Ask AI Assistant"
          >
            {isAiOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5 fill-current animate-pulse" />}
          </button>
        </div>
      )}
    </div>
  );
}
