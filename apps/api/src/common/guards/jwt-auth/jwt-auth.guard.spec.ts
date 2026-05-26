import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const jwtService = { verifyAsync: jest.fn() } as unknown as JwtService;
    const prisma = {
      client: { user: { findUnique: jest.fn() } },
    } as unknown as PrismaService;
    expect(new JwtAuthGuard(jwtService, prisma)).toBeDefined();
  });
});
