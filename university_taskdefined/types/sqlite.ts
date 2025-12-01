// Types pour l'architecture SQLite (EduTask Manager)

export type UserRole = 'student' | 'admin' | 'enseignant';
export type TaskStatus = 'todo' | 'doing' | 'done';

/**
 * Table: users
 * Stocke tous les utilisateurs du système
 */
export interface SQLiteUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  classIds?: string[];           // Pour les enseignants (classes qu'ils enseignent)
  createdAt: Date;
}

/**
 * Table: classes
 * Représente un groupe d'étudiants avec un enseignant
 */
export interface SQLiteClass {
  id: string;
  name: string;                  // Ex: "Terminale B", "Première S"
  teacherId: string;              // Référence vers users (enseignant)
  studentIds: string[];          // Array de références vers users (étudiants)
  createdAt: Date;
}

/**
 * Table: tasks
 * Définition d'une tâche/devoir assignée à une classe
 */
export interface SQLiteTask {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  assignerId: string;            // Référence vers users (créateur - enseignant/admin)
  classId?: string;               // Référence vers classes
  attachments?: string[];         // URLs des fichiers joints
  createdAt: Date;
}

/**
 * Table: user_tasks
 * Table de jonction : État d'une tâche pour un étudiant spécifique
 * Une tâche (task) peut avoir plusieurs userTasks (un par étudiant)
 */
export interface SQLiteUserTask {
  id: string;
  taskId: string;                // Référence vers tasks
  userId: string;                // Référence vers users (étudiant)
  status: TaskStatus;            // 'todo' | 'doing' | 'done'
  submissionLink?: string;        // URL de soumission (Google Drive, GitHub, etc.)
  grade?: number;                 // Note sur 20 (assignée par l'enseignant)
  teacherComment?: string;        // Commentaire du professeur
  createdAt: Date;
  updatedAt: Date;
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
export interface TaskWithUserTask extends SQLiteTask {
  userTask?: SQLiteUserTask;  // État pour l'utilisateur actuel
}

export interface ClassWithStats extends SQLiteClass {
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

