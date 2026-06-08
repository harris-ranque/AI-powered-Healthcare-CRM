export const assistantQueryKeys = {
  all: ['assistant'] as const,
  conversations: () => [...assistantQueryKeys.all, 'conversations'] as const,
  conversation: (id: string) =>
    [...assistantQueryKeys.all, 'conversation', id] as const,
};
