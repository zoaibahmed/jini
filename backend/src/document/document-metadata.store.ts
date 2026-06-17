import * as fs from 'fs';
import * as path from 'path';

export interface DocumentMetadata {
  id: string;
  name: string;
  categoryName: string;
  size: string;
  s3Key: string;
  status: string;
  expiryDate: string | null;
  notes: string | null;
  tags: string[];
  driverId: string;
  createdAt: string;
  isSupported?: boolean;
  requiresReview?: boolean;
  ocrConfidence?: number;
  adminNotes?: string | null;
  acceptedAt?: string;
  rejectedAt?: string;
}

export interface ActivityLogMetadata {
  id: string;
  userId: string;
  action: string;
  fileName: string;
  timestamp: string;
}

export class DocumentMetadataStore {
  private static readonly docFilePath = path.join(process.cwd(), 'data', 'document_metadata.json');
  private static readonly logFilePath = path.join(process.cwd(), 'data', 'activity_logs.json');

  private static ensureFileExists(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
  }

  // --- Document Operations ---
  static getAll(): DocumentMetadata[] {
    this.ensureFileExists(this.docFilePath);
    try {
      const content = fs.readFileSync(this.docFilePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading document metadata store:', err);
      return [];
    }
  }

  static getById(id: string): DocumentMetadata | undefined {
    const list = this.getAll();
    return list.find(d => d.id === id);
  }

  static getByDriverId(driverId: string): DocumentMetadata[] {
    const list = this.getAll();
    return list.filter(d => d.driverId === driverId);
  }

  static save(data: DocumentMetadata) {
    this.ensureFileExists(this.docFilePath);
    const list = this.getAll();
    const index = list.findIndex(d => d.id === data.id);
    if (index > -1) {
      list[index] = data;
    } else {
      list.push(data);
    }
    fs.writeFileSync(this.docFilePath, JSON.stringify(list, null, 2), 'utf8');
  }

  static delete(id: string): boolean {
    this.ensureFileExists(this.docFilePath);
    const list = this.getAll();
    const index = list.findIndex(d => d.id === id);
    if (index > -1) {
      list.splice(index, 1);
      fs.writeFileSync(this.docFilePath, JSON.stringify(list, null, 2), 'utf8');
      return true;
    }
    return false;
  }

  // --- Activity Log Operations ---
  static getAllLogs(): ActivityLogMetadata[] {
    this.ensureFileExists(this.logFilePath);
    try {
      const content = fs.readFileSync(this.logFilePath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Error reading activity logs store:', err);
      return [];
    }
  }

  static saveActivityLog(log: ActivityLogMetadata) {
    this.ensureFileExists(this.logFilePath);
    const list = this.getAllLogs();
    list.push(log);
    fs.writeFileSync(this.logFilePath, JSON.stringify(list, null, 2), 'utf8');
  }

  static getLogsByUserId(userId: string): ActivityLogMetadata[] {
    const list = this.getAllLogs();
    return list.filter(l => l.userId === userId);
  }
}
