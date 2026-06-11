export type SubscriptionBucket = 'active' | 'canceled' | 'pastDue' | 'none';

export function normalizeSubscriptionStatus(
  status: string | null | undefined,
): SubscriptionBucket {
  if (!status || status.trim() === '') {
    return 'none';
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === 'active' || normalized === 'trialing') {
    return 'active';
  }

  if (normalized === 'canceled' || normalized === 'cancelled') {
    return 'canceled';
  }

  if (normalized === 'past_due' || normalized === 'unpaid') {
    return 'pastDue';
  }

  return 'none';
}

export function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
