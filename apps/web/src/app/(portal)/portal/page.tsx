'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function PortalHomePage() {
  const user = useAuth().user;

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">Welcome to your portal</h1>
      <p className="text-muted-foreground text-sm">
        Signed in as {user?.email ?? 'patient'}. Use the sidebar to view your profile, records,
        and appointments.
      </p>
    </div>
  );
}
