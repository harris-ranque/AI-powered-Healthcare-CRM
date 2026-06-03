import { api } from '@/lib/api/client';

export type ClinicSearchResult = {
  name: string;
  slug: string;
};

export const organizationsApi = {
  search: async (q: string): Promise<ClinicSearchResult[]> => {
    const response = await api.get<ClinicSearchResult[]>('/organizations/search', {
      params: { q },
    });
    return response.data;
  },
};
