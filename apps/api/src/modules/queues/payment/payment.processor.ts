import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('payment')
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  process(job: Job): Promise<void> {
    switch (job.name) {
      case 'payment-success':
        this.handlePaymentSuccess(job.data);
        break;
      default:
        this.logger.warn(`Unknown payment job: ${job.name}`);
    }

    return Promise.resolve();
  }

  handlePaymentSuccess(data: unknown): void {
    this.logger.log('Processing successful payment');
    this.logger.debug(data);

    // future: analytics, invoice generation, notifications, audit logs, subscription activation
  }
}
