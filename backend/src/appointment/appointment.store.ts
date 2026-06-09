import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface AppointmentSlot {
  id: string;
  agentId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  driverId: string;
  agentId: string;
  title: string;
  description?: string;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SLOTS_FILE = path.join(DATA_DIR, 'appointment_slots.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');

export class AppointmentStore {
  private static initFile(filePath: string) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  static getSlots(): AppointmentSlot[] {
    this.initFile(SLOTS_FILE);
    try {
      return JSON.parse(fs.readFileSync(SLOTS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveSlots(slots: AppointmentSlot[]) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(slots, null, 2), 'utf-8');
  }

  static getAppointments(): Appointment[] {
    this.initFile(APPOINTMENTS_FILE);
    try {
      return JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  static saveAppointments(appointments: Appointment[]) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), 'utf-8');
  }
}
