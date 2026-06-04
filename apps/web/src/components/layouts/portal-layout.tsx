'use client';

import { PortalSidebar } from '../navigation/portal-sidebar';
import { Topbar } from '../navigation/topbar';

type Props = {
  children: React.ReactNode;
};

export function PortalLayout({ children }: Props) {
  return (
    <div className="medical-gradient-bg flex min-h-screen">
      <PortalSidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
