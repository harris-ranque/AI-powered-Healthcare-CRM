'use client';

import {
  CalendarClock,
  FileText,
  FileUp,
  NotebookPen,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { AiUsageChart } from '@/components/dashboard/ai-usage-chart';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { MetricCard } from '@/components/dashboard/metric-card';
import { PatientGrowthChart } from '@/components/dashboard/patient-growth-chart';
import { UpcomingAppointments } from '@/components/dashboard/upcoming-appointments';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { useDashboardActivity } from '@/features/dashboard/hooks/use-dashboard-activity';
import { useDashboardAnalytics } from '@/features/dashboard/hooks/use-dashboard-analytics';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { useUpcomingAppointments } from '@/features/dashboard/hooks/use-upcoming-appointments';
import { CreatePatientDialog } from '@/features/patients/components/create-patient-dialog';

const ANALYTICS_DAYS = 30;

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuth().user;
  const canRead = hasPermission(user?.role, Permission.PATIENT_READ);
  const canWritePatient = hasPermission(user?.role, Permission.PATIENT_WRITE);
  const canWriteFile = hasPermission(user?.role, Permission.FILE_WRITE);
  const canReadAppointments = hasPermission(user?.role, Permission.APPOINTMENT_READ);
  const canUseAi = hasPermission(user?.role, Permission.AI_SUMMARY);

  const [createPatientOpen, setCreatePatientOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics(
    ANALYTICS_DAYS,
    { enabled: canRead },
  );
  const { data: upcomingAppointments = [], isLoading: upcomingLoading } =
    useUpcomingAppointments({ enabled: canReadAppointments });

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="font-medium">You do not have access to the clinic dashboard.</p>
        <p className="text-muted-foreground text-sm">
          Contact your clinic administrator if you need dashboard access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Clinic dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Operational overview of patients, appointments, files, and AI activity.
        </p>
      </div>

      <DashboardGrid>
        <MetricCard
          label="Patients"
          value={stats?.patients ?? 0}
          icon={Users}
          isLoading={statsLoading}
        />
        <MetricCard
          label="Appointments today"
          value={stats?.appointmentsToday ?? 0}
          icon={CalendarClock}
          isLoading={statsLoading}
        />
        <MetricCard
          label="Files uploaded"
          value={stats?.files ?? 0}
          icon={FileText}
          isLoading={statsLoading}
        />
        <MetricCard
          label="AI summaries generated"
          value={stats?.aiSummaries ?? 0}
          icon={Sparkles}
          isLoading={statsLoading}
        />
      </DashboardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <PatientGrowthChart
          data={analytics?.patientGrowth ?? []}
          isLoading={analyticsLoading}
        />
        {canUseAi ? (
          <AiUsageChart
            data={analytics?.aiUsage ?? []}
            isLoading={analyticsLoading}
          />
        ) : null}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          {canWritePatient ? (
            <Button onClick={() => setCreatePatientOpen(true)}>
              <Plus className="size-4" />
              Add patient
            </Button>
          ) : null}
          {canWriteFile ? (
            <Button variant="outline" onClick={() => router.push('/dashboard/patients')}>
              <FileUp className="size-4" />
              Upload report
            </Button>
          ) : null}
          {canWritePatient ? (
            <Button variant="outline" onClick={() => router.push('/dashboard/patients')}>
              <NotebookPen className="size-4" />
              Create note
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {canReadAppointments ? (
          <UpcomingAppointments
            appointments={upcomingAppointments}
            isLoading={upcomingLoading}
          />
        ) : null}
        <ActivityFeed
          events={activity ?? []}
          isLoading={activityLoading}
          title="Recent activity"
          description="Latest changes across your clinic"
        />
      </div>

      <CreatePatientDialog open={createPatientOpen} onOpenChange={setCreatePatientOpen} />
    </div>
  );
}
