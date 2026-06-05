export type ActivityUser = {
  id: string;
  name: string | null;
  email: string;
};

export type ActivityEvent = {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: ActivityUser | null;
};
