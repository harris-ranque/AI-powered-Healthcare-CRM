import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { UsersService, UserProfile } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest): Promise<UserProfile> {
    return this.usersService.findById(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CLINIC_OWNER)
  @Get('admin')
  adminRoute() {
    return {
      message: 'Admin access granted',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLINIC_OWNER)
  @Get('clinic-owner')
  clinicOwnerRoute() {
    return {
      message: 'Clinic owner access granted',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Get('patient')
  patientRoute() {
    return {
      message: 'Patient access granted',
    };
  }
}
