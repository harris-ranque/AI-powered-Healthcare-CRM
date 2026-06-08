'use client';

import Link from 'next/link';
import { LogOut, Settings } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { getAvatarUrl, getInitials } from '@/features/auth/utils/avatar';

type Props = {
  settingsHref: string;
};

export function UserMenu({ settingsHref }: Props) {
  const user = useAuth().user;
  const { logout, loading } = useLogout();
  const initials = getInitials(user?.name, user?.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className="focus-visible:ring-primary/40 rounded-full outline-none focus-visible:ring-2"
        >
          <Avatar className="ring-primary/25 ring-2">
            {user ? (
              <AvatarImage src={getAvatarUrl(user)} alt={user.name ?? user.email} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate font-medium">{user?.name ?? 'My account'}</span>
            {user?.email ? (
              <span className="text-muted-foreground truncate text-xs font-normal">
                {user.email}
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsHref}>
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={loading}
          onSelect={(event) => {
            event.preventDefault();
            void logout();
          }}
        >
          <LogOut className="size-4" />
          {loading ? 'Logging out...' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
