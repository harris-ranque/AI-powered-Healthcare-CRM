import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateClinicalNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  body: string;
}
