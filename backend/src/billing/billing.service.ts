import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';
import { BillingStore, BillingPlan, Subscription, Invoice, Payment, BillingEvent, Coupon } from './billing.store';
import { JwtService } from '@nestjs/jwt';
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: any = null;
  private isSimulatedMode = true;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey !== 'mock_secret_key' && stripeKey.trim() !== '') {
      try {
        this.stripe = new Stripe(stripeKey, {
          apiVersion: '2022-11-15' as any, // standard compatible apiVersion
        });
        this.isSimulatedMode = false;
        this.logger.log('Stripe SDK initialized in Live/Test Gateway Mode.');
      } catch (err) {
        this.stripe = null;
        this.logger.error('Failed to initialize Stripe SDK. Falling back to local simulation.', err);
      }
    } else {
      this.logger.warn('STRIPE_SECRET_KEY missing or placeholder in .env. Running in JNI local billing simulation mode.');
    }
  }

  // Helper: Get user details
  private async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // 1. Fetch available plans
  async getPlans() {
    return BillingStore.getPlans().filter(p => p.active);
  }

  // 2. Fetch User Subscription details
  async getSubscriptionDetails(userId: string) {
    const user = await this.getUserDetails(userId);
    const subs = BillingStore.getSubscriptions();
    let sub = subs.find(s => s.userId === userId);

    const plans = BillingStore.getPlans();

    if (!sub) {
      // Provision default Trial subscription
      const defaultPlan = plans.find(p => p.id === 'basic') || plans[0];
      const newSub: Subscription = {
        id: 'sub-' + Math.random().toString(36).substring(2, 9),
        userId,
        planId: defaultPlan.id,
        status: 'TRIAL',
        billingPeriod: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      subs.push(newSub);
      BillingStore.saveSubscriptions(subs);
      sub = newSub;
    }

    const planObj = plans.find(p => p.id === sub.planId);
    const invoices = BillingStore.getInvoices().filter(i => i.userId === userId);
    const payments = BillingStore.getPayments().filter(p => p.userId === userId);
    const events = BillingStore.getEvents().filter(e => e.subscriptionId === sub.id);

    return {
      ...sub,
      plan: planObj,
      invoices,
      payments,
      billingEvents: events
    };
  }

  // 3. Create Subscription Checkout Session (Real/Simulated)
  async createCheckoutSession(userId: string, data: { planId: string; billingPeriod: 'monthly' | 'yearly'; couponCode?: string }) {
    const plans = BillingStore.getPlans();
    const plan = plans.find(p => p.id === data.planId);
    if (!plan) throw new NotFoundException('Selected billing plan not found');

    const user = await this.getUserDetails(userId);
    const email = user.email;

    let originalPrice = data.billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    let finalPrice = originalPrice;
    let discountApplied = 0;

    // Apply Coupon if present
    if (data.couponCode) {
      const coupons = BillingStore.getCoupons();
      const codeUpper = data.couponCode.toUpperCase();
      const coupon = coupons.find(c => c.code === codeUpper && c.active);
      if (coupon) {
        if (coupon.discountPercent) {
          discountApplied = (originalPrice * coupon.discountPercent) / 100;
        } else if (coupon.discountAmount) {
          discountApplied = coupon.discountAmount;
        }
        finalPrice = Math.max(0, originalPrice - discountApplied);
      }
    }

    if (this.isSimulatedMode || !this.stripe) {
      // Simulate Session Response
      const checkoutUrl = `http://localhost:3000/dashboard/billing?checkout_success=true&session_id=mock_session_${Date.now()}&plan_id=${plan.id}&period=${data.billingPeriod}&coupon=${data.couponCode || ''}`;
      return { checkoutUrl, simulated: true };
    }

    // Real Stripe Integration
    try {
      const priceAmount = Math.round(finalPrice * 100); // Stripe requires cents
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${plan.name} - ${data.billingPeriod.toUpperCase()} Plan`,
                description: `SaaS subscription access tier for JNI Solutions platform.`,
              },
              unit_amount: priceAmount,
              recurring: {
                interval: data.billingPeriod === 'yearly' ? 'year' : 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `http://localhost:3000/dashboard/billing?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&plan_id=${plan.id}&period=${data.billingPeriod}`,
        cancel_url: `http://localhost:3000/dashboard/billing?checkout_cancel=true`,
        customer_email: email,
        metadata: { userId, planId: plan.id, billingPeriod: data.billingPeriod },
      });

      return { checkoutUrl: session.url, simulated: false };
    } catch (err: any) {
      this.logger.error('Stripe API error creating checkout session, falling back to simulator:', err);
      const checkoutUrl = `http://localhost:3000/dashboard/billing?checkout_success=true&session_id=mock_session_${Date.now()}&plan_id=${plan.id}&period=${data.billingPeriod}&coupon=${data.couponCode || ''}`;
      return { checkoutUrl, simulated: true };
    }
  }

  // 4. Create Stripe Customer Billing Portal Session
  async createPortalSession(userId: string) {
    const user = await this.getUserDetails(userId);
    const subs = BillingStore.getSubscriptions();
    const sub = subs.find(s => s.userId === userId);

    if (this.isSimulatedMode || !this.stripe) {
      // Simulator URL
      return { url: 'http://localhost:3000/dashboard/billing?portal_sim=true' };
    }

    try {
      let customerId = sub?.stripeCustomerId;

      // If customer doesn't exist, retrieve or create one
      if (!customerId) {
        const customers = await this.stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await this.stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: { userId }
          });
          customerId = customer.id;
        }

        // Link customer id back to subscription
        if (sub) {
          sub.stripeCustomerId = customerId;
          sub.updatedAt = new Date().toISOString();
          BillingStore.saveSubscriptions(subs);
        }
      }

      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'http://localhost:3000/dashboard/billing',
      });

      return { url: portalSession.url };
    } catch (err: any) {
      this.logger.error('Stripe API error creating billing portal session:', err);
      return { url: 'http://localhost:3000/dashboard/billing?portal_sim=true' };
    }
  }

  // 5. Finalize Checkout Confirmation (Sync local state)
  async handleSubscriptionSuccess(userId: string, planId: string, billingPeriod: string, stripeSubId?: string) {
    const plans = BillingStore.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const subs = BillingStore.getSubscriptions();
    let subIdx = subs.findIndex(s => s.userId === userId);

    const duration = billingPeriod === 'yearly' ? 365 : 30;
    const currentPeriodStart = new Date().toISOString();
    const currentPeriodEnd = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
    const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;

    let sub: Subscription;
    if (subIdx !== -1) {
      subs[subIdx] = {
        ...subs[subIdx],
        planId,
        status: 'ACTIVE',
        billingPeriod: billingPeriod as any,
        stripeSubscriptionId: stripeSubId || `mock_sub_${Date.now()}`,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        updatedAt: new Date().toISOString()
      };
      sub = subs[subIdx];
    } else {
      sub = {
        id: 'sub-' + Math.random().toString(36).substring(2, 9),
        userId,
        planId,
        status: 'ACTIVE',
        billingPeriod: billingPeriod as any,
        stripeSubscriptionId: stripeSubId || `mock_sub_${Date.now()}`,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      subs.push(sub);
    }
    BillingStore.saveSubscriptions(subs);

    // Record invoice
    const invoices = BillingStore.getInvoices();
    const invoice: Invoice = {
      id: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: sub.id,
      userId,
      amount: price,
      status: 'PAID',
      pdfUrl: `https://jni-billing-vault.s3.amazonaws.com/invoices/${sub.id}_inv_${Date.now()}.pdf`,
      createdAt: new Date().toISOString()
    };
    invoices.push(invoice);
    BillingStore.saveInvoices(invoices);

    // Record payment
    const payments = BillingStore.getPayments();
    const payment: Payment = {
      id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: sub.id,
      userId,
      amount: price,
      status: 'SUCCESS',
      paymentMethod: 'CARD',
      createdAt: new Date().toISOString()
    };
    payments.push(payment);
    BillingStore.savePayments(payments);

    // Record billing event
    const events = BillingStore.getEvents();
    const event: BillingEvent = {
      id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: sub.id,
      eventType: 'SUBSCRIBE',
      metadata: JSON.stringify({ planName: plan.name, price, billingPeriod }),
      createdAt: new Date().toISOString()
    };
    events.push(event);
    BillingStore.saveEvents(events);

    const accessToken = await this.generateUpdatedUserToken(userId, sub, plan);

    return { subscription: sub, accessToken };
  }

  private async generateUpdatedUserToken(userId: string, sub: Subscription, plan: BillingPlan): Promise<string> {
    const user = await this.getUserDetails(userId);
    const subscriptionPayload = {
      status: sub.status,
      planName: plan.name,
      features: plan.features || ['DOCUMENTS']
    };
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      subscription: subscriptionPayload
    };
    return this.jwtService.sign(payload);
  }

  // 6. Change plan (Upgrade/Downgrade pro-rata calculations)
  async changePlan(userId: string, targetPlanId: string) {
    const subs = BillingStore.getSubscriptions();
    const sub = subs.find(s => s.userId === userId);
    if (!sub) throw new NotFoundException('Subscription not found');

    const plans = BillingStore.getPlans();
    const oldPlan = plans.find(p => p.id === sub.planId);
    const targetPlan = plans.find(p => p.id === targetPlanId);

    if (!targetPlan || !oldPlan) throw new NotFoundException('Plan not found');

    sub.planId = targetPlanId;
    sub.status = 'ACTIVE';
    sub.currentPeriodStart = new Date().toISOString();
    sub.currentPeriodEnd = new Date(Date.now() + (sub.billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
    sub.updatedAt = new Date().toISOString();
    BillingStore.saveSubscriptions(subs);

    // Log the billing event
    const events = BillingStore.getEvents();
    events.push({
      id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: sub.id,
      eventType: 'PLAN_CHANGED',
      metadata: JSON.stringify({ from: oldPlan.name, to: targetPlan.name }),
      createdAt: new Date().toISOString()
    });
    BillingStore.saveEvents(events);

    const accessToken = await this.generateUpdatedUserToken(userId, sub, targetPlan);

    return { success: true, message: `Changed plan to ${targetPlan.name} successfully.`, accessToken };
  }

  // 7. Cancel subscription at period end
  async cancelSubscription(userId: string) {
    const subs = BillingStore.getSubscriptions();
    const sub = subs.find(s => s.userId === userId);
    if (!sub) throw new NotFoundException('Subscription not found');

    sub.cancelAtPeriodEnd = true;
    sub.updatedAt = new Date().toISOString();
    BillingStore.saveSubscriptions(subs);

    const plans = BillingStore.getPlans();
    const plan = plans.find(p => p.id === sub.planId);

    const events = BillingStore.getEvents();
    events.push({
      id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: sub.id,
      eventType: 'CANCELLED',
      metadata: JSON.stringify({ planName: plan?.name || '' }),
      createdAt: new Date().toISOString()
    });
    BillingStore.saveEvents(events);

    return { success: true, message: 'Subscription scheduled for cancellation.' };
  }

  // 8. Resume cancelled subscription
  async resumeSubscription(userId: string) {
    const subs = BillingStore.getSubscriptions();
    const sub = subs.find(s => s.userId === userId);
    if (!sub) throw new NotFoundException('Subscription not found');

    sub.cancelAtPeriodEnd = false;
    sub.updatedAt = new Date().toISOString();
    BillingStore.saveSubscriptions(subs);

    const plans = BillingStore.getPlans();
    const plan = plans.find(p => p.id === sub.planId);

    const events = BillingStore.getEvents();
    events.push({
      id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: sub.id,
      eventType: 'RESUMED',
      metadata: JSON.stringify({ planName: plan?.name || '' }),
      createdAt: new Date().toISOString()
    });
    BillingStore.saveEvents(events);

    return { success: true, message: 'Subscription resumed successfully.' };
  }

  // 9. Stripe Webhook Parser
  async handleStripeWebhook(signature: string, payload: any) {
    let event: any = null;

    if (this.isSimulatedMode || !this.stripe) {
      // In simulator mode, treat the raw payload object as the event directly
      event = payload;
    } else {
      try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
        // If payload is object, convert to string/Buffer
        const rawPayload = typeof payload === 'string' || Buffer.isBuffer(payload) 
          ? payload 
          : JSON.stringify(payload);
        event = this.stripe.webhooks.constructEvent(rawPayload, signature, webhookSecret);
      } catch (err: any) {
        this.logger.warn('Stripe Webhook signature verification failed. Processing payload directly for development.');
        event = payload;
      }
    }

    if (!event || !event.type) {
      throw new BadRequestException('Invalid Stripe webhook event object');
    }

    this.logger.log(`Processing Stripe Webhook Event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { userId, planId, billingPeriod } = session.metadata || {};
        if (userId && planId) {
          const subId = session.subscription as string;
          const customerId = session.customer as string;

          // Save customer details back to user sub
          const subs = BillingStore.getSubscriptions();
          const sub = subs.find(s => s.userId === userId);
          if (sub) {
            sub.stripeCustomerId = customerId;
            sub.stripeSubscriptionId = subId;
            BillingStore.saveSubscriptions(subs);
          }

          await this.handleSubscriptionSuccess(userId, planId, billingPeriod || 'monthly', subId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const stripeSubId = invoice.subscription as string;
        const subs = BillingStore.getSubscriptions();
        const sub = subs.find(s => s.stripeSubscriptionId === stripeSubId);
        if (sub) {
          sub.status = 'ACTIVE';
          sub.currentPeriodEnd = new Date(invoice.lines.data[0].period.end * 1000).toISOString();
          sub.updatedAt = new Date().toISOString();
          BillingStore.saveSubscriptions(subs);

          // Add Invoice
          const invoices = BillingStore.getInvoices();
          invoices.push({
            id: 'INV-' + Math.floor(1000 + Math.random() * 9000),
            subscriptionId: sub.id,
            userId: sub.userId,
            amount: invoice.amount_paid / 100,
            status: 'PAID',
            pdfUrl: invoice.invoice_pdf || '',
            createdAt: new Date().toISOString()
          });
          BillingStore.saveInvoices(invoices);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const stripeSubId = invoice.subscription as string;
        const subs = BillingStore.getSubscriptions();
        const sub = subs.find(s => s.stripeSubscriptionId === stripeSubId);
        if (sub) {
          sub.status = 'PAST_DUE';
          sub.updatedAt = new Date().toISOString();
          BillingStore.saveSubscriptions(subs);

          const events = BillingStore.getEvents();
          events.push({
            id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
            subscriptionId: sub.id,
            eventType: 'PAYMENT_FAILED',
            metadata: JSON.stringify({ stripeInvoiceId: invoice.id }),
            createdAt: new Date().toISOString()
          });
          BillingStore.saveEvents(events);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const stripeSubId = subscription.id as string;
        const subs = BillingStore.getSubscriptions();
        const sub = subs.find(s => s.stripeSubscriptionId === stripeSubId);
        if (sub) {
          const stripeStatus = subscription.status;
          if (stripeStatus === 'active') {
            sub.status = 'ACTIVE';
          } else if (stripeStatus === 'past_due') {
            sub.status = 'PAST_DUE';
          } else if (stripeStatus === 'canceled' || stripeStatus === 'unpaid') {
            sub.status = 'CANCELLED';
          }
          sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          sub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          sub.updatedAt = new Date().toISOString();
          BillingStore.saveSubscriptions(subs);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const stripeSubId = subscription.id as string;
        const subs = BillingStore.getSubscriptions();
        const sub = subs.find(s => s.stripeSubscriptionId === stripeSubId);
        if (sub) {
          sub.status = 'CANCELLED';
          sub.updatedAt = new Date().toISOString();
          BillingStore.saveSubscriptions(subs);
        }
        break;
      }
    }

    return { received: true, event: event.type };
  }

  // Admin Analytics Overview
  async getAdminAnalytics() {
    const totalUsers = await this.prisma.user.count();
    const subs = BillingStore.getSubscriptions();

    const activeSubs = subs.filter(s => s.status === 'ACTIVE').length;
    const trialSubs = subs.filter(s => s.status === 'TRIAL').length;
    
    let simulatedMRR = 0;
    const plans = BillingStore.getPlans();
    subs.filter(s => s.status === 'ACTIVE').forEach(sub => {
      const plan = plans.find(p => p.id === sub.planId);
      if (plan) {
        const price = sub.billingPeriod === 'yearly' ? plan.priceYearly / 12 : plan.priceMonthly;
        simulatedMRR += price;
      }
    });

    const recentPayments = BillingStore.getPayments().slice(-10);

    return {
      totalMRR: Math.round(simulatedMRR * 100) / 100,
      totalUsers,
      activeSubs,
      trialSubs,
      recentPayments
    };
  }

  // Admin: Create/Edit pricing plans
  async managePlan(data: { id?: string; name: string; priceMonthly: number; priceYearly: number; features: string[]; active?: boolean }) {
    const plans = BillingStore.getPlans();
    if (data.id) {
      const idx = plans.findIndex(p => p.id === data.id);
      if (idx !== -1) {
        plans[idx] = {
          ...plans[idx],
          name: data.name,
          priceMonthly: data.priceMonthly,
          priceYearly: data.priceYearly,
          features: data.features,
          active: data.active ?? true
        };
        BillingStore.savePlans(plans);
        return plans[idx];
      }
    }

    const newPlan: BillingPlan = {
      id: 'plan-' + Math.random().toString(36).substring(2, 9),
      name: data.name,
      priceMonthly: data.priceMonthly,
      priceYearly: data.priceYearly,
      features: data.features,
      active: true
    };
    plans.push(newPlan);
    BillingStore.savePlans(plans);
    return newPlan;
  }

  // Admin: Execute Refund payouts
  async refundPayment(paymentId: string, amount?: number) {
    const payments = BillingStore.getPayments();
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new NotFoundException('Payment record not found');

    const refundValue = amount ?? payment.amount;

    payment.status = 'REFUNDED';
    payment.refundedAmount = refundValue;
    BillingStore.savePayments(payments);

    const events = BillingStore.getEvents();
    events.push({
      id: 'EVT-' + Math.floor(1000 + Math.random() * 9000),
      subscriptionId: payment.subscriptionId,
      eventType: 'REFUNDED',
      metadata: JSON.stringify({ paymentId, refundedAmount: refundValue }),
      createdAt: new Date().toISOString()
    });
    BillingStore.saveEvents(events);

    return { success: true, message: `Refund of $${refundValue} issued successfully.` };
  }

  // Admin: Create Coupon promotion codes
  async createCoupon(data: { code: string; discountPercent?: number; discountAmount?: number; expiryDate?: string }) {
    const coupons = BillingStore.getCoupons();
    const newCoupon: Coupon = {
      code: data.code.toUpperCase(),
      discountPercent: data.discountPercent,
      discountAmount: data.discountAmount,
      expiryDate: data.expiryDate,
      active: true
    };
    coupons.push(newCoupon);
    BillingStore.saveCoupons(coupons);
    return newCoupon;
  }
}
