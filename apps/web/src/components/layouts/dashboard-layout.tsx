'use client';

import { Sidebar } from '../navigation/sidebar';

import { Topbar } from '../navigation/topbar';

type Props = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: Props) {
  return (
    <div className="bg-muted/30 flex min-h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
