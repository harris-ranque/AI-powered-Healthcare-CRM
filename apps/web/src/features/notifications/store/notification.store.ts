import { create } from 'zustand';
import type {
  Notification,
  NotifyInput,
} from '../types/notification.type';

const DEFAULT_DURATION_MS = 5000;

interface NotificationStore {
  notifications: Notification[];
  notify: (input: NotifyInput) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  notify: ({ message, type = 'info', durationMs = DEFAULT_DURATION_MS }) => {
    const id = crypto.randomUUID();
    const notification: Notification = { id, message, type };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    window.setTimeout(() => {
      get().dismiss(id);
    }, durationMs);
  },

  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    }));
  },
}));
