// reminder.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reminders')
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a reminder' })
  async create(@Body() createDto: CreateReminderDto) {
    return this.reminderService.createReminder(createDto);
  }
}
