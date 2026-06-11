'use client';

import { useState } from 'react';

import { AdminSidebar } from '../navigation/admin-sidebar';
import { AdminSidebarContent } from '../navigation/admin-sidebar-content';
import { MobileSidebarSheet } from '../navigation/mobile-sidebar-sheet';
import { Topbar } from '../navigation/topbar';

type Props = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="medical-gradient-bg flex min-h-screen">
      <AdminSidebar />

      <MobileSidebarSheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <AdminSidebarContent onNavigate={() => setMobileNavOpen(false)} />
      </MobileSidebarSheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
