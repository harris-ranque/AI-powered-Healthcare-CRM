import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AppConfig } from '../../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailModule } from '../queues/email/email.module';
import { PrismaModule } from '../../database/prisma.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { envValidationSchema } from '../../config/env.validation';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        secret: config.get('jwtSecret', { infer: true }),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    forwardRef(() => AuditModule),
  ],
  providers: [AuthService, GoogleStrategy],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
