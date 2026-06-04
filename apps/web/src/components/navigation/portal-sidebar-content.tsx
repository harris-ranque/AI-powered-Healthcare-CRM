'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, FileText, LogOut, User, UserRound } from 'lucide-react';

import { useLogout } from '@/features/auth/hooks/use-logout';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Home', href: '/portal', icon: UserRound },
  { label: 'My profile', href: '/portal/profile', icon: UserRound },
  { label: 'My records', href: '/portal/records', icon: FileText },
  { label: 'My appointments', href: '/portal/appointments', icon: Calendar },
];

function matchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export function PortalSidebarContent({ onNavigate, className }: Props) {
  const pathname = usePathname();
  const { logout, loading } = useLogout();

  const activeHref = items
    .filter((item) => matchesHref(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-sidebar-border border-b p-6">
        <div className="flex items-center gap-2">
          <Image
            src="/sunrise-medical-logo.webp"
            alt="Sunrise Medical logo"
            width={32}
            height={32}
            className="ring-primary/20 size-8 shrink-0 rounded-full ring-2"
            priority
          />
          <div className="text-primary text-lg font-bold tracking-tight">Sunrise Medical</div>
        </div>
        <div className="text-sidebar-accent-foreground mt-1.5 ml-10 flex items-center gap-1.5 text-xs font-medium">
          <User className="text-medical-sky h-3.5 w-3.5" />
          <span>Patient</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/12 text-primary font-medium shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className={cn('h-4 w-4', active && 'text-primary')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-sidebar-border border-t p-3">
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loading}
          className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {loading ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
