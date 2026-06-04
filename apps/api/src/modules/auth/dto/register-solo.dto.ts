import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterSoloDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @ValidateIf((o: RegisterSoloDto) => !o.googleToken)
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  googleToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  practiceName?: string;
}
