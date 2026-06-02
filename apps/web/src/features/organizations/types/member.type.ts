import type { MemberStatus } from '@/features/auth/types/member-status.type';
import type { Role } from '@/features/auth/types/role.type';

export type OrganizationMember = {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
  status: MemberStatus;
  createdAt: string;
};
