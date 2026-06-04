'use client';

import { DashboardSidebarContent } from './dashboard-sidebar-content';

export function Sidebar() {
  return (
    <aside className="medical-sidebar-gradient border-sidebar-border text-sidebar-foreground hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
      <DashboardSidebarContent />
    </aside>
  );
}
