import { IsIn } from 'class-validator';

export class OnboardingPlanDto {
  @IsIn(['free', 'starter', 'pro'])
  plan: 'free' | 'starter' | 'pro';
}
