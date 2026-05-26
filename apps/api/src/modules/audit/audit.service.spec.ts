import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { mockPrismaService } from '../../test/testing-utils';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, mockPrismaService],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
