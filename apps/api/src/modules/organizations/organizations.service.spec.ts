import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { mockPrismaService } from '../../test/testing-utils';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationsService, mockPrismaService],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
