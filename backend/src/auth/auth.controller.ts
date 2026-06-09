import { Controller, Post, Body, Req, Get, UseGuards, UnauthorizedException, Headers, Patch, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new driver user' })
  async register(@Req() req: Request, @Body() body: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(body, ip, userAgent);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and receive access and refresh tokens' })
  async login(@Req() req: Request, @Body() body: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(body, ip, userAgent);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Silent refresh of Access Token using valid Refresh Token' })
  async refresh(@Req() req: Request, @Body() body: { refreshToken: string }) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.refreshTokens(body.refreshToken, ip, userAgent);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Invalidate current refresh session' })
  async logout(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    return this.authService.logout(body.refreshToken);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Activate account using email verification token' })
  async verifyEmail(@Req() req: Request, @Query('token') token: string) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    if (!token) {
      throw new UnauthorizedException('Verification token is required');
    }
    return this.authService.verifyEmail(token, ip, userAgent);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset verification link' })
  async forgotPassword(@Req() req: Request, @Body() body: { email: string }) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.requestPasswordReset(body.email, ip, userAgent);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using reset token' })
  async resetPassword(@Req() req: Request, @Body() body: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.resetPassword(body, ip, userAgent);
  }

  @Patch('profile-setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set up or update driver profile details' })
  async setupProfile(@Req() req: any, @Body() body: any) {
    return this.authService.setupProfile(req.user.id, body);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of active sessions for the user' })
  async getSessions(@Req() req: any) {
    return this.authService.getActiveSessions(req.user.id);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate all refresh tokens and sessions for this user' })
  async logoutAll(@Req() req: any) {
    return this.authService.logoutAllDevices(req.user.id);
  }
}
