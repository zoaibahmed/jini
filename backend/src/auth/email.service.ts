import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER') || 'britsyncuk@gmail.com';
    const pass = this.configService.get<string>('SMTP_PASS') || 'gila fjxj gqfq ehbf';

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user,
        pass,
      },
    });
  }

  async sendVerificationEmail(toEmail: string, token: string): Promise<boolean> {
    const verifyLink = `http://localhost:3000/auth/verify-email?email=${encodeURIComponent(toEmail)}&token=${token}`;
    const mailOptions = {
      from: `"JNI Solutions Driver Support" <${this.configService.get<string>('SMTP_USER') || 'britsyncuk@gmail.com'}>`,
      to: toEmail,
      subject: 'Verify Your JNI Solutions Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0b0b0b; font-weight: bold; border-bottom: 2px solid #f5c400; padding-bottom: 10px;">JNI SOLUTIONS</h2>
          <p style="font-size: 16px; color: #1f2937;">Hello,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            Welcome to JNI Solutions! Thank you for registering. Please activate your account by verifying your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #f5c400; color: #0b0b0b; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(245, 196, 0, 0.4);">
              Verify My Account
            </a>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Verification Token: <strong style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${token}</strong>
          </p>
          <p style="font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 15px;">
            If you did not create this account, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${toEmail}`, error.stack);
      return false;
    }
  }

  async sendPasswordResetEmail(toEmail: string, token: string): Promise<boolean> {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;
    const mailOptions = {
      from: `"JNI Solutions Driver Support" <${this.configService.get<string>('SMTP_USER') || 'britsyncuk@gmail.com'}>`,
      to: toEmail,
      subject: 'Reset Your JNI Solutions Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0b0b0b; font-weight: bold; border-bottom: 2px solid #f5c400; padding-bottom: 10px;">JNI SOLUTIONS</h2>
          <p style="font-size: 16px; color: #1f2937;">Hello,</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            We received a request to reset the password for your JNI Solutions driver account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #f5c400; color: #0b0b0b; text-decoration: none; padding: 12px 24px; font-weight: bold; font-size: 14px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(245, 196, 0, 0.4);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Reset Token: <strong style="font-family: monospace; font-size: 14px; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${token}</strong>
          </p>
          <p style="font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 15px;">
            If you did not request a password reset, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${toEmail}`, error.stack);
      return false;
    }
  }

  async sendContactFormSubmission(
    name: string,
    email: string,
    phone: string,
    subject: string,
    message: string,
  ): Promise<boolean> {
    const adminEmail = this.configService.get<string>('SMTP_USER') || 'britsyncuk@gmail.com';
    const mailOptions = {
      from: `"JNI Public Contact Form" <${adminEmail}>`,
      to: adminEmail,
      subject: `New Contact Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0b0b0b; font-weight: bold; border-bottom: 2px solid #f5c400; padding-bottom: 10px;">New Driver Inquiry</h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">
            A user has submitted an inquiry form from the public website.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0;">${subject}</td>
            </tr>
          </table>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #f5c400; margin-top: 15px;">
            <p style="margin: 0; font-weight: bold; font-size: 13px; color: #374151;">Message:</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #4b5563; white-space: pre-wrap; line-height: 1.4;">${message}</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Contact form email dispatched to ${adminEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send contact form email`, error.stack);
      return false;
    }
  }
}
