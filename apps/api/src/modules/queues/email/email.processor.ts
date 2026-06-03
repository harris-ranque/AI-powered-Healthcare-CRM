import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export type WelcomeEmailJobData = {
  email: string;
  name?: string;
};

export type InvitationEmailJobData = {
  email: string;
  inviteUrl: string;
  organizationName: string;
  role: string;
};

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(
    job: Job<WelcomeEmailJobData | InvitationEmailJobData>,
  ): Promise<void> {
    switch (job.name) {
      case 'send-welcome-email':
        await this.handleWelcomeEmail(job.data as WelcomeEmailJobData);
        break;
      case 'send-invitation-email':
        await this.handleInvitationEmail(job.data as InvitationEmailJobData);
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

  async handleInvitationEmail(data: InvitationEmailJobData): Promise<void> {
    this.logger.log(
      `Sending invitation to ${data.email} for ${data.organizationName} (${data.role}): ${data.inviteUrl}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(`Invitation email queued for ${data.email}`);
  }
}
