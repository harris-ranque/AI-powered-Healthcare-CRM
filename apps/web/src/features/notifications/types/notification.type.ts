export type NotificationType = 'error' | 'success' | 'info';

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
};

export type NotifyInput = {
  message: string;
  type?: NotificationType;
  durationMs?: number;
};
