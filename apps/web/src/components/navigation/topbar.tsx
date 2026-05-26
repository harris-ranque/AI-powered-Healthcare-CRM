'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Topbar() {
  return (
    <header className="bg-background flex h-16 items-center justify-between border-b px-6">
      <div>Search</div>

      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>HC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
