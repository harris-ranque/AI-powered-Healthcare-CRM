import { api } from '@/lib/api/client';

import type { ClinicSize, OnboardingPlan, OnboardingState } from '../types/onboarding.type';
import { Role } from '@/features/auth/types/role.type';

export const onboardingApi = {
  getState: async (): Promise<OnboardingState> => {
    const response = await api.get<OnboardingState>('/onboarding');
    return response.data;
  },

  createClinic: async (payload: {
    clinicName: string;
    clinicSlug?: string;
  }): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>('/onboarding/clinic', payload);
    return response.data;
  },

  updateClinicSize: async (clinicSize: ClinicSize): Promise<OnboardingState> => {
    const response = await api.patch<OnboardingState>('/onboarding/clinic', { clinicSize });
    return response.data;
  },

  inviteStaff: async (payload: {
    email: string;
    role: Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST;
  }): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>('/onboarding/invitations', payload);
    return response.data;
  },

  skipInvitations: async (): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>('/onboarding/invitations/skip');
    return response.data;
  },

  selectPlan: async (
    plan: OnboardingPlan,
  ): Promise<{ state: OnboardingState; checkoutUrl?: string }> => {
    const response = await api.post<{ state: OnboardingState; checkoutUrl?: string }>(
      '/onboarding/plan',
      { plan },
    );
    return response.data;
  },

  complete: async (): Promise<OnboardingState> => {
    const response = await api.post<OnboardingState>('/onboarding/complete');
    return response.data;
  },
};
