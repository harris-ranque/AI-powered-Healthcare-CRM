import { Controller, Body, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Organization } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ================================
  // Create Organization
  // ================================
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Organization> {
    return this.organizationsService.create(dto, req.user.sub);
  }

  // ================================
  // Get My Organizations
  // ================================
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyOrganizations(@Req() req: AuthenticatedRequest): Promise<Organization> {
    return this.organizationsService.getMyOrganizations(req.user.sub);
  }
}
