import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../modules/queues/email/email.service';
import { AuditService } from '../modules/audit/audit.service';

jest.mock('../common/security/login-rate-limit', () => ({
  getLoginRateLimiter: (): { consume: jest.Mock } => ({
    consume: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('Auth Integration', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              user: {
                findUnique: jest.fn().mockResolvedValue(null),
              },
            },
          },
        },
        { provide: EmailService, useValue: {} },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject invalid login', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'bad@test.com',
        password: 'wrongpass',
      })
      .expect(401);
  });
});
