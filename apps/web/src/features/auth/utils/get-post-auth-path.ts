import type { MemberStatus } from '../types/member-status.type';
import { Role } from '../types/role.type';

const STAFF_ROLES: Role[] = [
  Role.CLINIC_OWNER,
  Role.DOCTOR,
  Role.NURSE,
  Role.RECEPTIONIST,
  Role.SUPER_ADMIN,
];

export function getPostAuthPath(role: Role, memberStatus?: MemberStatus): string {
  if (role === Role.PATIENT) {
    return '/portal';
  }

  if (STAFF_ROLES.includes(role)) {
    if (memberStatus === 'PENDING') {
      return '/onboarding/pending';
    }
    return '/dashboard';
  }

  return '/dashboard';
}

export function isStaffRole(role: Role | undefined): boolean {
  if (!role) {
    return false;
  }
  return STAFF_ROLES.includes(role);
}

export function isPatientRole(role: Role | undefined): boolean {
  return role === Role.PATIENT;
}
