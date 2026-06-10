import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class RegisterProviderDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @ValidateIf((o: RegisterProviderDto) => !o.googleToken)
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  googleToken?: string;
}
