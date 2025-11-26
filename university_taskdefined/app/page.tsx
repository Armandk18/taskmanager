'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function Home() {
  const router = useRouter();

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
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Gestionnaire de tâches pour étudiants
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Redirection en cours...
        </p>
        <Button onClick={() => router.push('/login')}>
          Aller à la page de connexion
        </Button>
      </div>
    </div>
  );
}
