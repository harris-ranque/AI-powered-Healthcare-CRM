'use client';

import { AdminSidebarContent } from './admin-sidebar-content';

export function AdminSidebar() {
  return (
    <aside className="medical-sidebar-gradient border-sidebar-border text-sidebar-foreground hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
      <AdminSidebarContent />
    </aside>
  );
}
