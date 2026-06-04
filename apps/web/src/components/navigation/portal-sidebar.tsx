'use client';

import { PortalSidebarContent } from './portal-sidebar-content';

export function PortalSidebar() {
  return (
    <aside className="medical-sidebar-gradient border-sidebar-border text-sidebar-foreground hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
      <PortalSidebarContent />
    </aside>
  );
}
