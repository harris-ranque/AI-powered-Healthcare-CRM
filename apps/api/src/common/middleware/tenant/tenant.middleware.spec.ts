import { TenantMiddleware } from './tenant.middleware';
import { PrismaService } from '../../../database/prisma.service';

describe('TenantMiddleware', () => {
  it('should be defined', () => {
    const prisma = {
      client: {
        organizationMember: { findFirst: jest.fn() },
      },
    } as unknown as PrismaService;

    expect(new TenantMiddleware(prisma)).toBeDefined();
  });
});
