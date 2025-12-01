// EXEMPLE D'IMPLÉMENTATION : Approche Hybride
// Ce fichier montre comment migrer vers une architecture avec User + entités spécifiques

// ============================================
// 1. TYPES
// ============================================

export type UserType = 'student' | 'enseignant' | 'admin';

// Table commune pour l'authentification
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  type: UserType;
  createdAt: string;
}

// Tables spécifiques (optionnelles - seulement si besoin de champs spécifiques)
export interface StudentProfile {
  userId: string;  // Foreign key vers User.id
  matricule: string;
  niveau: string;   // L1, L2, L3, M1, M2
  filiere?: string;
}

export interface EnseignantProfile {
  userId: string;  // Foreign key vers User.id
  departement: string;
  specialite?: string;
  statut: 'titulaire' | 'vacataire' | 'contractuel';
}

export interface AdminProfile {
  userId: string;  // Foreign key vers User.id
  niveauAcces: 'super' | 'standard';
  derniereConnexion?: string;
}

// ============================================
// 2. BASE DE DONNÉES
// ============================================

let users: User[] = [
  {
    id: '1',
    email: 'admin@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO',
    name: 'Administrateur',
    type: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'student@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO',
    name: 'Étudiant Test',
    type: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'enseignant@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO',
    name: 'Enseignant Test',
    type: 'enseignant',
    createdAt: new Date().toISOString(),
  },
];

// Tables de profils spécifiques (optionnelles)
let studentProfiles: StudentProfile[] = [
  {
    userId: '2',
    matricule: 'STU2024001',
    niveau: 'L3',
    filiere: 'Informatique',
  },
];

let enseignantProfiles: EnseignantProfile[] = [
  {
    userId: '3',
    departement: 'Informatique',
    specialite: 'Développement Web',
    statut: 'titulaire',
  },
];

let adminProfiles: AdminProfile[] = [
  {
    userId: '1',
    niveauAcces: 'super',
  },
];

export const db = {
  // Table principale User (authentification)
  users: {
    findById: (id: string) => users.find(u => u.id === id),
    findByEmail: (email: string) => users.find(u => u.email === email),
    findByType: (type: UserType) => users.filter(u => u.type === type),
    create: (user: Omit<User, 'id' | 'createdAt'>) => {
      const newUser: User = {
        ...user,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      return newUser;
    },
    getAll: () => users,
  },

  // Profils spécifiques (optionnels)
  students: {
    findByUserId: (userId: string) => studentProfiles.find(sp => sp.userId === userId),
    findByMatricule: (matricule: string) => studentProfiles.find(sp => sp.matricule === matricule),
    create: (profile: StudentProfile) => {
      studentProfiles.push(profile);
      return profile;
    },
  },

  enseignants: {
    findByUserId: (userId: string) => enseignantProfiles.find(ep => ep.userId === userId),
    findByDepartement: (departement: string) => 
      enseignantProfiles.filter(ep => ep.departement === departement),
    create: (profile: EnseignantProfile) => {
      enseignantProfiles.push(profile);
      return profile;
    },
  },

  admins: {
    findByUserId: (userId: string) => adminProfiles.find(ap => ap.userId === userId),
    create: (profile: AdminProfile) => {
      adminProfiles.push(profile);
      return profile;
    },
  },

  // Fonction helper pour obtenir un utilisateur complet avec son profil
  getUserWithProfile: (userId: string) => {
    const user = db.users.findById(userId);
    if (!user) return null;

    switch (user.type) {
      case 'student':
        return {
          ...user,
          profile: db.students.findByUserId(userId),
        };
      case 'enseignant':
        return {
          ...user,
          profile: db.enseignants.findByUserId(userId),
        };
      case 'admin':
        return {
          ...user,
          profile: db.admins.findByUserId(userId),
        };
    }
  },
};

// ============================================
// 3. AUTHENTIFICATION (identique à l'actuel)
// ============================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = db.users.findByEmail(email);
  if (!user) return null;

  // Pour la démo
  const isValid = password === 'admin123' || 
                  password === 'student123' || 
                  password === 'enseignant123' || 
                  await bcrypt.compare(password, user.password);
  
  return isValid ? user : null;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, type: user.type },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; type: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; type: string };
  } catch {
    return null;
  }
}

// ============================================
// 4. MIDDLEWARE (légèrement modifié)
// ============================================

import { NextRequest } from 'next/server';

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('auth-token')?.value || null;
}

export function requireAuth(request: NextRequest): { id: string; email: string; type: string } | null {
  const token = getAuthToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireType(request: NextRequest, allowedTypes: UserType[]): { id: string; email: string; type: string } | null {
  const auth = requireAuth(request);
  if (!auth || !allowedTypes.includes(auth.type as UserType)) {
    return null;
  }
  return auth;
}

// ============================================
// 5. EXEMPLE D'UTILISATION DANS UNE ROUTE API
// ============================================

/*
// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireType } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireType(request, ['admin', 'enseignant']);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Accès refusé' },
      { status: 403 }
    );
  }

  // Récupérer tous les étudiants avec leurs profils
  const students = db.users.findByType('student').map(user => {
    const profile = db.students.findByUserId(user.id);
    return {
      ...user,
      matricule: profile?.matricule,
      niveau: profile?.niveau,
      filiere: profile?.filiere,
    };
  });

  return NextResponse.json({ success: true, students });
}
*/

// ============================================
// 6. AVANTAGES DE CETTE APPROCHE
// ============================================

/*
✅ Authentification unifiée : Un seul système de login
✅ Champs spécifiques : Chaque type peut avoir ses propres données
✅ Performance : Requêtes d'auth simples (une seule table User)
✅ Flexibilité : Facile d'ajouter de nouveaux champs spécifiques
✅ Relations : Les tâches référencent toujours User.id
✅ Évolutivité : Facile d'ajouter de nouveaux types d'utilisateurs
*/

// ============================================
// 7. MIGRATION DEPUIS L'APPROCHE ACTUELLE
// ============================================

/*
Étapes de migration :

1. Créer les nouvelles interfaces (User + Profiles)
2. Migrer les données existantes :
   - users existants → table User (ajouter champ 'type')
   - Créer les profils spécifiques si nécessaire
3. Modifier l'authentification :
   - Remplacer 'role' par 'type' dans les tokens
4. Mettre à jour les routes API :
   - Remplacer requireRole() par requireType()
   - Adapter les vérifications de rôle
5. Mettre à jour les pages frontend :
   - Remplacer user.role par user.type
*/

