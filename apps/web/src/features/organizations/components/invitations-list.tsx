'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import {
  useInvitationsList,
  useResendInvitation,
  useRevokeInvitation,
} from '../hooks/use-invitations';

type Props = {
  action?: ReactNode;
  inviteeType?: 'client' | 'staff';
};

export function InvitationsList({ action, inviteeType }: Props) {
  const notify = useNotificationStore((state) => state.notify);
  const { data: invitations = [], isLoading, error } = useInvitationsList(
    'PENDING',
    inviteeType,
  );
  const revoke = useRevokeInvitation();
  const resend = useResendInvitation();

  const handleResend = async (id: string) => {
    try {
      await resend.mutateAsync(id);
      notify({ type: 'success', message: 'Invitation resent' });
    } catch (err) {
      notify({
        type: 'error',
        message: getErrorMessage(err, 'Failed to resend invitation'),
      });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revoke.mutateAsync(id);
      notify({ type: 'success', message: 'Invitation revoked' });
    } catch (err) {
      notify({
        type: 'error',
        message: getErrorMessage(err, 'Failed to revoke invitation'),
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Pending invitations</h2>
        {action}
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading invitations...</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(error, 'Failed to load invitations')}
        </p>
      ) : null}
      <div className="medical-card-glow bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  No pending invitations
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{invitation.role}</TableCell>
                  <TableCell>
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resend.isPending}
                      onClick={() => void handleResend(invitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revoke.isPending}
                      onClick={() => void handleRevoke(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
