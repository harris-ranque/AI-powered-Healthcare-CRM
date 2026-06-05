import type { MemberStatus } from './member-status.type';
import type { Role } from './role.type';

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  organizationId?: string;
  memberStatus?: MemberStatus;
};
