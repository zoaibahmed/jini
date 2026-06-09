import type { OCRProvider, OcrResult } from '../interfaces/ocr.provider';

export class LocalRegexOcrProvider implements OCRProvider {
  async extractText(file: Buffer, mimeType?: string): Promise<OcrResult> {
    // In a real local setup, this might use Tesseract.js
    // For our simulated fallback, we'll run regex on a dummy string 
    // or return a mock successful extraction.
    const mockText = "DRIVER LICENSE \n ISSUE DATE: 01/15/2023 \n EXP DATE: 12/31/2026 \n LIC NO: 123456789 \n CLASS: TLC";
    
    // Simulate regex extraction
    const expiryMatch = mockText.match(/EXP\s*DATE:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const issueMatch = mockText.match(/ISSUE\s*DATE:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const licMatch = mockText.match(/LIC\s*NO:\s*(\d+)/i);

    return {
      text: mockText,
      extractedData: {
        documentType: 'TLC License',
        expiryDate: expiryMatch ? expiryMatch[1] : undefined,
        issueDate: issueMatch ? issueMatch[1] : undefined,
        licenseNumber: licMatch ? licMatch[1] : undefined,
      }
    };
  }
}
