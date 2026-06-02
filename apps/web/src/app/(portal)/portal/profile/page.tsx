'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function PortalProfilePage() {
  const user = useAuth().user;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My profile</h1>
      <dl className="bg-background max-w-md space-y-2 rounded-lg border p-4 text-sm">
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
  );
}
