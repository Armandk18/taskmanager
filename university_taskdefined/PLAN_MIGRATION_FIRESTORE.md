# Plan de Migration vers l'Architecture Firestore (EduTask Manager)

## 📋 Vue d'ensemble

Ce document décrit la migration de l'application actuelle (base de données en mémoire) vers l'architecture Firestore proposée dans le plan HTML.

## 🔄 Différences Clés

### Architecture Actuelle vs Plan Firestore

| Aspect | Actuel | Plan Firestore |
|--------|--------|----------------|
| **Base de données** | En mémoire (tableaux JS) | Firestore (NoSQL) |
| **Collections** | users, tasks, announcements, events | users, classes, tasks, userTasks |
| **Partage de tâches** | `sharedWith` (array dans Task) | Collection séparée `userTasks` |
| **Classes** | ❌ N'existe pas | ✅ Collection dédiée |
| **Notation** | ❌ N'existe pas | ✅ Champ `grade` dans userTasks |
| **Soumission** | ❌ N'existe pas | ✅ Champ `submissionLink` dans userTasks |

## 🏗️ Nouvelle Structure de Données

### Collection: `users`
```typescript
interface User {
  id: string;                    // uid Firestore
  role: 'student' | 'teacher' | 'admin';
  name: string;
  email: string;
  classIds?: string[];           // Pour les enseignants (classes qu'ils enseignent)
  createdAt: Timestamp;
}
```

### Collection: `classes` (NOUVELLE)
```typescript
interface Class {
  id: string;
  name: string;                  // Ex: "Terminale B"
  teacherId: string;              // Référence vers users (enseignant)
  studentIds: string[];          // Array de références vers users (étudiants)
  createdAt: Timestamp;
}
```

### Collection: `tasks`
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  assignerId: string;            // Référence vers users (créateur)
  classId: string;                // Référence vers classes
  attachments?: string[];         // URLs des fichiers
  createdAt: Timestamp;
}
```

### Collection: `userTasks` (NOUVELLE - Table de jonction)
```typescript
interface UserTask {
  id: string;
  taskId: string;                // Référence vers tasks
  userId: string;                // Référence vers users (étudiant)
  status: 'todo' | 'doing' | 'done';
  submissionLink?: string;        // URL de soumission (Google Drive, etc.)
  grade?: number;                 // Note sur 20
  teacherComment?: string;         // Commentaire du professeur
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 📝 Étapes de Migration

### Phase 1 : Préparation
1. ✅ Installer Firebase SDK
2. ✅ Configurer Firestore
3. ✅ Créer les types TypeScript
4. ✅ Créer les règles de sécurité Firestore

### Phase 2 : Migration des Données
1. Créer les collections Firestore
2. Migrer les utilisateurs existants
3. Créer des classes de test
4. Migrer les tâches existantes vers le nouveau modèle

### Phase 3 : Refactoring du Code
1. Remplacer `db.ts` par des fonctions Firestore
2. Adapter les routes API
3. Mettre à jour les composants frontend
4. Implémenter le système de notation

### Phase 4 : Nouvelles Fonctionnalités
1. Gestion des classes
2. Système de soumission de devoirs
3. Système de notation
4. Rapports et statistiques

## 🔐 Règles de Sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isStudent() {
      return getUserRole() == 'student';
    }
    
    function isTeacher() {
      return getUserRole() == 'teacher';
    }
    
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    // Collection: users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }
    
    // Collection: classes
    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow create: if isTeacher() || isAdmin();
      allow update, delete: if isAdmin() || 
        (isTeacher() && resource.data.teacherId == request.auth.uid);
    }
    
    // Collection: tasks
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow create: if isTeacher() || isAdmin();
      allow update, delete: if isAdmin() || 
        (isTeacher() && resource.data.assignerId == request.auth.uid);
    }
    
    // Collection: userTasks
    match /userTasks/{userTaskId} {
      allow read: if isAuthenticated() && (
        isAdmin() || 
        isTeacher() || 
        resource.data.userId == request.auth.uid
      );
      allow create: if isAuthenticated();
      allow update: if isAdmin() || 
        (isStudent() && resource.data.userId == request.auth.uid) ||
        (isTeacher() && canGradeTask(resource.data.taskId));
    }
    
    function canGradeTask(taskId) {
      let task = get(/databases/$(database)/documents/tasks/$(taskId));
      let classDoc = get(/databases/$(database)/documents/classes/$(task.data.classId));
      return classDoc.data.teacherId == request.auth.uid;
    }
  }
}
```

## 🚀 Implémentation Progressive

### Option A : Migration Complète (Recommandée pour nouveau projet)
- Tout refactoriser d'un coup
- Meilleure cohérence
- Plus de temps de développement

### Option B : Migration Progressive (Recommandée pour projet existant)
1. **Étape 1** : Ajouter Firestore en parallèle de la DB actuelle
2. **Étape 2** : Migrer les nouvelles fonctionnalités vers Firestore
3. **Étape 3** : Migrer progressivement les fonctionnalités existantes
4. **Étape 4** : Supprimer l'ancienne DB en mémoire

## 📦 Dépendances Nécessaires

```json
{
  "dependencies": {
    "firebase": "^10.0.0",
    "@firebase/firestore": "^4.0.0"
  }
}
```

## 🎯 Avantages de la Migration

✅ **Temps réel** : Synchronisation automatique entre clients
✅ **Scalabilité** : Gère des milliers d'utilisateurs
✅ **Persistance** : Données sauvegardées dans le cloud
✅ **Sécurité** : Règles de sécurité au niveau de la base
✅ **Offline** : Support du mode hors ligne
✅ **Structure** : Meilleure séparation des responsabilités (userTasks)

## ⚠️ Points d'Attention

- **Coût** : Firestore a un modèle de facturation (gratuit jusqu'à certaines limites)
- **Courbe d'apprentissage** : Nouvelle API à apprendre
- **Migration des données** : Nécessite un script de migration
- **Tests** : Nécessite une configuration Firestore pour les tests

## 📚 Ressources

- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [SDK Firebase pour Web](https://firebase.google.com/docs/web/setup)

