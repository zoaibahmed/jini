import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import IORedis from 'ioredis';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase() {
    try {
      // Simple raw query to verify DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return { db: true };
    } catch (err) {
      return { db: false, error: err.message };
    }
  }

  async checkRedis() {
    if (process.env.REDIS_ENABLED === 'false') {
      return { redis: true, status: 'disabled', message: 'Redis is disabled via environment configuration' };
    }
    const redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });
    try {
      await redis.ping();
      redis.disconnect();
      return { redis: true };
    } catch (err) {
      redis.disconnect();
      return { redis: false, error: err.message };
    }
  }

  // Stubbed queue health check – returns static success for Phase A
  async checkQueue() {
    return { queue: true, message: 'Queue health check stubbed for Phase A' };
  }
}
