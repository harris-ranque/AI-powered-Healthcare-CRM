import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  // =========================
  // CONNECTION
  // =========================
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // =========================
  // DISCONNECTION
  // =========================
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // =========================
  // JOIN ORGANIZATION ROOM
  // =========================
  @SubscribeMessage('joinOrg')
  handleJoinOrg(client: Socket, organizationId: string) {
    client.join(`org:${organizationId}`);

    return {
      event: 'joined',
      organizationId,
    };
  }

  // =========================
  // SEND NOTIFICATION
  // =========================
  sendToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }
}
