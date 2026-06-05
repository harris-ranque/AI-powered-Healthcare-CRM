import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateClinicalNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  body: string;
}
