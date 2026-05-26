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

  // =============================== ADMIN ===============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  adminRoute() {
    return {
      message: 'Admin access granted ',
    };
  }

  // =============================== VENDOR ===============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get('vendor')
  vendorRoute() {
    return {
      message: 'Vendor access granted ',
    };
  }

  // =============================== CUSTOMER ===============================
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Get('customer')
  customerRoute() {
    return {
      message: 'Customer access granted ',
    };
  }
}
