// reminder/dto/create-reminder.dto.ts
import { IsString, IsNotEmpty, IsISO8601, IsOptional, IsEmail } from 'class-validator';

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  @IsNotEmpty()
  remindAt: string; // ISO date string

  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  message?: string;
}

