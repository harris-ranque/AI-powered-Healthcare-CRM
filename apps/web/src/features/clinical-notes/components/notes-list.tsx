'use client';

import { Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import {
  useCreateNote,
  useDeleteNote,
  useSummarizeNote,
  useUpdateNote,
} from '../hooks/use-note-mutations';
import type { AiSummaryEntry, ClinicalNote } from '../types/clinical-note.type';

type Props = {
  patientId: string;
  notes: ClinicalNote[];
  aiSummaries: AiSummaryEntry[];
};

function NoteCard({
  note,
  patientId,
  canWrite,
  canSummarize,
}: {
  note: ClinicalNote;
  patientId: string;
  canWrite: boolean;
  canSummarize: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const update = useUpdateNote(patientId);
  const remove = useDeleteNote(patientId);
  const summarize = useSummarizeNote(patientId);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{note.author?.name ?? note.author?.email ?? 'Staff'}</p>
          <p className="text-muted-foreground text-xs">
            {new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(note.createdAt))}
          </p>
        </div>
        <div className="flex gap-1">
          {canSummarize ? (
            <Button
              variant="outline"
              size="sm"
              disabled={summarize.isPending}
              onClick={() => void summarize.mutateAsync(note.id)}
            >
              <Sparkles className="mr-1 size-3.5" />
              {summarize.isPending ? 'Summarizing...' : 'Summarize'}
            </Button>
          ) : null}
          {canWrite ? (
            <>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing((v) => !v)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={remove.isPending}
                onClick={() => void remove.mutateAsync(note.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!body.trim() || update.isPending}
              onClick={() => {
                void update.mutateAsync({ noteId: note.id, body }).then(() => setEditing(false));
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setBody(note.body);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap">{note.body}</p>
      )}

      {note.aiSummary ? (
        <div className="bg-muted/40 mt-3 rounded-md border p-3">
          <p className="text-primary mb-1 text-xs font-semibold tracking-wide uppercase">
            AI summary
          </p>
          <p className="text-sm whitespace-pre-wrap">{note.aiSummary}</p>
        </div>
      ) : null}
    </div>
  );
}

export function NotesList({ patientId, notes, aiSummaries }: Props) {
  const user = useAuth().user;
  const canWrite = hasPermission(user?.role, Permission.PATIENT_WRITE);
  const canSummarize = hasPermission(user?.role, Permission.AI_SUMMARY);
  const create = useCreateNote(patientId);
  const [newBody, setNewBody] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Clinical notes</h3>
        <p className="text-muted-foreground text-sm">
          Document visits, generate AI summaries, and review history.
        </p>
      </div>

      {canWrite ? (
        <div className="space-y-2 rounded-lg border p-4">
          <Textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Add a clinical note..."
            rows={4}
          />
          <Button
            disabled={!newBody.trim() || create.isPending}
            onClick={() => {
              void create.mutateAsync(newBody).then(() => setNewBody(''));
            }}
          >
            {create.isPending ? 'Saving...' : 'Add note'}
          </Button>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No clinical notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              patientId={patientId}
              canWrite={canWrite}
              canSummarize={canSummarize}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-medium">AI summary history</h4>
        {aiSummaries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No AI summaries generated yet.</p>
        ) : (
          <div className="space-y-2">
            {aiSummaries.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground mb-1 text-xs">
                  {new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(entry.createdAt))}{' '}
                  · {entry.user?.name ?? entry.user?.email ?? 'Staff'} · {entry.tokens} tokens
                </p>
                <p className="whitespace-pre-wrap">{entry.response}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
