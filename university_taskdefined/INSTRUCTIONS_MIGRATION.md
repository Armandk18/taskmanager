# Instructions de Migration vers Firestore

## 🚀 Installation

### 1. Installer Firebase

```bash
cd university_taskdefined
npm install firebase
```

### 2. Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer Firestore Database
3. Copier les identifiants de configuration
4. Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Configurer les Règles de Sécurité Firestore

Dans Firebase Console → Firestore Database → Rules, coller les règles de sécurité (voir `PLAN_MIGRATION_FIRESTORE.md`)

## 📋 Étapes de Migration

### Étape 1 : Créer les Collections

Les collections seront créées automatiquement lors de la première écriture. Vous pouvez aussi les créer manuellement dans Firebase Console.

### Étape 2 : Migrer les Données Existantes

Créer un script de migration (`scripts/migrate-to-firestore.ts`) :

```typescript
// Script de migration des données existantes vers Firestore
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

async function migrateUsers() {
  const existingUsers = [
    {
      email: 'admin@university.edu',
      name: 'Administrateur',
      role: 'admin',
    },
    {
      email: 'student@university.edu',
      name: 'Étudiant Test',
      role: 'student',
    },
    {
      email: 'enseignant@university.edu',
      name: 'Enseignant Test',
      role: 'teacher', // Note: 'teacher' au lieu de 'enseignant'
    },
  ];

  for (const user of existingUsers) {
    await addDoc(collection(db, 'users'), {
      ...user,
      createdAt: new Date(),
    });
  }
}

// Exécuter la migration
migrateUsers();
```

### Étape 3 : Adapter les Routes API

Remplacer les appels à `db` par les services Firestore :

**Avant** (DB en mémoire) :
```typescript
const tasks = db.tasks.findByStudentId(auth.id);
```

**Après** (Firestore) :
```typescript
import { userTasksService, tasksService } from '@/lib/firestore-service';

// Pour un étudiant : récupérer ses userTasks
const userTasks = await userTasksService.findByUser(auth.id);
const taskIds = userTasks.map(ut => ut.taskId);
const tasks = await Promise.all(taskIds.map(id => tasksService.findById(id)));
```

### Étape 4 : Mettre à Jour les Types

Les nouveaux types sont dans `types/firestore.ts`. Adapter les composants pour utiliser ces types.

## 🔄 Mapping des Fonctionnalités

### Création de Tâche

**Avant** :
```typescript
const task = db.tasks.create({
  title: '...',
  studentId: '...',
  // ...
});
```

**Après** :
```typescript
// 1. Créer la tâche
const task = await tasksService.create({
  title: '...',
  classId: '...',
  assignerId: auth.id,
  // ...
});

// 2. Créer les userTasks pour tous les étudiants de la classe
await userTasksService.createForClass(task.id, task.classId);
```

### Partage de Tâches

**Avant** : Utilisait `sharedWith` array dans Task

**Après** : Créer des `userTasks` pour les étudiants spécifiques

### Notation

**Nouveau** :
```typescript
await userTasksService.gradeTask(userTaskId, 15, 'Bon travail !');
```

## ⚠️ Points d'Attention

1. **Changement de rôle** : `'enseignant'` devient `'teacher'` dans Firestore
2. **Timestamps** : Utiliser `Timestamp` de Firestore au lieu de strings ISO
3. **Requêtes** : Firestore nécessite des index pour certaines requêtes complexes
4. **Mode hors ligne** : Firestore supporte le cache offline automatiquement

## 🧪 Tests

Créer un environnement de test Firestore ou utiliser l'émulateur Firebase :

```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

## 📚 Documentation

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase SDK for Web](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

