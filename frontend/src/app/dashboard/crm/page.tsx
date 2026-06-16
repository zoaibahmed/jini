'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  X, 
  ChevronRight, 
  ArrowRight,
  TrendingDown,
  Layers,
  Activity,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  language: string;
  source: string; // WEBSITE | PHONE | WHATSAPP | CALLBACK
  status: string; // NEW | CONTACTED | FOLLOW_UP | QUALIFIED | CONVERTED | LOST
  notes: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  calls?: Array<{ id: string; note: string; agentName: string; createdAt: string }>;
  meetings?: Array<{ id: string; agenda: string; scheduled: string; createdAt: string }>;
  appointments?: Array<{ id: string; title: string; scheduledTime: string }>;
  sales?: Array<{ id: string; amount: number; product: string; createdAt: string }>;
  user?: { id: string; name: string; email: string } | null;
}

interface CRMStats {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  revenueGenerated: number;
  conversionRate: number;
}

interface BusinessAnalytics {
  mrr: number;
  arr: number;
  churnRate: number;
  arpu: number;
  ltv: number;
  conversionRate: number;
  activeSubscribers: number;
  scheduledBookings: number;
  history: {
    months: string[];
    subscribers: number[];
    revenue: number[];
  };
}

const STATUS_COLUMNS = ['NEW', 'CONTACTED', 'FOLLOW_UP', 'QUALIFIED', 'CONVERTED', 'LOST'];

