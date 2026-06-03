import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type SendMailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from =
      this.config.get<string>('MAIL_FROM') ?? 'Healthcare CRM <noreply@localhost>';

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log(`SMTP mailer configured (${host}:${port})`);
    } else {
      this.transporter = null;
      this.logger.warn(
        'SMTP_HOST is not set — emails are not sent (OTP codes logged by EmailProcessor only)',
      );
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendMail(params: SendMailParams): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    return true;
  }
}
