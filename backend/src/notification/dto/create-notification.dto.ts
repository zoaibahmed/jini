// notification/dto/create-notification.dto.ts
import { IsString, IsEnum, IsOptional, IsISO8601 } from 'class-validator';
import { NotificationChannel, NotificationStatus } from '../enums/notification.enums';

export class CreateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status: NotificationStatus = NotificationStatus.PENDING;

  @IsISO8601()
  @IsOptional()
  sentAt?: string;

  @IsISO8601()
  @IsOptional()
  deliveredAt?: string;

  @IsISO8601()
  @IsOptional()
  readAt?: string;

  @IsString()
  @IsOptional()
  failureReason?: string;

  @IsString()
  @IsOptional()
  providerMessageId?: string;
}
