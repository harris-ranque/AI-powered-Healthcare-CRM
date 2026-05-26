import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { matchesTokenVersion } from '../../utils/token-version';
import { PrismaService } from '../../../database/prisma.service';
import type { AuthenticatedRequest } from '../../types/authenticated-request.type';
import type { JwtPayload } from '../../../modules/auth/types/jwt-payload.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !matchesTokenVersion(user, payload.tokenVersion)) {
        throw new UnauthorizedException();
      }

      (request as AuthenticatedRequest).user = payload;

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractBearerToken(authHeader: unknown): string | undefined {
    if (typeof authHeader !== 'string') {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}
