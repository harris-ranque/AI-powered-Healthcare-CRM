import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [
    AuditService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
