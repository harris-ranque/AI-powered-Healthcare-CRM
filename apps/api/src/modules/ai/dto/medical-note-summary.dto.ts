import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MedicalNoteSummaryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  notes: string;
}
