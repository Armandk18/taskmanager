import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  const announcements = db.announcements.getAll();
  return NextResponse.json({ success: true, announcements });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['admin']);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Accès refusé - Admin uniquement' },
      { status: 403 }
    );
  }

  try {
    const { title, content, priority } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: 'Titre et contenu requis' },
        { status: 400 }
      );
    }

    const user = db.users.findById(auth.id);
    const announcement = db.announcements.create({
      title,
      content,
      authorId: auth.id,
      authorName: user?.name || 'Administrateur',
      priority: priority || 'medium',
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

