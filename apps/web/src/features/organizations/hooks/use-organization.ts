'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  organizationsApi,
  type UpdateOrganizationPayload,
} from '../api/organizations.api';

export const organizationQueryKeys = {
  all: ['organization'] as const,
  current: () => [...organizationQueryKeys.all, 'current'] as const,
};

export function useOrganization(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: organizationQueryKeys.current(),
    queryFn: () => organizationsApi.getCurrent(),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      organizationsApi.update(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
