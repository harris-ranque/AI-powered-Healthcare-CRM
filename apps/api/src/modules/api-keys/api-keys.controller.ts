import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/role.guard';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  createApiKey(): { apiKey: string } {
    return { apiKey: this.apiKeysService.generateKey() };
  }
}
