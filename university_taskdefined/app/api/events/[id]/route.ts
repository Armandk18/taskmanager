import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const updates = await request.json();
    const event = db.events.getAll().find(e => e.id === params.id);

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (auth.role !== 'admin' && event.createdBy !== auth.id) {
      return NextResponse.json(
        { success: false, message: 'Permission refusée' },
        { status: 403 }
      );
    }

    const updatedEvent = db.events.update(params.id, updates);
    return NextResponse.json({ success: true, event: updatedEvent });
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
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  const event = db.events.getAll().find(e => e.id === params.id);
  if (!event) {
    return NextResponse.json(
      { success: false, message: 'Événement non trouvé' },
      { status: 404 }
    );
  }

  // Vérifier les permissions
  if (auth.role !== 'admin' && event.createdBy !== auth.id) {
    return NextResponse.json(
      { success: false, message: 'Permission refusée' },
      { status: 403 }
    );
  }

  db.events.delete(params.id);
  return NextResponse.json({ success: true });
}

