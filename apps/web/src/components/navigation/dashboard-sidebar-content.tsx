'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { Role } from '@/features/auth/types/role.type';
import { cn } from '@/lib/utils';

function matchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  visible: (role: Role | undefined) => boolean;
};

function getPersona(role: Role | undefined): { label: string; icon: LucideIcon } {
  switch (role) {
    case Role.CLINIC_OWNER:
      return { label: 'Organization owner', icon: Building2 };
    case Role.DOCTOR:
      return { label: 'Individual provider · Doctor', icon: Stethoscope };
    case Role.NURSE:
      return { label: 'Individual provider · Nurse', icon: Stethoscope };
    case Role.RECEPTIONIST:
      return { label: 'Individual provider · Receptionist', icon: Stethoscope };
    case Role.PATIENT:
      return { label: 'Patient', icon: User };
    case Role.SUPER_ADMIN:
      return { label: 'Super admin', icon: ShieldCheck };
    default:
      return { label: 'Member', icon: User };
  }
}

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
    label: 'Calendar',
    href: '/dashboard/calendar',
    icon: CalendarDays,
    visible: (role) => hasPermission(role, Permission.APPOINTMENT_READ),
  },
  {
    label: 'Activity',
    href: '/dashboard/activity',
    icon: Activity,
    visible: (role) => hasPermission(role, Permission.AUDIT_READ),
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    visible: (role) => hasPermission(role, Permission.BILLING_MANAGE),
  },
  {
    label: 'Members',
    href: '/dashboard/settings/team',
    icon: UserCog,
    visible: (role) =>
      hasPermission(role, Permission.MEMBER_MANAGE) ||
      hasPermission(role, Permission.CLIENT_INVITE),
  },
];

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export function DashboardSidebarContent({ onNavigate, className }: Props) {
  const pathname = usePathname();
  const user = useAuth().user;
  const visibleItems = items.filter((item) => item.visible(user?.role));
  const persona = getPersona(user?.role);
  const PersonaIcon = persona.icon;

  const activeHref = visibleItems
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
          <PersonaIcon className="text-primary h-3.5 w-3.5" />
          <span>{persona.label}</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map((item) => {
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
    </div>
  );
}
