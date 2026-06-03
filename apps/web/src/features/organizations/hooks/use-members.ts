'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MemberStatus } from '@/features/auth/types/member-status.type';
import type { Role } from '@/features/auth/types/role.type';

import { membersApi } from '../api/members.api';

export const membersQueryKeys = {
  all: ['organization-members'] as const,
  list: (status?: MemberStatus) => [...membersQueryKeys.all, status ?? 'all'] as const,
};

export function useMembersList(
  status?: MemberStatus,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: membersQueryKeys.list(status),
    queryFn: () => membersApi.list(status),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: MemberStatus }) =>
      membersApi.updateStatus(userId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersQueryKeys.all });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      membersApi.updateRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersQueryKeys.all });
    },
  });
}
