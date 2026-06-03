import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { AppConfig } from '../../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from '../queues/email/email.module';
import { PrismaModule } from '../../database/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuditModule } from '../audit/audit.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [
    PassportModule.register({ session: false }),
    PrismaModule,
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
  providers: [AuthService, GoogleStrategy],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
