import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';

import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],

  providers: [MailerService, EmailProcessor, EmailService],

  exports: [EmailService],
})
export class EmailModule {}
