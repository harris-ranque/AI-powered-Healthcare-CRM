import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
