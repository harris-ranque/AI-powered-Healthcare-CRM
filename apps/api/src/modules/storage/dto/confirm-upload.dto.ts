import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class ConfirmUploadDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  storageKey: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
