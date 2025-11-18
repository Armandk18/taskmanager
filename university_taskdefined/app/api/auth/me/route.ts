import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  const user = db.users.findById(auth.id);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Utilisateur non trouvé' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

