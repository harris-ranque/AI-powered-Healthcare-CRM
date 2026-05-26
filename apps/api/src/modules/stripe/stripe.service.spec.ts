import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { STRIPE_CLIENT } from './stripe.client';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { mockConfigService, mockPrismaService } from '../../test/testing-utils';

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        mockPrismaService,
        mockConfigService,
        { provide: RealtimeService, useValue: { paymentSuccess: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: { createNotification: jest.fn() },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: STRIPE_CLIENT, useValue: {} },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
