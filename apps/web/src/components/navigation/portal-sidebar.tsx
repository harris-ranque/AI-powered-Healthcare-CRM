'use client';

import Link from 'next/link';
import { Calendar, FileText, LogOut, UserRound } from 'lucide-react';

import { useLogout } from '@/features/auth/hooks/use-logout';

const items = [
  { label: 'Home', href: '/portal', icon: UserRound },
  { label: 'My profile', href: '/portal/profile', icon: UserRound },
  { label: 'My records', href: '/portal/records', icon: FileText },
  { label: 'My appointments', href: '/portal/appointments', icon: Calendar },
];

export function PortalSidebar() {
  const { logout, loading } = useLogout();

  return (
    <aside className="bg-background hidden w-64 border-r lg:flex lg:flex-col">
      <div className="border-b p-6 text-lg font-bold">Patient Portal</div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loading}
          className="hover:bg-muted flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {loading ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </aside>
  );
}
