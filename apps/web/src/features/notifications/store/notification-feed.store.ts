import { create } from 'zustand';

import type {
  ClientNotification,
  RealtimeNotificationPayload,
} from '../types/realtime-notification.type';

const MAX_ITEMS = 50;

interface NotificationFeedStore {
  items: ClientNotification[];
  add: (payload: RealtimeNotificationPayload) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationFeedStore = create<NotificationFeedStore>((set) => ({
  items: [],

  add: (payload) => {
    const notification: ClientNotification = {
      ...payload,
      id: crypto.randomUUID(),
      read: false,
    };

    set((state) => ({
      items: [notification, ...state.items].slice(0, MAX_ITEMS),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    }));
  },

  clear: () => {
    set({ items: [] });
  },
}));

export function selectUnreadCount(items: ClientNotification[]): number {
  return items.filter((item) => !item.read).length;
}
