import { IsNumber, IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;
}
