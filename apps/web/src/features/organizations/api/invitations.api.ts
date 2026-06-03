import { api } from '@/lib/api/client';

import type { Role } from '@/features/auth/types/role.type';

export type InvitationLookup = {
  email: string;
  role: Role;
  organization: { name: string; slug: string };
};

export type InvitationListItem = {
  id: string;
  email: string;
  role: Role;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  invitedByName: string | null;
};

export const invitationsApi = {
  lookup: async (token: string): Promise<InvitationLookup> => {
    const response = await api.get<InvitationLookup>('/invitations/lookup', {
      params: { token },
    });
    return response.data;
  },

  list: async (status?: string): Promise<InvitationListItem[]> => {
    const response = await api.get<InvitationListItem[]>('/invitations', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  create: async (payload: { email: string; role: Role }): Promise<InvitationListItem> => {
    const response = await api.post<InvitationListItem>('/invitations', payload);
    return response.data;
  },

  revoke: async (id: string): Promise<void> => {
    await api.patch(`/invitations/${id}/revoke`);
  },
};
