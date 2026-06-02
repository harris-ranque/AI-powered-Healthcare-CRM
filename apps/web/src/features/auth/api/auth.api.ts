import { api } from '@/lib/api/client';

import type { AuthUser } from '../types/auth-user.type';
import type { Role } from '../types/role.type';

export type RegisterClinicPayload = {
  name: string;
  email: string;
  password: string;
  clinicName: string;
  clinicSlug: string;
};

export type RegisterStaffPayload = {
  name: string;
  email: string;
  password: string;
  clinicSlug: string;
  role: Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST;
};

export type RegisterPatientPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  clinicSlug: string;
  phone?: string;
  dateOfBirth?: string;
};

type AccessTokenResponse = { access_token: string };

export const authApi = {
  login: async (email: string, password: string): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/login', { email, password });
    return response.data;
  },

  registerClinic: async (payload: RegisterClinicPayload): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/register/clinic', payload);
    return response.data;
  },

  registerStaff: async (payload: RegisterStaffPayload): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/register/staff', payload);
    return response.data;
  },

  registerPatient: async (payload: RegisterPatientPayload): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/register/patient', payload);
    return response.data;
  },

  /** @deprecated Use registerClinic */
  register: async (email: string, password: string, name: string): Promise<AccessTokenResponse> => {
    const response = await api.post<AccessTokenResponse>('/auth/register', {
      email,
      password,
      name,
      clinicName: `${name}'s Clinic`,
      clinicSlug: `clinic-${Date.now()}`,
    });
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
