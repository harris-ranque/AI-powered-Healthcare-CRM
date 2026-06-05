/**
 * Canonical permission strings used across the API.
 *
 * Each permission is a stable `"resource:action"` string. Keep this file
 * dependency-free so it can be imported from anywhere (controllers, guards,
 * decorators, queue processors) without pulling in Prisma or Nest internals.
 */
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

  AI_SUMMARY: 'ai:summary',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
