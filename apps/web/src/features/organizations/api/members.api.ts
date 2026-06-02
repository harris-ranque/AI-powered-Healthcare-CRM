import { api } from '@/lib/api/client';

import type { MemberStatus } from '@/features/auth/types/member-status.type';
import type { Role } from '@/features/auth/types/role.type';
import type { OrganizationMember } from '../types/member.type';

export const membersApi = {
  list: async (status?: MemberStatus): Promise<OrganizationMember[]> => {
    const response = await api.get<OrganizationMember[]>('/organizations/current/members', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  updateStatus: async (userId: string, status: MemberStatus) => {
    const response = await api.patch<{ userId: string; status: MemberStatus }>(
      `/organizations/current/members/${userId}/status`,
      { status },
    );
    return response.data;
  },

  updateRole: async (userId: string, role: Role) => {
    const response = await api.patch<{ userId: string; role: Role }>(
      `/organizations/current/members/${userId}/role`,
      { role },
    );
    return response.data;
  },
};
