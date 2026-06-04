'use client';

import { usePathname } from 'next/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type PageMeta = {
  title: string;
  description?: string;
};

const PAGE_META: Record<string, PageMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Overview of your organization.',
  },
  '/dashboard/patients': {
    title: 'Patients',
    description: 'Manage patient records with search, sorting, and pagination.',
  },
  '/dashboard/billing': {
    title: 'Billing',
    description: 'Billing management coming soon.',
  },
  '/dashboard/settings': {
    title: 'Settings',
    description: 'Manage your organization preferences.',
  },
  '/dashboard/settings/members': {
    title: 'Team members',
    description: 'Invite and manage your team and clients.',
  },
  '/portal': {
    title: 'Patient portal',
    description: 'Your health information at a glance.',
  },
  '/portal/profile': {
    title: 'My profile',
    description: 'View and update your personal details.',
  },
  '/portal/records': {
    title: 'My records',
    description: 'Access your medical records securely.',
  },
  '/portal/appointments': {
    title: 'My appointments',
    description: 'View and manage your upcoming visits.',
  },
};

function getPageMeta(pathname: string | null): PageMeta | undefined {
  if (!pathname) {
    return undefined;
  }
  if (PAGE_META[pathname]) {
    return PAGE_META[pathname];
  }
  const matchedKey = Object.keys(PAGE_META)
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return matchedKey ? PAGE_META[matchedKey] : undefined;
}

export function Topbar() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className="medical-topbar-accent flex h-16 items-center justify-between px-6">
      <div>
        {meta ? (
          <>
            <h1 className="text-primary text-lg leading-tight font-bold">{meta.title}</h1>
            {meta.description ? (
              <p className="text-muted-foreground text-xs">{meta.description}</p>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="ring-primary/25 ring-2">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            SM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
