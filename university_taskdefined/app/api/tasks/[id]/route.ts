import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const updates = await request.json();
    const task = db.tasks.findById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Tâche non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const isOwner = task.studentId === auth.id || task.createdById === auth.id;
    const isSharedWith = task.sharedWith?.includes(auth.id);
    const canEdit = auth.role === 'admin' || isOwner || (auth.role === 'enseignant' && task.createdById === auth.id);
    
    if (!canEdit && !isSharedWith) {
      return NextResponse.json(
        { success: false, message: 'Permission refusée' },
        { status: 403 }
      );
    }

    const updatedTask = db.tasks.update(id, updates);
    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const task = db.tasks.findById(id);
  if (!task) {
    return NextResponse.json(
      { success: false, message: 'Tâche non trouvée' },
      { status: 404 }
    );
  }

  // Vérifier les permissions
  const isOwner = task.studentId === auth.id || task.createdById === auth.id;
  const canDelete = auth.role === 'admin' || (auth.role === 'enseignant' && task.createdById === auth.id) || isOwner;
  
  if (!canDelete) {
    return NextResponse.json(
      { success: false, message: 'Permission refusée' },
      { status: 403 }
    );
  }

  db.tasks.delete(id);
  return NextResponse.json({ success: true });
}

