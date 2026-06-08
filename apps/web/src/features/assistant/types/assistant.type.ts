export type AssistantMessageRole = 'USER' | 'ASSISTANT';

export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
};

export type AssistantConversation = {
  id: string;
  organizationId: string;
  patientId: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: AssistantMessage[];
};
