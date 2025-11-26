import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function POST(
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
    const { studentIds } = await request.json(); // Array of student IDs to share with

    if (!Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, message: 'studentIds doit être un tableau' },
        { status: 400 }
      );
    }

    const task = db.tasks.findById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Tâche non trouvée' },
        { status: 404 }
      );
    }

    // Seuls les enseignants et admins peuvent partager des tâches
    if (auth.role !== 'enseignant' && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Seuls les enseignants et administrateurs peuvent partager des tâches' },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de la tâche ou un admin
    if (auth.role !== 'admin' && task.createdById !== auth.id) {
      return NextResponse.json(
        { success: false, message: 'Vous ne pouvez partager que vos propres tâches' },
        { status: 403 }
      );
    }

    // Vérifier que tous les IDs sont valides (sont des étudiants)
    const allUsers = db.users.getAll();
    const invalidIds = studentIds.filter((sid: string) => {
      const user = allUsers.find(u => u.id === sid);
      return !user || user.role !== 'student';
    });

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Certains IDs ne correspondent pas à des étudiants valides' },
        { status: 400 }
      );
    }

    // Mettre à jour la tâche avec les IDs partagés
    const updatedSharedWith = [...new Set([...(task.sharedWith || []), ...studentIds])];
    const updatedTask = db.tasks.update(id, { sharedWith: updatedSharedWith });

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

  try {
    const { id } = await params;
    const { studentId } = await request.json(); // ID de l'étudiant à retirer du partage

    const task = db.tasks.findById(id);

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Tâche non trouvée' },
        { status: 404 }
      );
    }

    // Seuls les enseignants et admins peuvent retirer le partage
    if (auth.role !== 'enseignant' && auth.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Permission refusée' },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de la tâche ou un admin
    if (auth.role !== 'admin' && task.createdById !== auth.id) {
      return NextResponse.json(
        { success: false, message: 'Permission refusée' },
        { status: 403 }
      );
    }

    // Retirer l'étudiant du partage
    const updatedSharedWith = (task.sharedWith || []).filter((sid: string) => sid !== studentId);
    const updatedTask = db.tasks.update(id, { sharedWith: updatedSharedWith });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

