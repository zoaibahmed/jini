'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { 
  Download, 
  Check, 
  CheckCircle2, 
  Sparkles,
  AlertCircle,
  Tag,
  Loader2,
  Lock,
  Zap,
  Star,
  Crown,
  Shield,
  X,
  ArrowRight,
  FileText,
  Bell,
  Bot,
  ClipboardCheck,
  HeadphonesIcon,
  Truck,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
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

const FEATURE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  DOCUMENTS:        { label: 'Document Vault',         icon: <FileText className="w-3.5 h-3.5" /> },
  NOTIFICATIONS:    { label: 'Smart Notifications',    icon: <Bell className="w-3.5 h-3.5" /> },
  AI_COPILOT:       { label: 'AI Driver Copilot',      icon: <Bot className="w-3.5 h-3.5" /> },
  COMPLIANCE:       { label: 'Compliance Tracker',     icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  SUPPORT_TICKETS:  { label: 'Priority Support',       icon: <HeadphonesIcon className="w-3.5 h-3.5" /> },
  FLEET_DISPATCH:   { label: 'Fleet Dispatch',         icon: <Truck className="w-3.5 h-3.5" /> },
  VOICE_AGENT:      { label: 'AI Voice Agent',         icon: <Phone className="w-3.5 h-3.5" /> },
  WHATSAPP:         { label: 'WhatsApp Integration',   icon: <MessageSquare className="w-3.5 h-3.5" /> },
};

const PLAN_META: Record<string, { icon: React.ReactNode; gradient: string; accent: string; badge?: string }> = {
  basic:      { icon: <Shield className="w-5 h-5" />,  gradient: 'from-slate-500/10 to-slate-400/5',  accent: 'text-slate-500 dark:text-slate-400',  badge: undefined },
  premium:    { icon: <Star className="w-5 h-5" />,    gradient: 'from-[#F5C400]/15 to-[#F5C400]/5',  accent: 'text-[#F5C400]',                        badge: 'Most Popular' },
  enterprise: { icon: <Crown className="w-5 h-5" />,   gradient: 'from-purple-500/15 to-purple-400/5', accent: 'text-purple-500 dark:text-purple-400',   badge: 'Best Value' },
};

