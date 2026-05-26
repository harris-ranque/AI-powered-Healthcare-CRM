import { BadRequestException, Injectable } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { File as StoredFile } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { r2Client } from './r2.client';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const UPLOAD_URL_TTL_SECONDS = 60 * 5;

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createUploadUrl(
    dto: CreateUploadUrlDto,
    userId: string,
  ): Promise<{ uploadUrl: string; file: StoredFile }> {
    if (dto.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large');
    }

    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException('Invalid file type');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.organizationId) {
      throw new BadRequestException('Organization not found');
    }

    const extension = dto.fileName.split('.').pop() ?? 'bin';
    const dangerousExtensions = ['exe', 'bat', 'sh', 'cmd'];

    if (dangerousExtensions.includes(extension)) {
      throw new BadRequestException('Invalid file type');
    }
    const storageKey = `${user.organizationId}/${randomUUID()}.${extension}`;

    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL;
    if (!bucket || !publicBaseUrl) {
      throw new BadRequestException('Storage is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: dto.mimeType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    });

    const publicUrl = `${publicBaseUrl}/${storageKey}`;
    const file = await this.prisma.createFile({
      organizationId: user.organizationId,
      uploadedById: user.id,
      originalName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
      storageKey,
      publicUrl,
    });

    await this.auditService.log({
      userId: user.id,

      action: 'FILE_UPLOADED',

      resource: 'FILE',

      resourceId: file.id,

      metadata: {
        fileName: file.originalName,

        mimeType: file.mimeType,
      },
    });

    return { uploadUrl, file };
  }
}
