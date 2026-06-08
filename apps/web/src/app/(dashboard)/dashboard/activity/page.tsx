'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { useOrganizationActivity } from '@/features/activity/hooks/use-organization-activity';

type ActivityFilter = 'all' | 'patients' | 'appointments' | 'uploads' | 'ai';

const FILTER_OPTIONS: { id: ActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'patients', label: 'Patients' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'ai', label: 'AI' },
];

const FILTER_ACTIONS: Record<Exclude<ActivityFilter, 'all'>, string[]> = {
  patients: ['PATIENT_CREATED'],
  appointments: ['APPOINTMENT_CREATED'],
  uploads: ['FILE_UPLOADED'],
  ai: ['AI_SUMMARIZED'],
};

export default function OrganizationActivityPage() {
  const router = useRouter();
  const user = useAuth().user;
  const canViewActivity = hasPermission(user?.role, Permission.AUDIT_READ);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const { data: events = [], isLoading } = useOrganizationActivity();

  useEffect(() => {
    if (user && !canViewActivity) {
      router.replace('/dashboard');
    }
  }, [router, user, canViewActivity]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') {
      return events;
    }
    const allowedActions = FILTER_ACTIONS[filter];
    return events.filter((event) => allowedActions.includes(event.action));
  }, [events, filter]);

  if (user && !canViewActivity) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Organization activity
        </h1>
        <p className="text-muted-foreground text-sm">
          Track patients created, appointments scheduled, file uploads, and AI actions
          across your organization.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={filter === option.id ? 'default' : 'outline'}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <ActivityFeed
        events={filteredEvents}
        isLoading={isLoading}
        title="Organization activity"
        description="Patients created, appointments scheduled, uploads, and AI actions."
      />
    </div>
  );
}
