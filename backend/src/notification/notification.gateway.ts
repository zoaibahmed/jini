import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to notifications gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from notifications gateway: ${client.id}`);
  }

  @SubscribeMessage('register')
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    if (data && data.userId) {
      client.join(data.userId);
      this.logger.log(`Client ${client.id} joined room (userId): ${data.userId}`);
      client.emit('registered', { status: 'success', room: data.userId });
    }
  }

  @SubscribeMessage('joinAdminRoom')
  async handleJoinAdminRoom(
    @ConnectedSocket() client: Socket,
  ) {
    client.join('admins');
    this.logger.log(`Client ${client.id} joined admin room`);
    client.emit('joinedAdmin', { status: 'success' });
  }

  sendNotification(userId: string, notification: any) {
    this.logger.log(`Sending notification to user room ${userId}: ${notification.title}`);
    this.server.to(userId).emit('notification', notification);
  }

  sendAdminNotification(notification: any) {
    this.logger.log(`Sending notification to admin room: ${notification.title}`);
    this.server.to('admins').emit('notification', notification);
  }
}


@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'support',
})
export class SupportGateway implements OnGatewayConnection {
  private readonly logger = new Logger(SupportGateway.name);
  handleConnection(client: Socket) {
    this.logger.log(`Client connected to support stub gateway: ${client.id}`);
  }
}
