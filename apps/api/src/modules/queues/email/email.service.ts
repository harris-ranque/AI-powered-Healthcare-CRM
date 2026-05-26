import { Injectable } from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email')
    private emailQueue: Queue,
  ) {}

  // =====================================
  // SEND EMAIL JOB
  // =====================================
  async sendWelcomeEmail(email: string, name?: string) {
    await this.emailQueue.add(
      'send-welcome-email',

      {
        email,
        name,
      },

      {
        attempts: 3,

        backoff: {
          type: 'exponential',

          delay: 5000,
        },

        removeOnComplete: 100,

        removeOnFail: 500,
      },
    );
  }
}
