import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

export const stripeClientProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Stripe.Stripe => {
    const apiKey = config.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    return new Stripe(apiKey, { apiVersion: '2026-04-22.dahlia' });
  },
};
