import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { AiService } from './ai.service';
import { CopilotStore } from './copilot.store';
import * as crypto from 'crypto';

@Controller('copilot')
export class CopilotController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly aiService: AiService,
  ) {}

  // 1. Public contact form submission
  @Post('contact')
  async submitContactForm(
    @Body()
    body: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
    },
  ) {
    if (!body.name || !body.email || !body.phone || !body.subject || !body.message) {
      throw new BadRequestException('All contact fields are required');
    }
    const sent = await this.emailService.sendContactFormSubmission(
      body.name,
      body.email,
      body.phone,
      body.subject,
      body.message,
    );
    if (!sent) {
      throw new BadRequestException('Failed to dispatch support mail. Please try again later.');
    }
    return { success: true, message: 'Your support inquiry has been transmitted successfully.' };
  }

  // 2. Fetch all chats for driver
  @Get('chats')
  @UseGuards(AuthGuard('jwt'))
  async getChats(@Req() req: any) {
    const driverId = req.user.id;
    return CopilotStore.getChatsByDriverId(driverId);
  }

  // 3. Create a new chat session
  @Post('chats')
  @UseGuards(AuthGuard('jwt'))
  async createChat(@Req() req: any, @Body() body: { title?: string }) {
    const driverId = req.user.id;
    return CopilotStore.createChat(driverId, body.title);
  }

  // 4. Delete a chat session
  @Delete('chats/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteChat(@Req() req: any, @Param('id') id: string) {
    const driverId = req.user.id;
    const chat = CopilotStore.getChatById(id);
    if (!chat || chat.driverId !== driverId) {
      throw new NotFoundException('Chat session not found');
    }

    CopilotStore.deleteChat(id);
    return { success: true, message: 'Conversation deleted.' };
  }

  // 5. Fetch messages inside a chat
  @Get('chats/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  async getChatMessages(@Req() req: any, @Param('id') chatId: string) {
    const driverId = req.user.id;
    const chat = CopilotStore.getChatById(chatId);
    if (!chat || chat.driverId !== driverId) {
      throw new NotFoundException('Chat session not found');
    }

    return CopilotStore.getMessagesByChatId(chatId);
  }

  // 6. Toggle Message Pin status
  @Patch('messages/:id/pin')
  @UseGuards(AuthGuard('jwt'))
  async togglePinMessage(@Req() req: any, @Param('id') id: string) {
    const message = CopilotStore.getMessageById(id);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    const chat = CopilotStore.getChatById(message.chatId);
    if (!chat || chat.driverId !== req.user.id) {
      throw new NotFoundException('Message not found');
    }

    message.isPinned = !message.isPinned;
    CopilotStore.saveMessage(message);
    return message;
  }

  // 7. Add Feedback to a message
  @Post('messages/:id/feedback')
  @UseGuards(AuthGuard('jwt'))
  async rateMessage(
    @Req() req: any,
    @Param('id') messageId: string,
    @Body() body: { rating: 'THUMBS_UP' | 'THUMBS_DOWN'; comment?: string },
  ) {
    const message = CopilotStore.getMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    const chat = CopilotStore.getChatById(message.chatId);
    if (!chat || chat.driverId !== req.user.id) {
      throw new NotFoundException('Message not found');
    }

    message.feedback = {
      id: crypto.randomUUID(),
      rating: body.rating,
      comment: body.comment,
      createdAt: new Date().toISOString(),
    };
    CopilotStore.saveMessage(message);
    return message.feedback;
  }

  // ================= ADMIN & AGENT CONTROLS =================

  // 8. Get system prompts list
  @Get('admin/prompts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getPrompts() {
    return CopilotStore.getPrompts();
  }

  // 9. Save or edit system prompt
  @Post('admin/prompts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async createOrUpdatePrompt(
    @Body() body: { name: string; content: string; category: string; isActive?: boolean },
  ) {
    if (!body.name || !body.content) {
      throw new BadRequestException('Name and Content are required');
    }
    return CopilotStore.upsertPrompt(body);
  }

  // 10. Fetch FAQ knowledge documents
  @Get('admin/knowledge')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getKnowledgeDocs() {
    return CopilotStore.getKnowledgeDocs();
  }

  // 11. Create a new FAQ knowledge document
  @Post('admin/knowledge')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async createKnowledgeDoc(
    @Body() body: { title: string; content: string; category: string; tags?: string[] },
  ) {
    if (!body.title || !body.content || !body.category) {
      throw new BadRequestException('Title, Content, and Category are required');
    }

    return CopilotStore.createKnowledgeDoc({
      title: body.title,
      content: body.content,
      category: body.category,
      tags: body.tags || [],
    });
  }

  // 12. Delete FAQ knowledge document
  @Delete('admin/knowledge/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async deleteKnowledgeDoc(@Param('id') id: string) {
    const deleted = CopilotStore.deleteKnowledgeDoc(id);
    if (!deleted) {
      throw new NotFoundException('Knowledge document not found');
    }
    return { success: true, message: 'FAQ document deleted.' };
  }

  // 13. Fetch AI Usage Analytics
  @Get('admin/metrics')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.SUPPORT)
  async getMetrics() {
    return CopilotStore.getUsageMetrics();
  }
}
