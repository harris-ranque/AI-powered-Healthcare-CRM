import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  type RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { SubscriptionPlan } from './dto/create-subscription.dto';
import { STRIPE_CLIENT } from './stripe.client';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

export type StripeConnectAccountResult =
  | { url: string }
  | { onboardingComplete: boolean };

export type StripeWebhookResponse = { received: boolean };

export type StripePaymentIntentResult = {
  clientSecret: string;
  paymentIntentId: string;
};

type StripeEvent = ReturnType<Stripe.Stripe['webhooks']['constructEvent']>;
type StripePaymentIntent = Extract<
  StripeEvent,
  { type: 'payment_intent.succeeded' }
>['data']['object'];
type StripeCheckoutSession = Extract<
  StripeEvent,
  { type: 'checkout.session.completed' }
>['data']['object'];
type StripeSubscription = Extract<
  StripeEvent,
  { type: 'customer.subscription.updated' }
>['data']['object'];

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly auditService: AuditService,
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe.Stripe,
  ) {}

  // ================================
  // Create Stripe Connect Account
  // ================================
  async createStripeConnectAccount(
    userId: string,
  ): Promise<StripeConnectAccountResult> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { ownerId: userId },
      select: {
        id: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    if (organization.stripeAccountId) {
      return {
        onboardingComplete: organization.stripeOnboardingComplete === true,
      };
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: { stripeAccountId: account.id },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${frontendUrl}/vendor/billing`,
      return_url: `${frontendUrl}/vendor/billing`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  // ================================
  // Handle Stripe Webhook
  // ================================
  async handleStripeWebhook(
    req: RawBodyRequest<Request>,
    signature: string,
  ): Promise<StripeWebhookResponse> {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret is not configured');
    }

    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown webhook error';
      throw new BadRequestException(`Webhook Error: ${message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);

        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);

        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);

        break;

      default:
        this.logger.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  // ================================
  // Payment Intent Succeeded
  // ================================
  async handlePaymentIntentSucceeded(
    paymentIntent: StripePaymentIntent,
  ): Promise<void> {
    const payment = await this.prisma.findPaymentByStripePaymentIntentId(
      paymentIntent.id,
    );

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    await this.prisma.updatePaymentStatus(payment.id, 'SUCCEEDED');
    this.realtime.paymentSuccess(payment.organizationId, payment);

    const organization = await this.prisma.client.organization.findUnique({
      where: {
        id: payment.organizationId,
      },
    });

    if (organization) {
      await this.auditService.log({
        action: 'PAYMENT_SUCCEEDED',

        resource: 'PAYMENT',

        resourceId: payment.id,

        metadata: {
          amount: payment.amount,

          organizationId: payment.organizationId,
        },
      });
      await this.notifications.createNotification({
        userId: organization.ownerId,

        type: 'PAYMENT_SUCCESS',

        title: 'Payment Received',

        message: `Payment of $${payment.amount / 100} succeeded`,

        metadata: {
          paymentId: payment.id,
        },
      });
    }

    this.logger.log(`Payment ${payment.id} succeeded`);
  }

  // ================================
  // Payment Intent Failed
  // ================================
  async handlePaymentIntentFailed(
    paymentIntent: StripePaymentIntent,
  ): Promise<void> {
    const payment = await this.prisma.findPaymentByStripePaymentIntentId(
      paymentIntent.id,
    );

    if (!payment) {
      return;
    }

    await this.prisma.updatePaymentStatus(payment.id, 'FAILED');

    this.logger.log(`Payment ${payment.id} failed`);
  }

  // ================================
  // Checkout Completed
  // ================================
  async handleCheckoutCompleted(session: StripeCheckoutSession): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const plan = session.metadata?.plan;

    if (!organizationId) {
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription?.id ?? null);

    if (!subscriptionId) {
      return;
    }

    await this.prisma.client.organization.update({
      where: { id: organizationId },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: 'ACTIVE',
        stripeSubscriptionPlan: plan,
      },
    });

    this.logger.log(
      `Subscription activated for organization ${organizationId}`,
    );
  }

  // ================================
  // Subscription Updated
  // ================================
  async handleSubscriptionUpdated(
    subscription: StripeSubscription,
  ): Promise<void> {
    const organization = await this.prisma.client.organization.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { id: true },
    });

    if (!organization) {
      return;
    }

    const firstItem = subscription.items.data[0];
    const currentPeriodEnd = firstItem
      ? new Date(firstItem.current_period_end * 1000)
      : null;

    await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: {
        stripeSubscriptionStatus: subscription.status,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
      },
    });
  }

  // ================================
  // Subscription Deleted
  // ================================
  async handleSubscriptionDeleted(
    subscription: StripeSubscription,
  ): Promise<void> {
    const organization = await this.prisma.client.organization.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { id: true },
    });

    if (!organization) {
      return;
    }

    await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: { stripeSubscriptionStatus: 'CANCELED' },
    });
  }

  async createStripePaymentIntent(
    organizationId: string,
    amount: number,
  ): Promise<StripePaymentIntentResult> {
    // ================================
    // Find Organization
    // ================================

    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization || !organization.stripeAccountId) {
      throw new BadRequestException('Organization not connected to Stripe');
    }

    // ================================
    // Platform Fee
    // ================================

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

    const platformFee = amount * (feePercent / 100);

    // ================================
    // Create Payment Intent
    // ================================

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      application_fee_amount: platformFee,
      transfer_data: {
        destination: organization.stripeAccountId,
      },
    });

    // ================================
    // Store Payment
    // ================================

    await this.prisma.client.payment.create({
      data: {
        organizationId: organizationId,
        stripePaymentIntentId: paymentIntent.id,
        amount: amount,
        currency: 'usd',
        status: 'PENDING',
        platformFee: platformFee,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Payment intent missing client secret');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async createStripeCustomer(organizationId: string): Promise<string> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: true,
      },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // ================================
    // Existing Customer
    // ================================
    if (organization.stripeCustomerId) {
      return organization.stripeCustomerId;
    }

    // ================================
    // Create Stripe Customer
    // ================================
    const customer = await this.stripe.customers.create({
      email: organization.owner.email,
      name: organization.name,
      metadata: {
        organizationId: organization.id,
      },
    });

    // ================================
    // Save Customer ID
    // ================================
    await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createSubscriptionCheckout(
    userId: string,
    plan: SubscriptionPlan,
  ): Promise<{ url: string }> {
    // =========================
    // FIND ORGANIZATION
    // =========================
    const organization = await this.prisma.client.organization.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // =========================
    // GET STRIPE CUSTOMER
    // =========================
    const customerId = await this.createStripeCustomer(organization.id);

    // =========================
    // DETERMINE PRICE ID
    // =========================
    let priceId: string | undefined;

    switch (plan) {
      case SubscriptionPlan.STARTER:
        priceId = this.config.get<string>('STRIPE_STARTER_PRICE_ID');
        break;

      case SubscriptionPlan.PRO:
        priceId = this.config.get<string>('STRIPE_PRO_PRICE_ID');
        break;

      default:
        throw new BadRequestException('Invalid plan');
    }

    if (!priceId) {
      throw new BadRequestException(`Price ID not configured for plan ${plan}`);
    }

    // =========================
    // CREATE CHECKOUT SESSION
    // =========================
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/vendor/billing/success`,
      cancel_url: `${frontendUrl}/vendor/billing`,
      metadata: {
        organizationId: organization.id,
        plan,
      },
    });

    if (!session.url) {
      throw new BadRequestException('Checkout session missing url');
    }

    return { url: session.url };
  }
}
