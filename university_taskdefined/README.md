# Gestionnaire de tâches pour étudiants

Application web de gestion de tâches développée avec Next.js, TypeScript et Tailwind CSS. Cette application permet aux étudiants de gérer leurs tâches et de recevoir des informations de l'administration.

## Fonctionnalités

### Pour les étudiants :
- ✅ Connexion sécurisée avec authentification
- ✅ Visualisation des annonces de l'administration
- ✅ Création et gestion de leurs propres tâches
- ✅ Marquage des tâches comme terminées
- ✅ Suppression de leurs tâches
- ✅ Système de priorités (basse, moyenne, haute)

### Pour l'administration :
- ✅ Dashboard administrateur
- ✅ Création de tâches pour les étudiants
- ✅ Création et gestion des annonces
- ✅ Visualisation de tous les étudiants et leurs tâches
- ✅ Gestion complète des tâches de tous les étudiants

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Lancer le serveur de développement :
```bash
npm run dev
```

3. L'application sera accessible sur :
   - **Local** : [http://localhost:8000](http://localhost:8000)
   - **Réseau local** : http://[VOTRE_IP_LOCALE]:8000
   
   Pour trouver votre adresse IP locale :
   - Windows : `ipconfig` (cherchez IPv4)
   - Mac/Linux : `ifconfig` ou `ip addr`

## Comptes de démonstration

### Administrateur
- **Email** : `admin@university.edu`
- **Mot de passe** : `admin123`

### Étudiant
- **Email** : `student@university.edu`
- **Mot de passe** : `student123`

## Structure du projet

```
university_taskdefined/
├── app/
│   ├── api/              # Routes API
│   │   ├── auth/         # Authentification
│   │   ├── tasks/        # Gestion des tâches
│   │   └── announcements/ # Gestion des annonces
│   ├── dashboard/        # Dashboard étudiant
│   ├── admin/            # Dashboard admin
│   └── login/            # Page de connexion
├── components/           # Composants réutilisables
├── lib/                 # Utilitaires (auth, db, middleware)
├── types/               # Types TypeScript
└── package.json
```

## Technologies utilisées

- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe

## Notes importantes

⚠️ **Pour la production** :
- Remplacer la base de données en mémoire par une vraie base de données (PostgreSQL, MongoDB, etc.)
- Configurer une variable d'environnement sécurisée pour `JWT_SECRET`
- Implémenter un système de hashage de mots de passe complet
- Ajouter la validation des données côté serveur
- Configurer HTTPS
- Ajouter la gestion des erreurs et logging

## Développement

Pour construire l'application pour la production :

```bash
npm run build
npm start
```

## Licence

Ce projet est un exemple éducatif.
