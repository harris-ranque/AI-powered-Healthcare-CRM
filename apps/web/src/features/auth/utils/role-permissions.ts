import { Role } from '../types/role.type';

export const Permission = {
  PATIENT_READ: 'patient:read',
  PATIENT_WRITE: 'patient:write',
  PATIENT_DELETE: 'patient:delete',
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_DELETE: 'file:delete',
  AUDIT_READ: 'audit:read',
  MEMBER_MANAGE: 'member:manage',
  BILLING_MANAGE: 'billing:manage',
  ORG_MANAGE: 'org:manage',
  CLIENT_INVITE: 'client:invite',
  STAFF_INVITE: 'staff:invite',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const DOCTOR_PERMISSIONS: Permission[] = [
  Permission.PATIENT_READ,
  Permission.PATIENT_WRITE,
  Permission.FILE_READ,
  Permission.FILE_WRITE,
  Permission.CLIENT_INVITE,
  Permission.STAFF_INVITE,
];

const RECEPTIONIST_PERMISSIONS: Permission[] = [
  Permission.PATIENT_READ,
  Permission.PATIENT_WRITE,
  Permission.FILE_READ,
  Permission.CLIENT_INVITE,
  Permission.STAFF_INVITE,
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
  [Role.CLINIC_OWNER]: CLINIC_OWNER_PERMISSIONS,
  [Role.DOCTOR]: DOCTOR_PERMISSIONS,
  [Role.NURSE]: DOCTOR_PERMISSIONS,
  [Role.RECEPTIONIST]: RECEPTIONIST_PERMISSIONS,
  [Role.PATIENT]: [],
  [Role.SUPER_ADMIN]: CLINIC_OWNER_PERMISSIONS,
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) {
    return false;
  }
  return getPermissionsForRole(role).includes(permission);
}
