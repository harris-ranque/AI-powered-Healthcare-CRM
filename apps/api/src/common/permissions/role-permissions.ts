import { Role } from '@prisma/client';

import { Permission } from './permission.constants';

/**
 * Maps `OrganizationMember.role` to the set of permissions granted.
 *
 * This is the single source of truth for role-to-permission resolution. A
 * future DB-backed RBAC layer should replace `ROLE_PERMISSIONS` while
 * keeping `getPermissionsForRole` as the public API.
 */

const READ_ONLY: Permission[] = [Permission.PATIENT_READ, Permission.FILE_READ];

const STAFF_PERMISSIONS: Permission[] = [
  Permission.PATIENT_READ,
  Permission.PATIENT_WRITE,
  Permission.FILE_READ,
  Permission.FILE_WRITE,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...STAFF_PERMISSIONS,
  Permission.PATIENT_DELETE,
  Permission.FILE_DELETE,
  Permission.AUDIT_READ,
  Permission.MEMBER_MANAGE,
  Permission.BILLING_MANAGE,
  Permission.ORG_MANAGE,
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  VENDOR: ADMIN_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
  CUSTOMER: READ_ONLY,
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
