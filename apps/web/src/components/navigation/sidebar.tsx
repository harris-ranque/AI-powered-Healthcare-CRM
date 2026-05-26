'use client';

import Link from 'next/link';

import { LayoutDashboard, Users, CreditCard, Settings } from 'lucide-react';

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
  return (
    <aside className="bg-background hidden w-64 border-r lg:flex lg:flex-col">
      <div className="border-b p-6 text-lg font-bold">Healthcare SaaS</div>

      <nav className="flex flex-col gap-1 p-3">
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
    </aside>
  );
}
