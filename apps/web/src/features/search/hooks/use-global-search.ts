import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchApi } from '../api/search.api';
import { searchQueryKeys } from './query-keys';

export function useGlobalSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: searchQueryKeys.query(trimmed),
    queryFn: () => searchApi.globalSearch(trimmed),
    enabled: trimmed.length >= 2,
    placeholderData: keepPreviousData,
  });
}
