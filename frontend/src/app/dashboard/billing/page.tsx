'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Download, 
  Check, 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Tag,
  Loader2,
  Lock,
  X,
  CreditCard as CardIcon,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '@/config';
import Link from 'next/link';

interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
}

interface PlanItem {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}

function BillingPortalContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN' || user?.role === 'SUPPORT';

  const isRestrictedAi = searchParams.get('restricted') === 'ai';
  const isRestrictedSupport = searchParams.get('restricted') === 'support';
  const isRestrictedWhatsapp = searchParams.get('restricted') === 'whatsapp';
  const isRestrictedVoice = searchParams.get('restricted') === 'voice';

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PlanItem[]>([
    { id: 'basic', name: 'Basic Support', priceMonthly: 0, priceYearly: 0, features: ['DOCUMENTS', 'NOTIFICATIONS'] },
    { id: 'premium', name: 'Premium Driver Pro', priceMonthly: 49, priceYearly: 490, features: ['DOCUMENTS', 'NOTIFICATIONS', 'AI_COPILOT', 'COMPLIANCE', 'SUPPORT_TICKETS'] },
    { id: 'enterprise', name: 'Enterprise Fleet', priceMonthly: 99, priceYearly: 990, features: ['DOCUMENTS', 'NOTIFICATIONS', 'AI_COPILOT', 'COMPLIANCE', 'SUPPORT_TICKETS', 'FLEET_DISPATCH', 'VOICE_AGENT', 'WHATSAPP'] }
  ]);
  
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Mock Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const fetchBillingData = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1];

      const plansRes = await fetch(`${API_URL}/billing/plans`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.length > 0) setPlans(plansData);
      }

      const subRes = await fetch(`${API_URL}/billing/subscription`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'DRIVER',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
        if (subData.invoices) {
          setInvoices(subData.invoices.map((inv: any) => ({
            id: inv.id,
            date: inv.billingDate ? inv.billingDate.split('T')[0] : inv.createdAt.split('T')[0],
            amount: inv.amount,
            status: inv.status
          })));
        }
      }
    } catch (err) {
      console.warn('Backend billing fetch failed. Running in seed/demo mode.', err);
      setSubscription({
        status: 'ACTIVE',
        plan: { id: 'premium', name: 'Premium Driver Pro', priceMonthly: 49, priceYearly: 490, features: ['DOCUMENTS', 'NOTIFICATIONS', 'AI_COPILOT', 'COMPLIANCE', 'SUPPORT_TICKETS'] },
        billingPeriod: 'monthly',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      });
      setInvoices([
        { id: 'INV-8029', date: '2026-05-12', amount: 49.00, status: 'PAID' },
        { id: 'INV-7901', date: '2026-04-12', amount: 49.00, status: 'PAID' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const handleCheckoutRedirect = async () => {
        const checkoutSuccess = searchParams.get('checkout_success') === 'true';
        const planId = searchParams.get('plan_id');
        const period = searchParams.get('period');
        
        if (checkoutSuccess && planId && period) {
          toast.info('Finalizing secure subscription provisioning...');
          try {
            const token = document.cookie
              .split('; ')
              .find((row) => row.startsWith('jni_access_token='))
              ?.split('=')[1];

            const res = await fetch(`${API_URL}/billing/checkout/success`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id,
                'Authorization': `Bearer ${token || ''}`
              },
              body: JSON.stringify({
                planId,
                billingPeriod: period,
                stripeSubscriptionId: `sub_sim_${Math.random().toString(36).substring(7)}`
              })
            });

            if (res.ok) {
              const resData = await res.json();
              if (resData.accessToken) {
                document.cookie = `jni_access_token=${resData.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
              }
              toast.success('Your subscription was successfully activated! Features unlocked.');
              window.location.href = '/dashboard/billing';
            }
          } catch (e) {
            toast.error('Failed to sync payment transaction.');
          }
        }
      };

      handleCheckoutRedirect();
      fetchBillingData();
    }
  }, [user, searchParams]);

  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-md mx-auto space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted leading-relaxed font-semibold">
            This page is driver-specific for billing ledgers and memberships. Admins and support agents can manage system records directly in the main panel.
          </p>
        </div>
        <Link href="/dashboard" className="w-full">
          <Button className="w-full bg-[#0B0B0B] text-white hover:bg-[#F5C400] hover:text-black border-0 font-bold py-3">
            Return to Admin Panel
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubscribeClick = (plan: PlanItem) => {
    if (plan.priceMonthly === 0) {
      // Free basic tier -> Go straight to checkout success
      handleExecuteSubscribe(plan.id);
    } else {
      setSelectedPlan(plan);
      setIsModalOpen(true);
    }
  };

  const handleExecuteSubscribe = async (planId: string) => {
    setActionLoading(planId);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1];

      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          planId,
          billingPeriod,
          couponCode: appliedCoupon || undefined
        })
      });

      if (!res.ok) throw new Error('Checkout API error');
      const data = await res.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      toast.error('Billing portal currently offline.');
      setActionLoading(null);
    }
  };

  const handleModalPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc || !cardHolder) {
      toast.error('Please fill out all payment details.');
      return;
    }
    
    setIsPaymentProcessing(true);

    // Simulate Payment processing delay
    setTimeout(async () => {
      setIsPaymentProcessing(false);
      setIsModalOpen(false);
      
      if (selectedPlan) {
        await handleExecuteSubscribe(selectedPlan.id);
      }
    }, 2000);
  };

  const handleCancelSub = async () => {
    setActionLoading('cancel');
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1];

      const res = await fetch(`${API_URL}/billing/cancel`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (res.ok) {
        toast.success('Your subscription will end on the current period renewal date.');
        fetchBillingData();
      }
    } catch (e) {
      toast.error('Failed to request cancellation.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeSub = async () => {
    setActionLoading('resume');
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1];

      const res = await fetch(`${API_URL}/billing/resume`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (res.ok) {
        toast.success('Subscription renewal resumed successfully!');
        fetchBillingData();
      }
    } catch (e) {
      toast.error('Failed to resume subscription.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleManagePortal = async () => {
    setActionLoading('portal');
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1];

      const res = await fetch(`${API_URL}/billing/create-portal-session`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!res.ok) throw new Error('Portal API error');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      toast.error('Billing portal currently offline.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setAppliedCoupon(code);
      setDiscountPercent(10);
      toast.success('Promo Code applied: Flat 10% discount will reflect on checkout!');
    } else if (code === 'SAVE50') {
      setAppliedCoupon(code);
      setDiscountPercent(50);
      toast.success('Promo Code applied: Flat 50% discount will reflect on checkout!');
    } else {
      toast.error('Invalid or expired promotional code.');
    }
    setCouponInput('');
  };

  const getDaysLeft = (dateString?: string) => {
    if (!dateString) return 0;
    const diff = new Date(dateString).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getSubProgress = (dateString?: string) => {
    const left = getDaysLeft(dateString);
    const total = subscription?.billingPeriod === 'yearly' ? 365 : 30;
    return Math.min(100, Math.max(0, (left / total) * 100));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <Loader2 className="w-12 h-12 text-[#F5C400] animate-spin" />
        <h3 className="text-sm font-bold text-foreground">Syncing Payment Ledger...</h3>
      </div>
    );
  }

  const activePlanId = subscription?.plan?.id || '';
  const isSubscriptionActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL';
  const hasPendingCancel = subscription?.cancelAtPeriodEnd ?? false;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Dynamic Feature Locked Warnings */}
      {(isRestrictedAi || isRestrictedSupport || isRestrictedWhatsapp || isRestrictedVoice) && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-4 text-xs leading-relaxed animate-pulse shadow-lg shadow-red-500/5">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-red-500 block font-bold text-sm">Feature Upgrade Required</strong>
            <span className="text-slate-400 font-semibold block mt-1">
              {isRestrictedAi && 'Your active plan does not include the AI Driver Copilot. Upgrade to Premium or Enterprise to unlock real-time compliance guides.'}
              {isRestrictedSupport && 'Filing compliance tickets and Summon dispute cases requires a JNI Premium subscription.'}
              {isRestrictedWhatsapp && 'Access to Meta WhatsApp dispatch integration requires an Enterprise Fleet level subscription.'}
              {isRestrictedVoice && 'Access to automated ElevenLabs voice support calls requires an Enterprise Fleet level subscription.'}
            </span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl tracking-tight text-foreground flex items-center gap-2">
            Billing & Subscriptions
            <Sparkles className="w-5 h-5 text-[#F5C400]" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Verify subscription tiers, review historical invoices, and manage payment options.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Active Plan & Plan Tiers) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Plan Dashboard */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d0d0d] to-[#141414] border border-[#222222] p-8 shadow-xl">
            {/* Glowing Backdrop Circle */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F5C400]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="space-y-4 w-full">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    subscription?.status === 'ACTIVE' 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {subscription?.status || 'No Active Plan'}
                  </span>
                  {hasPendingCancel && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                      Pending Cancellation
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="font-heading font-extrabold text-3xl text-white">{subscription?.plan?.name || 'Basic Free Tier'}</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    {subscription?.billingPeriod === 'yearly' ? 'Yearly billing cycle (best value)' : 'Monthly billing cycle'}
                  </p>
                </div>

                {isSubscriptionActive && (
                  <div className="space-y-2 w-full max-w-sm pt-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-450">
                      <span>{getDaysLeft(subscription?.currentPeriodEnd)} Days Remaining</span>
                      <span>Renews on {subscription?.currentPeriodEnd?.split('T')[0]}</span>
                    </div>
                    <div className="w-full bg-[#222222] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#F5C400] h-full transition-all duration-500 shadow-md shadow-gold-glow" style={{ width: `${getSubProgress(subscription?.currentPeriodEnd)}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3">
                {isSubscriptionActive ? (
                  hasPendingCancel ? (
                    <Button 
                      onClick={handleResumeSub}
                      disabled={actionLoading === 'resume'}
                      className="w-full bg-[#F5C400] text-black hover:bg-[#d4a800] font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'resume' && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Resume Auto-Renewal</span>
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleManagePortal}
                        disabled={actionLoading !== null}
                        className="w-full bg-[#F5C400] text-black hover:bg-[#d4a800] font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2"
                      >
                        {actionLoading === 'portal' && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Manage Payment Info</span>
                      </Button>
                      <Button 
                        onClick={handleCancelSub}
                        disabled={actionLoading === 'cancel'}
                        variant="outline"
                        className="w-full border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2"
                      >
                        {actionLoading === 'cancel' && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Cancel Subscription</span>
                      </Button>
                    </>
                  )
                ) : null}
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-heading font-extrabold text-lg text-foreground uppercase tracking-wider">Upgrade Tier Packages</h3>
                <p className="text-xs text-slate-400 mt-0.5">Toggle billing period options to view discounts.</p>
              </div>

              {/* Billing Period Switch */}
              <div className="bg-[#141414] p-1 rounded-2xl flex items-center border border-[#222222] select-none">
                <button 
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 ${
                    billingPeriod === 'monthly' ? 'bg-[#F5C400] text-black shadow-lg' : 'text-slate-450 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 ${
                    billingPeriod === 'yearly' ? 'bg-[#F5C400] text-black shadow-lg' : 'text-slate-450 hover:text-white'
                  }`}
                >
                  Yearly (Save 20%)
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isActive = activePlanId === p.id && isSubscriptionActive;
                const features = p.features || [];
                const price = billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly;
                const monthlyEquiv = billingPeriod === 'yearly' ? Math.round(price / 12) : price;

                return (
                  <div 
                    key={p.id}
                    className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 ${
                      isActive 
                        ? 'border-[#F5C400] bg-[#F5C400]/5 shadow-xl shadow-[#F5C400]/5' 
                        : 'border-[#222222] bg-[#0d0d0d] hover:border-[#333333]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-[#F5C400] text-black text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Current Plan
                      </span>
                    )}

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-heading font-extrabold text-sm text-white uppercase tracking-wider">{p.name}</h4>
                        <div className="flex items-baseline mt-4">
                          <span className="font-heading font-extrabold text-3xl text-white">${monthlyEquiv}</span>
                          <span className="text-[10px] text-slate-400 ml-1">/ month</span>
                        </div>
                        {billingPeriod === 'yearly' && price > 0 && (
                          <span className="text-[9px] text-emerald-400 font-bold mt-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded inline-block uppercase">
                            Save 20% (Billed ${price}/yr)
                          </span>
                        )}
                      </div>

                      <ul className="space-y-3 pt-4 border-t border-[#222222] text-xs font-semibold text-slate-450">
                        {features.map((feat) => (
                          <li key={feat} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-[#F5C400] shrink-0" />
                            <span className="text-slate-300">{feat.replace('_', ' ')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      {isActive ? (
                        <div className="w-full text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold py-3 text-xs rounded-2xl uppercase tracking-wider">
                          Active Tier
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleSubscribeClick(p)}
                          disabled={actionLoading !== null}
                          className="w-full bg-white text-black hover:bg-[#F5C400] font-bold py-3 rounded-2xl text-xs uppercase transition-all flex items-center justify-center gap-2"
                        >
                          {actionLoading === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>{p.priceMonthly === 0 ? 'Activate Plan' : 'Select Plan'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Promo Code, Active Card, Ledger) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Promo Card */}
          <div className="bg-[#0d0d0d] border border-[#222222] rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F5C400]" />
              <span>Promo Code</span>
            </h3>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter Code (e.g. SAVE50)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 bg-[#141414] border border-[#222222] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#F5C400] text-white font-semibold uppercase tracking-wider"
              />
              <Button onClick={handleApplyCoupon} className="bg-[#F5C400] text-black hover:bg-[#d4a800] border-0 text-xs font-bold px-4 py-2.5 rounded-xl shrink-0">
                Apply
              </Button>
            </div>

            {appliedCoupon && (
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl font-bold flex justify-between animate-fade-in">
                <span>Coupon '{appliedCoupon}' Activated</span>
                <span>-{discountPercent}% Discount applied</span>
              </div>
            )}
          </div>

          {/* Active Card */}
          <div className="bg-[#0d0d0d] border border-[#222222] rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">Active Card</h3>
            
            <div className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] text-white p-6 rounded-2xl border border-[#222222] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C400]/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center mb-6">
                <CardIcon className="w-8 h-8 text-[#F5C400]" />
                <span className="text-[10px] font-extrabold tracking-widest bg-white/10 px-2 py-0.5 rounded uppercase">VISA</span>
              </div>
              <div className="space-y-4">
                <span className="text-sm font-bold block tracking-widest text-white">•••• •••• •••• 4242</span>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>EXP: 12 / 2028</span>
                  <span>{user?.name?.toUpperCase() || 'ALEX MERCER'}</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-xs font-bold py-3 border-[#222222] hover:bg-[#141414] rounded-2xl" 
              onClick={() => toast.info('Billing details can be updated via the Stripe Elements Portal.')}
            >
              Update Payment Card
            </Button>
          </div>

          {/* Ledger invoices */}
          <div className="bg-[#0d0d0d] border border-[#222222] rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">Ledger Invoices</h3>
            
            <div className="divide-y divide-[#222222]">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-4 flex items-center justify-between text-xs font-semibold">
                  <div>
                    <strong className="block text-white">{inv.id}</strong>
                    <span className="text-[10px] text-slate-400">{inv.date}</span>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <span className="text-white">${inv.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => toast.success(`Saved ${inv.id}.pdf to downloads directory.`)}
                      className="p-2 rounded-xl border border-[#222222] text-slate-450 hover:text-white hover:bg-[#141414] transition-all"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  No invoice logs found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mock Credit Card Payment Modal */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-[#0d0d0d] border border-[#222222] rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl border border-[#222222] hover:bg-[#141414] text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
              Secure Checkout
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h3>
            <p className="text-slate-400 text-xs mt-1">Activate subscription for {selectedPlan.name}.</p>

            {/* Dynamic Card Display */}
            <div className="my-6 bg-gradient-to-br from-[#141414] to-[#0a0a0a] text-white p-6 rounded-2xl border border-[#222222] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C400]/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center mb-6">
                <CardIcon className="w-8 h-8 text-[#F5C400]" />
                <span className="text-[10px] font-extrabold tracking-widest bg-white/10 px-2 py-0.5 rounded uppercase">MOCK CARD</span>
              </div>
              <div className="space-y-4">
                <span className="text-sm font-bold block tracking-widest text-white">
                  {cardNumber || '•••• •••• •••• ••••'}
                </span>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>EXP: {cardExpiry || 'MM/YY'}</span>
                  <span>{cardHolder.toUpperCase() || 'CARDHOLDER NAME'}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleModalPaymentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cardholder Name</label>
                <input 
                  type="text"
                  placeholder="John Doe"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-[#141414] border border-[#222222] text-xs rounded-xl px-4 py-3 outline-none focus:border-[#F5C400] text-white font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Card Number</label>
                <input 
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  maxLength={19}
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full bg-[#141414] border border-[#222222] text-xs rounded-xl px-4 py-3 outline-none focus:border-[#F5C400] text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input 
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    className="w-full bg-[#141414] border border-[#222222] text-xs rounded-xl px-4 py-3 outline-none focus:border-[#F5C400] text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CVC</label>
                  <input 
                    type="text"
                    placeholder="123"
                    maxLength={3}
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-[#141414] border border-[#222222] text-xs rounded-xl px-4 py-3 outline-none focus:border-[#F5C400] text-white font-semibold"
                  />
                </div>
              </div>

              {/* Price Details */}
              <div className="pt-4 border-t border-[#222222] flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-400">Total Billed:</span>
                <span className="text-white text-lg font-heading font-extrabold">
                  ${(billingPeriod === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly) * (1 - discountPercent / 100)}
                </span>
              </div>

              <Button 
                type="submit"
                disabled={isPaymentProcessing}
                className="w-full bg-[#F5C400] text-black hover:bg-[#d4a800] font-bold py-3.5 rounded-2xl text-xs uppercase flex items-center justify-center gap-2 mt-4"
              >
                {isPaymentProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>Pay & Activate</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPortal() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex flex-col justify-center items-center min-h-[60vh] text-center p-6">
        <Loader2 className="w-10 h-10 text-[#F5C400] animate-spin" />
        <h3 className="text-sm font-bold text-foreground mt-4">Loading Billing Portal...</h3>
      </div>
    }>
      <BillingPortalContent />
    </Suspense>
  );
}
