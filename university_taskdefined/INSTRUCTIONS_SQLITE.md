# Instructions d'Installation et Migration vers SQLite

## 🚀 Installation

### 1. Installer better-sqlite3

```bash
cd university_taskdefined
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

**Note pour Windows :** Si vous rencontrez des erreurs de compilation, vous devrez peut-être installer les outils de build :
- Installer [node-gyp](https://github.com/nodejs/node-gyp)
- Installer [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

### 2. Configuration

La base de données SQLite sera créée automatiquement dans le dossier `data/` à la racine du projet.

Vous pouvez personnaliser le chemin via une variable d'environnement :
```env
DATABASE_PATH=./data/university.db
```

## 📋 Structure de la Base de Données

### Tables créées automatiquement :

1. **users** - Utilisateurs du système
2. **classes** - Classes/groupes d'étudiants
3. **class_students** - Table de jonction (étudiants dans les classes)
4. **tasks** - Tâches/devoirs
5. **user_tasks** - Table de jonction (statut, soumission, notation)
6. **announcements** - Annonces
7. **events** - Événements du calendrier

## 🔄 Migration depuis la DB en mémoire

### Étape 1 : Initialiser la base de données

La base de données est initialisée automatiquement au premier import de `lib/sqlite.ts`.

### Étape 2 : Migrer les données existantes

Créer un script de migration (`scripts/migrate-to-sqlite.ts`) :

```typescript
import { db } from '../lib/sqlite';
import { usersService } from '../lib/sqlite-service';

// Migrer les utilisateurs existants
const existingUsers = [
  {
    email: 'admin@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO',
    name: 'Administrateur',
    role: 'admin' as const,
  },
  {
    email: 'student@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO',
    name: 'Étudiant Test',
    role: 'student' as const,
  },
  {
    email: 'enseignant@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO',
    name: 'Enseignant Test',
    role: 'enseignant' as const,
  },
];

for (const user of existingUsers) {
  usersService.create(user);
}
```

### Étape 3 : Adapter les Routes API

Remplacer les appels à `db` par les services SQLite :

**Avant** (DB en mémoire) :
```typescript
import { db } from '@/lib/db';
const tasks = db.tasks.findByStudentId(auth.id);
```

**Après** (SQLite) :
```typescript
import { userTasksService, tasksService } from '@/lib/sqlite-service';

// Pour un étudiant : récupérer ses userTasks
const userTasks = userTasksService.findByUser(auth.id);
const taskIds = userTasks.map(ut => ut.taskId);
const tasks = await Promise.all(taskIds.map(id => tasksService.findById(id)));
```

## 📝 Exemple d'Utilisation

### Créer une classe

```typescript
import { classesService } from '@/lib/sqlite-service';

const classe = classesService.create({
  name: 'Terminale B',
  teacherId: 'teacher-id',
  studentIds: ['student1-id', 'student2-id'],
});
```

### Créer une tâche pour une classe

```typescript
import { tasksService, userTasksService } from '@/lib/sqlite-service';

// 1. Créer la tâche
const task = tasksService.create({
  title: 'Dissertation de Philosophie',
  description: 'Sujet sur la liberté',
  dueDate: new Date('2024-11-15'),
  assignerId: 'teacher-id',
  classId: 'class-id',
});

// 2. Créer automatiquement les userTasks pour tous les étudiants
userTasksService.createForClass(task.id, task.classId!);
```

### Soumettre un devoir (étudiant)

```typescript
import { userTasksService } from '@/lib/sqlite-service';

// Trouver le userTask
const userTask = userTasksService.findByTaskAndUser(taskId, userId);

// Soumettre
if (userTask) {
  userTasksService.submitTask(userTask.id, 'https://drive.google.com/...');
}
```

### Noter un devoir (enseignant)

```typescript
import { userTasksService } from '@/lib/sqlite-service';

userTasksService.gradeTask(userTaskId, 15, 'Bon travail !');
```

## 🔐 Sécurité

SQLite est un fichier local. Pour la sécurité :

1. **Backup régulier** : Sauvegarder le fichier `.db` régulièrement
2. **Permissions** : Restreindre l'accès au fichier de base de données
3. **Validation** : Les contraintes CHECK dans SQLite valident les données

## ⚠️ Points d'Attention

1. **Concurrence** : SQLite gère bien la concurrence en lecture, mais peut avoir des limitations en écriture simultanée
2. **Performance** : Pour de très grandes quantités de données, considérer PostgreSQL ou MySQL
3. **Backup** : Le fichier `.db` doit être sauvegardé régulièrement
4. **Migration** : Les données sont persistantes (contrairement à la DB en mémoire)

## 🧪 Tests

Pour les tests, vous pouvez utiliser une base de données en mémoire :

```typescript
import Database from 'better-sqlite3';
const testDb = new Database(':memory:');
```

## 📚 Avantages de SQLite

✅ **Simple** : Pas besoin de serveur de base de données
✅ **Léger** : Fichier unique, facile à déplacer
✅ **Performant** : Très rapide pour les applications moyennes
✅ **SQL standard** : Utilise SQL standard
✅ **Persistant** : Les données sont sauvegardées
✅ **Transactions** : Support des transactions ACID

## 🔄 Comparaison avec Firestore

| Aspect | SQLite | Firestore |
|--------|--------|-----------|
| **Type** | SQL relationnel | NoSQL |
| **Déploiement** | Fichier local | Cloud |
| **Temps réel** | ❌ | ✅ |
| **Coût** | Gratuit | Payant après limites |
| **Complexité** | Simple | Modérée |
| **Scalabilité** | Moyenne | Très élevée |

Pour votre cas d'usage (application éducative), SQLite est un excellent choix !

