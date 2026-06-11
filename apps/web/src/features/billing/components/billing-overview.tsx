'use client';

import { useState } from 'react';
import { CreditCard, ExternalLink, Sparkles } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import {
  useCancelSubscription,
  useCreateCheckout,
  useOpenBillingPortal,
} from '../hooks/use-billing-actions';
import { useBillingOverview } from '../hooks/use-billing-overview';
import { useBillingUsage } from '../hooks/use-billing-usage';
import type { CheckoutPlan, OrganizationBilling } from '../types/billing.type';

const UNLIMITED_DB_LIMIT = 2_147_483_647;

const PLAN_LABELS: Record<OrganizationBilling['subscriptionPlan'], string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

function isUnlimited(limit: number): boolean {
  return limit >= UNLIMITED_DB_LIMIT;
}

function formatLimit(limit: number): string {
  return isUnlimited(limit) ? 'Unlimited' : limit.toLocaleString();
}

function formatPlanLabel(plan: OrganizationBilling['subscriptionPlan']): string {
  return PLAN_LABELS[plan] ?? plan;
}

function formatStatus(status: string | null, plan: OrganizationBilling['subscriptionPlan']): string {
  if (!status) {
    return plan === 'FREE' ? 'None' : 'Unknown';
  }
  const normalized = status.toLowerCase();
  if (normalized === 'active') return 'Active';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'Canceled';
  if (normalized === 'past_due') return 'Past due';
  if (normalized === 'trialing') return 'Trialing';
  if (normalized === 'incomplete') return 'Incomplete';
  return status;
}

function statusVariant(
  status: string | null,
  plan: OrganizationBilling['subscriptionPlan'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!status && plan === 'FREE') return 'secondary';
  const normalized = status?.toLowerCase();
  if (normalized === 'active' || normalized === 'trialing') return 'default';
  if (normalized === 'past_due' || normalized === 'incomplete') return 'destructive';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'outline';
  return 'secondary';
}

function formatRenewalDate(
  periodEnd: string | null,
  plan: OrganizationBilling['subscriptionPlan'],
): string {
  if (plan === 'FREE' || !periodEnd) {
    return '—';
  }
  return new Date(periodEnd).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type UsageBarProps = {
  label: string;
  used: number;
  limit: number;
  formatUsed?: (value: number) => string;
  formatLimitValue?: (value: number) => string;
};

function UsageBar({
  label,
  used,
  limit,
  formatUsed = (value) => value.toLocaleString(),
  formatLimitValue = formatLimit,
}: UsageBarProps) {
  const unlimited = isUnlimited(limit);
  const percent = unlimited ? 0 : Math.min(100, limit > 0 ? (used / limit) * 100 : 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {formatUsed(used)} / {formatLimitValue(limit)}
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: unlimited ? '0%' : `${percent}%` }}
        />
      </div>
    </div>
  );
}

const UPGRADE_PLANS: { plan: CheckoutPlan; name: string; description: string }[] = [
  {
    plan: 'starter',
    name: 'Starter',
    description: '5 users · 500 patients · 100 AI requests/month',
  },
  {
    plan: 'pro',
    name: 'Professional',
    description: '25 users · 5,000 patients · 5,000 AI requests/month',
  },
];

