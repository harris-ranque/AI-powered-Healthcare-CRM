import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { getPermissionsForRole } from '../permissions';
import type { AuthenticatedRequest } from '../types/authenticated-request.type';
import type { OrganizationContext } from '../types/organization-context.type';

/**
 * Resolves the active organization for an authenticated request.
 *
 * Must run after `JwtAuthGuard`. Order is enforced by listing guards as
 * `@UseGuards(JwtAuthGuard, OrganizationContextGuard)` on the controller or
 * handler.
 *
 * Resolution strategy:
 *   1. If `x-organization-id` is present, use it.
 *   2. Otherwise, fall back to the user's earliest membership.
 *
 * In both cases membership in `OrganizationMember` is verified; the guard
 * throws 403 if the user is not a member of the resolved organization.
 */
@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const requestedOrganizationId = this.readHeader(
      request.headers['x-organization-id'],
    );

    const membership = requestedOrganizationId
      ? await this.prisma.client.organizationMember.findFirst({
          where: { organizationId: requestedOrganizationId, userId },
          select: { organizationId: true, role: true },
        })
      : await this.prisma.client.organizationMember.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          select: { organizationId: true, role: true },
        });

    if (!membership) {
      throw new ForbiddenException(
        requestedOrganizationId
          ? 'Invalid organization access'
          : 'No organization context available',
      );
    }

    const organization: OrganizationContext = {
      organizationId: membership.organizationId,
      role: membership.role,
      permissions: getPermissionsForRole(membership.role),
    };

    request.organization = organization;

    return true;
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}
