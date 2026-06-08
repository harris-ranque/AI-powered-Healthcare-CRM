'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { GlobalSearch } from '@/features/search/components/global-search';
import { UserMenu } from '@/components/navigation/user-menu';

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
  '/dashboard/calendar': {
    title: 'Calendar',
    description: 'View and manage clinic appointments.',
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

type TopbarProps = {
  onMenuClick?: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const settingsHref = pathname?.startsWith('/portal')
    ? '/portal/profile'
    : '/dashboard/settings';

  return (
    <header className="medical-topbar-accent flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-primary/20 text-primary shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>
        ) : null}
        {meta ? (
          <div className="min-w-0">
            <h1 className="text-primary truncate text-lg leading-tight font-bold">{meta.title}</h1>
            {meta.description ? (
              <p className="text-muted-foreground truncate text-xs">{meta.description}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <GlobalSearch />
        <NotificationBell />
        <UserMenu settingsHref={settingsHref} />
      </div>
    </header>
  );
}
