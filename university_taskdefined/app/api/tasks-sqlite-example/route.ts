// EXEMPLE : Route API utilisant SQLite (selon le plan)
// Ce fichier montre comment migrer une route API vers SQLite

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tasksService, userTasksService, classesService, usersService } from '@/lib/sqlite-service';

/**
 * GET /api/tasks-sqlite-example
 * Récupère les tâches selon le rôle de l'utilisateur
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const user = usersService.findById(auth.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    let tasks = [];

    if (user.role === 'admin') {
      // Admin : voir toutes les tâches
      tasks = tasksService.getAll();

    } else if (user.role === 'enseignant') {
      // Enseignant : voir les tâches qu'il a créées
      tasks = tasksService.findByAssigner(auth.id);

    } else if (user.role === 'student') {
      // Étudiant : voir ses userTasks avec les détails des tâches
      const userTasks = userTasksService.findByUser(auth.id);
      
      // Récupérer les détails de chaque tâche
      const taskDetails = userTasks
        .map(ut => tasksService.findById(ut.taskId))
        .filter(task => task !== null);
      
      // Combiner userTask (statut, note) avec task (détails)
      tasks = taskDetails.map((task) => {
        const userTask = userTasks.find(ut => ut.taskId === task!.id);
        return {
          ...task,
          userTask: {
            id: userTask?.id,
            status: userTask?.status,
            submissionLink: userTask?.submissionLink,
            grade: userTask?.grade,
            teacherComment: userTask?.teacherComment,
          },
        };
      });
    }

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks-sqlite-example
 * Créer une nouvelle tâche (enseignant/admin uniquement)
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const user = usersService.findById(auth.id);
    if (!user || (user.role !== 'enseignant' && user.role !== 'admin')) {
      return NextResponse.json(
        { success: false, message: 'Seuls les enseignants et admins peuvent créer des tâches' },
        { status: 403 }
      );
    }

    const { title, description, dueDate, classId, attachments } = await request.json();

    if (!title || !description || !dueDate || !classId) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que la classe existe
    const classData = classesService.findById(classId);
    if (!classData) {
      return NextResponse.json(
        { success: false, message: 'Classe non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est l'enseignant de la classe ou admin
    if (user.role !== 'admin' && classData.teacherId !== auth.id) {
      return NextResponse.json(
        { success: false, message: 'Vous ne pouvez créer des tâches que pour vos propres classes' },
        { status: 403 }
      );
    }

    // Créer la tâche
    const task = tasksService.create({
      title,
      description,
      dueDate: new Date(dueDate),
      assignerId: auth.id,
      classId,
      attachments: attachments || [],
    });

    // Créer automatiquement les userTasks pour tous les étudiants de la classe
    userTasksService.createForClass(task.id, classId);

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

