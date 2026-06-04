import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService.searchPublic', () => {
  let service: OrganizationsService;
  const findMany = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              organization: { findMany, findUnique: jest.fn(), findFirst: jest.fn() },
            },
          },
        },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('returns empty array for short queries', async () => {
    await expect(service.searchPublic('a')).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('searches clinics case-insensitively', async () => {
    findMany.mockResolvedValue([{ name: 'Sunrise', slug: 'sunrise' }]);

    const results = await service.searchPublic('sun');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'sun', mode: 'insensitive' } },
            { slug: { contains: 'sun', mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
    );
    expect(results).toEqual([{ name: 'Sunrise', slug: 'sunrise' }]);
  });
});
