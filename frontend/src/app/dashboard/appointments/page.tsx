'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  ChevronRight,
  Info,
  CalendarCheck,
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  agentId: string;
}

interface Appointment {
  id: string;
  driverId: string;
  agentId: string | null;
  title: string;
  description: string | null;
  date: string;
  status: string; // PENDING, CONFIRMED, RESCHEDULED, CANCELLED
  createdAt: string;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

const CATEGORIES = [
  'TLC Consultation',
  'TLC Renewal Assistance',
  'DMV Assistance',
  'Drug Test',
  'Defensive Driving',
  'Instructor Session',
  'Vehicle Inspection Assistance'
];

export default function AppointmentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // States
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  
  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [bookingSubmit, setBookingSubmit] = useState(false);

  // Admin Slot Creator State
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [creatingSlot, setCreatingSlot] = useState(false);

  // Admin Appointment Status Update State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED'>('CONFIRMED');
  const [updateComment, setUpdateComment] = useState('');
  const [updatingAppt, setUpdatingAppt] = useState(false);

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPPORT';

  // Fetch data on load
  const loadData = async () => {
    if (!user) return;
    const token = getCookie('jni_access_token');
    
    // 1. Fetch available slots
    try {
      setLoadingSlots(true);
      const res = await fetch(`${API_URL}/appointment/slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load slots.');
    } finally {
      setLoadingSlots(false);
    }

    // 2. Fetch appointments based on role
    try {
      setLoadingAppts(true);
      const endpoint = isStaff ? `${API_URL}/appointment/admin` : `${API_URL}/appointment/driver`;
      const headers: any = { Authorization: `Bearer ${token}` };
      if (!isStaff) {
        headers['x-driver-id'] = user.id;
      }
      
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load appointments.');
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isStaff]);

  // Submit appointment booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !user) return;

    try {
      setBookingSubmit(true);
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/appointment/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-driver-id': user.id
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          title: category,
          description: description
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to book slot.');
      }

      toast.success('Appointment booked successfully!');
      setSelectedSlot(null);
      setDescription('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error booking appointment.');
    } finally {
      setBookingSubmit(false);
    }
  };

  // Create slot (Admin)
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotStart || !newSlotEnd || !user) return;

    try {
      setCreatingSlot(true);
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/appointment/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-id': user.id
        },
        body: JSON.stringify({
          startTime: newSlotStart,
          endTime: newSlotEnd
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create slot.');
      }

      toast.success('Availability slot created.');
      setNewSlotStart('');
      setNewSlotEnd('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating slot.');
    } finally {
      setCreatingSlot(false);
    }
  };

  // Update appointment status (Admin/Support)
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      setUpdatingAppt(true);
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/appointment/${selectedAppt.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateStatus,
          comment: updateComment
        })
      });

      if (!res.ok) throw new Error('Failed to update status.');

      toast.success(`Appointment status set to ${updateStatus}`);
      setSelectedAppt(null);
      setUpdateComment('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status.');
    } finally {
      setUpdatingAppt(false);
    }
  };

  // Driver: Cancel booking
  const handleCancelBooking = async (apptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const token = getCookie('jni_access_token');
      const res = await fetch(`${API_URL}/appointment/${apptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to cancel.');

      toast.success('Appointment cancelled.');
      loadData();
    } catch (e) {
      toast.error('Error cancelling appointment.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">CONFIRMED</span>;
      case 'CANCELLED':
        return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">CANCELLED</span>;
      case 'RESCHEDULED':
        return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">RESCHEDULED</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">PENDING</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground flex items-center gap-2">
          <span>Appointments Center</span>
        </h1>
        <p className="text-muted text-sm font-medium font-heading">
          {isStaff 
            ? 'Manage driver consultations, schedule availability, and confirm renewal support schedules.'
            : 'Schedule an in-person or virtual consultation with JNI support agents for renewals, DMV audits, or drug tests.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Driver Booking Slots OR Admin Slot Creation */}
        <div className="lg:col-span-7 space-y-6">
          
          {isStaff ? (
            /* ADMIN SLOT CREATOR */
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold-primary" />
                <span>Create Availability Slot</span>
              </h2>
              
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Start Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newSlotStart}
                      onChange={(e) => setNewSlotStart(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">End Time</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={newSlotEnd}
                      onChange={(e) => setNewSlotEnd(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={creatingSlot}
                  className="bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider w-full cursor-pointer"
                >
                  {creatingSlot ? 'Creating Slot...' : 'Create Availability'}
                </Button>
              </form>
            </div>
          ) : (
            /* DRIVER AVAILABLE SLOTS */
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold-primary" />
                <span>Select Available Time Slot</span>
              </h2>
              
              {loadingSlots ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent animate-spin mx-auto mb-2" />
                  <p className="text-[11px] text-muted font-bold">Scanning scheduler...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-2 bg-muted-background/10">
                  <HelpCircle className="w-8 h-8 text-muted mx-auto" />
                  <p className="text-xs text-muted font-bold">No open slots available.</p>
                  <p className="text-[10px] text-muted">Please contact support or try again later as agents open new time blocks.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const start = new Date(slot.startTime);
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-gold-primary border-gold-hover text-black shadow-md shadow-gold-glow' 
                            : 'bg-card border-border text-foreground hover:bg-muted-background'
                        }`}
                      >
                        <span className={`text-[10px] font-extrabold uppercase ${isSelected ? 'text-black' : 'text-muted'}`}>
                          Agent ID: {slot.agentId?.slice(0, 8) || 'System'}
                        </span>
                        <div>
                          <strong className="text-xs block font-bold">
                            {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </strong>
                          <span className={`text-[11px] font-semibold flex items-center gap-1 ${isSelected ? 'text-black' : 'text-slate-500'}`}>
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Booking Form for Selected Slot */}
              {selectedSlot && (
                <form onSubmit={handleBookAppointment} className="border-t border-border pt-6 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase text-gold-primary tracking-wider">Book Consultation Slot</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Consultation Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Additional details or Notes</label>
                    <textarea
                      placeholder="e.g. Need assistance renewing TLC plate before expiry date..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button 
                      type="button" 
                      onClick={() => setSelectedSlot(null)}
                      className="bg-card hover:bg-muted-background border border-border text-foreground font-extrabold text-xs px-4 py-2 rounded-xl uppercase tracking-wider"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={bookingSubmit}
                      className="bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      {bookingSubmit ? 'Booking...' : 'Confirm Appointment'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* LIST OF CREATED SLOTS FOR ADMIN */}
          {isStaff && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold-primary" />
                <span>All Created Availability Slots</span>
              </h2>
              {loadingSlots ? (
                <div className="text-center py-6">
                  <div className="w-5 h-5 border border-gold-primary border-t-transparent animate-spin mx-auto" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-muted">No availability slots are currently listed in the system.</p>
              ) : (
                <div className="max-h-[220px] overflow-y-auto divide-y divide-border border border-border rounded-xl">
                  {slots.map((s) => {
                    const start = new Date(s.startTime);
                    const end = new Date(s.endTime);
                    return (
                      <div key={s.id} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <strong className="block font-bold">
                            {start.toLocaleDateString()} at {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                          <span className="text-[10px] text-muted">Ends: {end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${s.isBooked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {s.isBooked ? 'Booked' : 'Open'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Appointment Log Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-gold-primary" />
              <span>{isStaff ? 'Driver Bookings & Schedule' : 'My Scheduled Consultations'}</span>
            </h2>

            {loadingAppts ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-[11px] text-muted font-bold font-heading">Fetching schedules...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-2 bg-muted-background/10">
                <Calendar className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs text-muted font-bold">No active bookings.</p>
                <p className="text-[10px] text-muted">
                  {isStaff 
                    ? 'No appointments have been booked by drivers yet.' 
                    : 'Your scheduled consultations log is empty. Try booking one of the slots.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {appointments.map((appt) => {
                  const dateObj = new Date(appt.date);
                  return (
                    <div 
                      key={appt.id}
                      className="p-4 bg-muted-background/20 border border-border rounded-xl flex flex-col justify-between gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-xs font-bold text-foreground block">{appt.title}</strong>
                          <span className="text-[10px] text-slate-400 block font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-gold-primary shrink-0" />
                            {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>

                      {appt.driver && (
                        <div className="bg-card border border-border p-2 rounded-lg text-[10px] space-y-0.5">
                          <span className="font-bold text-foreground block flex items-center gap-1">
                            <User className="w-3 h-3 text-gold-primary" /> {appt.driver.name}
                          </span>
                          <span className="text-muted block font-semibold">{appt.driver.phone || 'No phone'}</span>
                          <span className="text-muted block font-semibold">{appt.driver.email}</span>
                        </div>
                      )}

                      {appt.description && (
                        <p className="text-[11px] text-slate-500 font-semibold italic bg-card/45 p-2 rounded-lg border border-border/40">
                          &ldquo;{appt.description}&rdquo;
                        </p>
                      )}

                      <div className="flex gap-2 justify-end border-t border-border/50 pt-3">
                        {isStaff ? (
                          <button
                            onClick={() => setSelectedAppt(appt)}
                            className="px-3 py-1.5 bg-[#0B0B0B] text-gold-primary hover:bg-[#F5C400] hover:text-black font-extrabold text-[10px] uppercase rounded-lg border border-gold-primary/20 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Action Status</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : (
                          appt.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelBooking(appt.id)}
                              className="px-3 py-1.5 border border-border hover:bg-red-500/10 hover:border-red-500/30 text-red-500 font-extrabold text-[10px] uppercase rounded-lg bg-card cursor-pointer"
                            >
                              Cancel Booking
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ADMIN APPOINTMENT STATUS ACTIONS MODAL / PANEL */}
          {isStaff && selectedAppt && (
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-xs font-extrabold uppercase text-gold-primary tracking-wider">Update Booking Status</h3>
                <button onClick={() => setSelectedAppt(null)} className="text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Select Confirmation Status</label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RESCHEDULED">RESCHEDULED</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-muted tracking-wider">Comments / Agent Notes</label>
                  <textarea
                    placeholder="e.g. Appointment scheduled for DMV summons mitigation guidelines..."
                    value={updateComment}
                    onChange={(e) => setUpdateComment(e.target.value)}
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold-primary"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updatingAppt}
                  className="bg-gold-primary hover:bg-gold-hover text-black font-extrabold text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider w-full cursor-pointer"
                >
                  {updatingAppt ? 'Saving Changes...' : 'Save Update'}
                </Button>
              </form>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
