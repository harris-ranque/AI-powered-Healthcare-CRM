'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CopilotChat } from '@/features/copilot/components/copilot-chat';
import { CopilotSessionList } from '@/features/copilot/components/copilot-session-list';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { useCreateCopilotSession } from '@/features/copilot/hooks/use-create-session';
import { useCopilotSession } from '@/features/copilot/hooks/use-session';
import { useCopilotSessions } from '@/features/copilot/hooks/use-sessions';

export default function CopilotPage() {
  const router = useRouter();
  const user = useAuth().user;
  const canUseCopilot = hasPermission(user?.role, Permission.AI_SUMMARY);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useCopilotSessions();
  const { data: activeSession, isLoading: sessionLoading } =
    useCopilotSession(activeSessionId);
  const createSession = useCreateCopilotSession();

  useEffect(() => {
    if (!canUseCopilot) {
      router.replace('/dashboard');
    }
  }, [canUseCopilot, router]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0]?.id ?? null);
    }
  }, [activeSessionId, sessions]);

  const handleCreate = async () => {
    const session = await createSession.mutateAsync();
    setActiveSessionId(session.id);
  };

  if (!canUseCopilot) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Clinical Copilot
        </h1>
        <p className="text-muted-foreground text-sm">
          AI assistant aware of your organization&apos;s patients and activity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <CopilotSessionList
          sessions={sessions}
          activeId={activeSessionId}
          isLoading={sessionsLoading}
          isCreating={createSession.isPending}
          onSelect={setActiveSessionId}
          onCreate={() => void handleCreate()}
        />
        <CopilotChat
          session={activeSession ?? null}
          isLoading={sessionLoading && Boolean(activeSessionId)}
        />
      </div>
    </div>
  );
}
