'use client';

import { useEffect, useState } from 'react';

import { AssistantChat } from '@/components/assistant/assistant-chat';
import { ConversationList } from '@/components/assistant/conversation-list';
import { useConversation } from '@/features/assistant/hooks/use-conversation';
import { useConversations } from '@/features/assistant/hooks/use-conversations';
import { useCreateConversation } from '@/features/assistant/hooks/use-create-conversation';

export default function PortalAssistantPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );

  const { data: conversations = [], isLoading: conversationsLoading } =
    useConversations();
  const { data: activeConversation, isLoading: conversationLoading } =
    useConversation(activeConversationId);
  const createConversation = useCreateConversation();

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0]?.id ?? null);
    }
  }, [activeConversationId, conversations]);

  const handleCreate = async () => {
    const conversation = await createConversation.mutateAsync();
    setActiveConversationId(conversation.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          AI Medical Assistant
        </h1>
        <p className="text-muted-foreground text-sm">
          Get health education, symptom guidance, and help with clinic questions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          isLoading={conversationsLoading}
          isCreating={createConversation.isPending}
          onSelect={setActiveConversationId}
          onCreate={() => void handleCreate()}
        />
        <AssistantChat
          conversation={activeConversation ?? null}
          isLoading={conversationLoading && Boolean(activeConversationId)}
        />
      </div>
    </div>
  );
}
