import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'node:crypto';

import { getRedis } from '../../common/redis/redis.provider';
import { EmailService } from '../queues/email/email.service';

import type { OtpChallenge, OtpPendingResponse, OtpPurpose } from './types/otp.types';

const OTP_KEY_PREFIX = 'auth:otp:';
const OTP_TTL_SECONDS = 600;
const MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(private readonly emailService: EmailService) {}

  async createChallenge(params: {
    purpose: OtpPurpose;
    email: string;
    userId?: string;
    payload?: unknown;
  }): Promise<OtpPendingResponse> {
    const code = String(randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(code, 10);
    const sessionId = randomUUID();

    const challenge: OtpChallenge = {
      purpose: params.purpose,
      email: params.email.toLowerCase().trim(),
      otpHash,
      attempts: 0,
      userId: params.userId,
      payload: params.payload,
    };

    await getRedis().set(
      `${OTP_KEY_PREFIX}${sessionId}`,
      JSON.stringify(challenge),
      'EX',
      OTP_TTL_SECONDS,
    );

    await this.emailService.sendOtpEmail({
      email: challenge.email,
      code,
      purpose: params.purpose,
    });

    return {
      otpSessionId: sessionId,
      email: maskEmail(challenge.email),
      expiresIn: OTP_TTL_SECONDS,
    };
  }

  async verifyCode(
    otpSessionId: string,
    code: string,
  ): Promise<OtpChallenge> {
    const key = `${OTP_KEY_PREFIX}${otpSessionId}`;
    const raw = await getRedis().get(key);

    if (!raw) {
      throw new BadRequestException(
        'Verification session expired. Please sign in or register again.',
      );
    }

    const challenge = JSON.parse(raw) as OtpChallenge;

    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      await getRedis().del(key);
      throw new UnauthorizedException(
        'Too many incorrect attempts. Please start again.',
      );
    }

    const matches = await bcrypt.compare(code, challenge.otpHash);
    if (!matches) {
      challenge.attempts += 1;
      const remaining = MAX_VERIFY_ATTEMPTS - challenge.attempts;
      if (remaining <= 0) {
        await getRedis().del(key);
        throw new UnauthorizedException(
          'Too many incorrect attempts. Please start again.',
        );
      }
      await getRedis().set(key, JSON.stringify(challenge), 'EX', OTP_TTL_SECONDS);
      throw new UnauthorizedException(
        `Invalid code. ${remaining} attempt(s) remaining.`,
      );
    }

    await getRedis().del(key);
    return challenge;
  }

  async resend(otpSessionId: string): Promise<OtpPendingResponse> {
    const key = `${OTP_KEY_PREFIX}${otpSessionId}`;
    const raw = await getRedis().get(key);

    if (!raw) {
      throw new BadRequestException(
        'Verification session expired. Please sign in or register again.',
      );
    }

    const previous = JSON.parse(raw) as OtpChallenge;
    await getRedis().del(key);

    return this.createChallenge({
      purpose: previous.purpose,
      email: previous.email,
      userId: previous.userId,
      payload: previous.payload,
    });
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email;
  }
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}
