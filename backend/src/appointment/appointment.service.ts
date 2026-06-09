import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStore, AppointmentSlot, Appointment } from './appointment.store';
import { randomUUID } from 'crypto';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  // List all open availability slots
  async getAvailableSlots() {
    const slots = AppointmentStore.getSlots();
    return slots.filter(s => !s.isBooked).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  // Create availability slot (Admin)
  async createSlot(agentId: string, startTime: Date, endTime: Date) {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }
    const slots = AppointmentStore.getSlots();
    
    // Check for overlapping slots by the same agent
    const conflict = slots.some(s => 
      s.agentId === agentId && 
      new Date(s.startTime) < endTime && 
      new Date(s.endTime) > startTime
    );
    if (conflict) {
      throw new BadRequestException('Agent already has a slot during this time period');
    }

    const newSlot: AppointmentSlot = {
      id: randomUUID(),
      agentId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      isBooked: false,
      createdAt: new Date().toISOString()
    };
    
    slots.push(newSlot);
    AppointmentStore.saveSlots(slots);
    
    return newSlot;
  }

  // Driver: Request Booking
  async bookAppointment(driverId: string, slotId: string, title: string, description?: string) {
    const slots = AppointmentStore.getSlots();
    const slotIndex = slots.findIndex(s => s.id === slotId);

    if (slotIndex === -1) {
      throw new NotFoundException('Availability slot not found');
    }
    const slot = slots[slotIndex];

    if (slot.isBooked) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Check if the driver already has an overlapping appointment (double-booking prevention)
    const appointments = AppointmentStore.getAppointments();
    const overlapping = appointments.some(a => 
      a.driverId === driverId && 
      a.status !== 'CANCELLED' && 
      new Date(a.date).getTime() === new Date(slot.startTime).getTime()
    );

    if (overlapping) {
      throw new BadRequestException('You already have an appointment scheduled for this time');
    }

    // Mark slot as booked
    slots[slotIndex].isBooked = true;
    AppointmentStore.saveSlots(slots);

    // Create appointment
    const newAppointment: Appointment = {
      id: randomUUID(),
      driverId,
      agentId: slot.agentId,
      title,
      description,
      date: slot.startTime,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    AppointmentStore.saveAppointments(appointments);

    // Create Notification Log for Admin
    try {
      await this.prisma.notification.create({
        data: {
          userId: slot.agentId, // notify assigned agent or admin
          title: 'New Appointment Booked',
          message: `Driver requested a meeting: "${title}" at ${new Date(slot.startTime).toLocaleString()}`,
          body: `Driver requested a meeting: "${title}" at ${new Date(slot.startTime).toLocaleString()}`,
          type: 'INFO',
          channel: 'IN_APP',
          status: 'UNREAD',
        },
      });
    } catch (e) {
      // Ignore if agentId doesn't exist in Prisma as user
    }

    return newAppointment;
  }

  // Retrieve appointments for a specific driver
  async getDriverAppointments(driverId: string) {
    const appointments = AppointmentStore.getAppointments();
    return appointments
      .filter(a => a.driverId === driverId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Retrieve all appointments (Admin/Staff view)
  async getAllAppointments() {
    const appointments = AppointmentStore.getAppointments();
    const enrichedAppointments: any[] = [];

    // Attempt to enrich with driver info if possible
    for (const a of appointments) {
      let driverObj: any = null;
      try {
        driverObj = await this.prisma.user.findUnique({
          where: { id: a.driverId },
          select: { id: true, name: true, email: true, phone: true }
        });
      } catch (e) {}

      enrichedAppointments.push({
        ...a,
        driver: driverObj
      });
    }

    return enrichedAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Update Status (Confirm, Cancel, Reschedule)
  async updateStatus(appointmentId: string, status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED', comment?: string) {
    const appointments = AppointmentStore.getAppointments();
    const idx = appointments.findIndex(a => a.id === appointmentId);

    if (idx === -1) {
      throw new NotFoundException('Appointment record not found');
    }

    appointments[idx].status = status;
    appointments[idx].updatedAt = new Date().toISOString();
    AppointmentStore.saveAppointments(appointments);

    const appointment = appointments[idx];

    // If cancelled, free up the slot
    if (status === 'CANCELLED') {
      const slots = AppointmentStore.getSlots();
      const slot = slots.find(s => s.agentId === appointment.agentId && s.startTime === appointment.date);
      if (slot) {
        slot.isBooked = false;
        AppointmentStore.saveSlots(slots);
      }
    }

    // Send notifications to driver
    try {
      await this.prisma.notification.create({
        data: {
          userId: appointment.driverId,
          title: `Appointment ${status}`,
          message: `Your booking "${appointment.title}" status has been set to ${status}. ${comment || ''}`,
          body: `Your booking "${appointment.title}" status has been set to ${status}.`,
          type: status === 'CANCELLED' ? 'ERROR' : 'SUCCESS',
          channel: 'IN_APP',
          status: 'UNREAD',
        },
      });
    } catch (e) {
      // Ignore if user ID invalid
    }

    return appointments[idx];
  }

  // Cancel Appointment (Driver/Admin)
  async cancelAppointment(appointmentId: string) {
    return this.updateStatus(appointmentId, 'CANCELLED', 'Cancelled by user/agent request');
  }
}
