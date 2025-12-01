// Configuration et connexion SQLite
// À installer : npm install better-sqlite3
// Types : npm install --save-dev @types/better-sqlite3

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Chemin vers la base de données SQLite
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'university.db');

// Créer le dossier data s'il n'existe pas
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Créer la connexion à la base de données
let db: Database.Database;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Mode Write-Ahead Logging pour de meilleures performances
  console.log('✅ Connexion SQLite établie:', dbPath);
} catch (error) {
  console.error('❌ Erreur de connexion SQLite:', error);
  throw error;
}

// Initialiser les tables si elles n'existent pas
export function initializeDatabase() {
  // Table: users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'admin', 'enseignant')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Table: classes (nouvelle - selon le plan)
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      teacherId TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (teacherId) REFERENCES users(id)
    )
  `);

  // Table: class_students (table de jonction pour les étudiants d'une classe)
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_students (
      classId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      PRIMARY KEY (classId, studentId),
      FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Table: tasks
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      assignerId TEXT NOT NULL,
      classId TEXT,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assignerId) REFERENCES users(id),
      FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE SET NULL
    )
  `);

  // Table: user_tasks (table de jonction - statut, soumission, notation)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_tasks (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      userId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'doing', 'done')),
      submissionLink TEXT,
      grade REAL CHECK(grade >= 0 AND grade <= 20),
      teacherComment TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(taskId, userId)
    )
  `);

  // Table: announcements
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      authorId TEXT NOT NULL,
      authorName TEXT NOT NULL,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (authorId) REFERENCES users(id)
    )
  `);

  // Table: events
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      createdBy TEXT NOT NULL,
      createdByName TEXT NOT NULL,
      visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
      color TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Créer les index pour améliorer les performances
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_classId ON tasks(classId);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignerId ON tasks(assignerId);
    CREATE INDEX IF NOT EXISTS idx_user_tasks_userId ON user_tasks(userId);
    CREATE INDEX IF NOT EXISTS idx_user_tasks_taskId ON user_tasks(taskId);
    CREATE INDEX IF NOT EXISTS idx_class_students_classId ON class_students(classId);
    CREATE INDEX IF NOT EXISTS idx_class_students_studentId ON class_students(studentId);
  `);

  console.log('✅ Tables SQLite initialisées');
}

// Initialiser la base de données au chargement du module
initializeDatabase();

// Fonction pour fermer la connexion (utile pour les tests)
export function closeDatabase() {
  if (db) {
    db.close();
  }
}

export { db };

