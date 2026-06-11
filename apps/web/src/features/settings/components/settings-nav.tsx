'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { cn } from '@/lib/utils';

type SettingsNavItem = {
  label: string;
  href: string;
  visible: boolean;
};

export function SettingsNav() {
  const pathname = usePathname();
  const user = useAuth().user;

  const items: SettingsNavItem[] = [
    {
      label: 'Organization',
      href: '/dashboard/settings/organization',
      visible: hasPermission(user?.role, Permission.ORG_MANAGE),
    },
    {
      label: 'Team',
      href: '/dashboard/settings/team',
      visible:
        hasPermission(user?.role, Permission.MEMBER_MANAGE) ||
        hasPermission(user?.role, Permission.CLIENT_INVITE) ||
        hasPermission(user?.role, Permission.STAFF_INVITE),
    },
    {
      label: 'Billing',
      href: '/dashboard/settings/billing',
      visible: hasPermission(user?.role, Permission.BILLING_MANAGE),
    },
    {
      label: 'Usage',
      href: '/dashboard/settings/usage',
      visible: hasPermission(user?.role, Permission.MEMBER_MANAGE),
    },
    {
      label: 'Security',
      href: '/dashboard/settings/security',
      visible: true,
    },
  ];

  const visibleItems = items.filter((item) => item.visible);

  return (
    <nav className="border-b">
      <ul className="-mb-px flex flex-wrap gap-1">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'inline-flex border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
