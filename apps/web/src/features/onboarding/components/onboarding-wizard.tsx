'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Role } from '@/features/auth/types/role.type';
import { suggestSlug } from '@/features/auth/schemas/register.schema';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { onboardingApi } from '../api/onboarding.api';
import type { ClinicSize, OnboardingState } from '../types/onboarding.type';

const STEPS = [
  'Clinic name',
  'Clinic size',
  'Invite staff',
  'Choose plan',
  'Finish setup',
] as const;

const SIZE_OPTIONS: { value: ClinicSize; label: string }[] = [
  { value: 'SIZE_1_5', label: '1–5' },
  { value: 'SIZE_6_20', label: '6–20' },
  { value: 'SIZE_21_100', label: '21–100' },
  { value: 'SIZE_100_PLUS', label: '100+' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const notify = useNotificationStore((state) => state.notify);
  const setUser = useAuthStore((state) => state.setUser);

  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [clinicName, setClinicName] = useState('');
  const [clinicSlug, setClinicSlug] = useState('');
  const slugEdited = useRef(false);

  const [clinicSize, setClinicSize] = useState<ClinicSize>('SIZE_1_5');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST>(
    Role.DOCTOR,
  );
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const stepFromQuery = Number(params.get('step'));
  const activeStep = state
    ? Number.isFinite(stepFromQuery) && stepFromQuery >= 1 && stepFromQuery <= 5
      ? stepFromQuery
      : state.onboardingStep
    : 1;

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      const next = await onboardingApi.getState();
      setState(next);
      if (next.clinicName) {
        setClinicName(next.clinicName);
      }
      if (next.clinicSlug) {
        setClinicSlug(next.clinicSlug);
      }
      if (next.clinicSize) {
        setClinicSize(next.clinicSize);
      }
      if (next.onboardingCompleted) {
        router.replace('/dashboard');
      }
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not load onboarding'),
      });
    } finally {
      setLoading(false);
    }
  }, [notify, router]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      notify({ type: 'success', message: 'Subscription activated' });
      void loadState();
    }
    if (params.get('checkout') === 'cancel') {
      notify({ type: 'error', message: 'Checkout was cancelled' });
    }
  }, [loadState, notify, params]);

  useEffect(() => {
    if (slugEdited.current) {
      return;
    }
    setClinicSlug(suggestSlug(clinicName));
  }, [clinicName]);

  const goToStep = (step: number) => {
    router.replace(`/onboarding?step=${step}`);
  };

  const handleCreateClinic = async () => {
    try {
      setSubmitting(true);
      const next = await onboardingApi.createClinic({
        clinicName: clinicName.trim(),
        clinicSlug: clinicSlug.trim() || undefined,
      });
      setState(next);
      setUser({
        ...(useAuthStore.getState().user!),
        organizationId: next.organizationId,
        onboardingCompleted: false,
        onboardingStep: next.onboardingStep,
      });
      notify({ type: 'success', message: 'Clinic created' });
      goToStep(2);
    } catch (error) {
      notify({ type: 'error', message: getErrorMessage(error, 'Could not create clinic') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSize = async () => {
    try {
      setSubmitting(true);
      const next = await onboardingApi.updateClinicSize(clinicSize);
      setState(next);
      goToStep(3);
    } catch (error) {
      notify({ type: 'error', message: getErrorMessage(error, 'Could not save clinic size') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      return;
    }
    try {
      setSubmitting(true);
      const next = await onboardingApi.inviteStaff({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setState(next);
      setInvitedEmails((prev) => [...prev, inviteEmail.trim()]);
      setInviteEmail('');
      notify({ type: 'success', message: 'Invitation sent' });
    } catch (error) {
      notify({ type: 'error', message: getErrorMessage(error, 'Could not send invitation') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipInvites = async () => {
    try {
      setSubmitting(true);
      const next = await onboardingApi.skipInvitations();
      setState(next);
      goToStep(4);
    } catch (error) {
      notify({ type: 'error', message: getErrorMessage(error, 'Could not continue') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPlan = async (plan: 'free' | 'starter' | 'pro') => {
    try {
      setSubmitting(true);
      const result = await onboardingApi.selectPlan(plan);
      setState(result.state);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      notify({ type: 'success', message: 'Plan selected' });
      goToStep(5);
    } catch (error) {
      notify({ type: 'error', message: getErrorMessage(error, 'Could not select plan') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      const next = await onboardingApi.complete();
      setState(next);
      setUser({
        ...(useAuthStore.getState().user!),
        onboardingCompleted: true,
        onboardingStep: 5,
      });
      notify({ type: 'success', message: 'Setup complete — welcome!' });
      router.push('/dashboard');
    } catch (error) {
      notify({ type: 'error', message: getErrorMessage(error, 'Could not finish setup') });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading setup...
      </div>
    );
  }

  return (
    <div className="medical-gradient-bg flex min-h-screen items-center justify-center p-4">
      <Card className="medical-card-glow w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your clinic</CardTitle>
          <CardDescription>
            Step {activeStep} of {STEPS.length}: {STEPS[activeStep - 1]}
          </CardDescription>
          <div className="mt-4 flex gap-2">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`h-1.5 flex-1 rounded-full ${
                  index + 1 <= activeStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeStep === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic name</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Sunrise Medical"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicSlug">Clinic URL slug</Label>
                <Input
                  id="clinicSlug"
                  value={clinicSlug}
                  onChange={(e) => {
                    slugEdited.current = true;
                    setClinicSlug(e.target.value);
                  }}
                  placeholder="sunrise-medical"
                />
              </div>
              <Button
                className="w-full"
                disabled={submitting || clinicName.trim().length < 3}
                onClick={() => void handleCreateClinic()}
              >
                Continue
              </Button>
            </>
          ) : null}

          {activeStep === 2 ? (
            <>
              <p className="text-muted-foreground text-sm">How many people work at your clinic?</p>
              <div className="grid grid-cols-2 gap-2">
                {SIZE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={clinicSize === option.value ? 'default' : 'outline'}
                    onClick={() => setClinicSize(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <Button className="w-full" disabled={submitting} onClick={() => void handleSaveSize()}>
                Continue
              </Button>
            </>
          ) : null}

          {activeStep === 3 ? (
            <>
              <p className="text-muted-foreground text-sm">
                Invite doctors, nurses, or receptionists. You can skip and invite later.
              </p>
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@clinic.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) =>
                    setInviteRole(value as Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.DOCTOR}>Doctor</SelectItem>
                    <SelectItem value={Role.NURSE}>Nurse</SelectItem>
                    <SelectItem value={Role.RECEPTIONIST}>Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {invitedEmails.length > 0 ? (
                <ul className="text-muted-foreground text-sm">
                  {invitedEmails.map((email) => (
                    <li key={email}>Invited {email}</li>
                  ))}
                </ul>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => void handleSkipInvites()}
                >
                  Skip for now
                </Button>
                <Button
                  className="flex-1"
                  disabled={submitting || !inviteEmail.trim()}
                  onClick={() => void handleInvite()}
                >
                  Send invite
                </Button>
              </div>
              {state.onboardingStep >= 4 ? (
                <Button variant="ghost" className="w-full" onClick={() => goToStep(4)}>
                  Continue to plans
                </Button>
              ) : null}
            </>
          ) : null}

          {activeStep === 4 ? (
            <>
              <p className="text-muted-foreground text-sm">Choose a plan to get started.</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-1 py-4"
                  disabled={submitting}
                  onClick={() => void handleSelectPlan('free')}
                >
                  <span className="font-semibold">Free</span>
                  <span className="text-muted-foreground text-sm">Up to 5 team members</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-1 py-4"
                  disabled={submitting}
                  onClick={() => void handleSelectPlan('starter')}
                >
                  <span className="font-semibold">Starter</span>
                  <span className="text-muted-foreground text-sm">Payments & notifications</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col items-start gap-1 py-4"
                  disabled={submitting}
                  onClick={() => void handleSelectPlan('pro')}
                >
                  <span className="font-semibold">Pro</span>
                  <span className="text-muted-foreground text-sm">Analytics & advanced reports</span>
                </Button>
              </div>
            </>
          ) : null}

          {activeStep === 5 ? (
            <>
              <div className="space-y-2 rounded-lg border p-4 text-sm">
                <p>
                  <strong>Clinic:</strong> {state.clinicName}
                </p>
                <p>
                  <strong>Plan:</strong> {state.subscriptionPlan ?? 'FREE'}
                </p>
                {invitedEmails.length > 0 ? (
                  <p>
                    <strong>Invites sent:</strong> {invitedEmails.length}
                  </p>
                ) : null}
              </div>
              <Button className="w-full" disabled={submitting} onClick={() => void handleComplete()}>
                Go to dashboard
              </Button>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
