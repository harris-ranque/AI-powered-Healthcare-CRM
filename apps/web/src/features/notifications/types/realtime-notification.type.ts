export type RealtimeNotificationType =
  | 'PATIENT_CREATED'
  | 'APPOINTMENT_CREATED'
  | 'FILE_UPLOADED'
  | 'USER_INVITED';

export type RealtimeNotificationPayload = {
  type: RealtimeNotificationType;
  title: string;
  message: string;
  actorId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type ClientNotification = RealtimeNotificationPayload & {
  id: string;
  read: boolean;
};
