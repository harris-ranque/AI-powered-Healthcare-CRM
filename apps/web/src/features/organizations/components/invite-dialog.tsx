'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { Role } from '@/features/auth/types/role.type';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { useCreateInvitation } from '../hooks/use-invitations';

type InviteMode = 'client' | 'staff';

type Props = {
  mode: InviteMode;
};

export function InviteDialog({ mode }: Props) {
  const user = useAuth().user;
  const notify = useNotificationStore((state) => state.notify);
  const createInvitation = useCreateInvitation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState<Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST>(
    Role.DOCTOR,
  );

  const canInviteClient = hasPermission(user?.role, Permission.CLIENT_INVITE);
  const canInviteStaff =
    mode === 'staff' && hasPermission(user?.role, Permission.MEMBER_MANAGE);

  if (mode === 'client' && !canInviteClient) {
    return null;
  }
  if (mode === 'staff' && !canInviteStaff) {
    return null;
  }

  const targetRole = mode === 'client' ? Role.PATIENT : staffRole;

  const handleSubmit = async () => {
    try {
      await createInvitation.mutateAsync({ email: email.trim(), role: targetRole });
      notify({
        type: 'success',
        message:
          mode === 'client'
            ? 'Client invitation sent'
            : 'Staff invitation sent',
      });
      setEmail('');
      setOpen(false);
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Failed to send invitation'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <UserPlus className="mr-2 size-4" />
          {mode === 'client' ? 'Invite client' : 'Invite staff'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'client' ? 'Invite a client' : 'Invite a team member'}
          </DialogTitle>
          <DialogDescription>
            We will email a signup link that pre-fills their clinic and role.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="person@example.com"
            />
          </div>
          {mode === 'staff' ? (
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={staffRole}
                onValueChange={(value) =>
                  setStaffRole(value as Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.DOCTOR}>Doctor</SelectItem>
                  <SelectItem value={Role.NURSE}>Nurse</SelectItem>
                  <SelectItem value={Role.RECEPTIONIST}>Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!email.trim() || createInvitation.isPending}
          >
            {createInvitation.isPending ? 'Sending...' : 'Send invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
