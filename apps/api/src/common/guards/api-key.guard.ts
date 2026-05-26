import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import {
  PrismaService,
  type ApiKeyRecord,
} from '../../database/prisma.service';

export type RequestWithApiKey = Request & { apiKey?: ApiKeyRecord };

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();

    const headerValue = request.headers['x-api-key'];
    const apiKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const record = await this.prisma.findApiKey(apiKey);

    if (!record || record.revoked) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      throw new UnauthorizedException('API key expired');
    }

    request.apiKey = record;

    return true;
  }
}
