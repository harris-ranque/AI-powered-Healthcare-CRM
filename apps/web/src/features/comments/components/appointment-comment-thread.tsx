'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import {
  useCreateAppointmentComment,
  useDeleteComment,
} from '../hooks/use-comment-mutations';
import { useAppointmentComments } from '../hooks/use-comments';
import { CommentThread } from './comment-thread';

type Props = {
  appointmentId: string;
};

export function AppointmentCommentThread({ appointmentId }: Props) {
  const user = useAuth().user;
  const canWrite = hasPermission(user?.role, Permission.APPOINTMENT_WRITE);
  const canModerate = hasPermission(user?.role, Permission.ORG_MANAGE);
  const { data: comments = [], isLoading } = useAppointmentComments(appointmentId);
  const create = useCreateAppointmentComment(appointmentId);
  const remove = useDeleteComment({ appointmentId });

  return (
    <div className="space-y-3 border-t pt-4">
      <div>
        <h4 className="text-sm font-semibold">Team comments</h4>
        <p className="text-muted-foreground text-xs">
          Coordinate scheduling and follow-up for this appointment.
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
