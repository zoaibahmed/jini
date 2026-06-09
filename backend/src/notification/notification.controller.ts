import { Controller, Get, Patch, Post, Delete, Param, Req, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(@Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.getNotificationsForUser(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    const userId = req.user.id;
    return this.notificationService.markAllAsRead(userId);
  }

  @Post('admin-send')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async adminSendNotification(
    @Body() body: { userId?: string; title: string; message: string; type: string; allAdmins?: boolean }
  ) {
    if (body.allAdmins) {
      return this.notificationService.createAdminNotification(body.title, body.message, body.type);
    } else if (body.userId) {
      return this.notificationService.createNotification(body.userId, body.title, body.message, body.type);
    }
    return { success: false, message: 'Must specify userId or allAdmins' };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationService.deleteNotification(id);
  }
}
