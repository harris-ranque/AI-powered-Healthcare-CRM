import { IsUUID } from 'class-validator';

export class ListFilesDto {
  @IsUUID()
  patientId: string;
}
