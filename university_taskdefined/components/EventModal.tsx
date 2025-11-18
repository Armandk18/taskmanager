'use client';

import { useState } from 'react';
import { Event } from '@/types';
import Modal from './Modal';
import Input from './Input';
import Textarea from './Textarea';
import Button from './Button';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'createdByName'>) => void;
  initialDate?: Date;
  isAdmin?: boolean;
}

export default function EventModal({ isOpen, onClose, onSubmit, initialDate, isAdmin = false }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
    endDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
    startTime: '',
    endTime: '',
    visibility: isAdmin ? 'public' as 'public' | 'private' : 'private' as 'public' | 'private',
    color: '#3b82f6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      visibility: isAdmin ? 'public' : 'private',
      color: '#3b82f6',
    });
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      startDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
      endDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
      startTime: '',
      endTime: '',
      visibility: isAdmin ? 'public' : 'private',
      color: '#3b82f6',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouvel événement">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Ex: Examen de mathématiques"
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Détails de l'événement..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date de début"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="Date de fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Heure de début (optionnel)"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
          <Input
            label="Heure de fin (optionnel)"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>

        {isAdmin && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Visibilité
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' })}
              className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="public">🌐 Public (visible par tous les étudiants)</option>
              <option value="private">🔒 Privé (visible uniquement par moi)</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Couleur
          </label>
          <div className="flex gap-2">
            {[
              { name: 'Bleu', value: '#3b82f6' },
              { name: 'Vert', value: '#10b981' },
              { name: 'Rouge', value: '#ef4444' },
              { name: 'Jaune', value: '#f59e0b' },
              { name: 'Violet', value: '#8b5cf6' },
              { name: 'Rose', value: '#ec4899' },
            ].map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  formData.color === color.value ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit">Créer l'événement</Button>
        </div>
      </form>
    </Modal>
  );
}

