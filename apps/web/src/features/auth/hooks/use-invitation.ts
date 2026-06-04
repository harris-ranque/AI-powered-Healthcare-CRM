'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { authApi } from '../api/auth.api';
import { Role } from '../types/role.type';
export type InvitationPrefill = {
  email: string;
  role: Role;
  clinicSlug: string;
  organizationName: string;
  inviteToken: string;
};

export function useInvitation() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [loading, setLoading] = useState(Boolean(inviteToken));
  const [error, setError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<InvitationPrefill | null>(null);

  useEffect(() => {
    if (!inviteToken) {
      setLoading(false);
      setPrefill(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await authApi.lookupInvitation(inviteToken);
        if (cancelled) {
          return;
        }
        setPrefill({
          email: data.email,
          role: data.role as Role,
          clinicSlug: data.organization.slug,
          organizationName: data.organization.name,
          inviteToken,
        });
      } catch {
        if (!cancelled) {
          setError('This invitation link is invalid or has expired.');
          setPrefill(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  return {
    inviteToken,
    isInviteFlow: Boolean(inviteToken),
    loading,
    error,
    prefill,
  };
}
