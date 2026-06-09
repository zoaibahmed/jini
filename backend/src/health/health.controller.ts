// health.controller.ts (updated)
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  async getHealth() {
    return { status: 'ok' };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health status including DB, Redis, and Queue' })
  async getDetailedHealth() {
    const db = await this.healthService.checkDatabase();
    const redis = await this.healthService.checkRedis();
    const queue = await this.healthService.checkQueue();
    return { status: 'ok', db, redis, queue };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connectivity health check' })
  async getDbHealth() {
    return this.healthService.checkDatabase();
  }

  @Get('queues')
  @ApiOperation({ summary: 'Queue health check' })
  async getQueueHealth() {
    return this.healthService.checkQueue();
  }

  @Get('storage')
  @ApiOperation({ summary: 'OCR provider health check' })
  async getStorageHealth() {
    // Static stub as per requirements
    return { available: true };
  }
}
