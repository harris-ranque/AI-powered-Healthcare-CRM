import { Role } from '@prisma/client';
import { IsEmail, IsIn, IsString } from 'class-validator';

const invitableRoles = [
  Role.PATIENT,
  Role.DOCTOR,
  Role.NURSE,
  Role.RECEPTIONIST,
] as const;

export class CreateInvitationDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(invitableRoles)
  role: (typeof invitableRoles)[number];
}
