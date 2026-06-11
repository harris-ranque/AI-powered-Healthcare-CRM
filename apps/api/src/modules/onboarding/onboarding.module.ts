import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { StripeModule } from '../stripe/stripe.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [
    PrismaModule,
    InvitationsModule,
    StripeModule,
    UsageTrackingModule,
    JwtModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
