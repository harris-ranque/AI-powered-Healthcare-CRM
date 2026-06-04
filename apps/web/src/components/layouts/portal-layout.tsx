'use client';

import { useState } from 'react';

import { MobileSidebarSheet } from '../navigation/mobile-sidebar-sheet';
import { PortalSidebar } from '../navigation/portal-sidebar';
import { PortalSidebarContent } from '../navigation/portal-sidebar-content';
import { Topbar } from '../navigation/topbar';

type Props = {
  children: React.ReactNode;
};

export function PortalLayout({ children }: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="medical-gradient-bg flex min-h-screen">
      <PortalSidebar />

      <MobileSidebarSheet open={mobileNavOpen} onOpenChange={setMobileNavOpen} title="Patient portal">
        <PortalSidebarContent onNavigate={() => setMobileNavOpen(false)} />
      </MobileSidebarSheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
