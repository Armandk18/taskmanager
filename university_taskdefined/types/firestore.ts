// Types pour l'architecture Firestore (Plan EduTask Manager)

import { Timestamp } from 'firebase/firestore';

export type UserRole = 'student' | 'teacher' | 'admin';
export type TaskStatus = 'todo' | 'doing' | 'done';

/**
 * Collection: users
 * Stocke tous les utilisateurs du système
 */
export interface FirestoreUser {
  id: string;                    // Document ID (uid)
  role: UserRole;
  name: string;
  email: string;
  classIds?: string[];           // Pour les enseignants (classes qu'ils enseignent)
  createdAt: Timestamp | Date;
}

/**
 * Collection: classes
 * Représente un groupe d'étudiants avec un enseignant
 */
export interface FirestoreClass {
  id: string;                    // Document ID
  name: string;                  // Ex: "Terminale B", "Première S"
  teacherId: string;              // Référence vers users (enseignant)
  studentIds: string[];          // Array de références vers users (étudiants)
  createdAt: Timestamp | Date;
}

/**
 * Collection: tasks
 * Définition d'une tâche/devoir assignée à une classe
 */
export interface FirestoreTask {
  id: string;                    // Document ID
  title: string;
  description: string;
  dueDate: Timestamp | Date;
  assignerId: string;            // Référence vers users (créateur - enseignant/admin)
  classId: string;                // Référence vers classes
  attachments?: string[];         // URLs des fichiers joints
  createdAt: Timestamp | Date;
}

/**
 * Collection: userTasks
 * Table de jonction : État d'une tâche pour un étudiant spécifique
 * Une tâche (task) peut avoir plusieurs userTasks (un par étudiant)
 */
export interface FirestoreUserTask {
  id: string;                    // Document ID
  taskId: string;                // Référence vers tasks
  userId: string;                // Référence vers users (étudiant)
  status: TaskStatus;            // 'todo' | 'doing' | 'done'
  submissionLink?: string;        // URL de soumission (Google Drive, GitHub, etc.)
  grade?: number;                 // Note sur 20 (assignée par l'enseignant)
  teacherComment?: string;        // Commentaire du professeur
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Types pour les requêtes et réponses API
 */
export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;               // ISO string
  classId: string;
  attachments?: string[];
}

export interface CreateClassRequest {
  name: string;
  teacherId: string;
  studentIds: string[];
}

export interface SubmitTaskRequest {
  taskId: string;
  submissionLink: string;
}

export interface GradeTaskRequest {
  userTaskId: string;
  grade: number;                  // 0-20
  teacherComment?: string;
}

/**
 * Types pour les vues agrégées
 */
export interface TaskWithUserTask extends FirestoreTask {
  userTask?: FirestoreUserTask;  // État pour l'utilisateur actuel
}

export interface ClassWithStats extends FirestoreClass {
  taskCount?: number;
  completedTaskCount?: number;
  averageGrade?: number;
}

/**
 * Types pour les statistiques
 */
export interface StudentStats {
  totalTasks: number;
  completedTasks: number;
  averageGrade: number;
  pendingTasks: number;
}

export interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  activeTasks: number;
  averageCompletionRate: number;
}

export interface AdminStats {
  totalUsers: number;
  totalClasses: number;
  totalTasks: number;
  systemUsage: {
    students: number;
    teachers: number;
    admins: number;
  };
}

