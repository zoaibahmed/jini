/**
 * Frontend Configuration Module
 * In production: reads from NEXT_PUBLIC_API_URL env var.
 * In development: auto-detects host for multi-device testing (mobile/tablet on LAN).
 */

export const getApiUrl = (): string => {
  // Production: use the explicitly set env var
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Development: auto-detect host so mobile devices on LAN can connect
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000`;
    }
  }

  return 'http://localhost:5000';
};

export const API_URL = getApiUrl();
