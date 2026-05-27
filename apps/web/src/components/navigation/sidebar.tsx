'use client';

import Link from 'next/link';

import { LayoutDashboard, Users, CreditCard, Settings, LogOut } from 'lucide-react';

import { useLogout } from '@/features/auth/hooks/use-logout';

const items = [
  {
    label: 'Dashboard',

    href: '/dashboard',

    icon: LayoutDashboard,
  },

  {
    label: 'Patients',

    href: '/patients',

    icon: Users,
  },

  {
    label: 'Billing',

    href: '/billing',

    icon: CreditCard,
  },

  {
    label: 'Settings',

    href: '/settings',

    icon: Settings,
  },
];

export function Sidebar() {
  const { logout, loading } = useLogout();

  return (
    <aside className="bg-background hidden w-64 border-r lg:flex lg:flex-col">
      <div className="border-b p-6 text-lg font-bold">Healthcare SaaS</div>

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
