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

  calculateSeverity(expiryDate?: Date | string | null): string {
    if (!expiryDate) return 'INFO';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const exp = new Date(expiryDate);
    const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'CRITICAL';
    if (daysLeft <= 14) return 'URGENT';
    if (daysLeft <= 30) return 'WARNING';
    if (daysLeft <= 90) return 'UPCOMING';
    return 'INFO';
  }

  normalizeDocumentType(rawType: string): string | null {
    const t = (rawType || '').toUpperCase().replace(/[\s\-_]+/g, '_');
    
    if (t.includes('TLC_LICENSE')) return 'TLC_LICENSE';
    if (t.includes('DMV_LICENSE') || t.includes('DRIVER_LICENSE')) return 'DMV_LICENSE';
    if (t.includes('REGISTRATION') || t.includes('VEHICLE_REGISTRATION')) return 'VEHICLE_REGISTRATION';
    if (t.includes('INSURANCE')) return 'INSURANCE';
    if (t.includes('DRUG_TEST') || t.includes('DRUG_SCREENING') || t.includes('DRUG')) return 'DRUG_TEST';
    if (t.includes('DEFENSIVE_DRIVING')) return 'DEFENSIVE_DRIVING_CERTIFICATE';
    if (t.includes('INSPECTION') || t.includes('VEHICLE_INSPECTION')) return 'VEHICLE_INSPECTION';
    if (t.includes('TLC_NOTICE')) return 'TLC_NOTICE';
    if (t.includes('DMV_NOTICE')) return 'DMV_NOTICE';
    if (t.includes('TICKET') || t.includes('SUMMONS') || t.includes('TICKET_SUMMONS') || t.includes('TRAFFIC_TICKET')) return 'TICKET_SUMMONS';

    return null;
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
      
      const rawExtractedType = ocrResult.extractedData?.documentType || 'Unknown';
      const normalizedType = this.normalizeDocumentType(rawExtractedType || originalName);
      
      const confidence = typeof ocrResult.extractedData?.confidence === 'number'
        ? ocrResult.extractedData.confidence
        : (normalizedType ? 0.85 : 0.4);

      const isSupported = normalizedType !== null;

      const responsePayload = {
        documentType: normalizedType || 'UNSUPPORTED',
        expiryDate: ocrResult.extractedData?.expiryDate || null,
        issueDate: ocrResult.extractedData?.issueDate || null,
        confidence,
        isSupportedDocument: isSupported,
        warnings: [] as string[],
        requiresHumanReview: false
      };

      if (!isSupported) {
        if (doc) {
          doc.categoryName = 'Unsupported';
          doc.status = 'Needs Review';
          doc.expiryDate = null;
          doc.notes = 'This document does not appear to be a supported driver compliance document.';
          doc.isSupported = false;
          doc.requiresReview = true;
          doc.ocrConfidence = confidence;
          DocumentMetadataStore.save(doc);
        }
        return { ocrResult: responsePayload };
      }

      // Load Document Rules
      const DOCUMENT_RULES: Record<string, any> = {
        TLC_LICENSE: { expectedValidityMonths: 36, maxAllowedFutureMonths: 48, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        DMV_LICENSE: { expectedValidityMonths: 36, maxAllowedFutureMonths: 48, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        VEHICLE_REGISTRATION: { expectedValidityMonths: 24, maxAllowedFutureMonths: 30, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        INSURANCE: { expectedValidityMonths: 12, maxAllowedFutureMonths: 18, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        DRUG_TEST: { expectedValidityMonths: 12, maxAllowedFutureMonths: 18, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        DEFENSIVE_DRIVING_CERTIFICATE: { expectedValidityMonths: 36, maxAllowedFutureMonths: 42, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        VEHICLE_INSPECTION: { expectedValidityMonths: 6, maxAllowedFutureMonths: 8, warningDays: 30, urgentDays: 14, requiresExpiryDate: true },
        TLC_NOTICE: { expectedValidityMonths: 1, maxAllowedFutureMonths: 3, warningDays: 15, urgentDays: 5, requiresExpiryDate: true },
        DMV_NOTICE: { expectedValidityMonths: 1, maxAllowedFutureMonths: 3, warningDays: 15, urgentDays: 5, requiresExpiryDate: true },
        TICKET_SUMMONS: { expectedValidityMonths: 1, maxAllowedFutureMonths: 2, warningDays: 15, urgentDays: 5, requiresExpiryDate: true }
      };

      const rule = DOCUMENT_RULES[normalizedType];
      let requiresReview = false;

      if (confidence < 0.6) {
        requiresReview = true;
        responsePayload.warnings.push('Low OCR confidence score.');
      }

      const expiryStr = ocrResult.extractedData?.expiryDate;
      if (rule.requiresExpiryDate && !expiryStr) {
        requiresReview = true;
        responsePayload.warnings.push('Expiry date is missing but required.');
      }

      let expiryDate: Date | null = null;
      if (expiryStr) {
        expiryDate = new Date(expiryStr);
        if (isNaN(expiryDate.getTime())) {
          requiresReview = true;
          responsePayload.warnings.push('Expiry date is invalid.');
        } else {
          const now = new Date();
          const diffMonths = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.43);
          if (diffMonths > rule.maxAllowedFutureMonths || diffMonths < -6) {
            requiresReview = true;
            responsePayload.warnings.push(`Unusual expiry date for ${normalizedType} (Expires in ${Math.round(diffMonths)} months).`);
          }
        }
      }

      responsePayload.requiresHumanReview = requiresReview;

      if (requiresReview) {
        if (doc) {
          doc.categoryName = normalizedType;
          doc.status = 'Needs Review';
          doc.expiryDate = expiryStr ? new Date(expiryStr).toISOString().split('T')[0] : null;
          doc.notes = `Needs Human Review:\n${responsePayload.warnings.join('\n')}`;
          doc.isSupported = true;
          doc.requiresReview = true;
          doc.ocrConfidence = confidence;
          DocumentMetadataStore.save(doc);
        }
        return { ocrResult: responsePayload };
      }

      if (expiryDate) {
        const title = normalizedType;
        const compliance = await this.prisma.complianceCheck.create({
          data: {
            title: title.replace(/_/g, ' '),
            description: `Extracted from ${originalName}. License No: ${ocrResult.extractedData?.licenseNumber || 'N/A'}`,
            dueDate: expiryDate,
            status: 'PENDING',
            driverId: userId,
          }
        });

        const reminderDate = new Date(expiryDate.getTime() - (rule.warningDays * 24 * 60 * 60 * 1000));
        if (reminderDate > new Date()) {
          await this.reminderService.createReminder({
            userId,
            title: `${title.replace(/_/g, ' ')} Renewal`,
            description: `Your ${title.replace(/_/g, ' ')} expires on ${expiryDate.toLocaleDateString()}. Please renew it.`,
            remindAt: reminderDate.toISOString()
          } as any);
        }

        if (doc) {
          doc.categoryName = normalizedType;
          doc.expiryDate = expiryDate.toISOString().split('T')[0];
          doc.status = this.calculateSeverity(expiryDate);
          doc.notes = `AI Analysis Complete: Confidently identified ${normalizedType}.\nExpiration Date: ${doc.expiryDate}\nAction: Added to compliance tracker.`;
          doc.isSupported = true;
          doc.requiresReview = false;
          doc.ocrConfidence = confidence;
          DocumentMetadataStore.save(doc);
        }

        return { ocrResult: responsePayload, compliance };
      }

      return { ocrResult: responsePayload };
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

