import { Injectable, Inject, Logger } from '@nestjs/common';
import type { OCRProvider } from './interfaces/ocr.provider';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderService } from '../reminder/reminder.service';
import * as fs from 'fs';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @Inject('OCR_PROVIDER') private readonly ocrProvider: OCRProvider,
    private readonly prisma: PrismaService,
    private readonly reminderService: ReminderService
  ) {}

  async processDocumentFromFile(filePath: string, userId: string, originalName: string) {
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found for OCR: ${filePath}`);
        return null;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const ocrResult = await this.ocrProvider.extractText(fileBuffer);

      if (ocrResult.extractedData && ocrResult.extractedData.expiryDate) {
        const title = ocrResult.extractedData.documentType || 'Uploaded Document';
        const dueDate = new Date(ocrResult.extractedData.expiryDate);

        // Check if valid date
        if (!isNaN(dueDate.getTime())) {
          const compliance = await this.prisma.complianceCheck.create({
            data: {
              title: title,
              description: `Extracted from ${originalName}. License No: ${ocrResult.extractedData.licenseNumber || 'N/A'}`,
              dueDate: dueDate,
              status: 'PENDING',
              driverId: userId,
            }
          });

          // Schedule reminder 30 days before expiry
          const reminderDate = new Date(dueDate.getTime() - (30 * 24 * 60 * 60 * 1000));
          if (reminderDate > new Date()) {
            await this.reminderService.createReminder({
              userId,
              title: `${title} Renewal`,
              description: `Your ${title} expires on ${dueDate.toLocaleDateString()}. Please renew it.`,
              remindAt: reminderDate.toISOString()
            } as any);
          }

          return { ocrResult, compliance };
        }
      }
      return { ocrResult };
    } catch (err) {
      this.logger.error(`Error processing OCR for ${originalName}`, err);
      return null;
    }
  }

  async getComplianceChecks(userId: string) {
    return this.prisma.complianceCheck.findMany({
      where: { driverId: userId },
      orderBy: { dueDate: 'asc' }
    });
  }

  async createCompliance(dto: any) {
    return { id: 'mock-id', ...dto };
  }

  async getOcrResult(id: string) {
    const dummyBuffer = Buffer.from('dummy image data');
    const result = await this.ocrProvider.extractText(dummyBuffer);
    return { id, ocrResult: result };
  }
}

