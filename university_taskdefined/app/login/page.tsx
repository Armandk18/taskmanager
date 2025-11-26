'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.user.role === 'admin') {
            router.push('/admin');
          } else if (data.user.role === 'enseignant') {
            router.push('/enseignant');
          } else {
            router.push('/dashboard');
          }
        }
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else if (data.user.role === 'enseignant') {
          router.push('/enseignant');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Connexion
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="votre.email@university.edu"
          />
          
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>Comptes de démonstration :</strong>
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Admin: admin@university.edu / admin123
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Étudiant: student@university.edu / student123
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Enseignant: enseignant@university.edu / enseignant123
          </p>
        </div>
      </div>
    </div>
  );
}

