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

import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';

import { AssistantService } from './assistant.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PATIENT)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('conversations')
  async createConversation(@Req() req: AuthenticatedRequest) {
    const context = await this.assistantService.resolvePatientContext(req.user.sub);
    return this.assistantService.createConversation(context);
  }

  @Get('conversations')
  async listConversations(@Req() req: AuthenticatedRequest) {
    const context = await this.assistantService.resolvePatientContext(req.user.sub);
    return this.assistantService.listConversations(context);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const context = await this.assistantService.resolvePatientContext(req.user.sub);
    return this.assistantService.getConversation(id, context);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const context = await this.assistantService.resolvePatientContext(req.user.sub);
    return this.assistantService.deleteConversation(id, context);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SendMessageDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const context = await this.assistantService.resolvePatientContext(req.user.sub);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = this.assistantService.streamAssistantReply(
        id,
        dto.content,
        context,
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
