import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function DashboardGrid({ children }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}
