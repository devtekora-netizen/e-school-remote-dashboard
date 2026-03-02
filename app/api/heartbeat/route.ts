import { NextResponse } from "next/server";

// Persistence en mémoire pour les sessions actives
const globalForHeartbeat = global as unknown as { 
  activeSessions: Record<string, Record<string, number>> // schoolId -> { sessionId: lastSeenTimestamp }
};

if (!globalForHeartbeat.activeSessions) globalForHeartbeat.activeSessions = {};

export async function POST(request: Request) {
  try {
    const { schoolId, sessionId } = await request.json();

    if (!schoolId || !sessionId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (!globalForHeartbeat.activeSessions[schoolId]) {
      globalForHeartbeat.activeSessions[schoolId] = {};
    }

    // Mettre à jour le timestamp de la session
    globalForHeartbeat.activeSessions[schoolId][sessionId] = Date.now();

    // Nettoyage des sessions expirées (plus de 90 secondes sans ping)
    const now = Date.now();
    const TIMEOUT = 90000; 

    Object.keys(globalForHeartbeat.activeSessions).forEach(id => {
      const sessions = globalForHeartbeat.activeSessions[id];
      Object.keys(sessions).forEach(sid => {
        if (now - sessions[sid] > TIMEOUT) {
          delete sessions[sid];
        }
      });
      // Supprimer l'école de la map si plus aucune session
      if (Object.keys(sessions).length === 0) {
        delete globalForHeartbeat.activeSessions[id];
      }
    });

    return NextResponse.json({ 
      success: true, 
      activeCount: Object.keys(globalForHeartbeat.activeSessions[schoolId] || {}).length 
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get('schoolId');

  // Si on demande pour une école spécifique
  if (schoolId) {
    const sessions = globalForHeartbeat.activeSessions[schoolId] || {};
    return NextResponse.json({ count: Object.keys(sessions).length });
  }

  // Sinon renvoyer tout le dictionnaire (pour le Master Admin)
  const stats: Record<string, number> = {};
  Object.keys(globalForHeartbeat.activeSessions).forEach(id => {
    stats[id] = Object.keys(globalForHeartbeat.activeSessions[id]).length;
  });

  return NextResponse.json(stats);
}
