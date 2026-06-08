'use client';

import { MessageCircle, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { AssistantConversation } from '@/features/assistant/types/assistant.type';
import { cn } from '@/lib/utils';

type Props = {
  conversations: AssistantConversation[];
  activeId: string | null;
  isLoading?: boolean;
  isCreating?: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  isCreating,
  onSelect,
  onCreate,
}: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Conversations</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCreate}
          disabled={isCreating}
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
            <MessageCircle className="size-8 opacity-40" />
            <p>No conversations yet. Start a new chat.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {conversations.map((conversation) => {
              const preview =
                conversation.messages?.[0]?.content ??
                'Start chatting with your assistant';
              const title = conversation.title ?? 'New conversation';

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      'hover:bg-muted/60 w-full rounded-lg border p-3 text-left transition-colors',
                      activeId === conversation.id && 'border-primary bg-primary/5',
                    )}
                  >
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {preview}
                    </p>
                    <p className="text-muted-foreground mt-2 text-[11px]">
                      {formatUpdatedAt(conversation.updatedAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
