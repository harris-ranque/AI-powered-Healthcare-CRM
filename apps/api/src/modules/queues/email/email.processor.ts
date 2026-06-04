import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MailerService } from './mailer.service';

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

export type OtpEmailJobData = {
  email: string;
  code: string;
  purpose: string;
};

function purposeLabel(purpose: string): string {
  switch (purpose) {
    case 'LOGIN':
      return 'sign in';
    case 'REGISTER_CLINIC':
      return 'clinic registration';
    case 'REGISTER_SOLO':
      return 'solo practice registration';
    case 'REGISTER_STAFF':
      return 'staff registration';
    case 'REGISTER_PATIENT':
      return 'client registration';
    default:
      return 'verification';
  }
}

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(
    job: Job<WelcomeEmailJobData | InvitationEmailJobData | OtpEmailJobData>,
  ): Promise<void> {
    switch (job.name) {
      case 'send-welcome-email':
        await this.handleWelcomeEmail(job.data as WelcomeEmailJobData);
        break;
      case 'send-invitation-email':
        await this.handleInvitationEmail(job.data as InvitationEmailJobData);
        break;
      case 'send-otp-email':
        await this.handleOtpEmail(job.data as OtpEmailJobData);
        break;
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  async handleWelcomeEmail(data: WelcomeEmailJobData): Promise<void> {
    const greeting = data.name ? `Hi ${data.name}` : 'Hi';
    const sent = await this.mailer.sendMail({
      to: data.email,
      subject: 'Welcome to Healthcare CRM',
      text: `${greeting},\n\nWelcome to Healthcare CRM.`,
      html: `<p>${greeting},</p><p>Welcome to Healthcare CRM.</p>`,
    });

    if (sent) {
      this.logger.log(`Welcome email sent to ${data.email}`);
    } else {
      this.logger.log(`Welcome email (stub) for ${data.email}`);
    }
  }

  async handleInvitationEmail(data: InvitationEmailJobData): Promise<void> {
    const sent = await this.mailer.sendMail({
      to: data.email,
      subject: `Invitation to join ${data.organizationName}`,
      text: `You have been invited to join ${data.organizationName} as ${data.role}.\n\nAccept: ${data.inviteUrl}`,
      html: `<p>You have been invited to join <strong>${data.organizationName}</strong> as <strong>${data.role}</strong>.</p><p><a href="${data.inviteUrl}">Accept invitation</a></p>`,
    });

    if (sent) {
      this.logger.log(`Invitation email sent to ${data.email}`);
    } else {
      this.logger.log(
        `Invitation (stub) for ${data.email}: ${data.inviteUrl}`,
      );
    }
  }

  async handleOtpEmail(data: OtpEmailJobData): Promise<void> {
    const action = purposeLabel(data.purpose);
    const subject = `Your verification code`;
    const text = `Your verification code to ${action} is: ${data.code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`;
    const html = `
      <p>Your verification code to <strong>${action}</strong> is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${data.code}</p>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `;

    const sent = await this.mailer.sendMail({
      to: data.email,
      subject,
      text,
      html,
    });

    if (sent) {
      this.logger.log(`OTP email sent to ${data.email} (${data.purpose})`);
    } else {
      this.logger.log(
        `OTP for ${data.email} (${data.purpose}): ${data.code} — configure SMTP_HOST to send real email`,
      );
    }
  }
}
