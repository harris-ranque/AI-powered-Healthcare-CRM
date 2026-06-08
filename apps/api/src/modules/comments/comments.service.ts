import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { Permission } from '../../common/permissions';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';

import { CreateCommentDto } from './dto/create-comment.dto';

export type CommentActor = {
  organizationId: string;
  userId: string;
  permissions: string[];
};

const commentInclude = {
  author: { select: { id: true, name: true, email: true } },
} as const;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listForPatient(
    patientId: string,
    organizationId: string,
  ): Promise<CommentWithAuthor[]> {
    await this.assertPatientInOrg(patientId, organizationId);
    return this.prisma.client.comment.findMany({
      where: { patientId, organizationId },
      orderBy: { createdAt: 'asc' },
      include: commentInclude,
    });
  }

  async listForAppointment(
    appointmentId: string,
    organizationId: string,
  ): Promise<CommentWithAuthor[]> {
    await this.assertAppointmentInOrg(appointmentId, organizationId);
    return this.prisma.client.comment.findMany({
      where: { appointmentId, organizationId },
      orderBy: { createdAt: 'asc' },
      include: commentInclude,
    });
  }

  async createForPatient(
    patientId: string,
    dto: CreateCommentDto,
    actor: CommentActor,
  ): Promise<CommentWithAuthor> {
    await this.assertPatientInOrg(patientId, actor.organizationId);

    const comment = await this.prisma.client.comment.create({
      data: {
        organizationId: actor.organizationId,
        patientId,
        authorId: actor.userId,
        body: dto.body,
      },
      include: commentInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'COMMENT_CREATED',
      resource: 'COMMENT',
      resourceId: comment.id,
      metadata: { patientId },
    });

    return comment;
  }

  async createForAppointment(
    appointmentId: string,
    dto: CreateCommentDto,
    actor: CommentActor,
  ): Promise<CommentWithAuthor> {
    const appointment = await this.assertAppointmentInOrg(
      appointmentId,
      actor.organizationId,
    );

    const comment = await this.prisma.client.comment.create({
      data: {
        organizationId: actor.organizationId,
        appointmentId,
        patientId: appointment.patientId,
        authorId: actor.userId,
        body: dto.body,
      },
      include: commentInclude,
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'COMMENT_CREATED',
      resource: 'COMMENT',
      resourceId: comment.id,
      metadata: { appointmentId, patientId: appointment.patientId },
    });

    return comment;
  }

  async remove(commentId: string, actor: CommentActor): Promise<{ id: string }> {
    const comment = await this.findOwnedComment(commentId, actor.organizationId);

    const canModerate = actor.permissions.includes(Permission.ORG_MANAGE);
    if (comment.authorId !== actor.userId && !canModerate) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.client.comment.delete({
      where: { id: comment.id },
    });

    await this.auditService.log({
      userId: actor.userId,
      organizationId: actor.organizationId,
      action: 'COMMENT_DELETED',
      resource: 'COMMENT',
      resourceId: comment.id,
      metadata: {
        patientId: comment.patientId,
        appointmentId: comment.appointmentId,
      },
    });

    return { id: comment.id };
  }

  private async findOwnedComment(commentId: string, organizationId: string) {
    const comment = await this.prisma.client.comment.findFirst({
      where: { id: commentId, organizationId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  private async assertPatientInOrg(
    patientId: string,
    organizationId: string,
  ): Promise<void> {
    const patient = await this.prisma.client.patient.findFirst({
      where: { id: patientId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
  }

  private async assertAppointmentInOrg(
    appointmentId: string,
    organizationId: string,
  ) {
    const appointment = await this.prisma.client.appointment.findFirst({
      where: { id: appointmentId, organizationId },
      select: { id: true, patientId: true },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }
}
