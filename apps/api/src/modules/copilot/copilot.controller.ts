import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/permissions';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';
import type { OrganizationContext } from '../../common/types/organization-context.type';

import { CopilotService } from './copilot.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('copilot')
@UseGuards(JwtAuthGuard, OrganizationContextGuard, PermissionsGuard)
@RequirePermissions(Permission.AI_SUMMARY)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('sessions')
  createSession(
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.copilotService.createSession({
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }

  @Get('sessions')
  listSessions(
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.copilotService.listSessions({
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }

  @Get('sessions/:id')
  getSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.copilotService.getSession(id, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }

  @Delete('sessions/:id')
  deleteSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.copilotService.deleteSession(id, {
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    });
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
    @CurrentOrganization() organization: OrganizationContext,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const actor = {
      organizationId: organization.organizationId,
      userId: req.user.sub,
      permissions: organization.permissions,
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = this.copilotService.streamCopilotReply(
        id,
        dto.content,
        actor,
      );

      let result = await generator.next();
      while (!result.done) {
        res.write(`data: ${JSON.stringify({ token: result.value })}\n\n`);
        result = await generator.next();
      }

      res.write(
        `event: done\ndata: ${JSON.stringify({
          messageId: result.value.messageId,
          content: result.value.content,
        })}\n\n`,
      );
      res.end();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate response';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
      res.end();
    }
  }
}
