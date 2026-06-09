import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(driverId: string) {
    return this.prisma.user.findUnique({
      where: { id: driverId },
      include: {
        driverProfile: true,
        vehicles: true,
        complianceChecks: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  async updateVehicle(driverId: string, vehicleId: string, data: { make?: string; model?: string; year?: number; plate?: string; vin?: string }) {
    return this.prisma.vehicle.updateMany({
      where: { id: vehicleId, driverId },
      data,
    });
  }

  async getComplianceChecks(driverId: string) {
    return this.prisma.complianceCheck.findMany({
      where: { driverId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async markComplianceCompleted(driverId: string, checkId: string) {
    // Verify check belongs to driver
    const check = await this.prisma.complianceCheck.findFirst({
      where: { id: checkId, driverId },
    });

    if (!check) {
      throw new Error('Compliance check not found for this driver');
    }

    return this.prisma.complianceCheck.update({
      where: { id: checkId },
      data: { status: 'COMPLETED' },
    });
  }
}
