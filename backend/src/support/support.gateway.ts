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
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'support',
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SupportGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to support gateway: ${client.id}`);
    client.emit('session', { status: 'connected', time: new Date() });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from support gateway: ${client.id}`);
  }

  // 1. Join a specific ticket room
  @SubscribeMessage('joinTicket')
  async handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string; userId: string },
  ) {
    this.logger.log(`User ${data.userId} joining ticket room: ${data.ticketId}`);
    client.join(data.ticketId);
    
    // Broadcast status to the room
    client.to(data.ticketId).emit('userJoined', { userId: data.userId, socketId: client.id });
  }

  // 2. Leave a specific ticket room
  @SubscribeMessage('leaveTicket')
  async handleLeaveTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string; userId: string },
  ) {
    this.logger.log(`User ${data.userId} leaving ticket room: ${data.ticketId}`);
    client.leave(data.ticketId);
  }

  // 3. Broadcast typing status
  @SubscribeMessage('typingStatus')
  async handleTypingStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string; userId: string; userName: string; isTyping: boolean },
  ) {
    // Broadcast to everyone else in the ticket room
    client.to(data.ticketId).emit('typingStatusReceived', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    });
  }

  // 4. Broadcast new message details
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string; messageId: string; senderName: string; message: string },
  ) {
    // Broadcast the new message event to the room
    client.to(data.ticketId).emit('messageReceived', {
      ticketId: data.ticketId,
      messageId: data.messageId,
      senderName: data.senderName,
      message: data.message,
      timestamp: new Date(),
    });
  }

  // 5. Broadcast message read receipts
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId: string; userId: string },
  ) {
    // Broadcast that messages have been read


    client.to(data.ticketId).emit('readMarked', {
      ticketId: data.ticketId,
      userId: data.userId,
    });
  }
}
