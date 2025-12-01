// Services SQLite pour remplacer la DB en mémoire
// Implémentation selon le plan avec SQLite

import { db } from './sqlite';
import {
  FirestoreUser,
  FirestoreClass,
  FirestoreTask,
  FirestoreUserTask,
  TaskStatus,
  UserRole,
} from '@/types/firestore';

// Helper pour générer des IDs
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ============================================
// COLLECTION: users
// ============================================

export const usersService = {
  /**
   * Récupérer un utilisateur par ID
   */
  findById(userId: string): FirestoreUser | null {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const row = stmt.get(userId) as any;
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        classIds: this.getClassIdsForUser(row.id),
        createdAt: new Date(row.createdAt),
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  /**
   * Récupérer un utilisateur par email
   */
  findByEmail(email: string): FirestoreUser | null {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const row = stmt.get(email) as any;
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        classIds: this.getClassIdsForUser(row.id),
        createdAt: new Date(row.createdAt),
      };
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  },

  /**
   * Récupérer tous les utilisateurs d'un rôle spécifique
   */
  findByRole(role: UserRole): FirestoreUser[] {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE role = ?');
      const rows = stmt.all(role) as any[];
      return rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        classIds: this.getClassIdsForUser(row.id),
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  },

  /**
   * Récupérer tous les utilisateurs
   */
  getAll(): FirestoreUser[] {
    try {
      const stmt = db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
      const rows = stmt.all() as any[];
      return rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        classIds: this.getClassIdsForUser(row.id),
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  /**
   * Créer un nouvel utilisateur
   */
  create(user: Omit<FirestoreUser, 'id' | 'createdAt'>): FirestoreUser {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, role, createdAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run(id, user.email, user.password || '', user.name, user.role);
    
    return {
      id,
      ...user,
      createdAt: new Date(),
    };
  },

  /**
   * Mettre à jour un utilisateur
   */
  update(userId: string, updates: Partial<FirestoreUser>): boolean {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
      }
      if (updates.password !== undefined) {
        fields.push('password = ?');
        values.push(updates.password);
      }

      if (fields.length === 0) return true;

      values.push(userId);
      const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  },

  /**
   * Supprimer un utilisateur
   */
  delete(userId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(userId);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  /**
   * Helper: Récupérer les IDs de classes pour un utilisateur
   */
  getClassIdsForUser(userId: string): string[] {
    try {
      const stmt = db.prepare(`
        SELECT DISTINCT classId FROM class_students WHERE studentId = ?
        UNION
        SELECT id FROM classes WHERE teacherId = ?
      `);
      const rows = stmt.all(userId, userId) as any[];
      return rows.map(row => row.classId || row.id);
    } catch (error) {
      return [];
    }
  },
};

// ============================================
// COLLECTION: classes
// ============================================

export const classesService = {
  /**
   * Récupérer une classe par ID
   */
  findById(classId: string): FirestoreClass | null {
    try {
      const stmt = db.prepare('SELECT * FROM classes WHERE id = ?');
      const row = stmt.get(classId) as any;
      if (!row) return null;

      const studentIds = this.getStudentIds(classId);
      return {
        id: row.id,
        name: row.name,
        teacherId: row.teacherId,
        studentIds,
        createdAt: new Date(row.createdAt),
      };
    } catch (error) {
      console.error('Error fetching class:', error);
      return null;
    }
  },

  /**
   * Récupérer toutes les classes d'un enseignant
   */
  findByTeacher(teacherId: string): FirestoreClass[] {
    try {
      const stmt = db.prepare('SELECT * FROM classes WHERE teacherId = ? ORDER BY createdAt DESC');
      const rows = stmt.all(teacherId) as any[];
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        teacherId: row.teacherId,
        studentIds: this.getStudentIds(row.id),
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching classes by teacher:', error);
      return [];
    }
  },

  /**
   * Récupérer toutes les classes d'un étudiant
   */
  findByStudent(studentId: string): FirestoreClass[] {
    try {
      const stmt = db.prepare(`
        SELECT c.* FROM classes c
        INNER JOIN class_students cs ON c.id = cs.classId
        WHERE cs.studentId = ?
        ORDER BY c.createdAt DESC
      `);
      const rows = stmt.all(studentId) as any[];
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        teacherId: row.teacherId,
        studentIds: this.getStudentIds(row.id),
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching classes by student:', error);
      return [];
    }
  },

  /**
   * Créer une nouvelle classe
   */
  create(classData: Omit<FirestoreClass, 'id' | 'createdAt'>): FirestoreClass {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO classes (id, name, teacherId, createdAt)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    stmt.run(id, classData.name, classData.teacherId);

    // Ajouter les étudiants à la classe
    if (classData.studentIds && classData.studentIds.length > 0) {
      const insertStudent = db.prepare(`
        INSERT INTO class_students (classId, studentId) VALUES (?, ?)
      `);
      const insertMany = db.transaction((studentIds: string[]) => {
        for (const studentId of studentIds) {
          insertStudent.run(id, studentId);
        }
      });
      insertMany(classData.studentIds);
    }

    return {
      id,
      ...classData,
      createdAt: new Date(),
    };
  },

  /**
   * Mettre à jour une classe
   */
  update(classId: string, updates: Partial<FirestoreClass>): boolean {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.teacherId !== undefined) {
        fields.push('teacherId = ?');
        values.push(updates.teacherId);
      }

      if (fields.length > 0) {
        values.push(classId);
        const stmt = db.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`);
        stmt.run(...values);
      }

      // Mettre à jour les étudiants si nécessaire
      if (updates.studentIds !== undefined) {
        // Supprimer les anciens étudiants
        const deleteStmt = db.prepare('DELETE FROM class_students WHERE classId = ?');
        deleteStmt.run(classId);

        // Ajouter les nouveaux étudiants
        if (updates.studentIds.length > 0) {
          const insertStudent = db.prepare(`
            INSERT INTO class_students (classId, studentId) VALUES (?, ?)
          `);
          const insertMany = db.transaction((studentIds: string[]) => {
            for (const studentId of studentIds) {
              insertStudent.run(classId, studentId);
            }
          });
          insertMany(updates.studentIds);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating class:', error);
      return false;
    }
  },

  /**
   * Supprimer une classe
   */
  delete(classId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
      stmt.run(classId);
      return true;
    } catch (error) {
      console.error('Error deleting class:', error);
      return false;
    }
  },

  /**
   * Helper: Récupérer les IDs des étudiants d'une classe
   */
  getStudentIds(classId: string): string[] {
    try {
      const stmt = db.prepare('SELECT studentId FROM class_students WHERE classId = ?');
      const rows = stmt.all(classId) as any[];
      return rows.map(row => row.studentId);
    } catch (error) {
      return [];
    }
  },
};

// ============================================
// COLLECTION: tasks
// ============================================

export const tasksService = {
  /**
   * Récupérer une tâche par ID
   */
  findById(taskId: string): FirestoreTask | null {
    try {
      const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
      const row = stmt.get(taskId) as any;
      if (!row) return null;
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: new Date(row.dueDate),
        assignerId: row.assignerId,
        classId: row.classId || undefined,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        createdAt: new Date(row.createdAt),
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  },

  /**
   * Récupérer toutes les tâches d'une classe
   */
  findByClass(classId: string): FirestoreTask[] {
    try {
      const stmt = db.prepare(`
        SELECT * FROM tasks 
        WHERE classId = ? 
        ORDER BY dueDate ASC
      `);
      const rows = stmt.all(classId) as any[];
      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: new Date(row.dueDate),
        assignerId: row.assignerId,
        classId: row.classId || undefined,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching tasks by class:', error);
      return [];
    }
  },

  /**
   * Récupérer toutes les tâches créées par un utilisateur
   */
  findByAssigner(assignerId: string): FirestoreTask[] {
    try {
      const stmt = db.prepare(`
        SELECT * FROM tasks 
        WHERE assignerId = ? 
        ORDER BY createdAt DESC
      `);
      const rows = stmt.all(assignerId) as any[];
      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: new Date(row.dueDate),
        assignerId: row.assignerId,
        classId: row.classId || undefined,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching tasks by assigner:', error);
      return [];
    }
  },

  /**
   * Récupérer toutes les tâches
   */
  getAll(): FirestoreTask[] {
    try {
      const stmt = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC');
      const rows = stmt.all() as any[];
      return rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        dueDate: new Date(row.dueDate),
        assignerId: row.assignerId,
        classId: row.classId || undefined,
        attachments: row.attachments ? JSON.parse(row.attachments) : [],
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      return [];
    }
  },

  /**
   * Créer une nouvelle tâche
   */
  create(taskData: Omit<FirestoreTask, 'id' | 'createdAt'>): FirestoreTask {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO tasks (id, title, description, dueDate, assignerId, classId, priority, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run(
      id,
      taskData.title,
      taskData.description,
      taskData.dueDate instanceof Date ? taskData.dueDate.toISOString() : taskData.dueDate,
      taskData.assignerId,
      taskData.classId || null,
      'medium'
    );

    return {
      id,
      ...taskData,
      createdAt: new Date(),
    };
  },

  /**
   * Mettre à jour une tâche
   */
  update(taskId: string, updates: Partial<FirestoreTask>): boolean {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.dueDate !== undefined) {
        fields.push('dueDate = ?');
        const date = updates.dueDate instanceof Date ? updates.dueDate.toISOString() : updates.dueDate;
        values.push(date);
      }
      if (updates.classId !== undefined) {
        fields.push('classId = ?');
        values.push(updates.classId || null);
      }
      if (updates.attachments !== undefined) {
        fields.push('attachments = ?');
        values.push(JSON.stringify(updates.attachments));
      }

      if (fields.length === 0) return true;

      values.push(taskId);
      const stmt = db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  },

  /**
   * Supprimer une tâche
   */
  delete(taskId: string): boolean {
    try {
      const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
      stmt.run(taskId);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  },
};

// ============================================
// COLLECTION: userTasks (Table de jonction)
// ============================================

export const userTasksService = {
  /**
   * Récupérer un userTask par ID
   */
  findById(userTaskId: string): FirestoreUserTask | null {
    try {
      const stmt = db.prepare('SELECT * FROM user_tasks WHERE id = ?');
      const row = stmt.get(userTaskId) as any;
      if (!row) return null;
      return {
        id: row.id,
        taskId: row.taskId,
        userId: row.userId,
        status: row.status as TaskStatus,
        submissionLink: row.submissionLink || undefined,
        grade: row.grade !== null ? row.grade : undefined,
        teacherComment: row.teacherComment || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      console.error('Error fetching userTask:', error);
      return null;
    }
  },

  /**
   * Récupérer tous les userTasks d'un étudiant
   */
  findByUser(userId: string): FirestoreUserTask[] {
    try {
      const stmt = db.prepare(`
        SELECT * FROM user_tasks 
        WHERE userId = ? 
        ORDER BY createdAt DESC
      `);
      const rows = stmt.all(userId) as any[];
      return rows.map(row => ({
        id: row.id,
        taskId: row.taskId,
        userId: row.userId,
        status: row.status as TaskStatus,
        submissionLink: row.submissionLink || undefined,
        grade: row.grade !== null ? row.grade : undefined,
        teacherComment: row.teacherComment || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      console.error('Error fetching userTasks by user:', error);
      return [];
    }
  },

  /**
   * Récupérer tous les userTasks d'une tâche
   */
  findByTask(taskId: string): FirestoreUserTask[] {
    try {
      const stmt = db.prepare('SELECT * FROM user_tasks WHERE taskId = ?');
      const rows = stmt.all(taskId) as any[];
      return rows.map(row => ({
        id: row.id,
        taskId: row.taskId,
        userId: row.userId,
        status: row.status as TaskStatus,
        submissionLink: row.submissionLink || undefined,
        grade: row.grade !== null ? row.grade : undefined,
        teacherComment: row.teacherComment || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      console.error('Error fetching userTasks by task:', error);
      return [];
    }
  },

  /**
   * Récupérer un userTask spécifique (tâche + étudiant)
   */
  findByTaskAndUser(taskId: string, userId: string): FirestoreUserTask | null {
    try {
      const stmt = db.prepare('SELECT * FROM user_tasks WHERE taskId = ? AND userId = ?');
      const row = stmt.get(taskId, userId) as any;
      if (!row) return null;
      return {
        id: row.id,
        taskId: row.taskId,
        userId: row.userId,
        status: row.status as TaskStatus,
        submissionLink: row.submissionLink || undefined,
        grade: row.grade !== null ? row.grade : undefined,
        teacherComment: row.teacherComment || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      console.error('Error fetching userTask by task and user:', error);
      return null;
    }
  },

  /**
   * Créer un userTask
   */
  create(userTaskData: Omit<FirestoreUserTask, 'id' | 'createdAt' | 'updatedAt'>): FirestoreUserTask {
    const id = generateId();
    const stmt = db.prepare(`
      INSERT INTO user_tasks (id, taskId, userId, status, submissionLink, grade, teacherComment, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    stmt.run(
      id,
      userTaskData.taskId,
      userTaskData.userId,
      userTaskData.status || 'todo',
      userTaskData.submissionLink || null,
      userTaskData.grade || null,
      userTaskData.teacherComment || null
    );

    return {
      id,
      ...userTaskData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  /**
   * Mettre à jour un userTask
   */
  update(userTaskId: string, updates: Partial<FirestoreUserTask>): boolean {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.submissionLink !== undefined) {
        fields.push('submissionLink = ?');
        values.push(updates.submissionLink || null);
      }
      if (updates.grade !== undefined) {
        fields.push('grade = ?');
        values.push(updates.grade !== undefined ? updates.grade : null);
      }
      if (updates.teacherComment !== undefined) {
        fields.push('teacherComment = ?');
        values.push(updates.teacherComment || null);
      }

      if (fields.length === 0) return true;

      fields.push("updatedAt = datetime('now')");
      values.push(userTaskId);
      const stmt = db.prepare(`UPDATE user_tasks SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      return true;
    } catch (error) {
      console.error('Error updating userTask:', error);
      return false;
    }
  },

  /**
   * Soumettre un devoir
   */
  submitTask(userTaskId: string, submissionLink: string): boolean {
    return this.update(userTaskId, {
      status: 'done',
      submissionLink,
    });
  },

  /**
   * Noter un devoir
   */
  gradeTask(userTaskId: string, grade: number, teacherComment?: string): boolean {
    return this.update(userTaskId, {
      grade,
      teacherComment,
    });
  },

  /**
   * Créer automatiquement des userTasks pour tous les étudiants d'une classe
   */
  createForClass(taskId: string, classId: string): boolean {
    try {
      const classData = classesService.findById(classId);
      if (!classData) return false;

      const insertStmt = db.prepare(`
        INSERT INTO user_tasks (id, taskId, userId, status, createdAt, updatedAt)
        VALUES (?, ?, ?, 'todo', datetime('now'), datetime('now'))
      `);

      const insertMany = db.transaction((studentIds: string[]) => {
        for (const studentId of studentIds) {
          insertStmt.run(generateId(), taskId, studentId);
        }
      });

      insertMany(classData.studentIds);
      return true;
    } catch (error) {
      console.error('Error creating userTasks for class:', error);
      return false;
    }
  },
};

