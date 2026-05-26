import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule, JwtModule, AuditModule],
  providers: [StorageService, JwtAuthGuard, AuditService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
