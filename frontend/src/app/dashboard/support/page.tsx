'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, 
  Plus, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  Clock, 
  X, 
  Paperclip,
  User,
  Shield,
  HelpCircle,
  Search,
  Filter,
  ArrowUpRight,
  Lock,
  AlertCircle,
  Loader2,
  Tag,
  Activity,
  FileText,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Undo,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { io, Socket } from 'socket.io-client';
import { API_URL, getSocketConfig } from '@/config';

interface AttachmentItem {
  id: string;
  name: string;
  s3Key: string;
  sizeBytes: number;
  mimeType: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  message: string;
  createdAt: string;
  attachments?: AttachmentItem[];
}

interface StatusHistoryItem {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: {
    id: string;
    name: string;
    role: string;
  };
  comment: string | null;
  createdAt: string;
}

interface InternalNoteItem {
  id: string;
  note: string;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    email: string;
  };
}

interface EscalationItem {
  id: string;
  reason: string;
  createdAt: string;
  escalatedBy: {
    id: string;
    name: string;
  };
}

interface SupportTicket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: 'TLC' | 'DMV' | 'INSURANCE' | 'ACCOUNT' | 'BILLING' | 'TECHNICAL';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  driverId: string;
  driver: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedAgentId: string | null;
  assignedAgent: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  messages: MessageItem[];
  attachments: AttachmentItem[];
  statusHistory: StatusHistoryItem[];
  internalNotes: InternalNoteItem[];
  escalations: EscalationItem[];
}

