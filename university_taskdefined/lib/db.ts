import { User, Task, Announcement, Event } from '@/types';

// Base de données en mémoire (pour la démo - en production, utiliser une vraie DB)
let users: User[] = [
  {
    id: '1',
    email: 'admin@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // "admin123" hashé
    name: 'Administrateur',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'student@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // "student123" hashé
    name: 'Étudiant Test',
    role: 'student',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'enseignant@university.edu',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // "enseignant123" hashé
    name: 'Enseignant Test',
    role: 'enseignant',
    createdAt: new Date().toISOString(),
  },
];

let tasks: Task[] = [];
let announcements: Announcement[] = [];
let events: Event[] = [];

export const db = {
  users: {
    findById: (id: string) => users.find(u => u.id === id),
    findByEmail: (email: string) => users.find(u => u.email === email),
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
  tasks: {
    findById: (id: string) => tasks.find(t => t.id === id),
    findByStudentId: (studentId: string) => tasks.filter(t => t.studentId === studentId),
    findBySharedWith: (userId: string) => tasks.filter(t => t.sharedWith?.includes(userId)),
    findByCreatedBy: (userId: string) => tasks.filter(t => t.createdById === userId),
    getAll: () => tasks,
    create: (task: Omit<Task, 'id' | 'createdAt'>) => {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      tasks.push(newTask);
      return newTask;
    },
    update: (id: string, updates: Partial<Task>) => {
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        return tasks[index];
      }
      return null;
    },
    delete: (id: string) => {
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.splice(index, 1);
        return true;
      }
      return false;
    },
  },
  announcements: {
    getAll: () => announcements.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    findById: (id: string) => announcements.find(a => a.id === id),
    create: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
      const newAnnouncement: Announcement = {
        ...announcement,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      announcements.push(newAnnouncement);
      return newAnnouncement;
    },
    update: (id: string, updates: Partial<Announcement>) => {
      const index = announcements.findIndex(a => a.id === id);
      if (index !== -1) {
        announcements[index] = { ...announcements[index], ...updates };
        return announcements[index];
      }
      return null;
    },
    delete: (id: string) => {
      const index = announcements.findIndex(a => a.id === id);
      if (index !== -1) {
        announcements.splice(index, 1);
        return true;
      }
      return false;
    },
  },
  events: {
    getAll: () => events.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    ),
    getPublic: () => events.filter(e => e.visibility === 'public'),
    getByUser: (userId: string) => events.filter(e => 
      e.visibility === 'public' || e.createdBy === userId
    ),
    getByDateRange: (start: string, end: string, userId?: string) => {
      const userEvents = userId 
        ? events.filter(e => e.visibility === 'public' || e.createdBy === userId)
        : events.filter(e => e.visibility === 'public');
      return userEvents.filter(e => {
        const eventStart = new Date(e.startDate);
        const eventEnd = new Date(e.endDate);
        const rangeStart = new Date(start);
        const rangeEnd = new Date(end);
        return eventStart <= rangeEnd && eventEnd >= rangeStart;
      });
    },
    create: (event: Omit<Event, 'id' | 'createdAt'>) => {
      const newEvent: Event = {
        ...event,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        color: event.color || '#3b82f6',
      };
      events.push(newEvent);
      return newEvent;
    },
    update: (id: string, updates: Partial<Event>) => {
      const index = events.findIndex(e => e.id === id);
      if (index !== -1) {
        events[index] = { ...events[index], ...updates };
        return events[index];
      }
      return null;
    },
    delete: (id: string) => {
      const index = events.findIndex(e => e.id === id);
      if (index !== -1) {
        events.splice(index, 1);
        return true;
      }
      return false;
    },
  },
};

