'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return ctx;
}

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const current = value ?? internal;
  const setValue = onValueChange ?? setInternal;

  return (
    <TabsContext.Provider value={{ value: current, onValueChange: setValue }}>
      <div data-slot="tabs" className={cn('flex flex-col gap-4', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        'bg-muted/50 inline-flex h-9 w-full items-center justify-start gap-1 rounded-lg border p-1 sm:w-auto',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  ...props
}: React.ComponentProps<'button'> & { value: string }) {
  const { value: current, onValueChange } = useTabsContext();
  const active = current === value;

  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={active ? 'active' : 'inactive'}
      className={cn(
        'inline-flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
      onClick={() => onValueChange(value)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  value,
  ...props
}: React.ComponentProps<'div'> & { value: string }) {
  const { value: current } = useTabsContext();
  if (current !== value) {
    return null;
  }

  return (
    <div data-slot="tabs-content" className={cn('outline-none', className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
