import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { BillingService } from '../../modules/billing/billing.service';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import type { RequestWithOrganization } from '../types/organization-context.type';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billing: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string | undefined>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!feature) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();
    const organizationId = request.organization?.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization required');
    }

    const allowed = await this.billing.hasFeature(organizationId, feature);

    if (!allowed) {
      throw new ForbiddenException('Feature not available on current plan');
    }

    return true;
  }
}
