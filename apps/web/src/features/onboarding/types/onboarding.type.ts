export type ClinicSize =
  | 'SIZE_1_5'
  | 'SIZE_6_20'
  | 'SIZE_21_100'
  | 'SIZE_100_PLUS';

export type OnboardingState = {
  organizationId?: string;
  clinicName?: string;
  clinicSlug?: string;
  clinicSize?: ClinicSize | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  subscriptionPlan?: string;
};

export type OnboardingPlan = 'free' | 'starter' | 'pro';
