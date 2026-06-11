'use client';

import { Activity, Database, Server } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

import { useAdminHealth } from '../hooks/use-admin-health';

function StatusBadge({ status }: { status: 'up' | 'down' }) {
  return (
    <Badge variant={status === 'up' ? 'default' : 'destructive'}>
      {status === 'up' ? 'Up' : 'Down'}
    </Badge>
  );
}

export function AdminHealth() {
  const { data, isLoading } = useAdminHealth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">System health</h1>
        <p className="text-muted-foreground text-sm">
          Infrastructure status, queue job counts, and recent failures.
        </p>
      </div>

      <DashboardGrid>
        <MetricCard
          label="API uptime"
          value={data ? `${data.uptime}s` : '—'}
          icon={Server}
          isLoading={isLoading}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Database</CardTitle>
            <Database className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <StatusBadge status={data?.checks.database ?? 'down'} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Redis</CardTitle>
            <Activity className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <StatusBadge status={data?.checks.redis ?? 'down'} />
            )}
          </CardContent>
        </Card>
      </DashboardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : (
          data?.queues.map((queue) => (
            <Card key={queue.name}>
              <CardHeader>
                <CardTitle className="capitalize">{queue.name} queue</CardTitle>
                <CardDescription>Job counts by state</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Waiting</p>
                  <p className="font-semibold tabular-nums">{queue.counts.waiting}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active</p>
                  <p className="font-semibold tabular-nums">{queue.counts.active}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed</p>
                  <p className="font-semibold tabular-nums">{queue.counts.completed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="text-destructive font-semibold tabular-nums">
                    {queue.counts.failed}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delayed</p>
                  <p className="font-semibold tabular-nums">{queue.counts.delayed}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div>
        <h2 className="mb-3 font-medium">Recent failed jobs</h2>
        <div className="medical-card-glow bg-card rounded-lg border">
          {isLoading ? (
            <Skeleton className="m-4 h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5">
                  <TableHead>Queue</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.failedJobs.length ? (
                  data.failedJobs.map((job) => (
                    <TableRow key={`${job.queue}-${job.id}`}>
                      <TableCell>{job.queue}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-muted-foreground text-xs">{job.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {job.failedReason ?? '—'}
                      </TableCell>
                      <TableCell>
                        {job.timestamp
                          ? new Date(job.timestamp).toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      No failed jobs in queue history.
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
