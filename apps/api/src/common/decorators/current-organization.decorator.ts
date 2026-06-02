import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type {
  OrganizationContext,
  RequestWithOrganization,
} from '../types/organization-context.type';

/**
 * Resolves the active organization context from the request.
 *
 * Usage:
 *   handler(@CurrentOrganization() organization: OrganizationContext) { ... }
 */
export const CurrentOrganization = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OrganizationContext | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithOrganization>();
    return request.organization;
  },
);
