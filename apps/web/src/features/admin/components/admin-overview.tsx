'use client';

import { Building2, Coins, Sparkles, Users } from 'lucide-react';

import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { MetricCard } from '@/components/dashboard/metric-card';

import { useAdminOverview } from '../hooks/use-admin-overview';

function formatTokens(value: number): string {
  return value.toLocaleString();
}

function formatCost(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function AdminOverview() {
  const { data, isLoading } = useAdminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Platform overview
        </h1>
        <p className="text-muted-foreground text-sm">
          Cross-tenant metrics for organizations, subscriptions, and AI usage.
        </p>
      </div>

      <DashboardGrid>
        <MetricCard
          label="Organizations"
          value={data?.organizations ?? 0}
          icon={Building2}
          isLoading={isLoading}
        />
        <MetricCard
          label="Users"
          value={data?.users ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <MetricCard
          label="Active subscriptions"
          value={data?.activeSubscriptions ?? 0}
          icon={Building2}
          isLoading={isLoading}
        />
        <MetricCard
          label="AI tokens this month"
          value={formatTokens(data?.aiTokensThisMonth ?? 0)}
          icon={Sparkles}
          hint="Platform-wide"
          isLoading={isLoading}
        />
        <MetricCard
          label="AI cost this month"
          value={formatCost(data?.aiCostThisMonth ?? 0)}
          icon={Coins}
          hint="Platform-wide"
          isLoading={isLoading}
        />
        <MetricCard
          label="AI requests this month"
          value={data?.aiRequestsThisMonth ?? 0}
          icon={Sparkles}
          isLoading={isLoading}
        />
      </DashboardGrid>
    </div>
  );
}
