import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterClinicDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @ValidateIf((o: RegisterClinicDto) => !o.googleToken)
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  googleToken?: string;

  @IsString()
  @MinLength(3)
  clinicName: string;

  @IsString()
  @MinLength(3)
  clinicSlug: string;
}
