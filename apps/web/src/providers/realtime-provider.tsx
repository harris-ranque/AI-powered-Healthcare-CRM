'use client';

import { useEffect } from 'react';

import { socket } from '@/lib/socket';

type Props = {
  children: React.ReactNode;
};

export function RealtimeProvider({ children }: Props) {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return children;
}
