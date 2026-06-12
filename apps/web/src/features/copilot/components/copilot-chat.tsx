'use client';

import { Bot, Send, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SafetyDisclaimer } from '@/components/assistant/safety-disclaimer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { copilotApi } from '@/features/copilot/api/copilot.api';
import { copilotQueryKeys } from '@/features/copilot/hooks/query-keys';
import type { ChatMessage, ChatSession } from '@/features/copilot/types/copilot.type';
import { cn } from '@/lib/utils';

type Props = {
  session: ChatSession | null;
  isLoading?: boolean;
};

type LocalMessage = ChatMessage & { streaming?: boolean };

export function CopilotChat({ session, isLoading }: Props) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(session?.messages ?? []);
    setError(null);
  }, [session?.id, session?.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !session || isSending) {
      return;
    }

    setInput('');
    setError(null);
    setIsSending(true);

    const userMessage: LocalMessage = {
      id: `local-user-${Date.now()}`,
      sessionId: session.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const assistantPlaceholder: LocalMessage = {
      id: `local-assistant-${Date.now()}`,
      sessionId: session.id,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      streaming: true,
    };

    setMessages((current) => [...current, userMessage, assistantPlaceholder]);

    try {
      await copilotApi.streamMessage(session.id, content, {
        onToken: (token) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantPlaceholder.id
                ? { ...message, content: message.content + token }
                : message,
            ),
          );
        },
        onDone: (payload) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantPlaceholder.id
                ? {
                    ...message,
                    id: payload.messageId,
                    content: payload.content,
                    streaming: false,
                  }
                : message,
            ),
          );
          void queryClient.invalidateQueries({
            queryKey: copilotQueryKeys.session(session.id),
          });
          void queryClient.invalidateQueries({
            queryKey: copilotQueryKeys.sessions(),
          });
        },
        onError: (message) => {
          setError(message);
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send message';
      setError(message);
      setMessages((current) =>
        current.filter((message) => message.id !== assistantPlaceholder.id),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-16 w-2/3 ml-auto" />
          <Skeleton className="h-16 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Bot className="text-muted-foreground mb-3 size-10" />
        <p className="font-medium">Select or start a session</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Ask about patient activity, appointments, files, or clinical notes.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-[560px] flex-col">
      <CardHeader className="space-y-3 border-b pb-4">
        <CardTitle className="text-base">
          {session.title ?? 'Clinical Copilot'}
        </CardTitle>
        <SafetyDisclaimer />
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center text-sm">
              <Bot className="size-8 opacity-40" />
              <p>Try: &quot;Show recent activity for John Doe&quot;</p>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                >
                  {!isUser ? (
                    <Avatar className="size-8">
                      <AvatarFallback>
                        <Bot className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    {message.content || (message.streaming ? 'Thinking...' : '')}
                  </div>
                  {isUser ? (
                    <Avatar className="size-8">
                      <AvatarFallback>
                        <UserRound className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : null}

        <div className="flex items-end gap-2 border-t pt-4">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a patient or clinic activity..."
            className="min-h-[72px] flex-1 resize-none"
            disabled={isSending}
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || !input.trim()}
          >
            <Send className="size-4" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
