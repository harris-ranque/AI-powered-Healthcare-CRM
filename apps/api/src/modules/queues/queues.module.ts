import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';

import { PaymentProcessor } from './payment/payment.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],

  providers: [PaymentProcessor],

  exports: [BullModule],
})
export class QueuesModule {}
