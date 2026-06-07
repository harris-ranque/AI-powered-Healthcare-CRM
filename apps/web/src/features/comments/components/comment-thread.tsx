'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import type { Comment } from '../types/comment.type';

type Props = {
  comments: Comment[];
  isLoading?: boolean;
  canWrite: boolean;
  currentUserId?: string;
  canModerate: boolean;
  onSubmit: (body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  pending?: boolean;
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function CommentThread({
  comments,
  isLoading = false,
  canWrite,
  currentUserId,
  canModerate,
  onSubmit,
  onDelete,
  pending = false,
}: Props) {
  const [body, setBody] = useState('');

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setBody('');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet. Start the conversation.</p>
      ) : (
        <ol className="space-y-3">
          {comments.map((comment) => {
            const canDelete =
              comment.authorId === currentUserId || canModerate;
            const author =
              comment.author?.name ?? comment.author?.email ?? 'Staff';

            return (
              <li
                key={comment.id}
                className="bg-muted/30 flex gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{author}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        onClick={() => void onDelete(comment.id)}
                        aria-label="Delete comment"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{comment.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canWrite ? (
        <div className="space-y-2 border-t pt-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <Button
            size="sm"
            disabled={!body.trim() || pending}
            onClick={() => void handleSubmit()}
          >
            {pending ? 'Posting...' : 'Post'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
