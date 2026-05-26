import { IsEnum } from 'class-validator';

export enum SubscriptionPlan {
  STARTER = 'starter',
  PRO = 'pro',
}

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
