import type { OCRProvider, OcrResult } from '../interfaces/ocr.provider';

export class AwsTextractProvider implements OCRProvider {
  async extractText(file: Buffer, mimeType?: string): Promise<OcrResult> {
    // Stub implementation returning mock text
    return { 
      text: 'Mock OCR result',
      extractedData: {
        documentType: 'Unknown',
        expiryDate: '12/31/2025'
      }
    };
  }
}
