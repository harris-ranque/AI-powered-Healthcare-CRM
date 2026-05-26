import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  Headers,
  type RawBodyRequest,
  Body,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import {
  StripeService,
  type StripeConnectAccountResult,
  type StripeWebhookResponse,
  type StripePaymentIntentResult,
} from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PrismaService } from '../../database/prisma.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  // =========================================
  // Connect Stripe Account
  // =========================================
  @UseGuards(JwtAuthGuard)
  @Get('connect')
  connectStripeAccount(
    @Req() req: AuthenticatedRequest,
  ): Promise<StripeConnectAccountResult> {
    return this.stripeService.createStripeConnectAccount(req.user.sub);
  }

  // =========================================
  // Stripe Webhook — version-neutral so Stripe's configured URL stays stable
  // (`/api/stripe/webhook`).
  // =========================================
  @Version(VERSION_NEUTRAL)
  @Post('webhook')
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<StripeWebhookResponse> {
    return this.stripeService.handleStripeWebhook(req, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-intent')
  createPaymentIntent(
    @Body()
    dto: CreatePaymentIntentDto,
  ): Promise<StripePaymentIntentResult> {
    return this.stripeService.createStripePaymentIntent(
      dto.organizationId,
      dto.amount,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription')
  createSubscription(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<{ url: string }> {
    return this.stripeService.createSubscriptionCheckout(
      req.user.sub,
      dto.plan,
    );
  }
}
