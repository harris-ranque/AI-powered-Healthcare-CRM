import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';

import { EmailProcessor } from './email/email.processor';
import { PaymentProcessor } from './payment/payment.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],

  providers: [EmailProcessor, PaymentProcessor],

  exports: [BullModule],
})
export class QueuesModule {}
