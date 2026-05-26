import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@prisma/client';
import type { Request } from 'express';

export type TenantContext = {
  organizationId: string;
  role: Role;
};

export type RequestWithTenant = Request & { tenant?: TenantContext };

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenant;
  },
);
