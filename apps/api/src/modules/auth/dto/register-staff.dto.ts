import { Role } from '@prisma/client';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

const staffRoles = [Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST] as const;

export class RegisterStaffDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @ValidateIf((o: RegisterStaffDto) => !o.googleToken)
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  googleToken?: string;

  @ValidateIf((o: RegisterStaffDto) => !o.inviteToken)
  @IsString()
  @MinLength(3)
  clinicSlug?: string;

  @ValidateIf((o: RegisterStaffDto) => !o.inviteToken)
  @IsString()
  @IsIn(staffRoles)
  role?: (typeof staffRoles)[number];

  @IsOptional()
  @IsString()
  inviteToken?: string;
}
