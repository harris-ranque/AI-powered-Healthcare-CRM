import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { StorageService } from './storage.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Controller('storage')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // =====================================
  // CREATE SIGNED URL
  // =====================================
  @Post('upload-url')
  @RequirePermissions(Permission.FILE_WRITE)
  createUploadUrl(
    @Body() dto: CreateUploadUrlDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storageService.createUploadUrl(dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}
