'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useMembersList, useUpdateMemberRole, useUpdateMemberStatus } from '../hooks/use-members';

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
  const [search, setSearch] = useState('');
  const notify = useNotificationStore((state) => state.notify);
  const {
    data: members = [],
    isLoading,
    error,
  } = useMembersList(
    canManageMembers ? (statusFilter === 'all' ? undefined : statusFilter) : undefined,
    { enabled: canManageMembers },
  );

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return members;
    }
    return members.filter((member) =>
      [member.name, member.email, member.role]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [members, search]);
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
      {canInviteClients ? <InvitationsList action={<InviteDialog mode="staff" />} /> : null}

      {!canManageMembers ? null : isLoading ? (
        <p className="text-muted-foreground text-sm">Loading members...</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600">{getErrorMessage(error, 'Failed to load members')}</p>
      ) : null}

      {!canManageMembers ? null : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Team members ({filteredMembers.length})</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-8"
                  placeholder="Search by name, email, or role..."
                />
              </div>
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
            </div>
          </div>
          <div className="medical-card-glow bg-card rounded-lg border">
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
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      {search.trim() ? 'No members match your search' : 'No members found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
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
        </div>
      )}
    </div>
  );
}
