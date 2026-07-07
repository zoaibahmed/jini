import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SmsService } from '../sms/sms.service';

interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpRecord>();

  constructor(private readonly smsService: SmsService) {}

  /**
   * Generates a random 6-digit OTP, stores it, and sends it via SMS.
   */
  async sendOtp(phone: string): Promise<{ success: boolean; codeForTesting?: string }> {
    // Standardize phone format (remove spaces, parentheses, dashes)
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[-()]/g, '');

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save in memory store
    this.otpStore.set(cleanPhone, { phone: cleanPhone, code, expiresAt });
    this.logger.log(`Generated OTP=${code} for phone=${cleanPhone}`);

    const message = `Your JNI Verification Code is: ${code}. It expires in 10 minutes.`;

    let isDelivered = true;
    try {
      const smsResult = await this.smsService.sendSms(cleanPhone, message, 'OTP');
      if (smsResult.status === 'FAILED') {
        isDelivered = false;
      }
    } catch (err: any) {
      this.logger.error(`Failed to send OTP SMS to ${cleanPhone}: ${err.message}`);
      isDelivered = false;
    }

    const isTwilioActive = this.smsService.isTwilioActive();

    // Return success. Expose testing code only if Twilio is inactive OR if delivery failed
    return {
      success: true,
      ...((!isTwilioActive || !isDelivered) ? { codeForTesting: code, twilioError: !isDelivered } : {}),
    };
  }

  /**
   * Verifies the OTP code for a phone number.
   */
  verifyOtp(phone: string, code: string): 'VALID' | 'EXPIRED' | 'INVALID' {
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[-()]/g, '');
    const record = this.otpStore.get(cleanPhone);

    if (!record) {
      this.logger.warn(`No OTP record found for phone=${cleanPhone}`);
      return 'INVALID';
    }

    if (record.expiresAt < new Date()) {
      this.logger.warn(`OTP expired for phone=${cleanPhone}`);
      this.otpStore.delete(cleanPhone);
      return 'EXPIRED';
    }

    if (record.code !== code) {
      this.logger.warn(`Invalid OTP code entered for phone=${cleanPhone}`);
      return 'INVALID';
    }

    // OTP matches! Delete it from store to prevent reuse
    this.otpStore.delete(cleanPhone);
    this.logger.log(`OTP successfully verified for phone=${cleanPhone}`);
    return 'VALID';
  }
}
