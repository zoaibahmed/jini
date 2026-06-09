import { Controller, Get, Post, Patch, Delete, Param, Body, Headers, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('Appointments')
@Controller('appointment')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('slots')
  @ApiOperation({ summary: 'Retrieve all available open time slots' })
  async getAvailableSlots() {
    return this.appointmentService.getAvailableSlots();
  }

  @Post('slots')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiOperation({ summary: 'Admin: Create a new availability slot for consultations' })
  async createSlot(
    @Headers('x-user-id') agentId: string,
    @Body() body: { startTime: string; endTime: string },
  ) {
    return this.appointmentService.createSlot(
      agentId,
      new Date(body.startTime),
      new Date(body.endTime),
    );
  }

  @Get('driver')
  @ApiHeader({ name: 'x-driver-id', required: true })
  @ApiOperation({ summary: 'Retrieve appointments for the active driver' })
  async getDriverAppointments(@Headers('x-driver-id') driverId: string) {
    return this.appointmentService.getDriverAppointments(driverId);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Admin: Retrieve all schedules and bookings' })
  async getAllAppointments() {
    return this.appointmentService.getAllAppointments();
  }

  @Post('book')
  @ApiHeader({ name: 'x-driver-id', required: true })
  @ApiOperation({ summary: 'Book an open appointment slot' })
  async bookAppointment(
    @Headers('x-driver-id') driverId: string,
    @Body() body: { slotId: string; title: string; description?: string },
  ) {
    return this.appointmentService.bookAppointment(
      driverId,
      body.slotId,
      body.title,
      body.description,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment confirmation status' })
  async updateStatus(
    @Param('id') appointmentId: string,
    @Body() body: { status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED'; comment?: string },
  ) {
    return this.appointmentService.updateStatus(appointmentId, body.status, body.comment);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an active appointment booking' })
  async cancelAppointment(@Param('id') appointmentId: string) {
    return this.appointmentService.cancelAppointment(appointmentId);
  }
}
