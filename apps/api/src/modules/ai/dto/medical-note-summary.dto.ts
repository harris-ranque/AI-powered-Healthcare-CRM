import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class MedicalNoteSummaryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  notes: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
