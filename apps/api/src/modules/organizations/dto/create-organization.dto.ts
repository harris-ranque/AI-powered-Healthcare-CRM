import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}
