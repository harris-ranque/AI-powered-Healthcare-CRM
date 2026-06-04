import { api } from '@/lib/api/client';

import type { AuthUser } from '../types/auth-user.type';
import type { OtpPendingResponse } from '../types/otp.type';
import type { Role } from '../types/role.type';

export type RegisterClinicPayload = {
  name: string;
  email: string;
  password?: string;
  googleToken?: string;
  clinicName: string;
  clinicSlug: string;
};

export type RegisterSoloPayload = {
  name: string;
  email: string;
  password?: string;
  googleToken?: string;
  practiceName?: string;
};

export type RegisterStaffPayload = {
  name: string;
  email: string;
  password?: string;
  googleToken?: string;
  clinicSlug?: string;
  role?: Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST;
  inviteToken?: string;
};

export type RegisterPatientPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  googleToken?: string;
  clinicSlug?: string;
  phone?: string;
  dateOfBirth?: string;
  inviteToken?: string;
};

export type GoogleOnboardingResponse = {
  email: string;
  name?: string;
};

type AccessTokenResponse = { access_token: string };

export const authApi = {
  login: async (email: string, password: string): Promise<OtpPendingResponse> => {
    const response = await api.post<OtpPendingResponse>('/auth/login', { email, password });
    return response.data;
  },

  registerClinic: async (payload: RegisterClinicPayload): Promise<OtpPendingResponse> => {
    const response = await api.post<OtpPendingResponse>('/auth/register/clinic', payload);
    return response.data;
  },

  registerSolo: async (payload: RegisterSoloPayload): Promise<OtpPendingResponse> => {
    const response = await api.post<OtpPendingResponse>('/auth/register/solo', payload);
    return response.data;
  },

  registerStaff: async (payload: RegisterStaffPayload): Promise<OtpPendingResponse> => {
    const response = await api.post<OtpPendingResponse>('/auth/register/staff', payload);
    return response.data;
  },

  registerPatient: async (payload: RegisterPatientPayload): Promise<OtpPendingResponse> => {
    const response = await api.post<OtpPendingResponse>('/auth/register/patient', payload);
    return response.data;
  },

  verifyOtp: async (otpSessionId: string, code: string): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/otp/verify', {
      otpSessionId,
      code,
    });
    return response.data;
  },

  resendOtp: async (otpSessionId: string): Promise<OtpPendingResponse> => {
    const response = await api.post<OtpPendingResponse>('/auth/otp/resend', { otpSessionId });
    return response.data;
  },

  getGoogleOnboarding: async (token: string): Promise<GoogleOnboardingResponse> => {
    const response = await api.get<GoogleOnboardingResponse>('/auth/google/onboarding', {
      params: { token },
    });
    return response.data;
  },

  lookupInvitation: async (token: string) => {
    const response = await api.get<{
      email: string;
      role: string;
      organization: { name: string; slug: string };
    }>('/invitations/lookup', { params: { token } });
    return response.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>('/auth/me');
    return response.data;
  },

  refresh: async (): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/refresh');
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/logout');
    return response.data;
  },
};
