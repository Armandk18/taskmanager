# Implémentation SQLite pour EduTask Manager

## 📦 Fichiers Créés

1. **`lib/sqlite.ts`** - Configuration et initialisation de la base de données SQLite
2. **`lib/sqlite-service.ts`** - Services pour interagir avec SQLite (users, classes, tasks, userTasks)
3. **`app/api/tasks-sqlite-example/route.ts`** - Exemple de route API utilisant SQLite
4. **`INSTRUCTIONS_SQLITE.md`** - Guide complet d'installation et migration

## 🚀 Installation Rapide

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

La base de données sera créée automatiquement dans `data/university.db` au premier lancement.

## 📊 Structure de la Base de Données

### Tables Principales

- **users** - Utilisateurs (student, admin, enseignant)
- **classes** - Classes/groupes d'étudiants
- **class_students** - Table de jonction (étudiants dans les classes)
- **tasks** - Tâches/devoirs
- **user_tasks** - Table de jonction (statut, soumission, notation)
- **announcements** - Annonces
- **events** - Événements du calendrier

## 🔄 Migration depuis la DB en mémoire

### Avant (DB en mémoire)
```typescript
import { db } from '@/lib/db';
const tasks = db.tasks.findByStudentId(auth.id);
```

### Après (SQLite)
```typescript
import { userTasksService, tasksService } from '@/lib/sqlite-service';
const userTasks = userTasksService.findByUser(auth.id);
const tasks = userTasks.map(ut => tasksService.findById(ut.taskId));
```

## ✨ Avantages de SQLite

✅ **Simple** - Pas besoin de serveur de base de données
✅ **Léger** - Fichier unique, facile à déplacer
✅ **Performant** - Très rapide pour les applications moyennes
✅ **SQL standard** - Utilise SQL standard
✅ **Persistant** - Les données sont sauvegardées
✅ **Transactions** - Support des transactions ACID

## 📝 Exemples d'Utilisation

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
const task = tasksService.create({
  title: 'Dissertation',
  description: 'Sujet sur la liberté',
  dueDate: new Date('2024-11-15'),
  assignerId: 'teacher-id',
  classId: 'class-id',
});

// Créer automatiquement les userTasks pour tous les étudiants
userTasksService.createForClass(task.id, task.classId!);
```

### Soumettre un devoir
```typescript
userTasksService.submitTask(userTaskId, 'https://drive.google.com/...');
```

### Noter un devoir
```typescript
userTasksService.gradeTask(userTaskId, 15, 'Bon travail !');
```

## 🔐 Sécurité

- Les contraintes CHECK dans SQLite valident les données
- Les clés étrangères assurent l'intégrité référentielle
- Backup régulier recommandé du fichier `.db`

## 📚 Documentation Complète

Voir `INSTRUCTIONS_SQLITE.md` pour :
- Guide d'installation détaillé
- Scripts de migration
- Exemples complets
- Dépannage

