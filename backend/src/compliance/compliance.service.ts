import { Injectable, Inject, Logger } from '@nestjs/common';
import type { OCRProvider } from './interfaces/ocr.provider';
import { PrismaService } from '../prisma/prisma.service';
import { ReminderService } from '../reminder/reminder.service';
import { DocumentMetadataStore } from '../document/document-metadata.store';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @Inject('OCR_PROVIDER') private readonly ocrProvider: OCRProvider,
    private readonly prisma: PrismaService,
    private readonly reminderService: ReminderService
  ) {}

  private calculateStatus(expiryDate?: Date | string | null): string {
    if (!expiryDate) return 'SAFE';
    const now = new Date();
    const daysLeft = Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'EXPIRED';
    if (daysLeft <= 7) return 'URGENT';
    if (daysLeft <= 15) return 'WARNING';
    return 'SAFE';
  }

  async processDocumentFromFile(filePath: string, userId: string, originalName: string, docId?: string) {
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`File not found for OCR: ${filePath}`);
        return null;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const ocrResult = await this.ocrProvider.extractText(fileBuffer, originalName);

      const doc = docId ? DocumentMetadataStore.getById(docId) : undefined;

      const allowedTypes = [
        'TLC License',
        'Insurance',
        'Registration',
        'Vehicle Inspection',
        'Drug Test',
        'DMV Notice',
        'Traffic Ticket'
      ];

      const isConfident = ocrResult.extractedData && 
                          ocrResult.extractedData.documentType && 
                          allowedTypes.includes(ocrResult.extractedData.documentType) && 
                          ocrResult.extractedData.expiryDate;

      if (isConfident) {
        const title = ocrResult.extractedData!.documentType!;
        const dueDate = new Date(ocrResult.extractedData!.expiryDate!);

        // Check if valid date
        if (!isNaN(dueDate.getTime())) {
          // Confidently identified, create compliance check
          const compliance = await this.prisma.complianceCheck.create({
            data: {
              title: title,
              description: `Extracted from ${originalName}. License No: ${ocrResult.extractedData!.licenseNumber || 'N/A'}`,
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

          // Update document metadata with confidently identified values
          if (doc) {
            doc.categoryName = title;
            doc.expiryDate = dueDate.toISOString().split('T')[0];
            doc.status = this.calculateStatus(dueDate);
            doc.notes = `AI Analysis Complete: Confidently identified ${title}.\nExpiration Date: ${doc.expiryDate}\nAction: Added to compliance tracker.`;
            DocumentMetadataStore.save(doc);
          }

          return { ocrResult, compliance };
        }
      }

      // If document is not confidently identified or required fields are missing
      if (doc) {
        doc.categoryName = 'Unknown Document';
        doc.status = 'Needs Review';
        doc.notes = 'Unknown Document';
        doc.expiryDate = null;
        DocumentMetadataStore.save(doc);
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

