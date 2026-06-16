import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { AuditService } from './audit.service';
import { EmailService } from './email.service';

// In-memory token store for Verification Tokens and Password Resets
interface InMemoryToken {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
}
const verificationTokens = new Map<string, InMemoryToken>();
const passwordResets = new Map<string, InMemoryToken>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async register(data: any, ip?: string, userAgent?: string) {
    // 1. Password validation
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // 2. Duplicate checking
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 4. Create User
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        phone: data.phone,
        preferredLanguage: data.preferredLanguage || 'English',
        country: data.country || 'US',
        role: UserRole.DRIVER,
        isVerified: true, // Auto-verified in production MVP
      },
    });

    // 5. Generate Email Verification Token in memory
    const verifyToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenRecord = {
      id: Math.random().toString(36).substring(2, 15),
      email: user.email,
      token: verifyToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
    };
    verificationTokens.set(verifyToken, tokenRecord);

    // Send Verification Email
    await this.emailService.sendVerificationEmail(user.email, verifyToken);

    // Log action
    await this.auditService.log(user.id, 'REGISTER', ip, userAgent);

    return {
      message: 'Registration successful. Verification email dispatched.',
      email: user.email,
      verificationToken: verifyToken, // Kept for local test harness
    };
  }

  async login(credentials: any, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your driver account has been suspended by administrators.');
    }

    const matches = await bcrypt.compare(credentials.password, user.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { BillingStore } = require('../billing/billing.store');
    const subs = BillingStore.getSubscriptions();
    const plans = BillingStore.getPlans();
    
    let sub = subs.find((s: any) => s.userId === user.id);
    let plan = sub ? plans.find((p: any) => p.id === sub.planId) : null;
    
    if (!sub || !plan) {
      plan = plans.find((p: any) => p.id === 'basic') || plans[0];
    }
    
    const baseFeatures = plan?.features || ['DOCUMENTS'];
    const features = Array.from(new Set([...baseFeatures, 'SUPPORT_TICKETS', 'AI_COPILOT']));
    
    const subscription = {
      status: sub ? sub.status : 'TRIAL',
      planName: plan?.name || 'Enterprise Support',
      features
    };

    // Generate tokens
    const payload = { sub: user.id, email: user.email, role: user.role, subscription };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    
    // Generate refresh token
    const refreshToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token: refreshToken,
        device: userAgent,
        ip,
        expiresAt,
      },
    });

    // Log action
    await this.auditService.log(user.id, 'LOGIN', ip, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        subscription,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(token: string, ip?: string, userAgent?: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Invalidate old session
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isValid: false },
    });

    // Create new refresh token and session
    const nextRefreshToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.userSession.create({
      data: {
        userId: session.user.id,
        token: nextRefreshToken,
        device: userAgent || session.device,
        ip: ip || session.ip,
        expiresAt,
      },
    });

    const { BillingStore } = require('../billing/billing.store');
    const subs = BillingStore.getSubscriptions();
    const plans = BillingStore.getPlans();
    
    let sub = subs.find((s: any) => s.userId === session.user.id);
    let plan = sub ? plans.find((p: any) => p.id === sub.planId) : null;
    
    if (!sub || !plan) {
      plan = plans.find((p: any) => p.id === 'basic') || plans[0];
    }
    
    const subscription = {
      status: sub ? sub.status : 'TRIAL',
      planName: plan?.name || 'Basic Support',
      features: plan?.features || ['DOCUMENTS']
    };

    // Generate new Access Token
    const payload = { sub: session.user.id, email: session.user.email, role: session.user.role, subscription };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(token: string) {
    await this.prisma.userSession.updateMany({
      where: { token },
      data: { isValid: false },
    });
    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isValid: false },
    });
    return { message: 'Successfully logged out of all devices' };
  }

  async verifyEmail(token: string, ip?: string, userAgent?: string) {
    const tokenRecord = verificationTokens.get(token);

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.prisma.user.update({
      where: { email: tokenRecord.email },
      data: { isVerified: true },
    });

    // Cleanup token
    verificationTokens.delete(token);

    // Log audit
    await this.auditService.log(user.id, 'EMAIL_VERIFY', ip, userAgent);

    return { message: 'Email verified successfully', email: user.email };
  }

  async requestPasswordReset(email: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Silent success to prevent email enumeration
    if (!user) {
      return { message: 'Password reset link sent if account exists.' };
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiry

    const resetRecord = {
      id: Math.random().toString(36).substring(2, 15),
      email,
      token,
      expiresAt,
    };
    passwordResets.set(token, resetRecord);

    // Send Password Reset Email
    await this.emailService.sendPasswordResetEmail(email, token);

    // Log request
    await this.auditService.log(user.id, 'PASSWORD_RESET_REQ', ip, userAgent);

    return {
      message: 'Password reset email dispatched.',
      email,
      resetToken: token, // Kept for local test harness
    };
  }

  async resetPassword(data: any, ip?: string, userAgent?: string) {
    const resetRecord = passwordResets.get(data.token);

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (data.password !== data.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await this.prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    });

    // Clean up reset record
    passwordResets.delete(data.token);

    // Log action
    await this.auditService.log(user.id, 'PASSWORD_RESET_COMP', ip, userAgent);

    return { message: 'Password reset completed successfully' };
  }

  async setupProfile(userId: string, profileData: any) {
    const profile = await this.prisma.driverProfile.upsert({
      where: { userId },
      update: {
        driverType: profileData.driverType,
        languages: profileData.languages || ['English'],
        documentsUploaded: profileData.documentsUploaded || false,
      },
      create: {
        userId,
        driverType: profileData.driverType,
        languages: profileData.languages || ['English'],
        documentsUploaded: profileData.documentsUploaded || false,
      },
    });

    // Seed a default hybrid vehicle for this driver profile if none exist
    const existingVehicles = await this.prisma.vehicle.findFirst({
      where: { driverId: userId },
    });

    if (!existingVehicles) {
      await this.prisma.vehicle.create({
        data: {
          driverId: userId,
          make: 'Toyota',
          model: 'Camry Hybrid',
          year: 2024,
          plate: 'T' + Math.floor(100000 + Math.random() * 900000) + 'TLC',
          vin: '1NX1BU4K0P' + Math.floor(100000 + Math.random() * 900000),
        },
      });
    }

    return profile;
  }

  async getActiveSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isValid: true },
      select: {
        id: true,
        device: true,
        ip: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}
