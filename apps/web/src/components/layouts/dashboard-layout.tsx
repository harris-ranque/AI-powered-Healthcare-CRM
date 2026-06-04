'use client';

import { useState } from 'react';

import { DashboardSidebarContent } from '../navigation/dashboard-sidebar-content';
import { MobileSidebarSheet } from '../navigation/mobile-sidebar-sheet';
import { Sidebar } from '../navigation/sidebar';
import { Topbar } from '../navigation/topbar';

type Props = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="medical-gradient-bg flex min-h-screen">
      <Sidebar />

      <MobileSidebarSheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DashboardSidebarContent onNavigate={() => setMobileNavOpen(false)} />
      </MobileSidebarSheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
