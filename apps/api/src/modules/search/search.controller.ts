import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequireAnyPermissions } from '../../common/decorators/require-any-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import type { SearchResults } from './search-results.type';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @RequireAnyPermissions(
    Permission.PATIENT_READ,
    Permission.APPOINTMENT_READ,
    Permission.FILE_READ,
  )
  search(
    @CurrentOrganization() organization: OrganizationContext,
    @Query('q') q?: string,
  ): Promise<SearchResults> {
    return this.searchService.search(
      organization.organizationId,
      q ?? '',
      organization.permissions,
    );
  }
}
