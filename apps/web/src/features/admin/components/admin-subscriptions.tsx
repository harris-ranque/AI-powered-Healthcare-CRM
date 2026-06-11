'use client';

import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, CreditCard, XCircle } from 'lucide-react';

import { useAdminSubscriptions } from '../hooks/use-admin-subscriptions';
import type { AdminSubscriptionOrgRow } from '../types/admin.type';

function SubscriptionTable({ rows }: { rows: AdminSubscriptionOrgRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No organizations in this bucket.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary/5 hover:bg-primary/5">
          <TableHead>Clinic</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Stripe status</TableHead>
          <TableHead>Period end</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-muted-foreground text-xs">{org.slug}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{org.subscriptionPlan}</Badge>
            </TableCell>
            <TableCell>{org.stripeSubscriptionStatus ?? '—'}</TableCell>
            <TableCell>
              {org.subscriptionCurrentPeriodEnd
                ? new Date(org.subscriptionCurrentPeriodEnd).toLocaleDateString()
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AdminSubscriptions() {
  const { data, isLoading } = useAdminSubscriptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground text-sm">
          Subscription status across all organizations.
        </p>
      </div>

      <DashboardGrid>
        <MetricCard
          label="Active"
          value={data?.counts.active ?? 0}
          icon={CheckCircle2}
          isLoading={isLoading}
        />
        <MetricCard
          label="Canceled"
          value={data?.counts.canceled ?? 0}
          icon={XCircle}
          isLoading={isLoading}
        />
        <MetricCard
          label="Past due"
          value={data?.counts.pastDue ?? 0}
          icon={AlertCircle}
          isLoading={isLoading}
        />
        <MetricCard
          label="No subscription"
          value={data?.counts.none ?? 0}
          icon={CreditCard}
          isLoading={isLoading}
        />
      </DashboardGrid>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({data?.counts.active ?? 0})</TabsTrigger>
            <TabsTrigger value="canceled">
              Canceled ({data?.counts.canceled ?? 0})
            </TabsTrigger>
            <TabsTrigger value="pastDue">Past due ({data?.counts.pastDue ?? 0})</TabsTrigger>
            <TabsTrigger value="none">None ({data?.counts.none ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="medical-card-glow bg-card rounded-lg border p-0">
            <SubscriptionTable rows={data?.organizations.active ?? []} />
          </TabsContent>
          <TabsContent value="canceled" className="medical-card-glow bg-card rounded-lg border p-0">
            <SubscriptionTable rows={data?.organizations.canceled ?? []} />
          </TabsContent>
          <TabsContent value="pastDue" className="medical-card-glow bg-card rounded-lg border p-0">
            <SubscriptionTable rows={data?.organizations.pastDue ?? []} />
          </TabsContent>
          <TabsContent value="none" className="medical-card-glow bg-card rounded-lg border p-0">
            <SubscriptionTable rows={data?.organizations.none ?? []} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
