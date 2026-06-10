'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Role } from '@/features/auth/types/role.type';

import { invitationsApi } from '../api/invitations.api';

export const invitationsQueryKeys = {
  all: ['invitations'] as const,
  list: (status?: string, inviteeType?: 'client' | 'staff') =>
    [...invitationsQueryKeys.all, status ?? 'all', inviteeType ?? 'all'] as const,
};

export function useInvitationsList(
  status?: string,
  inviteeType?: 'client' | 'staff',
) {
  return useQuery({
    queryKey: invitationsQueryKeys.list(status, inviteeType),
    queryFn: () => invitationsApi.list(status, inviteeType),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { email: string; role: Role }) => invitationsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.all });
    },
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.revoke(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.all });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.all });
    },
  });
}
