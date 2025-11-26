'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Announcement, User, Event } from '@/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import Modal from '@/components/Modal';
import Calendar from '@/components/Calendar';
import EventModal from '@/components/EventModal';

export default function EnseignantPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar'>('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    studentId: '',
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.success || data.user.role !== 'enseignant') {
      router.push('/login');
    } else {
      setUser(data.user);
    }
  };

  const loadData = async () => {
    try {
      const [tasksRes, announcementsRes, usersRes, eventsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/announcements'),
        fetch('/api/users'),
        fetch('/api/events'),
      ]);

      const tasksData = await tasksRes.json();
      const announcementsData = await announcementsRes.json();
      const usersData = await usersRes.json();
      const eventsData = await eventsRes.json();

      if (tasksData.success) setTasks(tasksData.tasks);
      if (announcementsData.success) setAnnouncements(announcementsData.announcements);
      if (usersData.success) setUsers(usersData.users.filter((u: User) => u.role === 'student'));
      if (eventsData.success) setEvents(eventsData.events);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          studentId: taskForm.studentId || user.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTasks([...tasks, data.task]);
        setShowTaskModal(false);
        setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', studentId: '' });
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error);
      alert('Erreur lors de la création de la tâche');
    }
  };

  const handleShareTask = async () => {
    if (!selectedTask || selectedStudents.length === 0) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudents }),
      });

      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map(t => t.id === selectedTask.id ? data.task : t));
        setShowShareModal(false);
        setSelectedTask(null);
        setSelectedStudents([]);
        loadData();
        alert('Tâche partagée avec succès !');
      } else {
        alert(data.message || 'Erreur lors du partage de la tâche');
      }
    } catch (error) {
      console.error('Erreur lors du partage de la tâche:', error);
      alert('Erreur lors du partage de la tâche');
    }
  };

  const handleRemoveShare = async (taskId: string, studentId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map(t => t.id === taskId ? data.task : t));
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du partage:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.filter(t => t.id !== taskId));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la tâche:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map(t => t.id === taskId ? data.task : t));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
    }
  };

  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();
      if (data.success) {
        setEvents([...events, data.event]);
        setShowEventModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents(events.filter(e => e.id !== eventId));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStudentName = (studentId: string) => {
    const student = users.find(u => u.id === studentId);
    return student?.name || 'Étudiant inconnu';
  };

  const openShareModal = (task: Task) => {
    setSelectedTask(task);
    setSelectedStudents(task.sharedWith || []);
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Tableau de bord Enseignant
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300">{user?.name}</span>
              <Button variant="secondary" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Annonces */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Annonces de l'administration
          </h2>
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucune annonce pour le moment.</p>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{announcement.content}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Par {announcement.authorName} • {new Date(announcement.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Onglets */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Mes tâches
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              📅 Agenda
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'tasks' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes tâches créées</h2>
              <Button onClick={() => setShowTaskModal(true)}>+ Nouvelle tâche</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 col-span-full">
                  Aucune tâche pour le moment.
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg font-semibold ${task.completed ? 'line-through' : ''} text-gray-900 dark:text-gray-100`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      Étudiant: {getStudentName(task.studentId)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                    
                    {/* Affichage des étudiants avec qui la tâche est partagée */}
                    {task.sharedWith && task.sharedWith.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Partagée avec:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {task.sharedWith.map((studentId) => (
                            <span
                              key={studentId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs"
                            >
                              {getStudentName(studentId)}
                              <button
                                onClick={() => handleRemoveShare(task.id, studentId)}
                                className="hover:text-red-600 dark:hover:text-red-400"
                                title="Retirer le partage"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="secondary"
                        onClick={() => openShareModal(task)}
                        className="flex-1 min-w-[120px]"
                      >
                        📤 Partager
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleUpdateTask(task.id, { completed: !task.completed })}
                        className="flex-1 min-w-[120px]"
                      >
                        {task.completed ? 'Réactiver' : 'Terminer'}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'calendar' && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda</h2>
              <Button onClick={() => {
                setSelectedDate(null);
                setShowEventModal(true);
              }}>
                + Nouvel événement
              </Button>
            </div>

            <Calendar
              events={events}
              onDateClick={(date) => {
                setSelectedDate(date);
                setShowEventModal(true);
              }}
              onEventClick={(event) => {
                if (confirm(`Supprimer l'événement "${event.title}" ?`)) {
                  handleDeleteEvent(event.id);
                }
              }}
            />

            {/* Liste des événements à venir */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Événements à venir</h3>
              <div className="space-y-3">
                {events
                  .filter(e => new Date(e.startDate) >= new Date())
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .slice(0, 10)
                  .map(event => (
                    <div
                      key={event.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 flex justify-between items-center"
                      style={{ borderLeftColor: event.color || '#3b82f6' }}
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(event.startDate).toLocaleDateString('fr-FR')}
                          {event.startTime && ` à ${event.startTime}`}
                          {event.visibility === 'public' && ' • 🌐 Public'}
                          {event.visibility === 'private' && ' • 🔒 Privé'}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                {events.filter(e => new Date(e.startDate) >= new Date()).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400">Aucun événement à venir.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal de création de tâche */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Nouvelle tâche"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Étudiant (optionnel)
            </label>
            <select
              value={taskForm.studentId}
              onChange={(e) => setTaskForm({ ...taskForm, studentId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Aucun étudiant spécifique</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Titre"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            required
            rows={4}
          />
          <Input
            label="Date d'échéance"
            type="date"
            value={taskForm.dueDate}
            onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Priorité
            </label>
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowTaskModal(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de partage de tâche */}
      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setSelectedTask(null);
          setSelectedStudents([]);
        }}
        title={`Partager la tâche: ${selectedTask?.title}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sélectionnez les étudiants avec qui vous souhaitez partager cette tâche.
          </p>
          
          <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
            {users.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun étudiant disponible.</p>
            ) : (
              users.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {student.name} ({student.email})
                  </span>
                </label>
              ))
            )}
          </div>

          {selectedTask?.sharedWith && selectedTask.sharedWith.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Actuellement partagée avec:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTask.sharedWith.map((studentId) => {
                  const student = users.find(u => u.id === studentId);
                  return (
                    <span
                      key={studentId}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs"
                    >
                      {student?.name || 'Étudiant inconnu'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowShareModal(false);
                setSelectedTask(null);
                setSelectedStudents([]);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleShareTask}
              disabled={selectedStudents.length === 0}
            >
              Partager avec {selectedStudents.length} étudiant{selectedStudents.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de création d'événement */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedDate(null);
        }}
        onSubmit={handleCreateEvent}
        initialDate={selectedDate || undefined}
        isAdmin={false}
      />
    </div>
  );
}

