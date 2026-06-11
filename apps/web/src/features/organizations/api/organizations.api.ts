import { api } from '@/lib/api/client';

export type ClinicSearchResult = {
  name: string;
  slug: string;
};

export type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type UpdateOrganizationPayload = {
  name?: string;
  description?: string;
};

export const organizationsApi = {
  search: async (q: string): Promise<ClinicSearchResult[]> => {
    const response = await api.get<ClinicSearchResult[]>('/organizations/search', {
      params: { q },
    });
    return response.data;
  },

  getCurrent: async (): Promise<OrganizationDetails> => {
    const response = await api.get<OrganizationDetails>('/organizations/current');
    return response.data;
  },

  update: async (payload: UpdateOrganizationPayload): Promise<OrganizationDetails> => {
    const response = await api.patch<OrganizationDetails>(
      '/organizations/current',
      payload,
    );
    return response.data;
  },
};
