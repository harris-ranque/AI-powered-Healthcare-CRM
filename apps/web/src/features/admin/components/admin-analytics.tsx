'use client';

import { Building2, Sparkles, Users } from 'lucide-react';

import { AiUsageChart } from '@/components/dashboard/ai-usage-chart';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAdminAnalytics } from '../hooks/use-admin-analytics';

const EVENT_LABELS: Record<string, string> = {
  patient_created: 'Patients created',
  appointment_created: 'Appointments created',
  file_uploaded: 'Files uploaded',
  ai_summary_generated: 'AI summaries',
  user_invited: 'Users invited',
};

function formatWeekLabel(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function AdminAnalytics() {
  const { data, isLoading } = useAdminAnalytics();

  const maxRetentionWeeks = Math.max(
    0,
    ...(data?.weeklyRetention.map((row) => row.retention.length) ?? [0]),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Platform activity, product events, and weekly cohort retention.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Active organizations</h2>
        <DashboardGrid>
          <MetricCard
            label="Daily active orgs"
            value={data?.activeOrganizations.daily ?? 0}
            icon={Building2}
            isLoading={isLoading}
          />
          <MetricCard
            label="Weekly active orgs"
            value={data?.activeOrganizations.weekly ?? 0}
            icon={Building2}
            isLoading={isLoading}
          />
          <MetricCard
            label="Monthly active orgs"
            value={data?.activeOrganizations.monthly ?? 0}
            icon={Building2}
            isLoading={isLoading}
          />
        </DashboardGrid>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Active users</h2>
        <DashboardGrid>
          <MetricCard
            label="Daily active users"
            value={data?.activeUsers.daily ?? 0}
            icon={Users}
            isLoading={isLoading}
          />
          <MetricCard
            label="Weekly active users"
            value={data?.activeUsers.weekly ?? 0}
            icon={Users}
            isLoading={isLoading}
          />
          <MetricCard
            label="Monthly active users"
            value={data?.activeUsers.monthly ?? 0}
            icon={Users}
            isLoading={isLoading}
          />
        </DashboardGrid>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Product events (last 30 days)</h2>
        <DashboardGrid>
          {isLoading ? (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : (
            data?.eventTotals.map((item) => (
              <MetricCard
                key={item.event}
                label={EVENT_LABELS[item.event] ?? item.event}
                value={item.count}
                icon={Sparkles}
              />
            ))
          )}
        </DashboardGrid>
      </div>

      <AiUsageChart
        data={data?.dailyAiUsage ?? []}
        isLoading={isLoading}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-medium">Weekly cohort retention</h2>
            <p className="text-muted-foreground text-sm">
              Organizations grouped by signup week; % with at least one product event.
            </p>
          </div>
          <div className="min-w-[180px]">
            <MetricCard
              label="Week 1 retention"
              value={
                data?.week1Retention != null
                  ? formatPercent(data.week1Retention)
                  : '—'
              }
              icon={Users}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="medical-card-glow bg-card overflow-x-auto rounded-lg border">
          {isLoading ? (
            <Skeleton className="m-4 h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5">
                  <TableHead>Cohort week</TableHead>
                  <TableHead>Size</TableHead>
                  {Array.from({ length: maxRetentionWeeks }, (_, index) => (
                    <TableHead key={index}>W{index}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.weeklyRetention.length ? (
                  data.weeklyRetention.map((row) => (
                    <TableRow key={row.cohortWeek}>
                      <TableCell className="font-medium">
                        {formatWeekLabel(row.cohortWeek)}
                      </TableCell>
                      <TableCell className="tabular-nums">{row.size}</TableCell>
                      {Array.from({ length: maxRetentionWeeks }, (_, index) => (
                        <TableCell key={index} className="tabular-nums">
                          {row.retention[index] != null
                            ? formatPercent(row.retention[index])
                            : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2 + maxRetentionWeeks}
                      className="text-muted-foreground text-center"
                    >
                      No cohort data yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
