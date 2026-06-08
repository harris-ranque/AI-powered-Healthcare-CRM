import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { StorageService } from './storage.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { ListFilesDto } from './dto/list-files.dto';

@Controller('storage')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

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

  @Post('files')
  @RequirePermissions(Permission.FILE_WRITE)
  confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storageService.confirmUpload(dto, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }

  @Get('files/:id/download-url')
  @RequirePermissions(Permission.FILE_READ)
  getDownloadUrl(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.storageService.getDownloadUrl(id, organization.organizationId);
  }

  @Get('files')
  @RequirePermissions(Permission.FILE_READ)
  listFiles(
    @Query() query: ListFilesDto,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.storageService.listForPatient(
      query.patientId,
      organization.organizationId,
    );
  }

  @Delete('files/:id')
  @RequirePermissions(Permission.FILE_DELETE)
  deleteFile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storageService.deleteFile(id, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
    });
  }
}
