// Service Firestore pour remplacer la DB en mémoire
// Implémentation selon le plan EduTask Manager

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  FirestoreUser,
  FirestoreClass,
  FirestoreTask,
  FirestoreUserTask,
  TaskStatus,
  UserRole,
} from '@/types/firestore';

// ============================================
// COLLECTION: users
// ============================================

export const usersService = {
  /**
   * Récupérer un utilisateur par ID
   */
  async findById(userId: string): Promise<FirestoreUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      return { id: userDoc.id, ...userDoc.data() } as FirestoreUser;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  /**
   * Récupérer un utilisateur par email
   */
  async findByEmail(email: string): Promise<FirestoreUser | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as FirestoreUser;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  },

  /**
   * Récupérer tous les utilisateurs d'un rôle spécifique
   */
  async findByRole(role: UserRole): Promise<FirestoreUser[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUser));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  },

  /**
   * Créer un nouvel utilisateur
   */
  async create(user: Omit<FirestoreUser, 'id' | 'createdAt'>): Promise<FirestoreUser> {
    const userData = {
      ...user,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'users'), userData);
    return { id: docRef.id, ...userData } as FirestoreUser;
  },

  /**
   * Mettre à jour un utilisateur
   */
  async update(userId: string, updates: Partial<FirestoreUser>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
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
  async findById(classId: string): Promise<FirestoreClass | null> {
    try {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (!classDoc.exists()) return null;
      return { id: classDoc.id, ...classDoc.data() } as FirestoreClass;
    } catch (error) {
      console.error('Error fetching class:', error);
      return null;
    }
  },

  /**
   * Récupérer toutes les classes d'un enseignant
   */
  async findByTeacher(teacherId: string): Promise<FirestoreClass[]> {
    try {
      const q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreClass));
    } catch (error) {
      console.error('Error fetching classes by teacher:', error);
      return [];
    }
  },

  /**
   * Récupérer toutes les classes d'un étudiant
   */
  async findByStudent(studentId: string): Promise<FirestoreClass[]> {
    try {
      const q = query(collection(db, 'classes'), where('studentIds', 'array-contains', studentId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreClass));
    } catch (error) {
      console.error('Error fetching classes by student:', error);
      return [];
    }
  },

  /**
   * Créer une nouvelle classe
   */
  async create(classData: Omit<FirestoreClass, 'id' | 'createdAt'>): Promise<FirestoreClass> {
    const data = {
      ...classData,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'classes'), data);
    return { id: docRef.id, ...data } as FirestoreClass;
  },

  /**
   * Mettre à jour une classe
   */
  async update(classId: string, updates: Partial<FirestoreClass>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'classes', classId), updates);
      return true;
    } catch (error) {
      console.error('Error updating class:', error);
      return false;
    }
  },

  /**
   * Supprimer une classe
   */
  async delete(classId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'classes', classId));
      return true;
    } catch (error) {
      console.error('Error deleting class:', error);
      return false;
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
  async findById(taskId: string): Promise<FirestoreTask | null> {
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) return null;
      return { id: taskDoc.id, ...taskDoc.data() } as FirestoreTask;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  },

  /**
   * Récupérer toutes les tâches d'une classe
   */
  async findByClass(classId: string): Promise<FirestoreTask[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('classId', '==', classId),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreTask));
    } catch (error) {
      console.error('Error fetching tasks by class:', error);
      return [];
    }
  },

  /**
   * Récupérer toutes les tâches créées par un utilisateur
   */
  async findByAssigner(assignerId: string): Promise<FirestoreTask[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assignerId', '==', assignerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreTask));
    } catch (error) {
      console.error('Error fetching tasks by assigner:', error);
      return [];
    }
  },

  /**
   * Créer une nouvelle tâche
   */
  async create(taskData: Omit<FirestoreTask, 'id' | 'createdAt'>): Promise<FirestoreTask> {
    const data = {
      ...taskData,
      createdAt: Timestamp.now(),
      dueDate: taskData.dueDate instanceof Date ? Timestamp.fromDate(taskData.dueDate) : taskData.dueDate,
    };
    const docRef = await addDoc(collection(db, 'tasks'), data);
    return { id: docRef.id, ...data } as FirestoreTask;
  },

  /**
   * Mettre à jour une tâche
   */
  async update(taskId: string, updates: Partial<FirestoreTask>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'tasks', taskId), updates);
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  },

  /**
   * Supprimer une tâche
   */
  async delete(taskId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
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
  async findById(userTaskId: string): Promise<FirestoreUserTask | null> {
    try {
      const userTaskDoc = await getDoc(doc(db, 'userTasks', userTaskId));
      if (!userTaskDoc.exists()) return null;
      return { id: userTaskDoc.id, ...userTaskDoc.data() } as FirestoreUserTask;
    } catch (error) {
      console.error('Error fetching userTask:', error);
      return null;
    }
  },

  /**
   * Récupérer tous les userTasks d'un étudiant
   */
  async findByUser(userId: string): Promise<FirestoreUserTask[]> {
    try {
      const q = query(
        collection(db, 'userTasks'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUserTask));
    } catch (error) {
      console.error('Error fetching userTasks by user:', error);
      return [];
    }
  },

  /**
   * Récupérer tous les userTasks d'une tâche (pour voir tous les étudiants)
   */
  async findByTask(taskId: string): Promise<FirestoreUserTask[]> {
    try {
      const q = query(collection(db, 'userTasks'), where('taskId', '==', taskId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreUserTask));
    } catch (error) {
      console.error('Error fetching userTasks by task:', error);
      return [];
    }
  },

  /**
   * Récupérer un userTask spécifique (tâche + étudiant)
   */
  async findByTaskAndUser(taskId: string, userId: string): Promise<FirestoreUserTask | null> {
    try {
      const q = query(
        collection(db, 'userTasks'),
        where('taskId', '==', taskId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as FirestoreUserTask;
    } catch (error) {
      console.error('Error fetching userTask by task and user:', error);
      return null;
    }
  },

  /**
   * Créer un userTask (quand une tâche est assignée à un étudiant)
   */
  async create(userTaskData: Omit<FirestoreUserTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreUserTask> {
    const now = Timestamp.now();
    const data = {
      ...userTaskData,
      status: userTaskData.status || 'todo',
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(collection(db, 'userTasks'), data);
    return { id: docRef.id, ...data } as FirestoreUserTask;
  },

  /**
   * Mettre à jour un userTask (changement de statut, soumission, notation)
   */
  async update(userTaskId: string, updates: Partial<FirestoreUserTask>): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'userTasks', userTaskId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Error updating userTask:', error);
      return false;
    }
  },

  /**
   * Soumettre un devoir (mise à jour du statut et du lien de soumission)
   */
  async submitTask(userTaskId: string, submissionLink: string): Promise<boolean> {
    return this.update(userTaskId, {
      status: 'done',
      submissionLink,
    });
  },

  /**
   * Noter un devoir (mise à jour de la note et du commentaire)
   */
  async gradeTask(userTaskId: string, grade: number, teacherComment?: string): Promise<boolean> {
    return this.update(userTaskId, {
      grade,
      teacherComment,
    });
  },

  /**
   * Créer automatiquement des userTasks pour tous les étudiants d'une classe
   * (quand une nouvelle tâche est créée)
   */
  async createForClass(taskId: string, classId: string): Promise<boolean> {
    try {
      const classData = await classesService.findById(classId);
      if (!classData) return false;

      const promises = classData.studentIds.map(studentId =>
        this.create({
          taskId,
          userId: studentId,
          status: 'todo',
        })
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error creating userTasks for class:', error);
      return false;
    }
  },
};

