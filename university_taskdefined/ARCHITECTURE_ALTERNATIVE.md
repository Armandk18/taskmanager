# Architecture Alternative : 3 Entités Séparées

## Option 1 : Entités Complètement Séparées

### Structure proposée

```typescript
// types/index.ts

// Entité de base commune
interface BaseUser {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

// Entités spécifiques
interface Student extends BaseUser {
  type: 'student';
  matricule: string;
  niveau: string; // L1, L2, L3, M1, M2
  filiere?: string;
}

interface Enseignant extends BaseUser {
  type: 'enseignant';
  departement: string;
  specialite?: string;
  statut: 'titulaire' | 'vacataire' | 'contractuel';
}

interface Admin extends BaseUser {
  type: 'admin';
  niveauAcces: 'super' | 'standard';
  derniereConnexion?: string;
}

// Union type pour l'authentification
type User = Student | Enseignant | Admin;
```

### Base de données séparée

```typescript
// lib/db.ts

let students: Student[] = [];
let enseignants: Enseignant[] = [];
let admins: Admin[] = [];

export const db = {
  students: {
    findById: (id: string) => students.find(s => s.id === id),
    findByEmail: (email: string) => students.find(s => s.email === email),
    findByMatricule: (matricule: string) => students.find(s => s.matricule === matricule),
    create: (student: Omit<Student, 'id' | 'createdAt'>) => { /* ... */ },
    getAll: () => students,
  },
  
  enseignants: {
    findById: (id: string) => enseignants.find(e => e.id === id),
    findByEmail: (email: string) => enseignants.find(e => e.email === email),
    findByDepartement: (departement: string) => enseignants.filter(e => e.departement === departement),
    create: (enseignant: Omit<Enseignant, 'id' | 'createdAt'>) => { /* ... */ },
    getAll: () => enseignants,
  },
  
  admins: {
    findById: (id: string) => admins.find(a => a.id === id),
    findByEmail: (email: string) => admins.find(a => a.email === email),
    create: (admin: Omit<Admin, 'id' | 'createdAt'>) => { /* ... */ },
    getAll: () => admins,
  },
  
  // Fonction unifiée pour l'authentification
  findUserByEmail: (email: string): User | null => {
    return db.students.findByEmail(email) || 
           db.enseignants.findByEmail(email) || 
           db.admins.findByEmail(email) || null;
  },
  
  findUserById: (id: string): User | null => {
    return db.students.findById(id) || 
           db.enseignants.findById(id) || 
           db.admins.findById(id) || null;
  },
};
```

### Authentification modifiée

```typescript
// lib/auth.ts

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Chercher dans les 3 entités
  const user = db.findUserByEmail(email);
  if (!user) return null;

  // Vérification du mot de passe (identique pour tous)
  const isValid = password === 'admin123' || 
                  password === 'student123' || 
                  password === 'enseignant123' || 
                  await verifyPassword(password, user.password);
  
  return isValid ? user : null;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      type: user.type  // 'student' | 'enseignant' | 'admin'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

### Middleware adapté

```typescript
// lib/middleware.ts

export function requireAuth(request: NextRequest): { id: string; email: string; type: string } | null {
  const token = getAuthToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireType(request: NextRequest, allowedTypes: string[]): { id: string; email: string; type: string } | null {
  const auth = requireAuth(request);
  if (!auth || !allowedTypes.includes(auth.type)) {
    return null;
  }
  return auth;
}
```

### Routes API modifiées

```typescript
// app/api/tasks/route.ts

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
  }

  if (auth.type === 'admin') {
    const tasks = db.tasks.getAll();
    return NextResponse.json({ success: true, tasks });
  } else if (auth.type === 'enseignant') {
    const createdTasks = db.tasks.findByCreatedBy(auth.id);
    return NextResponse.json({ success: true, tasks: createdTasks });
  } else if (auth.type === 'student') {
    const ownTasks = db.tasks.findByStudentId(auth.id);
    const sharedTasks = db.tasks.findBySharedWith(auth.id);
    const allTasks = [...ownTasks, ...sharedTasks.filter(t => !ownTasks.find(ot => ot.id === t.id))];
    return NextResponse.json({ success: true, tasks: allTasks });
  }
}
```

---

## Option 2 : Approche Hybride (RECOMMANDÉE)

### Structure avec table commune + tables spécifiques

```typescript
// Table commune pour l'authentification
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  type: 'student' | 'enseignant' | 'admin';
  createdAt: string;
}

// Tables spécifiques avec relation
interface Student {
  userId: string;  // Foreign key vers User
  matricule: string;
  niveau: string;
  filiere?: string;
}

interface Enseignant {
  userId: string;  // Foreign key vers User
  departement: string;
  specialite?: string;
  statut: 'titulaire' | 'vacataire' | 'contractuel';
}

interface Admin {
  userId: string;  // Foreign key vers User
  niveauAcces: 'super' | 'standard';
  derniereConnexion?: string;
}
```

### Avantages de l'approche hybride

✅ **Authentification unifiée** : Un seul système de login pour tous
✅ **Flexibilité** : Champs spécifiques par type d'utilisateur
✅ **Performance** : Requêtes d'auth simplifiées
✅ **Évolutivité** : Facile d'ajouter de nouveaux champs spécifiques
✅ **Relations** : Les tâches peuvent référencer User.id directement

---

## Comparaison des approches

| Critère | Entités Séparées | Approche Hybride | Actuel (Role) |
|---------|------------------|------------------|---------------|
| **Simplicité** | ❌ Complexe | ✅ Modéré | ✅ Simple |
| **Flexibilité** | ✅ Très flexible | ✅ Flexible | ⚠️ Limité |
| **Performance Auth** | ❌ 3 requêtes | ✅ 1 requête | ✅ 1 requête |
| **Champs spécifiques** | ✅ Oui | ✅ Oui | ❌ Non |
| **Maintenance** | ❌ 3x plus de code | ✅ Modéré | ✅ Simple |
| **Évolutivité** | ✅ Très bonne | ✅ Bonne | ⚠️ Moyenne |

---

## Recommandation

Pour votre cas d'usage actuel, **garder l'approche avec rôle** est optimal car :
- Les besoins sont simples (pas de champs spécifiques complexes)
- L'authentification est unifiée
- Le code est maintenable

**Passer à l'approche hybride** si vous avez besoin de :
- Champs spécifiques par type (matricule, département, etc.)
- Statistiques séparées par type
- Gestion différenciée importante

**Éviter les entités complètement séparées** sauf si :
- Les besoins sont très différents entre les types
- Vous avez une base de données relationnelle complexe
- Vous avez besoin de performances très spécifiques

