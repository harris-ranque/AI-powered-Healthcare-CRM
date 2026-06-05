'use client';

import { Activity, FileUp, NotebookPen, Sparkles, UserRound } from 'lucide-react';

import { usePatientActivity } from '../hooks/use-patient-activity';

type Props = {
  patientId: string;
};

const ACTION_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  PATIENT_CREATED: { label: 'Patient created', icon: UserRound },
  PATIENT_UPDATED: { label: 'Patient updated', icon: UserRound },
  PATIENT_DELETED: { label: 'Patient deleted', icon: UserRound },
  PATIENT_RESTORED: { label: 'Patient restored', icon: UserRound },
  FILE_UPLOADED: { label: 'File uploaded', icon: FileUp },
  FILE_DELETED: { label: 'File deleted', icon: FileUp },
  NOTE_CREATED: { label: 'Clinical note added', icon: NotebookPen },
  NOTE_UPDATED: { label: 'Clinical note updated', icon: NotebookPen },
  NOTE_DELETED: { label: 'Clinical note deleted', icon: NotebookPen },
  AI_SUMMARIZED: { label: 'AI summary generated', icon: Sparkles },
};

function getActionMeta(action: string) {
  return ACTION_LABELS[action] ?? { label: action.replaceAll('_', ' ').toLowerCase(), icon: Activity };
}

export function ActivityTimeline({ patientId }: Props) {
  const { data: events = [], isLoading } = usePatientActivity(patientId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Activity timeline</h3>
        <p className="text-muted-foreground text-sm">Audit events, updates, and uploads.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading activity...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l pl-6">
          {events.map((event) => {
            const meta = getActionMeta(event.action);
            const Icon = meta.icon;
            return (
              <li key={event.id} className="relative">
                <span className="bg-background absolute top-1 -left-[1.85rem] rounded-full border p-1">
                  <Icon className="text-primary size-3.5" />
                </span>
                <div className="rounded-lg border p-3">
                  <p className="font-medium capitalize">{meta.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {event.user?.name ?? event.user?.email ?? 'System'} ·{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(event.createdAt))}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
