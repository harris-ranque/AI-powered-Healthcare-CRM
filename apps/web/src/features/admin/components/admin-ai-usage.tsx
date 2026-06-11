'use client';

import { Coins, Sparkles } from 'lucide-react';

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

import { useAdminAiUsage } from '../hooks/use-admin-ai-usage';

function formatTokens(value: number): string {
  return value.toLocaleString();
}

function formatCost(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function AdminAiUsage() {
  const { data, isLoading } = useAdminAiUsage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">AI usage</h1>
        <p className="text-muted-foreground text-sm">
          Platform token consumption and top customers this month.
        </p>
      </div>

      <DashboardGrid>
        <MetricCard
          label="Tokens this month"
          value={formatTokens(data?.tokensThisMonth ?? 0)}
          icon={Sparkles}
          isLoading={isLoading}
        />
        <MetricCard
          label="Cost this month"
          value={formatCost(data?.costThisMonth ?? 0)}
          icon={Coins}
          isLoading={isLoading}
        />
        <MetricCard
          label="Requests this month"
          value={data?.requestsThisMonth ?? 0}
          icon={Sparkles}
          isLoading={isLoading}
        />
      </DashboardGrid>

      <div>
        <h2 className="mb-3 font-medium">Top customers</h2>
        <div className="medical-card-glow bg-card rounded-lg border">
          {isLoading ? (
            <Skeleton className="m-4 h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5">
                  <TableHead>Organization</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topCustomers.length ? (
                  data.topCustomers.map((row) => (
                    <TableRow key={row.organizationId}>
                      <TableCell className="font-medium">{row.organizationName}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatTokens(row.tokens)}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCost(row.cost)}</TableCell>
                      <TableCell className="tabular-nums">{row.requests}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      No AI usage this month.
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
