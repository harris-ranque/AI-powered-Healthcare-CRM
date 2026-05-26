import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { mockPrismaService } from '../../test/testing-utils';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, mockPrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
