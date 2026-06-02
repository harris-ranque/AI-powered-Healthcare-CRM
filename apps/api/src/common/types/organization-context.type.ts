import type { Role } from '@prisma/client';
import type { Request } from 'express';

/**
 * Canonical organization context attached to every authenticated request
 * after the organization-resolution middleware/guard runs.
 *
 * `permissions` is populated by the permissions-mapping step; until then it
 * is an empty array so consumers can treat it as the source of truth.
 */
export type OrganizationContext = {
  organizationId: string;
  role: Role;
  permissions: string[];
};

export type RequestWithOrganization = Request & {
  organization?: OrganizationContext;
};
