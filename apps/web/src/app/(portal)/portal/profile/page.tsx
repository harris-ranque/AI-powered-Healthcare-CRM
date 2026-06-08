'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { getAvatarUrl, getInitials } from '@/features/auth/utils/avatar';

export default function PortalProfilePage() {
  const user = useAuth().user;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My profile</h1>
      <div className="bg-background max-w-md space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="ring-primary/25 ring-2">
            {user ? (
              <AvatarImage src={getAvatarUrl(user)} alt={user.name ?? user.email} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{user?.name ?? 'Patient'}</p>
            <p className="text-muted-foreground truncate text-sm">{user?.email ?? '—'}</p>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{user?.role ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
