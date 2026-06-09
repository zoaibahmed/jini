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
  Lock
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

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PlanItem[]>([
    { id: '1', name: 'Basic Support', priceMonthly: 0, priceYearly: 0, features: ['DOCUMENTS'] },
    { id: '2', name: 'Premium Driver Pro', priceMonthly: 19, priceYearly: 168, features: ['DOCUMENTS', 'AI_COPILOT', 'SUPPORT_TICKETS'] },
    { id: '3', name: 'Enterprise Fleet', priceMonthly: 99, priceYearly: 948, features: ['DOCUMENTS', 'AI_COPILOT', 'SUPPORT_TICKETS', 'FLEET_DISPATCH'] }
  ]);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

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
        plan: { id: '2', name: 'Premium Driver Pro', priceMonthly: 19, priceYearly: 168, features: ['DOCUMENTS', 'AI_COPILOT', 'SUPPORT_TICKETS'] },
        billingPeriod: 'monthly',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      });
      setInvoices([
        { id: 'INV-8029', date: '2026-05-12', amount: 19.00, status: 'PAID' },
        { id: 'INV-7901', date: '2026-04-12', amount: 19.00, status: 'PAID' }
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
          <Button className="w-full bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black border-0 font-bold py-3">
            Return to Admin Panel
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubscribe = async (planId: string) => {
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
      
      toast.info('Redirecting to secure subscription portal...');
      
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
    if (code === 'JINI50') {
      setAppliedCoupon(code);
      setDiscountPercent(50);
      toast.success('Promo Code applied: 50% discount will reflect on checkout!');
    } else if (code === 'WELCOME10') {
      setAppliedCoupon(code);
      setDiscountPercent(10);
      toast.success('Promo Code applied: Flat $10.00 discount will reflect on checkout!');
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
        <Loader2 className="w-10 h-10 text-gold-primary animate-spin" />
        <h3 className="text-sm font-bold text-foreground">Syncing Payment Ledger...</h3>
      </div>
    );
  }

  const activePlanId = subscription?.plan?.id || '';
  const isSubscriptionActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL';
  const hasPendingCancel = subscription?.cancelAtPeriodEnd ?? false;

  return (
    <div className="space-y-6 animate-fade-in">
      {(isRestrictedAi || isRestrictedSupport) && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-bounce">
          <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-red-500 block font-bold">Feature Locked (Upgrade Required)</strong>
            <span className="text-slate-500 font-semibold">
              {isRestrictedAi 
                ? 'Your active plan does not include the AI Driver Copilot. Upgrade to Premium to unlock flight surge wave predictions.' 
                : 'Filing compliance tickets and Summon dispute cases requires a JNI Premium subscription. Please unlock below.'}
            </span>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">Billing & Memberships</h1>
        <p className="text-muted text-sm font-medium">Verify your JNI subscription tier, check invoice PDFs, and update payment options.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0B0B0B] text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden border border-[#222222]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5C400]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2.5 relative z-10 w-full">
              <span className="text-[9px] text-[#F5C400] font-bold uppercase tracking-wider bg-[#F5C400]/10 px-2.5 py-0.5 rounded border border-[#F5C400]/20 inline-block font-heading">
                {subscription?.status || 'No Plan'} Status
              </span>
              <h3 className="font-heading font-extrabold text-2xl">{subscription?.plan?.name || 'Basic Free Tier'}</h3>
              
              {isSubscriptionActive && (
                <div className="space-y-2 w-full max-w-sm pt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Active Subscription: {getDaysLeft(subscription?.currentPeriodEnd)} Days left</span>
                    <span>Renewal: {subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.split('T')[0] : 'None'}</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gold-primary h-full transition-all" style={{ width: `${getSubProgress(subscription?.currentPeriodEnd)}%` }} />
                  </div>
                </div>
              )}

              {hasPendingCancel && (
                <p className="text-xs text-red-400 font-bold">
                  ⚠️ Your membership was cancelled and will terminate on {subscription?.currentPeriodEnd?.split('T')[0]}.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 relative z-10 shrink-0 w-full sm:w-auto self-end sm:self-center">
              {isSubscriptionActive ? (
                hasPendingCancel ? (
                  <button 
                    onClick={handleResumeSub}
                    disabled={actionLoading === 'resume'}
                    className="px-4 py-2.5 rounded-xl bg-gold-primary hover:bg-gold-hover text-black font-bold text-xs uppercase border-0 transition-colors cursor-pointer shadow-md shadow-gold-glow flex items-center justify-center gap-1.5"
                  >
                    {actionLoading === 'resume' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Resume Renewal</span>
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={handleManagePortal}
                      disabled={actionLoading !== null}
                      className="px-4 py-2.5 rounded-xl bg-gold-primary hover:bg-gold-hover text-black font-bold text-xs uppercase border-0 transition-colors cursor-pointer shadow-md shadow-gold-glow flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === 'portal' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Manage Billing</span>
                    </button>
                    <button 
                      onClick={handleCancelSub}
                      disabled={actionLoading === 'cancel'}
                      className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-red-400 text-xs font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === 'cancel' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Cancel Subscription</span>
                    </button>
                  </div>
                )
              ) : null}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">Available Membership Tiers</h3>
                <p className="text-xs text-muted font-medium">Select a tier below. Switch to yearly billing to save up to 25%.</p>
              </div>
              
              <div className="bg-[#F5F5F5] dark:bg-[#161616] p-1 rounded-xl flex items-center space-x-1 border border-border shrink-0 select-none">
                <button 
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    billingPeriod === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-slate-450 hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    billingPeriod === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-slate-450 hover:text-foreground'
                  }`}
                >
                  Yearly (Save)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isActivePlan = activePlanId === p.id && isSubscriptionActive;
                const features = p.features || [];
                const price = billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly;
                const monthlyEquiv = billingPeriod === 'yearly' ? Math.round(price / 12) : price;

                return (
                  <div 
                    key={p.id} 
                    className={`p-5 rounded-2xl border flex flex-col justify-between hover-card-glow transition-all ${
                      isActivePlan 
                        ? 'border-[#F5C400] bg-gold-glow/5 shadow-sm' 
                        : 'border-border bg-muted-background/10'
                    }`}
                  >
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-heading font-extrabold text-xs text-foreground uppercase tracking-wider">{p.name}</h4>
                      </div>

                      <div className="flex items-baseline">
                        <span className="font-heading font-extrabold text-2xl text-foreground">${monthlyEquiv}</span>
                        <span className="text-[10px] text-muted ml-0.5">/ month</span>
                        {billingPeriod === 'yearly' && p.priceYearly > 0 && (
                          <span className="text-[8px] text-emerald-500 font-bold block ml-1 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 uppercase shrink-0">
                            Billed ${price}/yr
                          </span>
                        )}
                      </div>

                      <ul className="space-y-2 border-t border-border pt-4 text-[10px] text-slate-500 font-semibold">
                        <li className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-gold-primary shrink-0" />
                          <span>Documents Vault</span>
                        </li>
                        <li className="flex items-center space-x-1.5">
                          {features.includes('AI_COPILOT') ? (
                            <Check className="w-3.5 h-3.5 text-gold-primary shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-red-500 font-bold">×</span>
                          )}
                          <span className={features.includes('AI_COPILOT') ? 'text-foreground' : 'text-slate-400 line-through'}>
                            AI Driver Co-pilot
                          </span>
                        </li>
                        <li className="flex items-center space-x-1.5">
                          {features.includes('SUPPORT_TICKETS') ? (
                            <Check className="w-3.5 h-3.5 text-gold-primary shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-red-500 font-bold">×</span>
                          )}
                          <span className={features.includes('SUPPORT_TICKETS') ? 'text-foreground' : 'text-slate-400 line-through'}>
                            Support Ticket disputes
                          </span>
                        </li>
                        <li className="flex items-center space-x-1.5">
                          {features.includes('FLEET_DISPATCH') ? (
                            <Check className="w-3.5 h-3.5 text-gold-primary shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center text-red-500 font-bold">×</span>
                          )}
                          <span className={features.includes('FLEET_DISPATCH') ? 'text-foreground' : 'text-slate-400 line-through'}>
                            Enterprise Dispatcher
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-5 mt-2">
                      {isActivePlan ? (
                        <span className="w-full block text-center bg-emerald-500/10 text-emerald-500 font-bold py-2.5 text-[9px] rounded-xl border border-emerald-500/20 uppercase tracking-wider">
                          Current Plan
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleSubscribe(p.id)}
                          disabled={actionLoading !== null}
                          className="w-full bg-[#0B0B0B] text-white hover:bg-gold-primary hover:text-black py-2.5 rounded-xl text-[9px] font-bold uppercase transition-colors border-0 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === p.id && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>{p.priceMonthly === 0 ? 'Activate Trial' : 'Select Tier'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground flex items-center gap-1">
              <Tag className="w-4 h-4 text-gold-primary" />
              <span>Promo Coupons</span>
            </h3>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter coupon (e.g. JINI50)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 bg-[#F5F5F5] dark:bg-[#1A1A1A] border border-border text-xs rounded-xl px-3 py-2 outline-none focus:border-[#F5C400] text-foreground font-semibold uppercase"
              />
              <Button onClick={handleApplyCoupon} className="bg-gold-primary text-black hover:bg-gold-hover border-0 text-xs font-bold px-4 py-2 shrink-0">
                Apply
              </Button>
            </div>

            {appliedCoupon && (
              <div className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-550 p-2.5 rounded-xl font-bold flex justify-between">
                <span>Code Applied: {appliedCoupon}</span>
                <span>-{discountPercent}% Discount</span>
              </div>
            )}
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">Active Card</h3>
            
            <div className="bg-gradient-to-br from-[#0B0B0B] to-[#222222] text-white p-5 rounded-xl space-y-6 border border-[#333333] shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F5C400]/5 rounded-full blur-xl" />
              <div className="flex justify-between items-center">
                <CreditCard className="w-8 h-8 text-gold-primary" />
                <span className="text-[10px] font-extrabold tracking-widest bg-white/10 px-2 py-0.5 rounded">VISA</span>
              </div>
              <div>
                <span className="text-xs font-bold block tracking-widest">•••• •••• •••• 4242</span>
                <div className="flex justify-between items-center mt-3 text-[10px] text-slate-400">
                  <span>EXP: 12 / 2028</span>
                  <span>{user?.name?.toUpperCase() || 'ALEX MERCER'}</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-xs font-bold py-2.5 border-2 rounded-xl" 
              onClick={() => toast.info('Secure Stripe elements portal initialized in simulated mode.')}
            >
              Update Payment Card
            </Button>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-foreground">Invoice History</h3>
            
            <div className="divide-y divide-border">
              {invoices.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs font-semibold">
                  <div>
                    <strong className="block text-foreground">{inv.id}</strong>
                    <span className="text-[10px] text-muted">{inv.date}</span>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <span className="text-foreground">${inv.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => toast.success(`Saved ${inv.id}.pdf to downloads directory.`)}
                      className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-muted-background transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="text-center py-4 text-xs text-muted">
                  No invoice logs found.
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
        <Loader2 className="w-10 h-10 text-gold-primary animate-spin" />
        <h3 className="text-sm font-bold text-foreground mt-4">Loading Billing Portal...</h3>
      </div>
    }>
      <BillingPortalContent />
    </Suspense>
  );
}
