import { OCRProvider, OcrResult } from '../interfaces/ocr.provider';
import { OpenAI } from 'openai';
import { Logger } from '@nestjs/common';
import { LocalRegexOcrProvider } from './local-regex.provider';

export class OpenAiOcrProvider implements OCRProvider {
  private readonly logger = new Logger(OpenAiOcrProvider.name);
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async extractText(file: Buffer, fileName?: string): Promise<OcrResult> {
    try {
      this.logger.log(`Analyzing document with OpenAI Vision: ${fileName}`);
      const base64Image = file.toString('base64');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an AI OCR assistant. Analyze this uploaded document image.
1. Classify the document type from this allowed list only: 'TLC License', 'Insurance', 'Registration', 'Vehicle Inspection', 'Drug Test', 'DMV Notice', 'Traffic Ticket'.
2. If the document is not clearly one of these types, or confidence is low, set the documentType to 'Unknown Document' and do not extract other fields.
3. Extract the following fields if present:
   - Driver Name
   - License Number (e.g., TLC license number)
   - Issue Date (format MM/DD/YYYY or YYYY-MM-DD)
   - Expiration Date (format MM/DD/YYYY or YYYY-MM-DD)
   - Policy Number (for Insurance)
   - Ticket Number (for Traffic Ticket)

Respond STRICTLY with a JSON object in this format:
{
  "documentType": "TLC License" | "Insurance" | "Registration" | "Vehicle Inspection" | "Drug Test" | "DMV Notice" | "Traffic Ticket" | "Unknown Document",
  "expiryDate": "MM/DD/YYYY" | null,
  "issueDate": "MM/DD/YYYY" | null,
  "licenseNumber": "string" | null,
  "driverName": "string" | null,
  "policyNumber": "string" | null,
  "ticketNumber": "string" | null,
  "confidence": 0.0 to 1.0
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from OpenAI vision');
      }

      const data = JSON.parse(content);
      this.logger.log(`OpenAI Vision analysis complete. Classification: ${data.documentType}, Confidence: ${data.confidence}`);
      
      if (data.confidence < 0.6) {
        data.documentType = 'Unknown Document';
        data.expiryDate = null;
      }

      return {
        text: `OpenAI Vision OCR Result: Identified as ${data.documentType} with confidence ${data.confidence}.`,
        extractedData: {
          documentType: data.documentType,
          expiryDate: data.expiryDate || undefined,
          licenseNumber: data.licenseNumber || data.policyNumber || data.ticketNumber || undefined,
        }
      };
    } catch (err) {
      this.logger.error('OpenAI Vision OCR failed, falling back to LocalRegexOcrProvider:', err);
      const fallback = new LocalRegexOcrProvider();
      return fallback.extractText(file, fileName);
    }
  }
}
