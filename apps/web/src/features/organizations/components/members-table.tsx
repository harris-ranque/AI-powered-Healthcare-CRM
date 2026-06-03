'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Role } from '@/features/auth/types/role.type';

import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { useAuth } from '@/features/auth/hooks/use-auth';

import { InvitationsList } from './invitations-list';
import { InviteDialog } from './invite-dialog';
import {
  useMembersList,
  useUpdateMemberRole,
  useUpdateMemberStatus,
} from '../hooks/use-members';

type Props = {
  canManageMembers?: boolean;
  canInviteClients?: boolean;
};

export function MembersTable({
  canManageMembers: canManageMembersProp,
  canInviteClients: canInviteClientsProp,
}: Props) {
  const user = useAuth().user;
  const canManageMembers =
    canManageMembersProp ?? hasPermission(user?.role, Permission.MEMBER_MANAGE);
  const canInviteClients =
    canInviteClientsProp ?? hasPermission(user?.role, Permission.CLIENT_INVITE);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ACTIVE' | 'DISABLED' | 'all'>(
    'PENDING',
  );
  const notify = useNotificationStore((state) => state.notify);
  const { data: members = [], isLoading, error } = useMembersList(
    canManageMembers ? (statusFilter === 'all' ? undefined : statusFilter) : undefined,
    { enabled: canManageMembers },
  );
  const updateStatus = useUpdateMemberStatus();
  const updateRole = useUpdateMemberRole();

  const handleStatus = async (userId: string, status: 'ACTIVE' | 'DISABLED') => {
    try {
      await updateStatus.mutateAsync({ userId, status });
      notify({
        type: 'success',
        message: status === 'ACTIVE' ? 'Member approved' : 'Member disabled',
      });
    } catch (err) {
      notify({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update member'),
      });
    }
  };

  const handleRole = async (userId: string, role: Role) => {
    try {
      await updateRole.mutateAsync({ userId, role });
      notify({ type: 'success', message: 'Role updated' });
    } catch (err) {
      notify({
        type: 'error',
        message: getErrorMessage(err, 'Failed to update role'),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {canManageMembers ? 'Team members' : 'Invitations'}
        </h1>
        <div className="flex flex-wrap gap-2">
          {canInviteClients ? <InviteDialog mode="client" /> : null}
          {canManageMembers ? <InviteDialog mode="staff" /> : null}
        </div>
        {canManageMembers ? (
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as 'PENDING' | 'ACTIVE' | 'DISABLED' | 'all')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        ) : null}
      </div>

      {canInviteClients ? <InvitationsList /> : null}

      {!canManageMembers ? null : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading members...</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(error, 'Failed to load members')}
        </p>
      ) : null}

      {!canManageMembers ? null : (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>{member.name ?? '—'}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(role) => void handleRole(member.userId, role as Role)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Role.DOCTOR}>Doctor</SelectItem>
                        <SelectItem value={Role.NURSE}>Nurse</SelectItem>
                        <SelectItem value={Role.RECEPTIONIST}>Receptionist</SelectItem>
                        <SelectItem value={Role.CLINIC_OWNER}>Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{member.status}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    {member.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        onClick={() => void handleStatus(member.userId, 'ACTIVE')}
                        disabled={updateStatus.isPending}
                      >
                        Approve
                      </Button>
                    ) : null}
                    {member.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleStatus(member.userId, 'DISABLED')}
                        disabled={updateStatus.isPending}
                      >
                        Disable
                      </Button>
                    ) : null}
                    {member.status === 'DISABLED' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleStatus(member.userId, 'ACTIVE')}
                        disabled={updateStatus.isPending}
                      >
                        Re-enable
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
