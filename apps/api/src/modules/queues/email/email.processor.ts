import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export type WelcomeEmailJobData = {
  email: string;
  name?: string;
};

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<WelcomeEmailJobData>): Promise<void> {
    switch (job.name) {
      case 'send-welcome-email':
        await this.handleWelcomeEmail(job.data);
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  async handleWelcomeEmail(data: WelcomeEmailJobData): Promise<void> {
    this.logger.log(`Sending welcome email to ${data.email}`);

    // simulate async work; replace with SendGrid / Resend / SES
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.logger.log(`Welcome email sent to ${data.email}`);
  }
}
