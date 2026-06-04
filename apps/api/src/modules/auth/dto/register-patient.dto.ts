import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterPatientDto {
  @IsString()
  @IsEmail()
  email: string;

  @ValidateIf((o: RegisterPatientDto) => !o.googleToken)
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  googleToken?: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @ValidateIf((o: RegisterPatientDto) => !o.inviteToken)
  @IsString()
  @MinLength(3)
  clinicSlug?: string;

  @IsOptional()
  @IsString()
  inviteToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
