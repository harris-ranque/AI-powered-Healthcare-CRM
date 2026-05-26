import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { AuditService } from '../audit/audit.service';
import { mockPrismaService } from '../../test/testing-utils';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        mockPrismaService,
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
