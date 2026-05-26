import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [AuditService, JwtAuthGuard],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
