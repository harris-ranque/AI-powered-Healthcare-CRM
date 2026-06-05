import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListAppointmentsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;
}
