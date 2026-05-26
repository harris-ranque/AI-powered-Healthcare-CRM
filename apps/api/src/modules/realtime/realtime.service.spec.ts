import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeService', () => {
  let service: RealtimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        {
          provide: RealtimeGateway,
          useValue: { sendToOrganization: jest.fn(), notifyUser: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
