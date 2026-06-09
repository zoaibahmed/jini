import { Controller, Get, Post, Patch, Param, Body, Query, Headers, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('SaaS Subscription Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private getAuthContext(userIdHeader?: string) {
    if (!userIdHeader) {
      throw new BadRequestException('User identification header (x-user-id) required');
    }
    return { userId: userIdHeader };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all active SaaS subscription plans' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Get current user active subscription and invoice history' })
  async getSubscription(@Headers('x-user-id') userIdHeader: string) {
    const { userId } = this.getAuthContext(userIdHeader);
    return this.billingService.getSubscriptionDetails(userId);
  }

  @Post('checkout')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Generate Stripe payment checkout session URL (legacy)' })
  async createCheckout(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { planId: string; billingPeriod: 'monthly' | 'yearly'; couponCode?: string },
  ) {
    const { userId } = this.getAuthContext(userIdHeader);
    return this.billingService.createCheckoutSession(userId, body);
  }

  @Post('create-checkout-session')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Generate Stripe payment checkout session URL (new)' })
  async createCheckoutSession(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { planId: string; billingPeriod: 'monthly' | 'yearly'; couponCode?: string },
  ) {
    const { userId } = this.getAuthContext(userIdHeader);
    const result = await this.billingService.createCheckoutSession(userId, body);
    return { session: { url: result.checkoutUrl }, url: result.checkoutUrl };
  }

  @Post('checkout/success')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Finalize successful checkout to provision subscription features' })
  async checkoutSuccess(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { planId: string; billingPeriod: string; stripeSubscriptionId?: string },
  ) {
    const { userId } = this.getAuthContext(userIdHeader);
    return this.billingService.handleSubscriptionSuccess(userId, body.planId, body.billingPeriod, body.stripeSubscriptionId);
  }

  @Post('create-portal-session')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Create Stripe Customer Billing Portal Session' })
  async createPortalSession(@Headers('x-user-id') userIdHeader: string) {
    const { userId } = this.getAuthContext(userIdHeader);
    const result = await this.billingService.createPortalSession(userId);
    return { portalSession: { url: result.url }, url: result.url };
  }

  @Post('change-plan')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Upgrade or downgrade plan tier' })
  async changePlan(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: { targetPlanId: string },
  ) {
    const { userId } = this.getAuthContext(userIdHeader);
    return this.billingService.changePlan(userId, body.targetPlanId);
  }

  @Post('cancel')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Cancel subscription recurring billing' })
  async cancelSub(@Headers('x-user-id') userIdHeader: string) {
    const { userId } = this.getAuthContext(userIdHeader);
    return this.billingService.cancelSubscription(userId);
  }

  @Post('resume')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Resume scheduled subscription cancellation' })
  async resumeSub(@Headers('x-user-id') userIdHeader: string) {
    const { userId } = this.getAuthContext(userIdHeader);
    return this.billingService.resumeSubscription(userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive and parse Stripe billing events webhooks (legacy)' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.billingService.handleStripeWebhook(signature, payload);
  }
}

@ApiTags('Stripe Webhooks Global')
@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Receive and parse Stripe billing events webhooks' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.billingService.handleStripeWebhook(signature, payload);
  }
}
