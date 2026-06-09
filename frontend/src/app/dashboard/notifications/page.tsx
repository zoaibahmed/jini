'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Ticket, 
  DollarSign, 
  ShieldCheck, 
  Trash2, 
  CheckCheck,
  CheckCircle,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';
import { io } from 'socket.io-client';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt?: string | null;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const fetchNotifications = async () => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Could not fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Listen for real-time notifications on this page as well
    const newSocket = io(`${API_URL}/notifications`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('register', { userId: user.id });
    });

    newSocket.on('notification', (newNotif: NotificationItem) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  const tabs = ['ALL', 'INFO', 'WARNING', 'SUCCESS', 'ERROR'];

  const getIcon = (type: string) => {
    switch (type) {
      case 'WARNING': return AlertTriangle;
      case 'ERROR': return Clock;
      case 'SUCCESS': return CheckCircle;
      default: return ShieldCheck;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'ERROR': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'SUCCESS': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-gold-primary bg-gold-glow border-gold-primary/20';
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to mark read');
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
      toast.success('Notification marked as read.');
    } catch (err: any) {
      toast.error('Could not mark notification as read.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete');
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Alert deleted.');
    } catch (err: any) {
      toast.error('Could not delete notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to mark all read');

      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (err: any) {
      toast.error('Could not mark notifications as read.');
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('All alerts dismissed.');
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Some time ago';
    }
  };

  const filteredAlerts = notifications.filter(n => activeTab === 'ALL' || n.type === activeTab);
  const unreadCount = notifications.filter(n => !n.readAt && !n.read && !n.isRead).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground flex items-center gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-muted text-sm font-medium font-heading">Monitor critical compliance alerts, billing slips, and ticket replies.</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 border border-border hover:bg-muted-background transition-colors text-xs font-bold uppercase rounded-xl flex items-center gap-1 bg-card text-foreground cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-gold-primary" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 border border-border hover:bg-red-500/10 transition-colors text-xs font-bold uppercase rounded-xl flex items-center gap-1 bg-card text-red-500 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Inbox</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="bg-card border border-border p-2 rounded-2xl flex gap-1.5 overflow-x-auto select-none no-scrollbar max-w-xl">
        {tabs.map((tab) => {
          const count = notifications.filter(n => (tab === 'ALL' || n.type === tab) && !n.readAt && !n.read && !n.isRead).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === tab 
                  ? 'bg-gold-primary text-black' 
                  : 'text-muted hover:bg-muted-background hover:text-foreground'
              }`}
            >
              <span>{tab}</span>
              {count > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === tab ? 'bg-black' : 'bg-red-500 animate-pulse'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts Checklist */}
      {loading ? (
        <div className="text-center py-24 bg-card border border-border rounded-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-gold-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-xs text-muted">Retrieving alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-2xl space-y-4">
          <div className="w-14 h-14 bg-gold-glow border border-gold-primary/20 rounded-full flex items-center justify-center text-gold-primary mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">Notification Log Cleared</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">You have no active alerts under this category. Everything is secured.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {filteredAlerts.map((alert) => {
            const Icon = getIcon(alert.type);
            const isRead = !!alert.readAt || alert.read || alert.isRead;
            return (
              <div 
                key={alert.id} 
                className={`p-5 flex gap-4 transition-colors items-start ${
                  isRead ? 'bg-card' : 'bg-gold-glow/5 border-l-2 border-[#F5C400]'
                }`}
              >
                {/* Category Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${getColors(alert.type)}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start text-xs">
                    <strong className="text-foreground font-bold">{alert.title}</strong>
                    <span className="text-[10px] text-muted font-medium">{formatTimeAgo(alert.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 pt-2.5">
                    {!isRead && (
                      <button 
                        onClick={() => handleMarkRead(alert.id)}
                        className="text-[10px] font-extrabold uppercase text-gold-primary hover:text-gold-hover flex items-center gap-0.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(alert.id)}
                      className="text-[10px] font-extrabold uppercase text-red-500 hover:text-red-650 flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Alert</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
