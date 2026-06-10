import { ClinicSize } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateClinicSizeDto {
  @IsEnum(ClinicSize)
  clinicSize: ClinicSize;
}
