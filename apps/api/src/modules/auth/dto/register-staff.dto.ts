import { Role } from '@prisma/client';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

const staffRoles = [Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST] as const;

export class RegisterStaffDto {
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
  clinicSlug: string;

  @IsString()
  @IsIn(staffRoles)
  role: (typeof staffRoles)[number];
}
