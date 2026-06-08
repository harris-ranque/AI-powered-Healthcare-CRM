'use client';

import { ChevronDown, Pencil, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import {
  useCreateNote,
  useDeleteNote,
  useGenerateKeyPoints,
  useGenerateVisitSummary,
  useSummarizeNote,
  useUpdateNote,
} from '../hooks/use-note-mutations';
import { usePatientNotes } from '../hooks/use-patient-notes';
import { useSummarizeText } from '../hooks/use-summarize-text';
import {
  AI_SAFETY_DISCLAIMER,
  type ClinicalNote,
  type KeyPoints,
} from '../types/clinical-note.type';
import { RichTextEditor } from './rich-text-editor';

type Props = {
  patientId: string;
};

const SUMMARY_PREVIEW_LENGTH = 160;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isNoteEmpty(html: string) {
  return stripHtml(html).length === 0;
}

function NoteAiSummary({
  summary,
  defaultExpanded = false,
}: {
  summary: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isLong = summary.length > SUMMARY_PREVIEW_LENGTH;
  const displayText =
    isLong && !expanded
      ? `${summary.slice(0, SUMMARY_PREVIEW_LENGTH).trimEnd()}…`
      : summary;

  return (
    <div className="bg-muted/40 mt-3 space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" />
          AI summary
        </p>
        {isLong ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            {expanded ? 'Show less' : 'Show more'}
            <ChevronDown
              className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
            />
          </button>
        ) : null}
      </div>
      <p className="text-sm whitespace-pre-wrap">{displayText}</p>
      <p className="text-muted-foreground text-xs">{AI_SAFETY_DISCLAIMER}</p>
    </div>
  );
}

function KeyPointsSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold tracking-wide uppercase">{title}</p>
      <ul className="list-inside list-disc space-y-0.5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function NoteKeyPoints({ keyPoints }: { keyPoints: KeyPoints }) {
  const hasContent =
    keyPoints.keyFindings.length > 0 ||
    keyPoints.actionItems.length > 0 ||
    keyPoints.followUpTasks.length > 0;

  if (!hasContent) return null;

  return (
    <div className="bg-muted/40 mt-3 space-y-3 rounded-md border p-3">
      <p className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Sparkles className="size-3.5" />
        Key points
      </p>
      <KeyPointsSection title="Key findings" items={keyPoints.keyFindings} />
      <KeyPointsSection title="Action items" items={keyPoints.actionItems} />
      <KeyPointsSection title="Follow-up tasks" items={keyPoints.followUpTasks} />
      <p className="text-muted-foreground text-xs">{AI_SAFETY_DISCLAIMER}</p>
    </div>
  );
}

