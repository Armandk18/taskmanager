export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  studentId: string;
  createdBy: 'student' | 'admin';
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  createdBy: string; // ID de l'utilisateur
  createdByName: string;
  visibility: 'public' | 'private'; // public = visible par tous, private = visible uniquement par le créateur
  color?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  token?: string;
  message?: string;
}