export function BillingOverview() {
  const notify = useNotificationStore((state) => state.notify);
  const { data: org, isLoading: orgLoading, error: orgError } = useBillingOverview();
  const { data: usage, isLoading: usageLoading } = useBillingUsage();

  const createCheckout = useCreateCheckout();
  const openPortal = useOpenBillingPortal();
  const cancelSubscription = useCancelSubscription();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isLoading = orgLoading || usageLoading;

  const isCanceled =
    org?.stripeSubscriptionStatus?.toLowerCase() === 'canceled' ||
    org?.stripeSubscriptionStatus?.toLowerCase() === 'cancelled';
  const canCancel =
    Boolean(org?.stripeSubscriptionId) &&
    org?.subscriptionPlan !== 'FREE' &&
    !isCanceled;
  const canUpgrade = org?.subscriptionPlan === 'FREE' || org?.subscriptionPlan === 'STARTER';

  const handleUpgrade = async (plan: CheckoutPlan) => {
    try {
      await createCheckout.mutateAsync(plan);
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not start checkout'),
      });
    }
  };

  const handleManageBilling = async () => {
    try {
      await openPortal.mutateAsync();
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not open billing portal'),
      });
    }
  };

  const handleCancel = async () => {
    try {
      const result = await cancelSubscription.mutateAsync();
      setCancelOpen(false);
      const endDate = result.currentPeriodEnd
        ? new Date(result.currentPeriodEnd).toLocaleDateString()
        : 'the end of your billing period';
      notify({
        type: 'success',
        message: `Subscription will cancel on ${endDate}`,
      });
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Could not cancel subscription'),
      });
    }
  };

  if (orgError) {
    return (
      <p className="text-destructive text-sm">
        {getErrorMessage(orgError, 'Failed to load billing information')}
      </p>
    );
  }

  const storageUsedMb = (usage?.storage_bytes ?? 0) / (1024 * 1024);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-muted-foreground text-sm">
            Manage your subscription, usage, and invoices.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpgrade ? (
            <Button onClick={() => setUpgradeOpen(true)} disabled={createCheckout.isPending}>
              <Sparkles className="size-4" />
              Upgrade
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => void handleManageBilling()}
            disabled={openPortal.isPending || orgLoading}
          >
            <CreditCard className="size-4" />
            Manage Billing
          </Button>
          {canCancel ? (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setCancelOpen(true)}
              disabled={cancelSubscription.isPending}
            >
              Cancel Subscription
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>Your organization&apos;s active subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold">{formatPlanLabel(org!.subscriptionPlan)}</p>
                <div className="text-muted-foreground grid gap-1 text-sm">
                  <p>Users: {formatLimit(org!.memberLimit)}</p>
                  <p>Patients: {formatLimit(org!.patientLimit)}</p>
                  <p>AI requests/month: {formatLimit(org!.aiRequestLimitPerMonth)}</p>
                  <p>Storage: {formatLimit(org!.storageLimitMb)} MB</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Status and renewal details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <Badge variant={statusVariant(org!.stripeSubscriptionStatus, org!.subscriptionPlan)}>
                    {formatStatus(org!.stripeSubscriptionStatus, org!.subscriptionPlan)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Renewal date</p>
                  <p className="font-medium">
                    {formatRenewalDate(org!.subscriptionCurrentPeriodEnd, org!.subscriptionPlan)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Current month consumption against your plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            <>
              <UsageBar
                label="Patients"
                used={usage!.patients}
                limit={org!.patientLimit}
              />
              <UsageBar label="Users" used={usage!.users} limit={org!.memberLimit} />
              <UsageBar
                label="AI requests"
                used={usage!.ai_requests}
                limit={org!.aiRequestLimitPerMonth}
              />
              <UsageBar
                label="Storage"
                used={storageUsedMb}
                limit={org!.storageLimitMb}
                formatUsed={(value) => `${value.toFixed(1)} MB`}
                formatLimitValue={(value) =>
                  isUnlimited(value) ? 'Unlimited' : `${value.toLocaleString()} MB`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and download past invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Invoices and payment history are available in the Stripe Customer Portal.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleManageBilling()}
            disabled={openPortal.isPending}
          >
            <ExternalLink className="size-4" />
            View invoices in portal
          </Button>
        </CardContent>
      </Card>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade your plan</DialogTitle>
            <DialogDescription>
              Choose a plan to continue to secure Stripe checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {UPGRADE_PLANS.filter((item) => {
              if (org?.subscriptionPlan === 'STARTER' && item.plan === 'starter') {
                return false;
              }
              return true;
            }).map((item) => (
              <Button
                key={item.plan}
                variant="outline"
                className="h-auto flex-col items-start gap-1 px-4 py-3"
                disabled={createCheckout.isPending}
                onClick={() => void handleUpgrade(item.plan)}
              >
                <span className="font-semibold">{item.name}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {item.description}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until{' '}
              {formatRenewalDate(org?.subscriptionCurrentPeriodEnd ?? null, org?.subscriptionPlan ?? 'FREE')}.
              After that, your organization will move to the Free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelSubscription.isPending}>
              Keep subscription
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelSubscription.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleCancel();
              }}
            >
              {cancelSubscription.isPending ? 'Canceling...' : 'Cancel subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