function NoteVisitSummary({ summary }: { summary: string }) {
  return (
    <div className="bg-muted/40 mt-3 space-y-2 rounded-md border p-3">
      <p className="text-primary flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Sparkles className="size-3.5" />
        Visit summary
      </p>
      <p className="text-sm whitespace-pre-wrap">{summary}</p>
      <p className="text-muted-foreground text-xs">{AI_SAFETY_DISCLAIMER}</p>
    </div>
  );
}

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
  const [title, setTitle] = useState(note.title ?? '');
  const [body, setBody] = useState(note.body);
  const [expanded, setExpanded] = useState(false);
  const [showFreshSummary, setShowFreshSummary] = useState(false);
  const update = useUpdateNote(patientId);
  const remove = useDeleteNote(patientId);
  const summarize = useSummarizeNote(patientId);
  const keyPointsMutation = useGenerateKeyPoints(patientId);
  const visitSummaryMutation = useGenerateVisitSummary(patientId);

  const plainBody = stripHtml(note.body);
  const isLong = plainBody.length > 240;
  const hasSavedSummary = Boolean(note.aiSummary);
  const hasSavedKeyPoints = Boolean(note.keyPoints);
  const hasSavedVisitSummary = Boolean(note.visitSummary);
  const aiPending =
    summarize.isPending ||
    keyPointsMutation.isPending ||
    visitSummaryMutation.isPending;

  const handleSummarize = async () => {
    try {
      await summarize.mutateAsync(note.id);
      setShowFreshSummary(true);
    } catch {
      // onError toast is handled inside the mutation
    }
  };

  const handleKeyPoints = async () => {
    try {
      await keyPointsMutation.mutateAsync(note.id);
    } catch {
      // onError toast is handled inside the mutation
    }
  };

  const handleVisitSummary = async () => {
    try {
      await visitSummaryMutation.mutateAsync(note.id);
    } catch {
      // onError toast is handled inside the mutation
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          {note.title ? <p className="font-semibold">{note.title}</p> : null}
          <p className="font-medium">{note.author?.name ?? note.author?.email ?? 'Staff'}</p>
          <p className="text-muted-foreground text-xs">
            {new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(note.createdAt))}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {canSummarize ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={aiPending}
                onClick={() => void handleSummarize()}
              >
                <Sparkles className="mr-1 size-3.5" />
                {summarize.isPending
                  ? 'Summarizing...'
                  : hasSavedSummary
                    ? 'Regenerate summary'
                    : 'Summarize note'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={aiPending}
                onClick={() => void handleKeyPoints()}
              >
                <Sparkles className="mr-1 size-3.5" />
                {keyPointsMutation.isPending
                  ? 'Generating...'
                  : hasSavedKeyPoints
                    ? 'Regenerate key points'
                    : 'Key points'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={aiPending}
                onClick={() => void handleVisitSummary()}
              >
                <Sparkles className="mr-1 size-3.5" />
                {visitSummaryMutation.isPending
                  ? 'Generating...'
                  : hasSavedVisitSummary
                    ? 'Regenerate visit summary'
                    : 'Visit summary'}
              </Button>
            </>
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
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title (optional)"
          />
          <RichTextEditor value={body} onChange={setBody} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isNoteEmpty(body) || update.isPending}
              onClick={() => {
                void update
                  .mutateAsync({
                    noteId: note.id,
                    title: title.trim() || undefined,
                    body,
                  })
                  .then(() => setEditing(false));
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTitle(note.title ?? '');
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
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none text-sm',
              !expanded && isLong && 'max-h-32 overflow-hidden',
            )}
            dangerouslySetInnerHTML={{ __html: note.body }}
          />
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

      {hasSavedSummary && note.aiSummary ? (
        <NoteAiSummary
          key={`${note.id}-summary-${note.updatedAt}`}
          summary={note.aiSummary}
          defaultExpanded={showFreshSummary}
        />
      ) : null}

      {hasSavedKeyPoints && note.keyPoints ? (
        <div key={`${note.id}-keypoints-${note.updatedAt}`}>
          <NoteKeyPoints keyPoints={note.keyPoints} />
        </div>
      ) : null}

      {hasSavedVisitSummary && note.visitSummary ? (
        <NoteVisitSummary
          key={`${note.id}-visit-${note.updatedAt}`}
          summary={note.visitSummary}
        />
      ) : null}
    </div>
  );
}

function DraftAssistant({ patientId }: { patientId: string }) {
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
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div>
        <h4 className="flex items-center gap-2 font-semibold">
          <Sparkles className="text-primary size-4" />
          Draft assistant
        </h4>
        <p className="text-muted-foreground text-sm">
          Paste rough visit notes to draft a summary before adding a formal chart note. Results are
          not saved to the patient record.
        </p>
      </div>

      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Paste draft notes here..."
        rows={6}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!draft.trim() || summarizeText.isPending}
          onClick={handleSummarize}
        >
          <Sparkles className="mr-2 size-4" />
          {summarizeText.isPending ? 'Summarizing...' : 'Summarize draft'}
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
              Draft summary
            </p>
            {tokens !== null ? (
              <span className="text-muted-foreground text-xs">{tokens} tokens</span>
            ) : null}
          </div>
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
          <p className="text-muted-foreground text-xs">{AI_SAFETY_DISCLAIMER}</p>
        </div>
      ) : null}
    </div>
  );
}

export function NotesList({ patientId }: Props) {
  const user = useAuth().user;
  const canWrite = hasPermission(user?.role, Permission.PATIENT_WRITE);
  const canSummarize = hasPermission(user?.role, Permission.AI_SUMMARY);
  const create = useCreateNote(patientId);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data: notes = [], isLoading } = usePatientNotes(patientId, debouncedSearch);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold">Clinical notes</h3>
        <p className="text-muted-foreground text-sm">
          Document visits on the chart. Summarize saved notes to keep a persistent AI summary on the
          record.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search notes..."
          className="pl-9"
        />
      </div>

      {canSummarize ? <DraftAssistant patientId={patientId} /> : null}

      {canWrite ? (
        <div className="space-y-2 rounded-lg border p-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title (optional)"
          />
          <RichTextEditor
            value={newBody}
            onChange={setNewBody}
            placeholder="Add a clinical note..."
          />
          <Button
            disabled={isNoteEmpty(newBody) || create.isPending}
            onClick={() => {
              void create
                .mutateAsync({
                  title: newTitle.trim() || undefined,
                  body: newBody,
                })
                .then(() => {
                  setNewTitle('');
                  setNewBody('');
                });
            }}
          >
            {create.isPending ? 'Saving...' : 'Add note'}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {debouncedSearch ? 'No notes match your search.' : 'No clinical notes yet.'}
        </p>
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
