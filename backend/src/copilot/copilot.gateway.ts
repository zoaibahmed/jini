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
import { AiService } from './ai.service';
import { CopilotStore, ChatMessage } from './copilot.store';
import * as crypto from 'crypto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'copilot',
})
export class CopilotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CopilotGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected to copilot socket: ${client.id}`);
    client.emit('session', { status: 'connected', time: new Date() });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from copilot socket: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      message: string;
      chatId?: string;
      driverId?: string;
      language?: string;
      provider?: string;
    },
  ) {
    this.logger.log(`Received message: ${data.message} for chat: ${data.chatId}`);

    // Resolve driver
    let driverId = data.driverId;
    if (!driverId) {
      const fallback = await this.prisma.user.findFirst({
        where: { role: 'DRIVER' },
      });
      driverId = fallback?.id;
    }

    if (!driverId) {
      client.emit('receiveMessage', {
        message: 'Error: No driver user found in database. Please seed or sign in.',
        sender: 'AI',
        timestamp: new Date(),
      });
      return;
    }

    // Check active subscription limits (Bypassed in dev / JSON store mode because BillingModule is excluded)
    const hasAiAccess = true;
    if (!hasAiAccess) {
      client.emit('receiveMessage', {
        message: '⚠️ Feature Restricted: The AI Driver Co-pilot assistant is only available on Premium Driver Pro and Enterprise plans. Please go to the Billing Portal to upgrade your tier.',
        sender: 'AI',
        timestamp: new Date(),
      });
      return;
    }

    // Resolve or create active chat session in JSON Store
    let chatId = data.chatId;
    if (!chatId) {
      const activeChats = CopilotStore.getChatsByDriverId(driverId);
      if (activeChats.length > 0) {
        chatId = activeChats[0].id;
      } else {
        const newChat = CopilotStore.createChat(driverId, 'Default Conversation');
        chatId = newChat.id;
      }
    }

    // Save user message to JSON Store
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      chatId,
      sender: 'USER',
      message: data.message,
      language: data.language || 'English',
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    CopilotStore.saveMessage(userMsg);

    // Update conversation updatedAt timestamp in JSON Store
    CopilotStore.updateChatTimestamp(chatId);

    // Generate message ID for AI's response beforehand
    const aiMessageId = crypto.randomUUID();

    // Emit streamStart
    client.emit('streamStart', { id: aiMessageId, chatId });

    // Run query through prompt processing pipeline
    const pipeline = await this.aiService.processQuery(
      driverId,
      data.message,
      chatId,
      data.language || 'English',
      data.provider || 'OpenAI',
      (token, text) => {
        client.emit('streamToken', { id: aiMessageId, token, text, chatId });
      },
      aiMessageId,
    );

    const savedAI = pipeline.message;

    // Emit final completed message block
    client.emit('receiveMessage', {
      id: savedAI.id,
      chatId,
      message: savedAI.message,
      sender: 'AI',
      timestamp: savedAI.createdAt,
      isPinned: savedAI.isPinned,
      confidenceScore: savedAI.confidenceScore,
      ticketCreated: pipeline.ticketCreated,
    });
  }
}
