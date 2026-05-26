import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuthModule],
  providers: [OrganizationsService, JwtAuthGuard],
  controllers: [OrganizationsController],
})
export class OrganizationsModule {}
