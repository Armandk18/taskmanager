import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin', 'enseignant']);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Accès refusé - Admin ou Enseignant uniquement' },
      { status: 403 }
    );
  }

  const users = db.users.getAll().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  }));

  return NextResponse.json({ success: true, users });
}

