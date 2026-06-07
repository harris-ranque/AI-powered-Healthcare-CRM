export type CommentAuthor = {
  id: string;
  name: string | null;
  email: string;
};

export type Comment = {
  id: string;
  organizationId: string;
  patientId: string | null;
  appointmentId: string | null;
  authorId: string;
  body: string;
  createdAt: string;
  author?: CommentAuthor;
};
