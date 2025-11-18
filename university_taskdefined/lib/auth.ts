import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = db.users.findByEmail(email);
  if (!user) return null;

  // Pour la démo, on accepte les mots de passe simples
  // En production, utiliser verifyPassword
  const isValid = password === 'admin123' || password === 'student123' || 
                  await verifyPassword(password, user.password);
  
  return isValid ? user : null;
}

