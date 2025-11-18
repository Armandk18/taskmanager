import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, ['admin']);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Accès refusé - Admin uniquement' },
      { status: 403 }
    );
  }

  try {
    const { title, content, priority } = await request.json();
    const announcement = db.announcements.getAll().find(a => a.id === params.id);

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    const updatedAnnouncement = db.announcements.update(params.id, {
      title,
      content,
      priority,
    });

    if (!updatedAnnouncement) {
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, announcement: updatedAnnouncement });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireRole(request, ['admin']);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Accès refusé - Admin uniquement' },
      { status: 403 }
    );
  }

  const success = db.announcements.delete(params.id);
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Annonce non trouvée' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

