import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Prisma, type File as StoredFile } from '@prisma/client';
import { randomUUID } from 'crypto';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { r2Client } from './r2.client';
import type { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const UPLOAD_URL_TTL_SECONDS = 60 * 5;
const DOWNLOAD_URL_TTL_SECONDS = 60 * 5;
const DANGEROUS_EXTENSIONS = new Set(['exe', 'bat', 'sh', 'cmd']);

type FileMetaInput = {
  fileName: string;
  mimeType: string;
  size: number;
};

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
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    this.validateFileMeta(dto);

    if (dto.patientId) {
      await this.assertPatientInOrg(dto.patientId, actor.organizationId);
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      throw new BadRequestException('Storage is not configured');
    }

    const extension = dto.fileName.split('.').pop() ?? 'bin';
    const storageKey = `${actor.organizationId}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: dto.mimeType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    });

    return { uploadUrl, storageKey };
  }

  async confirmUpload(
    dto: ConfirmUploadDto,
    actor: UploadActor,
  ): Promise<StoredFile> {
    this.validateFileMeta(dto);

    if (dto.patientId) {
      await this.assertPatientInOrg(dto.patientId, actor.organizationId);
    }

    const orgPrefix = `${actor.organizationId}/`;
    if (!dto.storageKey.startsWith(orgPrefix)) {
      throw new BadRequestException('Invalid storage key');
    }

    const bucket = process.env.R2_BUCKET_NAME;
    const publicBaseUrl = process.env.R2_PUBLIC_URL;
    if (!bucket || !publicBaseUrl) {
      throw new BadRequestException('Storage is not configured');
    }

    let contentLength: number;
    try {
      const head = await r2Client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: dto.storageKey,
        }),
      );
      if (head.ContentLength === undefined) {
        throw new BadRequestException('Upload not found');
      }
      contentLength = head.ContentLength;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Upload not found');
    }

    if (contentLength > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large');
    }

    const publicUrl = `${publicBaseUrl}/${dto.storageKey}`;

    try {
      const file = await this.prisma.createFile({
        organizationId: actor.organizationId,
        uploadedById: actor.userId,
        patientId: dto.patientId,
        originalName: dto.fileName,
        mimeType: dto.mimeType,
        size: contentLength,
        storageKey: dto.storageKey,
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
          patientId: dto.patientId ?? null,
        },
      });

      return file;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('File already registered');
      }
      throw error;
    }
  }

  async listForPatient(
    patientId: string,
    organizationId: string,
  ): Promise<StoredFile[]> {
    await this.assertPatientInOrg(patientId, organizationId);
    return this.prisma.findFilesByPatient(organizationId, patientId);
  }

  async getDownloadUrl(
    fileId: string,
    organizationId: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const file = await this.prisma.findFileById(fileId, organizationId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      throw new BadRequestException('Storage is not configured');
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: file.storageKey,
      ResponseContentDisposition: `inline; filename="${file.originalName}"`,
      ResponseContentType: file.mimeType,
    });

    const url = await getSignedUrl(r2Client, command, {
      expiresIn: DOWNLOAD_URL_TTL_SECONDS,
    });

    return { url, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
  }

  async deleteFile(
    fileId: string,
    actor: UploadActor,
  ): Promise<{ id: string }> {
    const file = await this.prisma.findFileById(fileId, actor.organizationId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (bucket) {
      try {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: file.storageKey,
          }),
        );
      } catch {
        // Best-effort R2 delete; still remove DB row
      }
    }

    await this.prisma.deleteFile(file.id);

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'FILE_DELETED',
      resource: 'FILE',
      resourceId: file.id,
      metadata: {
        fileName: file.originalName,
        patientId: file.patientId ?? null,
      },
    });

    return { id: file.id };
  }

  private validateFileMeta(dto: FileMetaInput): void {
    if (dto.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large');
    }

    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException('Invalid file type');
    }

    const extension = dto.fileName.split('.').pop()?.toLowerCase() ?? 'bin';
    if (DANGEROUS_EXTENSIONS.has(extension)) {
      throw new BadRequestException('Invalid file type');
    }
  }

  private async assertPatientInOrg(
    patientId: string,
    organizationId: string,
  ): Promise<void> {
    const patient = await this.prisma.client.patient.findFirst({
      where: { id: patientId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
  }
}
