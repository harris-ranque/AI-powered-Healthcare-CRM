import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';

import { StorageService } from './storage.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // =====================================
  // CREATE SIGNED URL
  // =====================================
  @UseGuards(JwtAuthGuard)
  @Post('upload-url')
  createUploadUrl(
    @Body() dto: CreateUploadUrlDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.storageService.createUploadUrl(dto, req.user.sub);
  }
}