export default function SupportCenter() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isAgent = user?.role === 'SUPPORT' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  
  // Tabs for Agents/Admins
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics'>('queue');
  
  // Main Lists
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  
  // Loading indicators
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jni_access_token='))
      ?.split('=')[1] || '';

    if (token && user) {
      fetch(`${API_URL}/billing/subscription`, {
        headers: {
          'x-user-id': user.id,
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSubscription(data);
        }
      })
      .catch(err => console.warn('Failed to fetch subscription in support:', err));
    }
  }, [user]);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Ticket Creator Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>('TLC');
  const [newPriority, setNewPriority] = useState<string>('MEDIUM');
  const [newFiles, setNewFiles] = useState<Array<{ name: string; size: string; s3Key?: string; mimeType?: string; sizeBytes?: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat Input
  const [chatInput, setChatInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Metadata Modification Panel State
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [showEscalateInput, setShowEscalateInput] = useState(false);
  const [assigneeAgentInput, setAssigneeAgentInput] = useState('');
  
  // Websockets Reference
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeTicketRef = useRef<SupportTicket | null>(null);

  // Sync ref for socket closure callbacks
  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  const getToken = () => {
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith('jni_access_token='))
      ?.split('=')[1] || '';
  };

  // Fetch Tickets list from server
  const fetchTickets = async () => {
    try {
      const token = getToken();
      let url = `${API_URL}/support/tickets?page=1&limit=50`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;

      const res = await fetch(url, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'DRIVER',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data.items || []);
      }
    } catch (err) {
      console.warn('Backend ticket API offline, using fallback mock tickets');
      setupFallbackMockTickets();
    } finally {
      setLoading(false);
    }
  };

  // Fetch details of single ticket
  const fetchTicketDetails = async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/tickets/${id}`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'DRIVER',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data);
        setAssigneeAgentInput(data.assignedAgentId || '');
      }
    } catch (err) {
      console.warn('Failed to load live ticket details');
    }
  };

  // Fetch performance metrics for Admin Tab
  const fetchAnalytics = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/admin/analytics`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'DRIVER',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.warn('Analytics API offline. Falling back to simulated metrics.');
      setAnalytics({
        totalTickets: 42,
        openTickets: 12,
        resolvedTickets: 25,
        closedTickets: 5,
        resolutionRate: 71.4,
        avgResponseTimeHours: 1.25,
        agentWorkload: [
          { agentId: 'agent-1', name: 'Sarah Connor', email: 'support@jnisolutions.com', activeTicketsCount: 8 },
          { agentId: 'agent-2', name: 'John Connor', email: 'admin@jnisolutions.com', activeTicketsCount: 4 }
        ],
        categoryMetrics: [
          { category: 'TLC', count: 18 },
          { category: 'DMV', count: 10 },
          { category: 'BILLING', count: 6 },
          { category: 'ACCOUNT', count: 4 },
          { category: 'TECHNICAL', count: 4 }
        ]
      });
    }
  };

  // Setup Fallback Mock Tickets
  const setupFallbackMockTickets = () => {
    const mockList: SupportTicket[] = [
      {
        id: '1',
        ticketId: 'JNI-T-1001',
        title: 'TLC Summon Dispute - High Speed Warning',
        description: 'I received a speed summon notice near LGA airport. The speed limit signs were obscured by construction equipment. I have uploaded pictures of the sign blockage. Need legal representation review to dispute the fine.',
        category: 'TLC',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        driverId: user?.id || 'driver-1',
        driver: { id: 'driver-1', name: 'Alex Mercer', email: 'driver@jnisolutions.com', phone: '+1 (555) 987-6543' },
        assignedAgentId: 'support-1',
        assignedAgent: { id: 'support-1', name: 'Sarah Connor', email: 'support@jnisolutions.com' },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'm1',
            senderId: 'driver-1',
            sender: { id: 'driver-1', name: 'Alex Mercer', email: 'driver@jnisolutions.com', role: 'DRIVER' },
            message: 'Hello, please check my uploaded documents. The speed limit signs were completely hidden by a container.',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'm2',
            senderId: 'support-1',
            sender: { id: 'support-1', name: 'Sarah Connor', email: 'support@jnisolutions.com', role: 'SUPPORT' },
            message: 'Hi Alex, I have received your ticket and the uploaded files. I will forward this to our legal dispute compliance team.',
            createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
          }
        ],
        attachments: [
          { id: 'att-1', name: 'LGA_Obstructed_Sign.jpg', s3Key: 'mock/obstructed.jpg', sizeBytes: 1542000, mimeType: 'image/jpeg' }
        ],
        statusHistory: [
          { id: 'h1', oldStatus: null, newStatus: 'OPEN', changedBy: { id: 'driver-1', name: 'Alex Mercer', role: 'DRIVER' }, comment: 'Ticket created by driver', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
          { id: 'h2', oldStatus: 'OPEN', newStatus: 'IN_PROGRESS', changedBy: { id: 'support-1', name: 'Sarah Connor', role: 'SUPPORT' }, comment: 'Agent assigned. Assigning to compliance team review.', createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() }
        ],
        internalNotes: [
          { id: 'n1', note: 'Valid sign blockage claim. Construction company name is LGA Renovations LLC.', createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(), agent: { id: 'support-1', name: 'Sarah Connor', email: 'support@jnisolutions.com' } }
        ],
        escalations: []
      },
      {
        id: '2',
        ticketId: 'JNI-T-1002',
        title: 'Billing Discrepancy - Double Charge',
        description: 'My credit card was billed twice for the Premium Driver subscription this month. Please issue a refund for the duplicate transaction.',
        category: 'BILLING',
        status: 'OPEN',
        priority: 'MEDIUM',
        driverId: 'driver-2',
        driver: { id: 'driver-2', name: 'Luis R.', email: 'luis.r@jnisolutions.com' },
        assignedAgentId: null,
        assignedAgent: null,
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        messages: [],
        attachments: [],
        statusHistory: [
          { id: 'h3', oldStatus: null, newStatus: 'OPEN', changedBy: { id: 'driver-2', name: 'Luis R.', role: 'DRIVER' }, comment: 'Ticket opened', createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() }
        ],
        internalNotes: [],
        escalations: []
      },
      {
        id: '3',
        ticketId: 'JNI-T-1003',
        title: 'Drug Test Lab Appointment Delay',
        description: 'I went to the LabCorp Woodside location for my annual TLC drug screen but they told me the voucher is expired. Please check.',
        category: 'TECHNICAL',
        status: 'ESCALATED',
        priority: 'URGENT',
        driverId: user?.id || 'driver-1',
        driver: { id: 'driver-1', name: 'Alex Mercer', email: 'driver@jnisolutions.com' },
        assignedAgentId: 'support-1',
        assignedAgent: { id: 'support-1', name: 'Sarah Connor', email: 'support@jnisolutions.com' },
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        attachments: [],
        statusHistory: [
          { id: 'h4', oldStatus: null, newStatus: 'OPEN', changedBy: { id: 'driver-1', name: 'Alex Mercer', role: 'DRIVER' }, comment: 'Ticket opened', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
          { id: 'h5', oldStatus: 'OPEN', newStatus: 'ESCALATED', changedBy: { id: 'support-1', name: 'Sarah Connor', role: 'SUPPORT' }, comment: 'Escalating to admin: voucher expired', createdAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString() }
        ],
        internalNotes: [],
        escalations: [
          { id: 'esc-1', reason: 'Partner voucher batch expired at lab site.', createdAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(), escalatedBy: { id: 'support-1', name: 'Sarah Connor' } }
        ]
      }
    ];

    const visibleMock = mockList.filter(t => isAgent || t.driver.email === user?.email);
    setTickets(visibleMock);
  };

  // Initialize socket client connection
  useEffect(() => {
    if (!user) return;

    fetchTickets();
    if (isAgent && activeTab === 'analytics') {
      fetchAnalytics();
    }

    const socketCfg = getSocketConfig('support');
    const socketInstance = io(socketCfg.url, socketCfg.options);

    socketInstance.on('connect', () => {
      console.log('Successfully connected to real-time Support WS Gateway');
    });

    // Handle real-time incoming messages
    socketInstance.on('messageReceived', (data: any) => {
      if (activeTicketRef.current?.id === data.ticketId) {
        fetchTicketDetails(data.ticketId);
        // Mark read immediately if window is open
        socketInstance.emit('markRead', { ticketId: data.ticketId, userId: user.id });
      }
      fetchTickets();
    });

    // Handle typing status updates
    socketInstance.on('typingStatusReceived', (data: any) => {
      if (activeTicketRef.current?.id === data.ticketId && data.userId !== user.id) {
        setTypingUser(data.isTyping ? data.userName : null);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  // Load analytics when switching tab
  useEffect(() => {
    if (activeTab === 'analytics' && isAgent) {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Scroll to chat bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages, typingUser]);

  // Join/leave websocket rooms when active ticket shifts
  useEffect(() => {
    if (!socket || !user) return;

    if (activeTicket) {
      socket.emit('joinTicket', { ticketId: activeTicket.id, userId: user.id });
      socket.emit('markRead', { ticketId: activeTicket.id, userId: user.id });
    }

    return () => {
      if (activeTicket) {
        socket.emit('leaveTicket', { ticketId: activeTicket.id, userId: user.id });
      }
    };
  }, [activeTicket, socket, user]);

  // File Submission Creator Handler
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      const token = getToken();
      
      // Simulate file upload metadata mapping
      const filesPayload = newFiles.map(f => ({
        name: f.name,
        s3Key: `uploads/driver-support/${Date.now()}_${f.name.replace(/\s+/g, '_')}`,
        sizeBytes: f.name.length * 1540, // Mock bytes size
        mimeType: f.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
      }));

      const res = await fetch(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'DRIVER',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
          files: newFiles.filter(f => f.s3Key).map(f => ({
            name: f.name,
            s3Key: f.s3Key,
            sizeBytes: f.sizeBytes,
            mimeType: f.mimeType
          }))
        })
      });

      if (res.ok) {
        toast.success('Your support ticket has been filed. Agents will review shortly.');
        setIsCreateOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewFiles([]);
        fetchTickets();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create ticket.');
      }
    } catch (err) {
      console.warn('Backend create ticket failed. Simulating local insert.');
      // Local Simulation
      const simulated: SupportTicket = {
        id: `sim-${Date.now()}`,
        ticketId: `JNI-T-${1000 + tickets.length + 1}`,
        title: newTitle,
        description: newDescription,
        category: newCategory as any,
        status: 'OPEN',
        priority: newPriority as any,
        driverId: user?.id || 'driver-1',
        driver: { id: user?.id || 'driver-1', name: user?.name || 'Alex Mercer', email: user?.email || 'driver@jnisolutions.com' },
        assignedAgentId: null,
        assignedAgent: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        attachments: newFiles.map((f, i) => ({
          id: `f-${i}`,
          name: f.name,
          s3Key: 'mock/file.pdf',
          sizeBytes: 14020,
          mimeType: f.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'
        })),
        statusHistory: [
          { id: `h-${Date.now()}`, oldStatus: null, newStatus: 'OPEN', changedBy: { id: user?.id || 'driver-1', name: user?.name || 'Alex Mercer', role: 'DRIVER' }, comment: 'Ticket created', createdAt: new Date().toISOString() }
        ],
        internalNotes: [],
        escalations: []
      };

      setTickets(prev => [simulated, ...prev]);
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewFiles([]);
      toast.success(`Simulated Ticket ${simulated.ticketId} created locally.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Text Message chat replies
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeTicket || !user) return;

    const messageContent = chatInput;
    setChatInput('');
    setChatLoading(true);

    // Stop typing state
    if (typingTimer.current) clearTimeout(typingTimer.current);
    socket?.emit('typingStatus', { ticketId: activeTicket.id, userId: user.id, userName: user.name, isTyping: false });

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/tickets/${activeTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageContent })
      });

      if (res.ok) {
        const msgData = await res.json();
        
        // Notify socket gateway
        socket?.emit('sendMessage', {
          ticketId: activeTicket.id,
          messageId: msgData.id,
          senderName: user.name,
          message: messageContent
        });

        fetchTicketDetails(activeTicket.id);
        fetchTickets();
      }
    } catch (err) {
      console.warn('Backend message submission failed. Simulating local reply.');
      // Local fallback simulation
      const newMsg: MessageItem = {
        id: `m-sim-${Date.now()}`,
        senderId: user.id,
        sender: { id: user.id, name: user.name, email: user.email || '', role: user.role },
        message: messageContent,
        createdAt: new Date().toISOString()
      };

      // Transition status locally
      let nextStatus = activeTicket.status;
      if (!isAgent) {
        if (activeTicket.status === 'RESOLVED' || activeTicket.status === 'CLOSED') {
          nextStatus = 'OPEN';
        }
      } else {
        if (activeTicket.status === 'ASSIGNED' || activeTicket.status === 'IN_PROGRESS') {
          nextStatus = 'WAITING_USER';
        }
      }

      setTickets(prev => prev.map(t => {
        if (t.id === activeTicket.id) {
          const updated = {
            ...t,
            status: nextStatus,
            messages: [...t.messages, newMsg],
            statusHistory: nextStatus !== t.status ? [
              ...t.statusHistory,
              {
                id: `h-sim-${Date.now()}`,
                oldStatus: t.status,
                newStatus: nextStatus,
                changedBy: { id: user.id, name: user.name, role: user.role },
                comment: 'Automated status shift on reply',
                createdAt: new Date().toISOString()
              }
            ] : t.statusHistory
          };
          setActiveTicket(updated);
          return updated;
        }
        return t;
      }));
    } finally {
      setChatLoading(false);
    }
  };

  // Notify websocket when driver/agent types replies
  const handleChatInputChange = (val: string) => {
    setChatInput(val);
    if (!socket || !activeTicket || !user) return;

    // Send typing notification
    socket.emit('typingStatus', {
      ticketId: activeTicket.id,
      userId: user.id,
      userName: user.name,
      isTyping: true
    });

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typingStatus', {
        ticketId: activeTicket.id,
        userId: user.id,
        userName: user.name,
        isTyping: false
      });
    }, 1500);
  };

  // Submit Private Staff Comment Note (Agents/Admins)
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteInput.trim() || !activeTicket || !user) return;

    const note = internalNoteInput;
    setInternalNoteInput('');

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/tickets/${activeTicket.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
      });

      if (res.ok) {
        toast.success('Private internal note logged.');
        fetchTicketDetails(activeTicket.id);
      }
    } catch (err) {
      console.warn('Failed to post live note, simulating locally.');
      const simulatedNote: InternalNoteItem = {
        id: `note-${Date.now()}`,
        note,
        createdAt: new Date().toISOString(),
        agent: { id: user.id, name: user.name, email: user.email || '' }
      };

      setTickets(prev => prev.map(t => {
        if (t.id === activeTicket.id) {
          const updated = {
            ...t,
            internalNotes: [...t.internalNotes, simulatedNote]
          };
          setActiveTicket(updated);
          return updated;
        }
        return t;
      }));
      toast.success('Private note logged locally.');
    }
  };

  // Update Status Manually
  const handleStatusChange = async (newStatus: string) => {
    if (!activeTicket || !user) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/tickets/${activeTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, comment: `Manual override by ${user.role}` })
      });

      if (res.ok) {
        toast.success(`Case status set to ${newStatus}`);
        fetchTicketDetails(activeTicket.id);
        fetchTickets();
      }
    } catch (err) {
      setTickets(prev => prev.map(t => {
        if (t.id === activeTicket.id) {
          const updated: SupportTicket = {
            ...t,
            status: newStatus as any,
            statusHistory: [
              ...t.statusHistory,
              {
                id: `h-${Date.now()}`,
                oldStatus: t.status,
                newStatus: newStatus as any,
                changedBy: { id: user.id, name: user.name, role: user.role },
                comment: 'Manual status update override',
                createdAt: new Date().toISOString()
              }
            ]
          };
          setActiveTicket(updated);
          return updated;
        }
        return t;
      }));
      toast.success(`Simulated status changed to ${newStatus}`);
    }
  };

  // Assign ticket to agent
  const handleAssigneeChange = async (agentId: string) => {
    if (!activeTicket || !user) return;

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/tickets/${activeTicket.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentId: agentId || null })
      });

      if (res.ok) {
        toast.success('Ticket assignee updated.');
        fetchTicketDetails(activeTicket.id);
        fetchTickets();
      }
    } catch (err) {
      setTickets(prev => prev.map(t => {
        if (t.id === activeTicket.id) {
          const updated: SupportTicket = {
            ...t,
            assignedAgentId: agentId || null,
            assignedAgent: agentId ? { id: agentId, name: 'Sarah Connor', email: 'support@jnisolutions.com' } : null,
            status: t.status === 'OPEN' && agentId ? 'ASSIGNED' : t.status,
            statusHistory: [
              ...t.statusHistory,
              {
                id: `h-${Date.now()}`,
                oldStatus: t.status,
                newStatus: t.status === 'OPEN' && agentId ? 'ASSIGNED' : t.status,
                changedBy: { id: user.id, name: user.name, role: user.role },
                comment: agentId ? 'Assigned agent to ticket' : 'Unassigned agent from ticket',
                createdAt: new Date().toISOString()
              }
            ]
          };
          setActiveTicket(updated);
          return updated;
        }
        return t;
      }));
      toast.success('Agent assignee updated locally.');
    }
  };

  // Escalate Ticket to Administrators
  const handleEscalateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateReason.trim() || !activeTicket || !user) return;

    const reason = escalateReason;
    setEscalateReason('');
    setShowEscalateInput(false);

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/support/tickets/${activeTicket.id}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        toast.success('Ticket has been escalated to administration review.');
        fetchTicketDetails(activeTicket.id);
        fetchTickets();
      }
    } catch (err) {
      setTickets(prev => prev.map(t => {
        if (t.id === activeTicket.id) {
          const updated: SupportTicket = {
            ...t,
            status: 'ESCALATED',
            escalations: [
              ...t.escalations,
              {
                id: `esc-${Date.now()}`,
                reason,
                createdAt: new Date().toISOString(),
                escalatedBy: { id: user.id, name: user.name }
              }
            ],
            statusHistory: [
              ...t.statusHistory,
              {
                id: `h-${Date.now()}`,
                oldStatus: t.status,
                newStatus: 'ESCALATED',
                changedBy: { id: user.id, name: user.name, role: user.role },
                comment: `Escalated ticket: ${reason}`,
                createdAt: new Date().toISOString()
              }
            ]
          };
          setActiveTicket(updated);
          return updated;
        }
        return t;
      }));
      toast.success('Ticket escalated locally.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'MEDIUM': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'ASSIGNED': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'IN_PROGRESS': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'WAITING_USER': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'RESOLVED': return 'text-emerald-450 bg-emerald-500/20 border-emerald-500/30';
      case 'CLOSED': return 'text-slate-450 bg-zinc-800 border-[#333]';
      case 'ESCALATED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-150';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 text-gold-primary animate-spin" />
        <h3 className="text-sm font-bold text-foreground">Syncing Ticket Registers...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="w-8 h-8 text-gold-primary" />
            <span>{isAgent ? 'Support Ticket Operations Console' : 'Driver Support & Dispute Center'}</span>
          </h1>
          <p className="text-muted text-sm font-medium">
            {isAgent 
              ? 'Manage driver TLC speed summonses, account lockout disputes, and response logs.' 
              : 'Submit speed ticket summon reviews, dispute rate lockouts, and track updates in real-time.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isAgent && subscription?.planId === 'premium' && (
            <div className="bg-gold-primary/20 border border-gold-primary text-gold-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold animate-pulse-slow">
              <Star className="w-4 h-4 fill-current" />
              Priority Support
            </div>
          )}
          {isAgent && (
            <div className="bg-[#F5F5F5] dark:bg-[#161616] p-1 rounded-xl flex items-center space-x-1 border border-border shrink-0 select-none">
              <button 
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'queue' ? 'bg-card text-foreground shadow-sm' : 'text-slate-450 hover:text-foreground'
                }`}
              >
                Tickets Queue
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'analytics' ? 'bg-card text-foreground shadow-sm' : 'text-slate-450 hover:text-foreground'
                }`}
              >
                Analytics Desk
              </button>
            </div>
          )}

          {!isAgent && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gold-primary hover:bg-gold-hover text-black font-bold text-xs flex items-center gap-1.5 transition-colors border-0 cursor-pointer shadow-md shadow-gold-glow"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Ticket</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'queue' ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex-1 w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search by ID, title, keyword, or driver..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-xl pl-9 pr-4 py-3 outline-none focus:border-[#F5C400] text-foreground font-semibold"
              />
            </div>
            
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto shrink-0 select-none">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-[10px] font-bold uppercase px-3 py-2.5 rounded-xl outline-none text-slate-500"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_USER">Waiting User</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ESCALATED">Escalated</option>
              </select>

              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-[10px] font-bold uppercase px-3 py-2.5 rounded-xl outline-none text-slate-500"
              >
                <option value="">All Categories</option>
                <option value="TLC">TLC Issue</option>
                <option value="DMV">DMV Issue</option>
                <option value="INSURANCE">Insurance Issue</option>
                <option value="ACCOUNT">Account Issue</option>
                <option value="BILLING">Billing Issue</option>
                <option value="TECHNICAL">Technical Support</option>
              </select>

              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-[10px] font-bold uppercase px-3 py-2.5 rounded-xl outline-none text-slate-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {(searchQuery || statusFilter || categoryFilter || priorityFilter) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-[10px] font-bold uppercase py-2 h-9 px-3 rounded-xl border-dashed"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setCategoryFilter('');
                    setPriorityFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Grid Layout: L (Queue List) | R (Ticket details panel) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* L: Tickets Table/List */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-muted-background/25 border-b border-border flex justify-between items-center">
                  <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">
                    {isAgent ? 'Assigned Cases Queue' : 'Your Dispute Ledger'}
                  </h3>
                  <span className="text-[10px] bg-[#F5F5F5] dark:bg-[#1A1A1A] px-2 py-0.5 rounded font-extrabold text-muted border border-border">
                    {tickets.length} cases
                  </span>
                </div>

                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {tickets.map((t) => {
                    const isSelected = activeTicket?.id === t.id;
                    return (
                      <div 
                        key={t.id}
                        onClick={() => fetchTicketDetails(t.id)}
                        className={`p-4 cursor-pointer hover:bg-muted-background/10 transition-colors flex flex-col gap-2 ${
                          isSelected ? 'bg-gold-glow/5 border-l-4 border-l-[#F5C400]' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-450 tracking-wider font-heading">{t.ticketId} • {t.category}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded border text-[8px] font-extrabold ${getPriorityColor(t.priority)}`}>
                              {t.priority}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[8px] font-extrabold ${getStatusColor(t.status)}`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-heading font-bold text-xs text-foreground mt-0.5 truncate">{t.title}</h4>
                        
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{t.description}</p>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-1 border-t border-border/10 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gold-primary" />
                            <span className="truncate max-w-[120px]">{t.driver?.name || 'Unknown Driver'}</span>
                          </span>
                          <span>Updated: {new Date(t.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}

                  {tickets.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted flex flex-col items-center justify-center space-y-3">
                      <HelpCircle className="w-8 h-8 text-slate-350" />
                      <span>No active tickets found. File a new case or adjust search terms.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* R: Case Workspace chat and config panel */}
            <div className="lg:col-span-7">
              {activeTicket ? (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[580px]">
                  
                  {/* LHS: Threaded Chat Stream */}
                  <div className={`flex flex-col justify-between ${isAgent ? 'xl:col-span-7' : 'xl:col-span-12'} border-r border-border h-[580px]`}>
                    {/* Header */}
                    <div className="p-4 bg-[#0B0B0B] text-white flex justify-between items-center border-b border-border">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-[#F5C400] font-bold uppercase tracking-wider bg-[#F5C400]/10 px-2 py-0.5 rounded border border-[#F5C400]/20 inline-block font-heading">
                          {activeTicket.ticketId}
                        </span>
                        <h4 className="font-heading font-extrabold text-xs text-white max-w-[280px] truncate leading-tight pt-1">
                          {activeTicket.title}
                        </h4>
                      </div>
                      <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Stream Container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted-background/5 text-[11px] leading-relaxed">
                      {/* Original description box */}
                      <div className="p-3 bg-muted-background/30 border border-border rounded-xl space-y-1">
                        <span className="text-[9px] text-[#F5C400] font-bold uppercase">Case Intake Details</span>
                        <p className="text-foreground font-medium">{activeTicket.description}</p>
                      </div>

                      {/* Chat messages list */}
                      {activeTicket.messages?.map((msg, index) => {
                        const isSenderAgent = msg.sender?.role === 'SUPPORT' || msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPERADMIN';
                        const isMe = msg.senderId === user?.id;

                        return (
                          <div key={msg.id || index} className={`flex gap-2 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                            <div className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-[9px] font-bold border ${
                              isSenderAgent ? 'bg-gold-glow border-gold-primary/20 text-[#F5C400]' : 'bg-muted-background border-border text-foreground'
                            }`}>
                              {isSenderAgent ? 'AG' : 'DR'}
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[8px] text-muted block px-0.5 font-bold">
                                {msg.sender?.name || 'System User'} ({msg.sender?.role || 'SYSTEM'})
                              </span>
                              <div className={`p-2.5 rounded-xl border ${
                                isMe ? 'bg-gold-primary text-black font-semibold border-gold-hover' : 'bg-card border-border text-foreground'
                              }`}>
                                {msg.message}
                                <span className={`block text-[8px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-slate-400'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Real-time typing animation */}
                      {typingUser && (
                        <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-bold italic pl-2">
                          <Loader2 className="w-3 h-3 animate-spin text-gold-primary" />
                          <span>{typingUser} is typing...</span>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input form */}
                    <form onSubmit={handleSendChatMessage} className="p-3 border-t border-border bg-card flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Type reply message..."
                        value={chatInput}
                        onChange={(e) => handleChatInputChange(e.target.value)}
                        className="flex-1 bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-xl px-3 py-2.5 outline-none font-semibold text-foreground"
                      />
                      <Button 
                        type="submit" 
                        size="sm"
                        disabled={chatLoading} 
                        className="bg-[#F5C400] text-black hover:bg-[#D9A300] border-0 h-9 w-9 p-0 flex items-center justify-center shadow-md shadow-gold-glow shrink-0"
                      >
                        {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </Button>
                    </form>
                  </div>

                  {/* RHS: Metadata panel (Only visible for Agents / Admin) */}
                  {isAgent && (
                    <div className="xl:col-span-5 p-4 space-y-5 h-[580px] overflow-y-auto text-[10px] font-semibold text-slate-500">
                      
                      {/* Ticket parameters */}
                      <div className="space-y-3">
                        <h4 className="font-heading font-extrabold text-xs text-foreground uppercase tracking-wider">Case Action Console</h4>
                        
                        {/* Status Select dropdown */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted uppercase">Override Status</label>
                          <select 
                            value={activeTicket.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs font-semibold p-2.5 rounded-xl outline-none text-foreground"
                          >
                            <option value="OPEN">Open</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="WAITING_USER">Waiting User</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                            <option value="ESCALATED">Escalated</option>
                          </select>
                        </div>

                        {/* Assignee dropdown */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted uppercase">Assigned Agent</label>
                          <select 
                            value={assigneeAgentInput}
                            onChange={(e) => handleAssigneeChange(e.target.value)}
                            className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs font-semibold p-2.5 rounded-xl outline-none text-foreground"
                          >
                            <option value="">Unassigned</option>
                            <option value="support-1">Sarah Connor (Support Agent)</option>
                            <option value="admin-1">John Connor (Administrator)</option>
                            <option value="superadmin-1">Marcus Wright (Super Admin)</option>
                          </select>
                        </div>
                      </div>

                      {/* Escalations Trigger action */}
                      <div className="border-t border-border pt-4">
                        {activeTicket.status !== 'ESCALATED' ? (
                          !showEscalateInput ? (
                            <Button 
                              onClick={() => setShowEscalateInput(true)}
                              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase py-2 rounded-xl"
                            >
                              ⚠️ Escalate to Admin Review
                            </Button>
                          ) : (
                            <form onSubmit={handleEscalateTicket} className="space-y-2">
                              <label className="text-[9px] font-bold text-red-400 uppercase">Escalation Reason</label>
                              <input 
                                type="text" 
                                placeholder="E.g. Partner drug test voucher batch code expired"
                                required
                                value={escalateReason}
                                onChange={(e) => setEscalateReason(e.target.value)}
                                className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-red-500/20 focus:border-red-500 text-xs rounded-xl p-2.5 outline-none text-foreground font-semibold"
                              />
                              <div className="flex gap-1.5 justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-[8px] py-1 h-7 px-2"
                                  onClick={() => setShowEscalateInput(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  size="sm" 
                                  className="bg-red-500 text-white hover:bg-red-600 border-0 text-[8px] py-1 h-7 px-2 font-bold"
                                >
                                  Submit
                                </Button>
                              </div>
                            </form>
                          )
                        ) : (
                          <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 space-y-1">
                            <span className="font-extrabold uppercase text-[8px] block">Escalated Status Active</span>
                            {activeTicket.escalations && activeTicket.escalations[0] && (
                              <p className="font-semibold text-[9px]">Reason: {activeTicket.escalations[0].reason}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Private Internal Notes compiler */}
                      <div className="border-t border-border pt-4 space-y-3">
                        <h4 className="font-heading font-extrabold text-xs text-foreground uppercase tracking-wider">Internal Staff Notes</h4>
                        
                        <div className="space-y-2 max-h-[120px] overflow-y-auto">
                          {activeTicket.internalNotes?.map((note) => (
                            <div key={note.id} className="p-2 bg-[#F5F5F5] dark:bg-[#161616] border border-border rounded-xl">
                              <p className="text-foreground text-[9px] font-medium leading-relaxed">{note.note}</p>
                              <span className="text-[8px] text-muted block mt-1">Logged by: {note.agent.name}</span>
                            </div>
                          ))}
                          {(!activeTicket.internalNotes || activeTicket.internalNotes.length === 0) && (
                            <span className="text-xs italic text-muted block text-center py-2">No agent comments recorded yet.</span>
                          )}
                        </div>

                        <form onSubmit={handleAddInternalNote} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add private staff note..."
                            value={internalNoteInput}
                            onChange={(e) => setInternalNoteInput(e.target.value)}
                            className="flex-1 bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-[9px] rounded-xl px-2 py-2 outline-none text-foreground font-semibold"
                          />
                          <Button type="submit" className="bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black text-[9px] font-bold px-3 py-2 border-0 rounded-xl shrink-0">
                            Save
                          </Button>
                        </form>
                      </div>

                      {/* Visual Case Timeline Progression Log */}
                      <div className="border-t border-border pt-4 space-y-3">
                        <h4 className="font-heading font-extrabold text-xs text-foreground uppercase tracking-wider">Audit Case Timeline</h4>
                        <div className="space-y-2 pl-2">
                          {activeTicket.statusHistory?.map((h, index) => (
                            <div key={h.id || `hist-${index}`} className="relative pl-4 border-l border-border pb-2">
                              <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-gold-primary" />
                              <div className="flex justify-between items-start">
                                <span className="text-foreground font-bold text-[9px]">Status: {h.newStatus}</span>
                                <span className="text-[8px] text-muted">{new Date(h.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-[8px] text-slate-400 mt-0.5">{h.comment || 'Transition log'}</p>
                              <span className="text-[7px] text-muted block">By: {h.changedBy?.name || 'System User'} ({h.changedBy?.role || 'SYSTEM'})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl h-[580px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <MessageSquare className="w-16 h-16 text-slate-350 animate-bounce" />
                  <h4 className="text-sm font-bold text-foreground">
                    {isAgent ? 'Select a Support Ticket' : 'Select a Dispute Case'}
                  </h4>
                  <p className="text-xs text-muted max-w-sm">
                    {isAgent 
                      ? 'Select any ticket from the active list on the left to review chat transcripts, post agent replies, append notes, escalate, or change status.'
                      : 'Click on any support ticket in the side panel to view legal messages, downloads, and ticket resolution logs.'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* ADMIN PERFORMANCE ANALYTICS TAB VIEW */
        <div className="space-y-6 animate-fade-in">
          {analytics ? (
            <>
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl space-y-2 hover-card-glow transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Cases Logged</span>
                  <strong className="text-3xl font-heading font-extrabold text-foreground">{analytics.totalTickets}</strong>
                  <span className="text-[9px] text-slate-500 block">Fleet support historical metrics</span>
                </div>
                <div className="bg-card border border-border p-5 rounded-2xl space-y-2 hover-card-glow transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Open Queue</span>
                  <strong className="text-3xl font-heading font-extrabold text-amber-550">{analytics.openTickets} Cases</strong>
                  <span className="text-[9px] text-slate-500 block">Currently waiting support action</span>
                </div>
                <div className="bg-card border border-border p-5 rounded-2xl space-y-2 hover-card-glow transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Case Resolution Rate</span>
                  <div className="flex items-baseline space-x-2">
                    <strong className="text-3xl font-heading font-extrabold text-emerald-500">{analytics.resolutionRate}%</strong>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +2.5%
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 block">Resolved or Closed tickets ratio</span>
                </div>
                <div className="bg-card border border-border p-5 rounded-2xl space-y-2 hover-card-glow transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Resolution SLA</span>
                  <strong className="text-3xl font-heading font-extrabold text-foreground">{analytics.avgResponseTimeHours} hrs</strong>
                  <span className="text-[9px] text-slate-500 block">From intake to first agent response</span>
                </div>
              </div>

              {/* Main Analytics Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Workload Distribution Table (L) */}
                <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">
                    Support Agent Workload Distribution
                  </h3>
                  
                  <div className="overflow-x-auto text-[10px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-slate-400 font-bold">
                          <th className="pb-3 pr-2">Agent Name</th>
                          <th className="pb-3 pr-2">Email Address</th>
                          <th className="pb-3 text-right">Active Cases</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {analytics.agentWorkload?.map((w: any) => (
                          <tr key={w.agentId} className="font-medium text-foreground">
                            <td className="py-3 pr-2 font-bold">{w.name}</td>
                            <td className="py-3 pr-2 text-slate-500">{w.email}</td>
                            <td className="py-3 text-right font-extrabold text-gold-primary">{w.activeTicketsCount}</td>
                          </tr>
                        ))}
                        {(!analytics.agentWorkload || analytics.agentWorkload.length === 0) && (
                          <tr>
                            <td colSpan={3} className="text-center py-4 text-xs text-muted">No staff agent details found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Category breakdown (R) */}
                <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 space-y-4">
                  <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-foreground">
                    Ticket Categories Distribution
                  </h3>
                  
                  <div className="space-y-3.5">
                    {analytics.categoryMetrics?.map((c: any) => {
                      const percentage = analytics.totalTickets > 0 ? (c.count / analytics.totalTickets) * 100 : 0;
                      return (
                        <div key={c.category} className="space-y-1.5 text-[9px] font-bold">
                          <div className="flex justify-between items-center text-foreground uppercase tracking-wide">
                            <span>{c.category}</span>
                            <span className="text-muted">{c.count} cases ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="w-full bg-[#F5F5F5] dark:bg-[#161616] h-1.5 rounded-full overflow-hidden border border-border">
                            <div className="bg-gold-primary h-full transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
              <span className="text-xs text-muted font-bold">Consolidating KPI Performance Metrics...</span>
            </div>
          )}
        </div>
      )}

      {/* Create Support Ticket Modal Drawer (Drivers) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in text-foreground">
            {/* Modal Header */}
            <div className="bg-[#0B0B0B] text-white p-4 flex justify-between items-center border-b border-border">
              <div className="flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-gold-primary" />
                <span className="font-heading font-extrabold text-sm uppercase tracking-wider">File Compliance Dispute Ticket</span>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-5 text-left">
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="title">Ticket Subject Title</label>
                <input
                  type="text"
                  id="title"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Obstructed speed limit sign near JFK Terminal 4"
                  className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none text-foreground uppercase font-bold"
                  >
                    <option value="TLC">TLC Issue</option>
                    <option value="DMV">DMV Issue</option>
                    <option value="INSURANCE">Insurance Issue</option>
                    <option value="ACCOUNT">Account Issue</option>
                    <option value="BILLING">Billing Issue</option>
                    <option value="TECHNICAL">Technical Support</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none text-foreground uppercase font-bold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="description">Dispute Description Details</label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe your issue. Add details like signs obscurities, lab locations, or charge dates..."
                  className="w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border focus:border-[#F5C400] text-xs font-semibold p-3.5 rounded-xl outline-none resize-none"
                />
              </div>

              {/* Simulated Files attachment dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Attach Documents/Photos (optional)</label>
                <div className="border border-dashed border-border p-4 rounded-xl text-center space-y-2 bg-[#F5F5F5]/30 dark:bg-[#1A1A1A]/30">
                  <Paperclip className="w-6 h-6 mx-auto text-slate-400" />
                  <span className="text-[10px] text-muted block font-semibold">PDFs or Images (up to 5MB)</span>
                  <input 
                    type="file" 
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gold-primary/10 file:text-gold-primary hover:file:bg-gold-primary/20 cursor-pointer" 
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setIsUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        const uploadRes = await fetch(`${API_URL}/support/upload`, {
                          method: 'POST',
                          headers: {
                            'x-user-id': user?.id || '',
                            'x-user-role': user?.role || ''
                          },
                          body: formData
                        });
                        
                        if (!uploadRes.ok) throw new Error('Upload failed');
                        
                        const fileData = await uploadRes.json();
                        
                        setNewFiles(prev => [...prev, { 
                          name: fileData.name, 
                          size: (fileData.sizeBytes / (1024 * 1024)).toFixed(2) + ' MB',
                          s3Key: fileData.s3Key,
                          mimeType: fileData.mimeType,
                          sizeBytes: fileData.sizeBytes
                        }]);
                      } catch (err) {
                        toast.error('Failed to upload file');
                      } finally {
                        setIsUploading(false);
                        e.target.value = ''; // Reset input
                      }
                    }}
                  />
                  {isUploading && (
                    <div className="text-[10px] text-gold-primary font-bold mt-2 animate-pulse">Uploading...</div>
                  )}
                </div>
                {newFiles.length > 0 && (
                  <div className="space-y-1.5 pl-1 pt-1">
                    {newFiles.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[9px] font-bold text-foreground bg-gold-primary/10 border border-gold-primary/20 p-1.5 rounded-lg">
                        <span>📎 {file.name} ({file.size})</span>
                        <X className="w-3 h-3 text-red-500 cursor-pointer" onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={submitting} 
                  className="bg-gold-primary text-black hover:bg-gold-hover border-0 font-bold"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'File Support Case'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
