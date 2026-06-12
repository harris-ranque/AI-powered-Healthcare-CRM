import { env } from '@/config/env';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/features/auth/store/auth.store';

import type { ChatSession } from '../types/copilot.type';

type StreamHandlers = {
  onToken: (token: string) => void;
  onDone: (payload: { messageId: string; content: string }) => void;
  onError?: (message: string) => void;
};

function parseSseBlock(block: string): {
  event?: string;
  data?: string;
} {
  const lines = block.split('\n');
  let event: string | undefined;
  let data: string | undefined;

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data = line.slice(5).trim();
    }
  }

  return { event, data };
}

export const copilotApi = {
  createSession: async (): Promise<ChatSession> => {
    const response = await api.post<ChatSession>('/copilot/sessions');
    return response.data;
  },

  listSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get<ChatSession[]>('/copilot/sessions');
    return response.data;
  },

  getSession: async (id: string): Promise<ChatSession> => {
    const response = await api.get<ChatSession>(`/copilot/sessions/${id}`);
    return response.data;
  },

  deleteSession: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete<{ id: string }>(`/copilot/sessions/${id}`);
    return response.data;
  },

  streamMessage: async (
    sessionId: string,
    content: string,
    handlers: StreamHandlers,
  ): Promise<void> => {
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/copilot/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'ngrok-skip-browser-warning': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      },
    );

    if (!response.ok || !response.body) {
      const message = `Copilot request failed (${response.status})`;
      handlers.onError?.(message);
      throw new Error(message);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        if (!block.trim()) {
          continue;
        }

        const { event, data } = parseSseBlock(block);
        if (!data) {
          continue;
        }

        if (event === 'error') {
          const payload = JSON.parse(data) as { message: string };
          handlers.onError?.(payload.message);
          throw new Error(payload.message);
        }

        if (event === 'done') {
          const payload = JSON.parse(data) as {
            messageId: string;
            content: string;
          };
          handlers.onDone(payload);
          continue;
        }

        const payload = JSON.parse(data) as { token: string };
        if (payload.token) {
          handlers.onToken(payload.token);
        }
      }
    }
  },
};
