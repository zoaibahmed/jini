export interface OcrResult {
  text: string;
  extractedData?: {
    documentType?: string;
    expiryDate?: string;
    issueDate?: string;
    licenseNumber?: string;
    confidence?: number;
  };
}

export interface OCRProvider {
  /**
   * Extracts textual content and structured data from an image buffer.
   */
  extractText(file: Buffer, mimeType?: string): Promise<OcrResult>;
}
