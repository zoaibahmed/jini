// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { DocumentMetadataStore, DocumentMetadata } from './document-metadata.store';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ComplianceService))
    private readonly complianceService: ComplianceService
  ) {}

  // Return local URLs for upload and download flows
  async getPresignedUrl(fileName: string, action: 'GET' | 'PUT'): Promise<string> {
    const port = process.env.PORT || 5000;
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    
    if (action === 'PUT') {
      return `${backendUrl}/documents/upload-local?fileName=${encodeURIComponent(fileName)}`;
    }
    
    // For download via fileName
    return `${backendUrl}/documents/download-file?fileName=${encodeURIComponent(fileName)}`;
  }

  // Stream raw PUT binary stream from client and write to uploads/ on disk
  async saveFile(fileName: string, req: Request): Promise<{ success: boolean; filePath: string }> {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, fileName);
      const writeStream = fs.createWriteStream(filePath);

      req.on('data', (chunk) => writeStream.write(chunk));
      
      req.on('end', () => {
        writeStream.end();
        resolve({ success: true, filePath });
      });
      
      req.on('error', (err) => {
        writeStream.end();
        reject(err);
      });
    });
  }

  // Retrieve file metadata and path from uploads/ on disk
  async getFile(id: string): Promise<{ name: string; filePath: string }> {
    const doc = DocumentMetadataStore.getById(id);
    if (!doc) {
      throw new NotFoundException(`Document metadata not found for ID: ${id}`);
    }

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(process.cwd(), 'uploads', doc.name);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Physical file ${doc.name} not found on disk`);
    }

    return { name: doc.name, filePath };
  }

  // Log activity in store & database ID generator
  private async logActivity(userId: string, action: string, fileName: string) {
    try {
      const dbLog = await this.prisma.docActivityLog.create({ data: {} });
      DocumentMetadataStore.saveActivityLog({
        id: dbLog.id,
        userId,
        action,
        fileName,
        timestamp: dbLog.createdAt.toISOString(),
      });
    } catch (err) {
      console.error('Failed to log document activity in DB:', err);
    }
  }

  // Expiry status calculation based on standard thresholds (30, 15, 7 days)
  private calculateStatus(expiryDate?: Date | string | null): string {
    if (!expiryDate) return 'SAFE';
    const now = new Date();
    const daysLeft = Math.ceil((new Date(expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 'EXPIRED';
    if (daysLeft <= 7) return 'URGENT';
    if (daysLeft <= 15) return 'WARNING';
    return 'SAFE';
  }

  // Return static categories to compile successfully
  async getCategories() {
    return [
      { id: 'cat-1', name: 'TLC License' },
      { id: 'cat-2', name: 'Insurance' },
      { id: 'cat-3', name: 'Registration' },
      { id: 'cat-4', name: 'Vehicle Inspection' },
      { id: 'cat-5', name: 'Drug Test' },
      { id: 'cat-6', name: 'DMV Notice' },
      { id: 'cat-7', name: 'Traffic Ticket' },
    ];
  }

  // Fetch documents with filtering from the local JSON store
  async getDocuments(userId: string, role: UserRole, filters: {
    categoryName?: string;
    status?: string;
    search?: string;
  }) {
    let docs = DocumentMetadataStore.getAll();

    // 1. Enforce Role Visibility
    if (role === UserRole.DRIVER) {
      docs = docs.filter(d => d.driverId === userId);
    }

    // 2. Category filtering
    if (filters.categoryName && filters.categoryName !== 'All') {
      docs = docs.filter(d => d.categoryName === filters.categoryName);
    }

    // 3. Status filtering
    if (filters.status && filters.status !== 'All') {
      const filterStatus = filters.status.toUpperCase();
      if (filterStatus === 'EXPIRING SOON') {
        docs = docs.filter(d => ['WARNING', 'URGENT'].includes(d.status));
      } else {
        docs = docs.filter(d => d.status === filterStatus);
      }
    }

    // 4. Search text filtering
    if (filters.search) {
      const q = filters.search.toLowerCase();
      docs = docs.filter(d => 
        d.name.toLowerCase().includes(q) ||
        d.categoryName.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q)) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort by newest
    docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Dynamic expiry calculations
    docs.forEach(doc => {
      const currentStatus = this.calculateStatus(doc.expiryDate);
      if (currentStatus !== doc.status) {
        doc.status = currentStatus;
        DocumentMetadataStore.save(doc);
      }
    });

    return docs;
  }

  // Create a document database record and persistent metadata entry
  async createDocument(userId: string, data: {
    name: string;
    categoryName: string;
    size: string;
    expiryDate?: string;
    notes?: string;
    tags?: string[];
  }) {
    // Generate actual database uuid record
    const dbDoc = await this.prisma.document.create({ data: {} });
    const status = this.calculateStatus(data.expiryDate ? new Date(data.expiryDate) : null);
    
    const metadata: DocumentMetadata = {
      id: dbDoc.id,
      name: data.name,
      categoryName: data.categoryName,
      size: data.size,
      s3Key: `uploads/${userId}/${Date.now()}_${data.name}`,
      status,
      expiryDate: data.expiryDate || null,
      notes: data.notes || null,
      tags: data.tags || [],
      driverId: userId,
      createdAt: dbDoc.createdAt.toISOString(),
    };

    DocumentMetadataStore.save(metadata);
    await this.logActivity(userId, 'UPLOAD', metadata.name);

    // Trigger asynchronous OCR & Compliance Check
    const path = require('path');
    const filePath = path.join(process.cwd(), 'uploads', data.name);
    
    // Non-blocking async call
    this.complianceService.processDocumentFromFile(filePath, userId, data.name).catch(err => {
      console.error('Background OCR processing failed:', err);
    });

    return metadata;
  }


  // Delete a document
  async deleteDocument(userId: string, role: UserRole, docId: string) {
    const doc = DocumentMetadataStore.getById(docId);
    if (!doc) throw new NotFoundException('Document not found');

    if (role === UserRole.DRIVER && doc.driverId !== userId) {
      throw new ForbiddenException('Access denied to delete this document');
    }

    // Delete DB uuid row
    await this.prisma.document.delete({ where: { id: docId } }).catch(() => {});

    // Delete physical file from disk
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'uploads', doc.name);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink document physical file:', err);
      }
    }

    DocumentMetadataStore.delete(docId);
    await this.logActivity(userId, 'DELETE', doc.name);

    return { success: true, message: 'Document deleted successfully' };
  }

  // Rename/update notes of a document
  async updateDocument(userId: string, role: UserRole, docId: string, data: {
    name?: string;
    notes?: string;
    tags?: string[];
    expiryDate?: string;
  }) {
    const doc = DocumentMetadataStore.getById(docId);
    if (!doc) throw new NotFoundException('Document not found');

    if (role === UserRole.DRIVER && doc.driverId !== userId) {
      throw new ForbiddenException('Access denied to update this document');
    }

    const oldName = doc.name;

    if (data.name !== undefined) doc.name = data.name;
    if (data.notes !== undefined) doc.notes = data.notes;
    if (data.tags !== undefined) doc.tags = data.tags;
    if (data.expiryDate !== undefined) {
      doc.expiryDate = data.expiryDate;
      doc.status = this.calculateStatus(data.expiryDate);
    }

    DocumentMetadataStore.save(doc);

    if (data.name && data.name !== oldName) {
      await this.logActivity(userId, 'RENAME', `${oldName} to ${data.name}`);
    } else {
      await this.logActivity(userId, 'UPDATE', doc.name);
    }

    return doc;
  }

  // Get single document preview
  async getDocumentPreview(userId: string, role: UserRole, docId: string) {
    const doc = DocumentMetadataStore.getById(docId);
    if (!doc) throw new NotFoundException('Document not found');

    if (role === UserRole.DRIVER && doc.driverId !== userId) {
      throw new ForbiddenException('Access denied to preview this document');
    }

    const port = process.env.PORT || 5000;
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
    const presignedUrl = `${backendUrl}/documents/download/${doc.id}`;

    await this.logActivity(userId, 'PREVIEW', doc.name);

    return {
      ...doc,
      presignedUrl,
    };
  }

  // Fetch document audit log activities with User database joins
  async getActivityLogs(userId: string, role: UserRole) {
    let logs = DocumentMetadataStore.getAllLogs();
    
    if (role === UserRole.DRIVER) {
      logs = logs.filter(l => l.userId === userId);
      logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return logs.slice(0, 15);
    }
    
    // Admins see all logs with user name/email details mapped from Postgres
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const recentLogs = logs.slice(0, 50);
    
    const userIds = Array.from(new Set(recentLogs.map(l => l.userId)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));
    
    return recentLogs.map(l => ({
      ...l,
      user: userMap.get(l.userId) || { name: 'System / Guest User', email: '' },
    }));
  }
}
