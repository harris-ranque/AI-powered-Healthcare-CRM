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
const DANGEROUS_EXTENSIONS = new Set(['exe', 'bat', 'sh', 'cmd']);

export type UploadActor = {
  organizationId: string;
  userId: string;
};

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createUploadUrl(
    dto: CreateUploadUrlDto,
    actor: UploadActor,
  ): Promise<{ uploadUrl: string; file: StoredFile }> {
    if (dto.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large');
    }

    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException('Invalid file type');
    }

    const extension = dto.fileName.split('.').pop() ?? 'bin';
    if (DANGEROUS_EXTENSIONS.has(extension)) {
      throw new BadRequestException('Invalid file type');
    }

    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL;
    if (!bucket || !publicBaseUrl) {
      throw new BadRequestException('Storage is not configured');
    }

    const storageKey = `${actor.organizationId}/${randomUUID()}.${extension}`;
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
      organizationId: actor.organizationId,
      uploadedById: actor.userId,
      originalName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
      storageKey,
      publicUrl,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
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
