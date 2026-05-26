import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { EmailService } from '../queues/email/email.service';
import { AuditService } from '../audit/audit.service';
import { mockJwtService, mockPrismaService } from '../../test/testing-utils';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        mockPrismaService,
        mockJwtService,
        { provide: EmailService, useValue: { sendWelcomeEmail: jest.fn() } },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
