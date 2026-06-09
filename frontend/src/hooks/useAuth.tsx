'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { API_URL } from '@/config';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<string | undefined>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string | undefined>;
  resetPassword: (data: any) => Promise<void>;
  setupProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions to set/delete cookies on client
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax; Secure`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Safe localStorage wrappers to prevent SecurityError in private/incognito browsing mode
const safeGetItem = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch (e) {
    console.warn('LocalStorage access blocked:', e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('LocalStorage access blocked:', e);
  }
};

const safeRemoveItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('LocalStorage access blocked:', e);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();


  const logout = useCallback(async () => {
    try {
      const rt = safeGetItem('jni_refresh_token');
      if (rt) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
      }
    } catch (err) {
      console.warn('Backend logout failed', err);
    } finally {
      // Clear client state
      setUser(null);
      safeRemoveItem('jni_refresh_token');
      safeRemoveItem('jni_user');
      deleteCookie('jni_access_token');
      toast.info('Logged out successfully');
      router.push('/auth/login');
    }
  }, [router, toast]);

  // Silent Token Refresh
  const handleRefresh = useCallback(async () => {
    const rt = safeGetItem('jni_refresh_token');
    if (!rt) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        throw new Error('Refresh session expired');
      }

      const data = await res.json();
      setCookie('jni_access_token', data.accessToken, 7);
      safeSetItem('jni_refresh_token', data.refreshToken);
      
      // Keep session active
      const cachedUser = safeGetItem('jni_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
      setLoading(false);
    } catch (err) {
      console.warn('Silent refresh failed. Session expired.', err);
      // Clear invalid state
      setUser(null);
      safeRemoveItem('jni_refresh_token');
      safeRemoveItem('jni_user');
      deleteCookie('jni_access_token');
      setLoading(false);
    }
  }, []);

  // Trigger silent refresh on mount and set a 14 min interval (access token expires in 15m)
  useEffect(() => {
    handleRefresh();
    const interval = setInterval(() => {
      handleRefresh();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Invalid credentials');
      }

      const data = await res.json();
      
      // Store session details
      setUser(data.user);
      safeSetItem('jni_user', JSON.stringify(data.user));
      safeSetItem('jni_refresh_token', data.refreshToken);
      setCookie('jni_access_token', data.accessToken, credentials.rememberMe ? 30 : 1);

      toast.success('Welcome back to JNI Solutions!');
      
      if (!data.user.isVerified) {
        router.push('/auth/verify-email');
      } else {
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('redirect');
        router.push(redirectPath ? redirectPath : '/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await res.json();
      toast.success('Registration successful. Activation token sent.');
      router.push(`/auth/verify-email?email=${encodeURIComponent(userData.email)}`);
      
      return data.verificationToken; // Handed back to easily auto-populate testing UI
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Invalid or expired verification token');
      }

      const data = await res.json();
      
      // Update local state if user is logged in
      const cached = safeGetItem('jni_user');
      if (cached) {
        const u = JSON.parse(cached);
        u.isVerified = true;
        setUser(u);
        safeSetItem('jni_user', JSON.stringify(u));
        toast.success('Your email is now verified!');
        router.push('/auth/profile-setup');
      } else {
        toast.success('Your email is now verified! Please login.');
        router.push('/auth/login?redirect=/auth/profile-setup');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const data = await res.json();
      toast.success('Password reset link sent successfully.');
      return data.resetToken; // For demo UI auto-fills
    } catch (err: any) {
      toast.error(err.message || 'Error requesting reset');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Invalid reset token');
      }
      toast.success('Password changed successfully. Please login.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message || 'Reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setupProfile = async (profileData: any) => {
    setLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jni_access_token='))
        ?.split('=')[1];

      const res = await fetch(`${API_URL}/auth/profile-setup`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Profile setup failed');
      }

      toast.success('Profile completed successfully.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Setup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, verifyEmail, forgotPassword, resetPassword, setupProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
