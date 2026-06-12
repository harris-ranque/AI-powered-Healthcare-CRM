export const copilotQueryKeys = {
  all: ['copilot'] as const,
  sessions: () => [...copilotQueryKeys.all, 'sessions'] as const,
  session: (id: string) => [...copilotQueryKeys.all, 'session', id] as const,
};
