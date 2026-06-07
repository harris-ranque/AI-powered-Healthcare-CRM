'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import {
  useCreatePatientComment,
  useDeleteComment,
} from '../hooks/use-comment-mutations';
import { usePatientComments } from '../hooks/use-comments';
import { CommentThread } from './comment-thread';

type Props = {
  patientId: string;
};

export function PatientCommentThread({ patientId }: Props) {
  const user = useAuth().user;
  const canWrite = hasPermission(user?.role, Permission.PATIENT_WRITE);
  const canModerate = hasPermission(user?.role, Permission.ORG_MANAGE);
  const { data: comments = [], isLoading } = usePatientComments(patientId);
  const create = useCreatePatientComment(patientId);
  const remove = useDeleteComment({ patientId });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Team comments</h3>
        <p className="text-muted-foreground text-sm">
          Collaborate with your team on this patient&apos;s care.
        </p>
      </div>
      <CommentThread
        comments={comments}
        isLoading={isLoading}
        canWrite={canWrite}
        currentUserId={user?.id}
        canModerate={canModerate}
        pending={create.isPending || remove.isPending}
        onSubmit={async (body) => {
          await create.mutateAsync(body);
        }}
        onDelete={async (commentId) => {
          await remove.mutateAsync(commentId);
        }}
      />
    </div>
  );
}
