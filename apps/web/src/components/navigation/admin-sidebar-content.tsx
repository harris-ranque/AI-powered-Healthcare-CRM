'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Building2,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';

function matchesHref(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const items = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'AI Usage', href: '/admin/ai-usage', icon: Sparkles },
  { label: 'System Health', href: '/admin/health', icon: Activity },
];

type Props = {
  onNavigate?: () => void;
  className?: string;
};

export function AdminSidebarContent({ onNavigate, className }: Props) {
  const pathname = usePathname() ?? '';

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-sidebar-border flex h-16 items-center gap-2 border-b px-4">
        <ShieldCheck className="text-primary size-6" />
        <div>
          <p className="font-heading text-sm font-semibold">Platform Admin</p>
          <p className="text-muted-foreground text-xs">Internal operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = matchesHref(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border border-t p-4">
        <div className="flex items-center gap-2">
          <Image
            src="/sunrise-medical-logo.webp"
            alt="Sunrise Medical logo"
            width={24}
            height={24}
            className="opacity-80"
          />
          <span className="text-muted-foreground text-xs">Platform admin</span>
        </div>
      </div>
    </div>
  );
}
