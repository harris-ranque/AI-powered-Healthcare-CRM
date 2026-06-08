export const searchQueryKeys = {
  all: ['search'] as const,
  query: (q: string) => [...searchQueryKeys.all, q] as const,
};
