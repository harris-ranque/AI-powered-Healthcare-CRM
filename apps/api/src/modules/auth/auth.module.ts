import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { AppConfig } from '../../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { EmailModule } from '../queues/email/email.module';
import { PrismaModule } from '../../database/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuditModule } from '../audit/audit.module';
import { BillingModule } from '../billing/billing.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    PrismaModule,
    BillingModule,
    EmailModule,
    forwardRef(() => InvitationsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('jwtSecret', { infer: true }),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    forwardRef(() => AuditModule),
  ],
  providers: [AuthService, OtpService, GoogleStrategy],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