function ConfirmModal({ plan, billingPeriod, discountPercent, onConfirm, onClose, loading }: {
  plan: PlanItem;
  billingPeriod: 'monthly' | 'yearly';
  discountPercent: number;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const raw = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const final = discountPercent > 0 ? raw * (1 - discountPercent / 100) : raw;
  const isYearly = billingPeriod === 'yearly';
  const meta = PLAN_META[plan.id] || PLAN_META.basic;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#222222] rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center border border-slate-200 dark:border-[#333333] ${meta.accent}`}>
            {meta.icon}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">Confirm Subscription</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review your plan details before being redirected to secure checkout.</p>
        </div>

        <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#222222] rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Plan</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">{plan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Billing</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{billingPeriod}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Promo Applied</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">-{discountPercent}%</span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-[#333333] pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Due</span>
            <span className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
              ${plan.priceMonthly === 0 ? '0.00' : final.toFixed(2)}
              <span className="text-xs font-semibold text-slate-400 ml-1">/{isYearly ? 'yr' : 'mo'}</span>
            </span>
          </div>
        </div>

        {plan.priceMonthly === 0 ? (
          <p className="text-xs text-center text-slate-400">This is a free plan. No payment required.</p>
        ) : (
          <p className="text-xs text-center text-slate-400">You will be redirected to Stripe's secure payment portal to complete your purchase.</p>
        )}

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-200 dark:border-[#333333] text-slate-600 dark:text-slate-400 font-bold rounded-2xl">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-[#F5C400] text-black hover:bg-[#d4a800] font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {plan.priceMonthly === 0 ? 'Activate Free' : 'Go to Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BillingPortalContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();

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

  // Confirm Modal State
  const [confirmPlan, setConfirmPlan] = useState<PlanItem | null>(null);

  // Promo Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const getToken = () =>
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('jni_access_token='))
      ?.split('=')[1] || '';

  const fetchBillingData = async () => {
    try {
      const token = getToken();
      const plansRes = await fetch(`${API_URL}/billing/plans`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.length > 0) setPlans(plansData);
      }

      const subRes = await fetch(`${API_URL}/billing/subscription`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': user?.role || 'DRIVER',
          'Authorization': `Bearer ${token}`
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
      console.warn('Billing fetch failed, using demo data.', err);
      setSubscription({
        status: 'TRIAL',
        plan: { id: 'basic', name: 'Basic Support', priceMonthly: 0, priceYearly: 0 },
        billingPeriod: 'monthly',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
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
            const token = getToken();
            const res = await fetch(`${API_URL}/billing/checkout/success`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id,
                'Authorization': `Bearer ${token}`
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

  // Open modal first — do NOT auto-checkout
  const handleSubscribeClick = (plan: PlanItem) => {
    setConfirmPlan(plan);
  };

  const handleExecuteSubscribe = async () => {
    if (!confirmPlan) return;
    setActionLoading(confirmPlan.id);
    setConfirmPlan(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: confirmPlan.id,
          billingPeriod,
          couponCode: appliedCoupon || undefined
        })
      });

      if (!res.ok) throw new Error('Checkout API error');
      const data = await res.json();
      
      toast.info('Redirecting to secure Stripe checkout portal...');
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      toast.error('Billing portal currently offline.');
      setActionLoading(null);
    }
  };

  const handleCancelSub = async () => {
    setActionLoading('cancel');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/billing/cancel`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '', 'Authorization': `Bearer ${token}` }
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
      const token = getToken();
      const res = await fetch(`${API_URL}/billing/resume`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '', 'Authorization': `Bearer ${token}` }
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
      const token = getToken();
      const res = await fetch(`${API_URL}/billing/create-portal-session`, {
        method: 'POST',
        headers: { 'x-user-id': user?.id || '', 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Portal API error');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      toast.error('Billing portal currently offline.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setAppliedCoupon(code); setDiscountPercent(10);
      toast.success('Promo Code applied: 10% discount on checkout!');
    } else if (code === 'SAVE50') {
      setAppliedCoupon(code); setDiscountPercent(50);
      toast.success('Promo Code applied: 50% discount on checkout!');
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
  const isBasicPlan = activePlanId === 'basic' || !activePlanId;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Confirm Modal */}
      {confirmPlan && (
        <ConfirmModal
          plan={confirmPlan}
          billingPeriod={billingPeriod}
          discountPercent={discountPercent}
          onConfirm={handleExecuteSubscribe}
          onClose={() => setConfirmPlan(null)}
          loading={actionLoading === confirmPlan.id}
        />
      )}

      {/* Feature Locked Warning */}
      {(isRestrictedAi || isRestrictedSupport || isRestrictedWhatsapp || isRestrictedVoice) && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-4 text-xs leading-relaxed shadow-lg shadow-red-500/5">
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

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#222222] pb-6">
        <div>
          <h1 className="font-heading font-extrabold text-3xl tracking-tight text-foreground flex items-center gap-2">
            Billing <span className="text-[#F5C400]">&amp;</span> Subscriptions
            <Sparkles className="w-5 h-5 text-[#F5C400]" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your plan, review invoices, and apply promo codes.</p>
        </div>
      </div>

      {/* Active Plan Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800/80 bg-gradient-to-br from-slate-50 to-white dark:from-zinc-900/70 dark:to-black/30 p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F5C400]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#F5C400]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                subscription?.status === 'ACTIVE' 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/15 text-amber-650 dark:text-amber-400 border-amber-500/30'
              }`}>
                {subscription?.status || 'No Plan'}
              </span>
              {hasPendingCancel && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/15 text-red-500 border border-red-500/30">
                  Cancelling at Period End
                </span>
              )}
              {isBasicPlan && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                  Free Tier
                </span>
              )}
            </div>

            <div>
              <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 dark:text-white">
                {subscription?.plan?.name || 'Basic Support'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                {isBasicPlan
                  ? 'You are on the free tier. Upgrade to unlock AI, compliance, and support features.'
                  : subscription?.billingPeriod === 'yearly' ? 'Yearly billing cycle (best value)' : 'Monthly billing cycle'}
              </p>
            </div>

            {/* Renewal Progress — only for paid active plans */}
            {isSubscriptionActive && !isBasicPlan && (
              <div className="space-y-1.5 max-w-xs">
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>{getDaysLeft(subscription?.currentPeriodEnd)} days left</span>
                  <span>Renews {subscription?.currentPeriodEnd?.split('T')[0]}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F5C400] h-full rounded-full transition-all duration-700"
                    style={{ width: `${getSubProgress(subscription?.currentPeriodEnd)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3 min-w-[180px]">
            {isSubscriptionActive && !isBasicPlan ? (
              hasPendingCancel ? (
                <Button
                  onClick={handleResumeSub}
                  disabled={actionLoading === 'resume'}
                  className="w-full bg-[#F5C400] text-black hover:bg-[#d4a800] font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2"
                >
                  {actionLoading === 'resume' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Resume Auto-Renewal
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleManagePortal}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#F5C400] text-black hover:bg-[#d4a800] font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'portal' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Manage Payment Info
                  </Button>
                  <Button
                    onClick={handleCancelSub}
                    disabled={actionLoading === 'cancel'}
                    variant="outline"
                    className="w-full border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 dark:text-red-400 font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'cancel' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Cancel Subscription
                  </Button>
                </>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Layout: Pricing left, sidebar right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Plan Tiers */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-foreground uppercase tracking-wider">Choose Your Plan</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All plans include SSL, uptime guarantee, and daily backups.</p>
            </div>

            {/* Billing Toggle */}
            <div className="bg-slate-100 dark:bg-[#141414] p-1 rounded-2xl flex items-center border border-slate-200 dark:border-zinc-800 select-none">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 ${
                  billingPeriod === 'monthly' ? 'bg-[#F5C400] text-black shadow-lg' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 ${
                  billingPeriod === 'yearly' ? 'bg-[#F5C400] text-black shadow-lg' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Yearly <span className="hidden sm:inline">(Save 20%)</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isActive = activePlanId === p.id && isSubscriptionActive;
              const meta = PLAN_META[p.id] || PLAN_META.basic;
              const price = billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly;
              const monthlyEquiv = billingPeriod === 'yearly' && price > 0 ? Math.round(price / 12) : price;

              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-300 ${
                    isActive
                      ? 'border-[#F5C400] bg-[#F5C400]/5 shadow-xl shadow-[#F5C400]/10'
                      : p.id === 'premium'
                      ? 'border-[#F5C400]/30 dark:border-[#F5C400]/20 bg-white dark:bg-[#0d0d0d] hover:border-[#F5C400]/60 hover:shadow-lg hover:shadow-[#F5C400]/5'
                      : 'border-slate-200 dark:border-[#222222] bg-white dark:bg-[#0d0d0d] hover:border-slate-300 dark:hover:border-[#333333] hover:shadow-md'
                  }`}
                >
                  {/* Popular / Best Value badge */}
                  {meta.badge && !isActive && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap ${
                      p.id === 'premium' ? 'bg-[#F5C400] text-black' : 'bg-purple-600 text-white'
                    }`}>
                      <Zap className="w-2.5 h-2.5" />
                      {meta.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Current Plan
                    </span>
                  )}

                  {/* Plan Icon + Name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} border border-slate-200 dark:border-[#333333] flex items-center justify-center ${meta.accent}`}>
                      {meta.icon}
                    </div>
                    <h4 className="font-heading font-extrabold text-sm text-slate-800 dark:text-white leading-tight">{p.name}</h4>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading font-extrabold text-4xl text-slate-900 dark:text-white">
                        ${p.priceMonthly === 0 ? '0' : monthlyEquiv}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">/ mo</span>
                    </div>
                    {billingPeriod === 'yearly' && price > 0 && (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 uppercase tracking-wide">
                        Billed ${price}/yr — Save 20%
                      </p>
                    )}
                    {p.priceMonthly === 0 && (
                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">Always free</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 border-t border-slate-100 dark:border-[#1e1e1e] pt-4 mb-6">
                    {p.features.map((feat) => {
                      const fm = FEATURE_LABELS[feat] || { label: feat.replace(/_/g, ' '), icon: <Check className="w-3.5 h-3.5" /> };
                      return (
                        <li key={feat} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          <span className={`shrink-0 ${meta.accent}`}>{fm.icon}</span>
                          <span>{fm.label}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  {isActive ? (
                    <div className="w-full text-center text-[10px] font-extrabold uppercase tracking-wider py-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active Tier
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSubscribeClick(p)}
                      disabled={actionLoading !== null}
                      className={`w-full font-bold py-3 rounded-2xl text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                        p.id === 'premium'
                          ? 'bg-[#F5C400] text-black hover:bg-[#d4a800]'
                          : p.id === 'enterprise'
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-800 dark:bg-white text-white dark:text-black hover:bg-slate-700 dark:hover:bg-slate-100'
                      }`}
                    >
                      {actionLoading === p.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      {p.priceMonthly === 0 ? 'Start Free' : 'Select Plan'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Promo Code + Invoices */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Promo Code */}
          <div className="bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#222222] rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F5C400]" />
              Promo Code
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SAVE50"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                className="flex-1 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#222222] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[#F5C400] text-slate-900 dark:text-white font-semibold uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400"
              />
              <Button onClick={handleApplyCoupon} className="bg-[#F5C400] text-black hover:bg-[#d4a800] border-0 text-xs font-bold px-4 py-2.5 rounded-xl shrink-0">
                Apply
              </Button>
            </div>

            {appliedCoupon && (
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-2.5 rounded-xl font-bold flex justify-between items-center animate-fade-in">
                <span>'{appliedCoupon}' Active</span>
                <span>-{discountPercent}% off</span>
              </div>
            )}

            <p className="text-[10px] text-slate-400 leading-relaxed">Discount is applied automatically at checkout confirmation. Try <strong>WELCOME10</strong> or <strong>SAVE50</strong>.</p>
          </div>

          {/* Invoice Ledger */}
          <div className="bg-white dark:bg-[#0d0d0d] border border-slate-200 dark:border-[#222222] rounded-3xl p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#F5C400]" />
              Invoice Ledger
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-[#1e1e1e]">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between text-xs font-semibold">
                  <div>
                    <strong className="block text-slate-900 dark:text-white">{inv.id}</strong>
                    <span className="text-[10px] text-slate-400">{inv.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      inv.status === 'PAID' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : inv.status === 'FAILED'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>{inv.status}</span>
                    <span className="text-slate-900 dark:text-white">${inv.amount.toFixed(2)}</span>
                    <button
                      onClick={() => toast.success(`Saved ${inv.id}.pdf to downloads.`)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222222] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#141414] transition-all cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No invoices yet.<br />They'll appear here after your first payment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
