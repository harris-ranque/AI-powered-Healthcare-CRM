'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAdminOrganizations } from '../hooks/use-admin-organizations';

function formatStatus(status: string | null): string {
  if (!status) return 'None';
  return status.replace(/_/g, ' ');
}

export function AdminOrganizationsTable() {
  const { data: organizations, isLoading, error } = useAdminOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground text-sm">
          All clinics on the platform with plan, user count, and subscription status.
        </p>
      </div>

      {error ? (
        <p className="text-destructive text-sm">Failed to load organizations.</p>
      ) : (
        <div className="medical-card-glow bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5 hover:bg-primary/5">
                <TableHead>Clinic</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : organizations?.length ? (
                organizations.map((org) => (
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
                    <TableCell className="tabular-nums">{org.users}</TableCell>
                    <TableCell>{formatStatus(org.stripeSubscriptionStatus)}</TableCell>
                    <TableCell>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No organizations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
