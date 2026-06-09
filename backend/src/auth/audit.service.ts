import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string | null, action: string, ip?: string, userAgent?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          ip: ip || 'unknown',
          userAgent: userAgent || 'unknown',
        },
      });
    } catch (err) {
      console.error(`Audit logging failed: ${err.message}`);
    }
  }
}
