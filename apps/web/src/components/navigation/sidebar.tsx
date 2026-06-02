'use client';

import Link from 'next/link';
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { Role } from '@/features/auth/types/role.type';

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  visible: (role: Role | undefined) => boolean;
};

const items: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    visible: () => true,
  },
  {
    label: 'Patients',
    href: '/dashboard/patients',
    icon: Users,
    visible: (role) => hasPermission(role, Permission.PATIENT_READ),
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    visible: (role) => hasPermission(role, Permission.BILLING_MANAGE),
  },
  {
    label: 'Members',
    href: '/dashboard/settings/members',
    icon: UserCog,
    visible: (role) => hasPermission(role, Permission.MEMBER_MANAGE),
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    visible: (role) =>
      hasPermission(role, Permission.ORG_MANAGE) || role === Role.CLINIC_OWNER,
  },
];

export function Sidebar() {
  const { logout, loading } = useLogout();
  const user = useAuth().user;
  const visibleItems = items.filter((item) => item.visible(user?.role));

  return (
    <aside className="bg-background hidden w-64 border-r lg:flex lg:flex-col">
      <div className="border-b p-6 text-lg font-bold">Healthcare SaaS</div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map((item) => {
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