export default function CRMPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'DIRECTORY' | 'ANALYTICS'>('KANBAN');
  
  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [crmStats, setCRMStats] = useState<CRMStats | null>(null);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selected Lead detail modal/sidebar
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeLeadDetails, setActiveLeadDetails] = useState<Lead | null>(null);
  
  // Add Lead form modal
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadLang, setNewLeadLang] = useState('English');
  const [newLeadSource, setNewLeadSource] = useState('PHONE');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [addingLead, setAddingLead] = useState(false);

  // Edit Lead form modal
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editLeadName, setEditLeadName] = useState('');
  const [editLeadPhone, setEditLeadPhone] = useState('');
  const [editLeadEmail, setEditLeadEmail] = useState('');
  const [editLeadLang, setEditLeadLang] = useState('English');
  const [editLeadSource, setEditLeadSource] = useState('PHONE');
  const [editLeadNotes, setEditLeadNotes] = useState('');
  const [updatingLead, setUpdatingLead] = useState(false);

  // CRM Log form state
  const [logType, setLogType] = useState<'CALL' | 'MEETING' | 'SALE'>('CALL');
  const [callNote, setCallNote] = useState('');
  const [callAgent, setCallAgent] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleProduct, setSaleProduct] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  // Convert / Link to User Account state
  const [linkUserId, setLinkUserId] = useState('');
  const [linkingLead, setLinkingLead] = useState(false);

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const token = getCookie('jni_access_token');
      
      let queryUrl = `${API_URL}/crm/leads`;
      const queryParams = [];
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (statusFilter !== 'ALL') queryParams.push(`status=${statusFilter}`);
      if (queryParams.length > 0) {
        queryUrl += `?${queryParams.join('&')}`;
      }

      const res = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load leads list.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = getCookie('jni_access_token');
      
      // CRM KPIs
      const resStats = await fetch(`${API_URL}/crm/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resStats.ok) {
        const data = await resStats.json();
        setCRMStats(data);
      }
      
      // Business Analytics
      const resAnalytics = await fetch(`${API_URL}/crm/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      loadLeads();
      loadStats();
    }
  }, [user, statusFilter]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  // Add Lead
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    try {
      setAddingLead(true);
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/crm/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newLeadName,
          phone: newLeadPhone,
          email: newLeadEmail || undefined,
          language: newLeadLang,
          source: newLeadSource,
          notes: newLeadNotes || undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create lead.');

      toast.success('New lead generated successfully.');
      setIsAddLeadOpen(false);
      
      // Reset form
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadNotes('');
      
      loadLeads();
      loadStats();
    } catch (err: any) {
      toast.error('Error creating lead.');
    } finally {
      setAddingLead(false);
    }
  };

  // Get single lead details on click
  const handleViewLeadDetails = async (leadId: string) => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/crm/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveLeadDetails(data);
        setSelectedLead(data);
      }
    } catch (e) {
      toast.error('Failed to retrieve lead logs timeline.');
    }
  };

  // Update Status in columns
  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/crm/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Lead transitioned to ${status}`);
        loadLeads();
        loadStats();
        if (activeLeadDetails && activeLeadDetails.id === leadId) {
          handleViewLeadDetails(leadId);
        }
      }
    } catch (e) {
      toast.error('Error updating status.');
    }
  };

  // Convert/Link to registered account
  const handleLinkToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadDetails || !linkUserId) return;

    try {
      setLinkingLead(true);
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/crm/leads/${activeLeadDetails.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: linkUserId })
      });

      if (!res.ok) throw new Error('Association failed.');

      toast.success('Lead converted. User account linked.');
      setLinkUserId('');
      handleViewLeadDetails(activeLeadDetails.id);
      loadLeads();
      loadStats();
    } catch (err: any) {
      toast.error('Error matching lead to user account ID.');
    } finally {
      setLinkingLead(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      await handleUpdateStatus(leadId, status);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/crm/leads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Lead deleted successfully.');
        setActiveLeadDetails(null);
        setSelectedLead(null);
        loadLeads();
        loadStats();
      }
    } catch (e) {
      toast.error('Error deleting lead.');
    }
  };

  // Edit Lead Details
  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadDetails) return;

    try {
      setUpdatingLead(true);
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/crm/leads/${activeLeadDetails.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editLeadName,
          phone: editLeadPhone,
          email: editLeadEmail || null,
          language: editLeadLang,
          source: editLeadSource,
          notes: editLeadNotes || null
        })
      });

      if (!res.ok) throw new Error('Failed to update lead details.');

      toast.success('Lead details updated successfully.');
      setIsEditLeadOpen(false);
      handleViewLeadDetails(activeLeadDetails.id);
      loadLeads();
      loadStats();
    } catch (err: any) {
      toast.error('Error updating lead details.');
    } finally {
      setUpdatingLead(false);
    }
  };

  const startEditLead = (lead: Lead) => {
    setEditLeadName(lead.name);
    setEditLeadPhone(lead.phone);
    setEditLeadEmail(lead.email || '');
    setEditLeadLang(lead.language);
    setEditLeadSource(lead.source);
    setEditLeadNotes(lead.notes || '');
    setIsEditLeadOpen(true);
  };

  // Log interaction events (Calls, Meetings, Sales)
  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadDetails) return;

    try {
      setSubmittingLog(true);
      const token = getCookie('jni_access_token');
      let endpoint = '';
      let body: any = {};

      if (logType === 'CALL') {
        endpoint = `${API_URL}/crm/leads/${activeLeadDetails.id}/calls`;
        body = { agentName: callAgent || user?.name || 'CRM Agent', note: callNote };
      } else if (logType === 'MEETING') {
        endpoint = `${API_URL}/crm/leads/${activeLeadDetails.id}/meetings`;
        body = { agenda: meetingAgenda, scheduled: meetingSchedule };
      } else if (logType === 'SALE') {
        endpoint = `${API_URL}/crm/leads/${activeLeadDetails.id}/sales`;
        body = { amount: parseFloat(saleAmount), product: saleProduct };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Submission failed.');

      toast.success(`${logType} logged onto lead timeline.`);
      
      // Reset forms
      setCallNote('');
      setMeetingAgenda('');
      setMeetingSchedule('');
      setSaleAmount('');
      setSaleProduct('');
      
      handleViewLeadDetails(activeLeadDetails.id);
      loadStats();
    } catch (err: any) {
      toast.error(`Error logging ${logType.toLowerCase()}.`);
    } finally {
      setSubmittingLog(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground flex items-center gap-2">
            <span>CRM & Lead Engine</span>
          </h1>
          <p className="text-muted text-sm font-medium font-heading">
            Track outbound callback funnels, conversion rates, and lifetime value analytics.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="px-4 py-2.5 bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats overview row */}
      {crmStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Total Leads</span>
            <div className="flex items-baseline gap-1 mt-2">
              <strong className="text-2xl font-heading font-extrabold text-foreground">{crmStats.totalLeads}</strong>
              <Users className="w-3.5 h-3.5 text-gold-primary" />
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Qualified Leads</span>
            <div className="flex items-baseline gap-1 mt-2">
              <strong className="text-2xl font-heading font-extrabold text-foreground">{crmStats.qualifiedLeads}</strong>
              <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Conversions</span>
            <div className="flex items-baseline gap-1 mt-2">
              <strong className="text-2xl font-heading font-extrabold text-foreground">{crmStats.convertedLeads}</strong>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">SUBSCRIBERS</span>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Revenue generated</span>
            <div className="flex items-baseline gap-0.5 mt-2">
              <strong className="text-2xl font-heading font-extrabold text-foreground">${crmStats.revenueGenerated.toLocaleString()}</strong>
              <DollarSign className="w-3.5 h-3.5 text-[#F5C400]" />
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Lead Conversion Rate</span>
            <div className="flex items-baseline gap-1 mt-2">
              <strong className="text-2xl font-heading font-extrabold text-foreground">{crmStats.conversionRate.toFixed(1)}%</strong>
              <Percent className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs / Panel Selector */}
      <div className="flex justify-between items-center border-b border-border pb-1">
        <div className="bg-card border border-border p-1.5 rounded-2xl flex gap-1 select-none no-scrollbar">
          {(['KANBAN', 'DIRECTORY', 'ANALYTICS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-colors shrink-0 ${
                activeTab === tab 
                  ? 'bg-gold-primary text-black' 
                  : 'text-muted hover:bg-muted-background hover:text-foreground'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left/Middle Content: Based on Tab */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeTab === 'KANBAN' && (
            /* KANBAN PIPELINE VIEW */
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {STATUS_COLUMNS.map((status) => {
                const columnLeads = leads.filter(l => l.status === status);
                return (
                  <div 
                    key={status} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="bg-card border border-border rounded-2xl p-4 flex flex-col min-w-[200px] h-[600px] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
                      <span className="text-[10px] font-extrabold text-foreground uppercase tracking-wider">{status}</span>
                      <span className="text-[10px] font-bold bg-muted-background px-2 py-0.5 rounded text-muted">
                        {columnLeads.length}
                      </span>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      {columnLeads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => handleViewLeadDetails(lead.id)}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`p-3 bg-muted-background/30 border rounded-xl hover:border-gold-primary/30 transition-all cursor-pointer space-y-2 hover:shadow-sm ${
                            activeLeadDetails?.id === lead.id ? 'border-gold-primary' : 'border-border'
                          }`}
                        >
                          <div>
                            <strong className="text-xs font-bold text-foreground block truncate">{lead.name}</strong>
                            <span className="text-[10px] text-muted block">{lead.phone}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400">
                            <span className="bg-card px-1.5 py-0.5 rounded border border-border">{lead.source}</span>
                            <span>{new Date(lead.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                          </div>

                          {/* Quick transitions inside card */}
                          <div className="pt-2 border-t border-border/40 flex justify-end gap-1.5">
                            <select
                              value={lead.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                              className="bg-card text-[9px] font-bold border border-border rounded p-0.5 outline-none text-muted focus:text-foreground"
                            >
                              {STATUS_COLUMNS.map(sc => (
                                <option key={sc} value={sc}>{sc}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'DIRECTORY' && (
            /* LEADS DIRECTORY LIST */
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-xs">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Search name, phone, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    />
                  </div>
                  <Button type="submit" size="sm" className="bg-[#0B0B0B] text-white border border-border hover:bg-muted-background text-xs">
                    Find
                  </Button>
                </form>

                {/* Filter Status */}
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                  <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filter:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-background text-xs border border-border rounded-xl px-2.5 py-1.5 text-foreground outline-none"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    {STATUS_COLUMNS.map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent animate-spin mx-auto mb-2" />
                  <p className="text-[11px] text-muted">Retrieving leads database...</p>
                </div>
              ) : leads.length === 0 ? (
                <p className="text-xs text-muted text-center py-12">No leads matching search parameters were found.</p>
              ) : (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleViewLeadDetails(lead.id)}
                      className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted-background/30 transition-all cursor-pointer ${
                        activeLeadDetails?.id === lead.id ? 'bg-gold-glow/5 border-l-2 border-[#F5C400]' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <strong className="text-xs font-bold text-foreground block">{lead.name}</strong>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-gold-primary" /> {lead.phone}</span>
                          {lead.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3 text-gold-primary" /> {lead.email}</span>}
                          <span>Source: {lead.source}</span>
                          <span>Lang: {lead.language}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                          lead.status === 'CONVERTED' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : lead.status === 'LOST'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {lead.status}
                        </span>
                        
                        {lead.user && (
                          <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-0.5">
                            <CheckCircle className="w-3.5 h-3.5 fill-current" /> Link: {lead.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ANALYTICS' && analytics && (
            /* ANALYTICS CHARTS & METRICS */
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SaaS Metrics block */}
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold-primary" />
                    <span>SaaS Revenue Core</span>
                  </h2>

                  <div className="divide-y divide-border text-xs">
                    <div className="py-3 flex justify-between">
                      <span className="text-muted font-semibold">Monthly Recurring Revenue (MRR)</span>
                      <strong className="text-foreground font-bold">${analytics.mrr.toLocaleString()}</strong>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="text-muted font-semibold">Annual Recurring Revenue (ARR)</span>
                      <strong className="text-foreground font-bold">${analytics.arr.toLocaleString()}</strong>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="text-muted font-semibold">Average Revenue Per User (ARPU)</span>
                      <strong className="text-foreground font-bold">${analytics.arpu.toFixed(2)}</strong>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="text-muted font-semibold">Customer Lifetime Value (LTV)</span>
                      <strong className="text-foreground font-bold">${analytics.ltv.toFixed(2)}</strong>
                    </div>
                    <div className="py-3 flex justify-between">
                      <span className="text-muted font-semibold">Subscription Churn Rate</span>
                      <strong className="text-red-500 font-bold">{analytics.churnRate.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                {/* Operations Core KPI */}
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-gold-primary" />
                      <span>Subscriber Retention</span>
                    </h2>
                    <p className="text-[11px] text-muted font-medium mt-1 leading-normal">
                      Tracks absolute active subscribers and scheduling commitments inside JNI platforms.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                        <span>Active SaaS Subscribers</span>
                        <span className="text-foreground font-bold">{analytics.activeSubscribers} / 5,000 Goal</span>
                      </div>
                      <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                        <div className="bg-gold-primary h-full rounded-full" style={{ width: `${Math.min((analytics.activeSubscribers / 5000) * 100, 100)}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
                        <span>Booked consultations</span>
                        <span className="text-foreground font-bold">{analytics.scheduledBookings} Active</span>
                      </div>
                      <div className="w-full bg-muted-background h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full animate-pulse" style={{ width: '45%' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Pure CSS Charts representing historical acquisitions */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Historical SaaS Growth (Subscribers)</h3>
                
                <div className="h-48 w-full flex items-end justify-between gap-2 pt-6">
                  {analytics.history.months.map((month, idx) => {
                    const subs = analytics.history.subscribers[idx];
                    const heightPercent = Math.min((subs / 150) * 100, 100);
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <span className="text-[10px] font-bold text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          {subs}
                        </span>
                        <div 
                          className="w-full bg-gold-primary/20 border border-gold-primary/30 rounded-t-lg group-hover:bg-gold-primary transition-all duration-300 relative"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gold-hover rounded-t" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 mt-1">{month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Side: Lead Card Detail Panel & Timeline logs */}
        <div className="lg:col-span-4 space-y-6">
          {activeLeadDetails ? (
            <div className="space-y-6">
              
              {/* Lead detail profile */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">{activeLeadDetails.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold bg-[#0B0B0B] text-gold-primary border border-gold-primary/20 px-2 py-0.5 rounded uppercase inline-block">
                        Source: {activeLeadDetails.source}
                      </span>
                      <button
                        onClick={() => startEditLead(activeLeadDetails)}
                        className="text-[10px] font-extrabold text-gold-primary hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      <span className="text-muted text-[10px]">•</span>
                      <button
                        onClick={() => handleDeleteLead(activeLeadDetails.id)}
                        className="text-[10px] font-extrabold text-red-500 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setActiveLeadDetails(null)} className="text-muted hover:text-foreground cursor-pointer">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="text-xs space-y-2.5 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Phone:</span>
                    <strong className="text-foreground font-bold">{activeLeadDetails.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Email:</span>
                    <strong className="text-foreground font-bold">{activeLeadDetails.email || 'None'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Language:</span>
                    <strong className="text-foreground font-bold">{activeLeadDetails.language}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-semibold">Status:</span>
                    <select
                      value={activeLeadDetails.status}
                      onChange={(e) => handleUpdateStatus(activeLeadDetails.id, e.target.value)}
                      className="bg-background text-xs border border-border rounded-lg px-2 py-1 text-foreground font-bold"
                    >
                      {STATUS_COLUMNS.map(sc => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                  {activeLeadDetails.notes && (
                    <div className="pt-2">
                      <span className="text-[10px] font-extrabold uppercase text-muted tracking-wider block mb-1">Lead Notes</span>
                      <p className="p-2.5 bg-muted-background/25 border border-border/60 rounded-lg text-[11px] leading-relaxed text-slate-500">
                        {activeLeadDetails.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* USER ACCOUNT LINKING / CONVERSION */}
                <div className="border-t border-border pt-4 space-y-3 bg-muted-background/10 p-3.5 rounded-xl border border-dashed border-border/80">
                  <strong className="text-xs font-bold text-foreground block flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>User Account Link</span>
                  </strong>
                  
                  {activeLeadDetails.user ? (
                    <div className="text-[11px] space-y-0.5">
                      <span className="text-emerald-500 font-bold block">CONVERTED REGISTERED USER</span>
                      <span className="text-muted font-semibold block">ID: {activeLeadDetails.user.id}</span>
                      <span className="text-muted font-semibold block">Email: {activeLeadDetails.user.email}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleLinkToUser} className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-medium">Link this lead card to their newly created User account ID to track conversion rates.</p>
                      <input
                        type="text"
                        required
                        placeholder="Paste User Account UUID..."
                        value={linkUserId}
                        onChange={(e) => setLinkUserId(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-foreground focus:outline-none"
                      />
                      <Button
                        type="submit"
                        disabled={linkingLead}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg uppercase w-full cursor-pointer"
                      >
                        {linkingLead ? 'Linking...' : 'Confirm User Registration'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* TIMELINE LOG RECORDER */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-gold-primary tracking-wider flex items-center gap-1">
                  <Activity className="w-4.5 h-4.5" />
                  <span>Log Lead Interaction</span>
                </h3>

                <div className="flex border border-border p-1 rounded-xl bg-muted-background/40">
                  {(['CALL', 'MEETING', 'SALE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLogType(t)}
                      className={`flex-1 py-1.5 text-[9px] font-extrabold rounded-lg uppercase transition-colors ${
                        logType === t 
                          ? 'bg-[#0B0B0B] text-gold-primary' 
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogInteraction} className="space-y-3">
                  {logType === 'CALL' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted tracking-wider">Agent Name</label>
                        <input
                          type="text"
                          placeholder="Agent Name..."
                          value={callAgent}
                          onChange={(e) => setCallAgent(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted tracking-wider">Call Notes</label>
                        <textarea
                          placeholder="TLC renewal checklist reviewed with driver. Follow up scheduled..."
                          required
                          value={callNote}
                          onChange={(e) => setCallNote(e.target.value)}
                          rows={2}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {logType === 'MEETING' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted tracking-wider">Meeting Agenda</label>
                        <input
                          type="text"
                          placeholder="e.g. In-person DMV Summons Mitigation Review"
                          required
                          value={meetingAgenda}
                          onChange={(e) => setMeetingAgenda(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted tracking-wider">Scheduled Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={meetingSchedule}
                          onChange={(e) => setMeetingSchedule(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {logType === 'SALE' && (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted tracking-wider">Sale Product / Plan</label>
                        <select
                          required
                          value={saleProduct}
                          onChange={(e) => setSaleProduct(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        >
                          <option value="">SELECT PRODUCT...</option>
                          <option value="Basic Support Plan">Basic Support Plan</option>
                          <option value="Premium Driver Pro Subscription">Premium Driver Pro Subscription</option>
                          <option value="Enterprise Taxi Fleet License">Enterprise Taxi Fleet License</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-muted tracking-wider">Invoice Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 19.00"
                          required
                          value={saleAmount}
                          onChange={(e) => setSaleAmount(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submittingLog}
                    className="bg-[#0B0B0B] text-gold-primary hover:bg-[#F5C400] hover:text-black border border-gold-primary/20 font-extrabold text-[10px] uppercase w-full py-2 rounded-lg cursor-pointer"
                  >
                    {submittingLog ? 'Logging Event...' : `Save ${logType}`}
                  </Button>
                </form>
              </div>

              {/* TIMELINE TIMESTAMPS OF LOGS */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-extrabold uppercase text-gold-primary tracking-wider">Lead Activity Timeline</h3>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* Calls */}
                  {activeLeadDetails.calls?.map((c) => (
                    <div key={c.id} className="p-3 bg-muted-background/25 border border-border rounded-xl text-[11px] space-y-1 relative">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>📞 Phone Call Logged</span>
                        <span className="text-[9px] text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-500 leading-normal font-semibold italic">&ldquo;{c.note}&rdquo;</p>
                      <span className="text-[9px] text-muted block text-right font-semibold">— Agent: {c.agentName}</span>
                    </div>
                  ))}

                  {/* Meetings */}
                  {activeLeadDetails.meetings?.map((m) => (
                    <div key={m.id} className="p-3 bg-muted-background/25 border border-border rounded-xl text-[11px] space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>🤝 Meeting Scheduled</span>
                        <span className="text-[9px] text-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-foreground font-bold">{m.agenda}</p>
                      <span className="text-[10px] text-gold-primary block font-semibold">
                        Scheduled for: {new Date(m.scheduled).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {/* Sales */}
                  {activeLeadDetails.sales?.map((s) => (
                    <div key={s.id} className="p-3 bg-muted-background/25 border border-border rounded-xl text-[11px] space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>💰 Sales Invoice Logged</span>
                        <span className="text-[9px] text-muted">{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-emerald-500 font-extrabold">{s.product}</p>
                      <strong className="text-foreground font-extrabold block text-sm">${s.amount.toFixed(2)}</strong>
                    </div>
                  ))}

                  {/* Appointments */}
                  {activeLeadDetails.appointments?.map((a) => (
                    <div key={a.id} className="p-3 bg-muted-background/25 border border-border rounded-xl text-[11px] space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>📅 Consultation Booked</span>
                        <span className="text-[9px] text-muted">Active</span>
                      </div>
                      <p className="text-foreground font-bold">{a.title}</p>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Time: {new Date(a.scheduledTime).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {/* Fallback */}
                  {(!activeLeadDetails.calls?.length && 
                    !activeLeadDetails.meetings?.length && 
                    !activeLeadDetails.sales?.length && 
                    !activeLeadDetails.appointments?.length) && (
                      <p className="text-[10px] text-muted text-center py-4">No logged interactions on this lead profile timeline.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center py-16 space-y-3">
              <Users className="w-10 h-10 text-muted mx-auto" />
              <h3 className="text-sm font-bold text-foreground">Select a Lead</h3>
              <p className="text-xs text-muted max-w-xs mx-auto">Click on a lead card from the Kanban columns or Directory lists to view details and log call, meeting, or sales activities.</p>
            </div>
          )}
        </div>

      </div>

      {/* GENERATE LEAD MODAL */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-extrabold uppercase text-gold-primary tracking-wider">Generate CRM Lead Card</h3>
              <button onClick={() => setIsAddLeadOpen(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Driver Full Name..."
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Phone number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (718) 555-0199..."
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="driver@gmail.com..."
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Preferred Language</label>
                  <select
                    value={newLeadLang}
                    onChange={(e) => setNewLeadLang(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Bengali">Bengali</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Lead Source</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="PHONE">PHONE CALL</option>
                    <option value="WEBSITE">WEBSITE CTA</option>
                    <option value="WHATSAPP">WHATSAPP INBOUND</option>
                    <option value="CALLBACK">GUEST CALLBACK FORM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Notes / Summary</label>
                <textarea
                  placeholder="Reason for consultation..."
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={addingLead}
                className="bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs px-5 py-3 rounded-xl uppercase tracking-wider w-full cursor-pointer"
              >
                {addingLead ? 'Submitting...' : 'Save Lead'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {isEditLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-extrabold uppercase text-gold-primary tracking-wider">Edit Lead Details</h3>
              <button onClick={() => setIsEditLeadOpen(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditLead} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Driver Full Name..."
                  value={editLeadName}
                  onChange={(e) => setEditLeadName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Phone number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (718) 555-0199..."
                    value={editLeadPhone}
                    onChange={(e) => setEditLeadPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="driver@gmail.com..."
                    value={editLeadEmail}
                    onChange={(e) => setEditLeadEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Preferred Language</label>
                  <select
                    value={editLeadLang}
                    onChange={(e) => setEditLeadLang(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Mandarin">Mandarin</option>
                    <option value="Bengali">Bengali</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Lead Source</label>
                  <select
                    value={editLeadSource}
                    onChange={(e) => setEditLeadSource(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="PHONE">PHONE CALL</option>
                    <option value="WEBSITE">WEBSITE CTA</option>
                    <option value="WHATSAPP">WHATSAPP INBOUND</option>
                    <option value="CALLBACK">GUEST CALLBACK FORM</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Notes / Summary</label>
                <textarea
                  placeholder="Reason for consultation..."
                  value={editLeadNotes}
                  onChange={(e) => setEditLeadNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={updatingLead}
                className="bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs px-5 py-3 rounded-xl uppercase tracking-wider w-full cursor-pointer"
              >
                {updatingLead ? 'Updating...' : 'Update Lead'}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
