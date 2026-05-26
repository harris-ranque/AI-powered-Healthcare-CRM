'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ReactNode } from 'react';

import { setupApiInterceptors } from '@/lib/api/interceptors';
import { AuthProvider } from './auth-provider';
import { NotificationProvider } from './notification-provider';
import { Toaster } from 'sonner';
import { RealtimeProvider } from './realtime-provider';

setupApiInterceptors();

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
          <Toaster richColors />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
