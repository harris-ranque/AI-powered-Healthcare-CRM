import type { Request } from 'express';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
};
