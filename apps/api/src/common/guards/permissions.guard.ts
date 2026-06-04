import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRED_ANY_PERMISSIONS_KEY } from '../decorators/require-any-permissions.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { Permission } from '../permissions';
import type { RequestWithOrganization } from '../types/organization-context.type';

/**
 * Enforces `@RequirePermissions(...)` metadata against the active
 * organization permissions.
 *
 * Must run after `OrganizationContextGuard` (which populates
 * `request.organization.permissions`). The guard is a no-op when no
 * permissions are declared on the handler/controller.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredAny = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if ((!required || required.length === 0) && (!requiredAny || requiredAny.length === 0)) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();

    const granted = request.organization?.permissions;
    if (!granted) {
      throw new ForbiddenException('Organization context required');
    }

    const grantedSet = new Set(granted);

    if (requiredAny && requiredAny.length > 0) {
      const hasAny = requiredAny.some((perm) => grantedSet.has(perm));
      if (!hasAny) {
        throw new ForbiddenException(
          `Missing required permission (need one of): ${requiredAny.join(', ')}`,
        );
      }
    }

    if (required && required.length > 0) {
      const missing = required.filter((perm) => !grantedSet.has(perm));
      if (missing.length > 0) {
        throw new ForbiddenException(
          `Missing required permission(s): ${missing.join(', ')}`,
        );
      }
    }

    return true;
  }
}
