import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterClinicDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(3)
  clinicName: string;

  @IsString()
  @MinLength(3)
  clinicSlug: string;
}
