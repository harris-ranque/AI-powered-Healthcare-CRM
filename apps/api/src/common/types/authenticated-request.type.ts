import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';
import type { OrganizationContext } from './organization-context.type';

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
  organization?: OrganizationContext;
};
