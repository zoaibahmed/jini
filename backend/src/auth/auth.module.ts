import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { AuditService } from './audit.service';
import { EmailService } from './email.service';
import { OtpService } from './otp.service';
import { SmsModule } from '../sms/sms.module';
import { WebAuthnService } from './webauthn.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'JNI_SECURE_JWT_SECRET_KEY_98765',
      signOptions: { expiresIn: '15m' },
    }),
    SmsModule,
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, AuditService, EmailService, OtpService, WebAuthnService],
  controllers: [AuthController],
  exports: [AuthService, PassportModule, JwtModule, EmailService, OtpService, WebAuthnService],
})
export class AuthModule {}

