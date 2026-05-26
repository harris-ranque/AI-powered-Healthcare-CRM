import { Injectable } from '@nestjs/common';

import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  constructor(private gateway: RealtimeGateway) {}

  // =========================
  // PAYMENT NOTIFICATION
  // =========================
  paymentSuccess(organizationId: string, payment: any) {
    this.gateway.sendToOrganization(organizationId, 'payment.success', payment);
  }

  // =========================
  // SUBSCRIPTION UPDATE
  // =========================
  subscriptionUpdated(organizationId: string, subscription: any) {
    this.gateway.sendToOrganization(
      organizationId,
      'subscription.updated',
      subscription,
    );
  }

  // =========================
  // FILE UPLOADED
  // =========================
  fileUploaded(organizationId: string, file: any) {
    this.gateway.sendToOrganization(organizationId, 'file.uploaded', file);
  }

  // =========================
  // SYSTEM ALERT
  // =========================
  systemAlert(organizationId: string, message: string) {
    this.gateway.sendToOrganization(organizationId, 'system.alert', {
      message,
    });
  }
}
