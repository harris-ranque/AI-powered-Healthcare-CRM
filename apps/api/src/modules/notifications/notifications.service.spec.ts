import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { mockPrismaService } from '../../test/testing-utils';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        mockPrismaService,
        { provide: RealtimeService, useValue: { systemAlert: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
