import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import { CreateInvitationDto } from '../invitations/dto/create-invitation.dto';
import { CreateOnboardingClinicDto } from './dto/create-onboarding-clinic.dto';
import { OnboardingPlanDto } from './dto/onboarding-plan.dto';
import { UpdateClinicSizeDto } from './dto/update-clinic-size.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  getState(@Req() req: AuthenticatedRequest) {
    return this.onboardingService.getState(req.user.sub);
  }

  @Post('clinic')
  createClinic(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOnboardingClinicDto,
  ) {
    return this.onboardingService.createClinic(req.user.sub, dto);
  }

  @Patch('clinic')
  updateClinicSize(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateClinicSizeDto,
  ) {
    return this.onboardingService.updateClinicSize(req.user.sub, dto);
  }

  @Post('invitations')
  inviteStaff(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.onboardingService.inviteStaff(req.user.sub, dto);
  }

  @Post('invitations/skip')
  skipInvitations(@Req() req: AuthenticatedRequest) {
    return this.onboardingService.skipInvitations(req.user.sub);
  }

  @Post('plan')
  selectPlan(@Req() req: AuthenticatedRequest, @Body() dto: OnboardingPlanDto) {
    return this.onboardingService.selectPlan(req.user.sub, dto);
  }

  @Post('complete')
  complete(@Req() req: AuthenticatedRequest) {
    return this.onboardingService.complete(req.user.sub);
  }
}
