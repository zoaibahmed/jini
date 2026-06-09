import { Controller, Get, Patch, Post, Param, Body, Headers, NotFoundException } from '@nestjs/common';
import { DriverService } from './driver.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('Driver & Compliance')
@Controller('driver')
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly prisma: PrismaService,
  ) {}

  private async getDriverId(driverIdHeader?: string): Promise<string> {
    if (driverIdHeader) return driverIdHeader;
    const fallback = await this.prisma.user.findFirst();
    if (!fallback) {
      throw new NotFoundException('No driver found in the database. Please seed the database first.');
    }
    return fallback.id;
  }

  @Get('profile')
  @ApiHeader({ name: 'x-driver-id', required: false })
  @ApiOperation({ summary: 'Retrieve the active driver profile, vehicle details, and compliance checklist' })
  async getProfile(@Headers('x-driver-id') driverIdHeader?: string) {
    const driverId = await this.getDriverId(driverIdHeader);
    const profile = await this.driverService.getProfile(driverId);
    if (!profile) throw new NotFoundException('Driver profile not found');
    return profile;
  }

  @Get('compliance')
  @ApiHeader({ name: 'x-driver-id', required: false })
  @ApiOperation({ summary: 'Retrieve the TLC compliance checks checklist' })
  async getCompliance(@Headers('x-driver-id') driverIdHeader?: string) {
    const driverId = await this.getDriverId(driverIdHeader);
    return this.driverService.getComplianceChecks(driverId);
  }

  @Patch('compliance/:id/complete')
  @ApiHeader({ name: 'x-driver-id', required: false })
  @ApiOperation({ summary: 'Mark a specific compliance requirement as COMPLETED' })
  async markComplianceCompleted(
    @Headers('x-driver-id') driverIdHeader: string,
    @Param('id') checkId: string,
  ) {
    const driverId = await this.getDriverId(driverIdHeader);
    return this.driverService.markComplianceCompleted(driverId, checkId);
  }
}
