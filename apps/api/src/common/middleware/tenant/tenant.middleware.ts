import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Response } from 'express';

import { PrismaService } from '../../../database/prisma.service';
import type { RequestWithTenant } from '../../decorators/current-tenant.decorator';
import type { JwtPayload } from '../../../modules/auth/types/jwt-payload.type';

type AuthedRequest = RequestWithTenant & { user?: JwtPayload };

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(
    req: AuthedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    // =============================
    // GET TENANT HEADER
    // =============================
    const headerValue = req.headers['x-organization-id'];
    const organizationId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;

    if (!organizationId) {
      return next();
    }
    // =============================
    // VERIFY MEMBERSHIP
    // =============================
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    const membership = await this.prisma.client.organizationMember.findFirst({
      where: {
        organizationId,
        userId: req.user.sub,
      },
      select: { role: true },
    });

    if (!membership) {
      throw new UnauthorizedException('Invalid organization access');
    }
    // =============================
    // ATTACH TENANT CONTEXT
    // =============================
    req.tenant = {
      organizationId,
      role: membership.role,
    };

    next();
  }
}
