import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

import { Role } from '../enums/role.enum';
import { Observable } from 'rxjs';
import { AuthenticatedRequest } from '../types/authenticated-request.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role restriction
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    return requiredRoles.includes(user.role as Role);
  }
}
