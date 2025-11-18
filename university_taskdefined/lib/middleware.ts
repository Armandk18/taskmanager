import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}

export function requireAuth(request: NextRequest): { id: string; email: string; role: string } | null {
  const token = getAuthToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(request: NextRequest, allowedRoles: string[]): { id: string; email: string; role: string } | null {
  const auth = requireAuth(request);
  if (!auth || !allowedRoles.includes(auth.role)) {
    return null;
  }
  return auth;
}

