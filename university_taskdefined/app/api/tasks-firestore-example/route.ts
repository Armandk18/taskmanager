// EXEMPLE : Route API utilisant Firestore (selon le plan)
// Ce fichier montre comment migrer une route API vers Firestore

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { tasksService, userTasksService, classesService } from '@/lib/firestore-service';
import { usersService } from '@/lib/firestore-service';

/**
 * GET /api/tasks-firestore-example
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
    const user = await usersService.findById(auth.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    let tasks = [];

    if (user.role === 'admin') {
      // Admin : voir toutes les tâches
      // Note: Dans Firestore, on devrait paginer pour les grandes collections
      const allTasks = await tasksService.findByAssigner(auth.id);
      // Pour admin, on pourrait aussi avoir une méthode getAll() avec pagination
      tasks = allTasks;

    } else if (user.role === 'teacher') {
      // Enseignant : voir les tâches qu'il a créées
      tasks = await tasksService.findByAssigner(auth.id);

    } else if (user.role === 'student') {
      // Étudiant : voir ses userTasks avec les détails des tâches
      const userTasks = await userTasksService.findByUser(auth.id);
      
      // Récupérer les détails de chaque tâche
      const taskPromises = userTasks.map(ut => tasksService.findById(ut.taskId));
      const taskDetails = await Promise.all(taskPromises);
      
      // Combiner userTask (statut, note) avec task (détails)
      tasks = taskDetails
        .filter(task => task !== null)
        .map((task, index) => ({
          ...task,
          userTask: {
            id: userTasks[index].id,
            status: userTasks[index].status,
            submissionLink: userTasks[index].submissionLink,
            grade: userTasks[index].grade,
            teacherComment: userTasks[index].teacherComment,
          },
        }));
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
 * POST /api/tasks-firestore-example
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
    const user = await usersService.findById(auth.id);
    if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
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
    const classData = await classesService.findById(classId);
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
    const task = await tasksService.create({
      title,
      description,
      dueDate: new Date(dueDate),
      assignerId: auth.id,
      classId,
      attachments: attachments || [],
    });

    // Créer automatiquement les userTasks pour tous les étudiants de la classe
    await userTasksService.createForClass(task.id, classId);

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

