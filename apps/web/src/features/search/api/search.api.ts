import { api } from '@/lib/api/client';

import type { SearchResults } from '../types/search.type';

export const searchApi = {
  globalSearch: async (q: string): Promise<SearchResults> => {
    const response = await api.get<SearchResults>('/search', {
      params: { q },
    });
    return response.data;
  },
};
