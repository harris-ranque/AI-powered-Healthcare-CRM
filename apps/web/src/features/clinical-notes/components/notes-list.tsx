'use client';

import { Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import {
  useCreateNote,
  useDeleteNote,
  useSummarizeNote,
  useUpdateNote,
} from '../hooks/use-note-mutations';
import { useSummarizeText } from '../hooks/use-summarize-text';
import type { ClinicalNote } from '../types/clinical-note.type';

type Props = {
  patientId: string;
  notes: ClinicalNote[];
};

const PREVIEW_LENGTH = 240;

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
  const [expanded, setExpanded] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const update = useUpdateNote(patientId);
  const remove = useDeleteNote(patientId);
  const summarize = useSummarizeNote(patientId);

  const isLong = note.body.length > PREVIEW_LENGTH;
  const displayBody =
    isLong && !expanded ? `${note.body.slice(0, PREVIEW_LENGTH).trimEnd()}…` : note.body;

  const handleSummarize = async () => {
    try {
      const result = await summarize.mutateAsync(note.id);
      setSummary(result.summary);
      setSummaryOpen(true);
    } catch {
      // onError toast is handled inside the mutation
    }
  };

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
              onClick={() => void handleSummarize()}
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
        <>
          <p className="text-sm whitespace-pre-wrap">{displayBody}</p>
          {isLong ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-primary mt-2 text-xs font-medium hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          ) : null}
        </>
      )}

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              AI summary
            </DialogTitle>
            <DialogDescription>
              AI-generated summary of this clinical note. This is not a diagnosis.
            </DialogDescription>
          </DialogHeader>
          <p className="max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap">
            {summary ?? note.aiSummary ?? 'No summary available.'}
          </p>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AiDocumentationAssistant({ patientId }: { patientId: string }) {
  const summarizeText = useSummarizeText(patientId);
  const [draft, setDraft] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);

  const handleSummarize = () => {
    summarizeText.mutate(draft, {
      onSuccess: (result) => {
        setSummary(result.summary);
        setTokens(result.tokens);
      },
    });
  };

  const handleClear = () => {
    setDraft('');
    setSummary(null);
    setTokens(null);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <h4 className="flex items-center gap-2 font-semibold">
          <Sparkles className="text-primary size-4" />
          AI documentation assistant
        </h4>
        <p className="text-muted-foreground text-sm">
          Paste clinical notes to get a concise summary. Documentation assistant only — not a
          diagnosis.
        </p>
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Paste clinical notes here..."
        rows={6}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!draft.trim() || summarizeText.isPending}
          onClick={handleSummarize}
        >
          <Sparkles className="mr-2 size-4" />
          {summarizeText.isPending ? 'Summarizing...' : 'Summarize'}
        </Button>
        {summary || draft ? (
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        ) : null}
      </div>

      {summary ? (
        <div className="bg-muted/40 space-y-2 rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              AI summary
            </p>
            {tokens !== null ? (
              <span className="text-muted-foreground text-xs">{tokens} tokens</span>
            ) : null}
          </div>
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
          <p className="text-muted-foreground text-xs">
            Documentation assistant — not a diagnosis. Do not use for medical decisions.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function NotesList({ patientId, notes }: Props) {
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
          Document visits and generate AI summaries on demand.
        </p>
      </div>

      {canSummarize ? <AiDocumentationAssistant patientId={patientId} /> : null}

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
    </div>
  );
}
