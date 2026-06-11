'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingOverview } from '@/features/billing/hooks/use-billing-overview';
import { useBillingUsage } from '@/features/billing/hooks/use-billing-usage';

const UNLIMITED_DB_LIMIT = 2_147_483_647;

function isUnlimited(limit: number): boolean {
  return limit >= UNLIMITED_DB_LIMIT;
}

function formatLimit(limit: number): string {
  return isUnlimited(limit) ? 'Unlimited' : limit.toLocaleString();
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

export function UsageOverview() {
  const { data: org, isLoading: orgLoading } = useBillingOverview();
  const { data: usage, isLoading: usageLoading } = useBillingUsage();

  const isLoading = orgLoading || usageLoading;
  const storageUsedMb = (usage?.storage_bytes ?? 0) / (1024 * 1024);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-muted-foreground text-sm">
          Current month consumption against your plan limits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This month</CardTitle>
          <CardDescription>Patients, users, AI requests, and storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
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
              <UsageBar
                label="Appointments"
                used={usage!.appointments}
                limit={UNLIMITED_DB_LIMIT}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
