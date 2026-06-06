import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClinicalNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  body: string;
}
