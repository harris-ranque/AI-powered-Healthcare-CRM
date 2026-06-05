import { Role } from '@prisma/client';

import { Permission } from './permission.constants';

/**
 * Maps `OrganizationMember.role` to the set of permissions granted.
 *
 * This is the single source of truth for role-to-permission resolution. A
 * future DB-backed RBAC layer should replace `ROLE_PERMISSIONS` while
 * keeping `getPermissionsForRole` as the public API.
 */

const DOCTOR_PERMISSIONS: Permission[] = [
  Permission.PATIENT_READ,
  Permission.PATIENT_WRITE,
  Permission.FILE_READ,
  Permission.FILE_WRITE,
  Permission.CLIENT_INVITE,
  Permission.STAFF_INVITE,
  Permission.AI_SUMMARY,
];

const RECEPTIONIST_PERMISSIONS: Permission[] = [
  Permission.PATIENT_READ,
  Permission.PATIENT_WRITE,
  Permission.FILE_READ,
  Permission.CLIENT_INVITE,
  Permission.STAFF_INVITE,
  Permission.AI_SUMMARY,
];

const CLINIC_OWNER_PERMISSIONS: Permission[] = [
  ...DOCTOR_PERMISSIONS,
  Permission.PATIENT_DELETE,
  Permission.FILE_DELETE,
  Permission.AUDIT_READ,
  Permission.MEMBER_MANAGE,
  Permission.BILLING_MANAGE,
  Permission.ORG_MANAGE,
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CLINIC_OWNER: CLINIC_OWNER_PERMISSIONS,
  DOCTOR: DOCTOR_PERMISSIONS,
  NURSE: DOCTOR_PERMISSIONS,
  RECEPTIONIST: RECEPTIONIST_PERMISSIONS,
  PATIENT: [],
  SUPER_ADMIN: CLINIC_OWNER_PERMISSIONS,
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
