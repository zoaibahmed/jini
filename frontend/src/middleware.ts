import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'JNI_SECURE_JWT_SECRET_KEY_98765';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get access token from cookies
  const accessToken = request.cookies.get('jni_access_token')?.value;

  // Paths requiring authentication
  const isDashboardPath = pathname.startsWith('/dashboard');
  const isAdminPath = pathname.startsWith('/admin');
  const isSupportPath = pathname.startsWith('/support');

  if (isDashboardPath || isAdminPath || isSupportPath) {
    if (!accessToken) {
      // Not logged in -> Redirect to login page
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Decode JWT claim
      // Note: In production edge, we verify using TextEncoder
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(accessToken, secretKey);
      
      const userRole = payload.role as string;
      const isEmailVerified = payload.isVerified as boolean;

      // Super admin can access anything
      if (userRole === 'SUPERADMIN') {
        return NextResponse.next();
      }

      // Check role based access limits
      if (isAdminPath && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      if (isSupportPath && userRole !== 'SUPPORT' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      if (isDashboardPath) {
        // If driver email is not verified, redirect them to verify page, except if they are already on verify route
        if (payload.isVerified === false && !pathname.startsWith('/auth/verify-email')) {
          // If not verified, we can let them check verification or redirect. Let's keep it simple for now
        }

        // Subscription plan limits enforcement for drivers
        if (userRole === 'DRIVER') {
          const subscription = payload.subscription as any;
          const features = subscription?.features || ['DOCUMENTS'];

          if (pathname.startsWith('/dashboard/copilot') && !features.includes('AI_COPILOT')) {
            return NextResponse.redirect(new URL('/dashboard/billing?restricted=ai', request.url));
          }

          if (pathname.startsWith('/dashboard/support') && !features.includes('SUPPORT_TICKETS')) {
            return NextResponse.redirect(new URL('/dashboard/billing?restricted=support', request.url));
          }
        }
      }

      return NextResponse.next();
    } catch (err) {
      // Token is invalid/expired -> Redirect to session expired
      const expiredUrl = new URL('/auth/session-expired', request.url);
      return NextResponse.redirect(expiredUrl);
    }
  }

  // Prevent logged-in users from hitting login/signup pages
  const isAuthPath = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup');
  if (isAuthPath && accessToken) {
    try {
      const secretKey = new TextEncoder().encode(JWT_SECRET);
      await jose.jwtVerify(accessToken, secretKey);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Invalid token, clear it and let them hit login
      const response = NextResponse.next();
      response.cookies.delete('jni_access_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/support/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
