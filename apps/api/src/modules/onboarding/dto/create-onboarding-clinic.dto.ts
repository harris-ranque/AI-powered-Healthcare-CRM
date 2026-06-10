import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOnboardingClinicDto {
  @IsString()
  @MinLength(3)
  clinicName: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  clinicSlug?: string;
}
