import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { getRedis } from '../../common/redis/redis.provider';
import { EmailService } from '../queues/email/email.service';
import { OtpService, maskEmail } from './otp.service';

jest.mock('../../common/redis/redis.provider', () => ({
  getRedis: jest.fn(),
}));

describe('OtpService', () => {
  let service: OtpService;
  const redis = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
  };
  const emailService = { sendOtpEmail: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    (getRedis as jest.Mock).mockReturnValue(redis);

    const module = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(OtpService);
  });

  it('masks email for display', () => {
    expect(maskEmail('jane@clinic.com')).toBe('j***@clinic.com');
  });

  it('creates challenge and sends OTP email', async () => {
    const result = await service.createChallenge({
      purpose: 'LOGIN',
      email: 'user@test.com',
      userId: 'user-1',
    });

    expect(result.otpSessionId).toBeDefined();
    expect(result.email).toContain('@test.com');
    expect(result.expiresIn).toBe(600);
    expect(redis.set).toHaveBeenCalled();
    expect(emailService.sendOtpEmail).toHaveBeenCalled();
  });

  it('rejects invalid OTP code', async () => {
    const hash = await bcrypt.hash('123456', 10);
    redis.get.mockResolvedValue(
      JSON.stringify({
        purpose: 'LOGIN',
        email: 'user@test.com',
        otpHash: hash,
        attempts: 0,
        userId: 'user-1',
      }),
    );

    await expect(service.verifyCode('session-1', '000000')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(redis.set).toHaveBeenCalled();
  });

  it('rejects expired session', async () => {
    redis.get.mockResolvedValue(null);

    await expect(service.verifyCode('missing', '123456')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
