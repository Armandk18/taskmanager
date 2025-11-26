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

  if (auth.role === 'admin') {
    const tasks = db.tasks.getAll();
    return NextResponse.json({ success: true, tasks });
  } else if (auth.role === 'enseignant') {
    // Les enseignants voient les tâches qu'ils ont créées
    const createdTasks = db.tasks.findByCreatedBy(auth.id);
    return NextResponse.json({ success: true, tasks: createdTasks });
  } else {
    // Les étudiants voient leurs tâches et celles partagées avec eux
    const ownTasks = db.tasks.findByStudentId(auth.id);
    const sharedTasks = db.tasks.findBySharedWith(auth.id);
    const allTasks = [...ownTasks, ...sharedTasks.filter(t => !ownTasks.find(ot => ot.id === t.id))];
    return NextResponse.json({ success: true, tasks: allTasks });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const { title, description, dueDate, priority, studentId } = await request.json();

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const task = db.tasks.create({
      title,
      description,
      dueDate,
      completed: false,
      studentId: (auth.role === 'admin' || auth.role === 'enseignant') ? (studentId || auth.id) : auth.id,
      createdBy: auth.role === 'admin' ? 'admin' : auth.role === 'enseignant' ? 'enseignant' : 'student',
      priority: priority || 'medium',
      createdById: auth.id,
      sharedWith: [],
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

