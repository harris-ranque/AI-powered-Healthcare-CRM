import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import type { RequestWithTenant } from '../decorators/current-tenant.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    if (!request.tenant) {
      throw new ForbiddenException('Tenant required');
    }

    return true;
  }
}
