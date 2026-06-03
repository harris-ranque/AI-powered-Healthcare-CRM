import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  otpSessionId: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string;
}

export class ResendOtpDto {
  @IsString()
  otpSessionId: string;
}
