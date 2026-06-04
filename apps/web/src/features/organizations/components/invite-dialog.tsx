'use client';

import { useId, useRef, useState } from 'react';
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
  onOpenChange?: (open: boolean) => void;
};

export function InviteDialog({ mode, onOpenChange }: Props) {
  const user = useAuth().user;
  const notify = useNotificationStore((state) => state.notify);
  const createInvitation = useCreateInvitation();
  const emailInputId = useId();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setEmail('');
    }
  };
  const [staffRole, setStaffRole] = useState<Role.DOCTOR | Role.NURSE | Role.RECEPTIONIST>(
    Role.DOCTOR,
  );

  const canInviteClient = hasPermission(user?.role, Permission.CLIENT_INVITE);
  const canInviteStaff =
    mode === 'staff' && hasPermission(user?.role, Permission.STAFF_INVITE);

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
      handleOpenChange(false);
    } catch (error) {
      notify({
        type: 'error',
        message: getErrorMessage(error, 'Failed to send invitation'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <UserPlus className="mr-2 size-4" />
          {mode === 'client' ? 'Invite client' : 'Invite staff'}
        </Button>
      </DialogTrigger>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          emailInputRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'client' ? 'Invite a client' : 'Invite a team member'}
          </DialogTitle>
          <DialogDescription>
            We will email a signup link that pre-fills their clinic and role.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={emailInputId}>Email</Label>
            <Input
              ref={emailInputRef}
              id={emailInputId}
              name={`${mode}-invitation-email`}
              type="email"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
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
          <DialogFooter className="px-0 pb-0">
            <Button
              type="submit"
              disabled={!email.trim() || createInvitation.isPending}
            >
              {createInvitation.isPending ? 'Sending...' : 'Send invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
