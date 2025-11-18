import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  try {
    let events;
    if (start && end) {
      // Récupérer les événements pour une plage de dates
      events = db.events.getByDateRange(start, end, auth.id);
    } else if (auth.role === 'admin') {
      // Admin voit tous les événements publics
      events = db.events.getAll();
    } else {
      // Étudiant voit les événements publics + ses événements privés
      events = db.events.getByUser(auth.id);
    }

    return NextResponse.json({ success: true, events });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    );
  }

  try {
    const { title, description, startDate, endDate, startTime, endTime, visibility, color } = await request.json();

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Titre, date de début et date de fin sont requis' },
        { status: 400 }
      );
    }

    // Les admins peuvent créer des événements publics ou privés
    // Les étudiants ne peuvent créer que des événements privés
    const eventVisibility = auth.role === 'admin' 
      ? (visibility || 'public')
      : 'private';

    const user = db.users.findById(auth.id);
    const event = db.events.create({
      title,
      description: description || '',
      startDate,
      endDate,
      startTime,
      endTime,
      createdBy: auth.id,
      createdByName: user?.name || 'Utilisateur',
      visibility: eventVisibility,
      color: color || '#3b82f6',
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

