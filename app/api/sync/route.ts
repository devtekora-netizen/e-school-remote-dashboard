import { NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Clé "Maître" pour l'entreprise
const MASTER_API_KEY = process.env.MASTER_API_KEY || "E-SCHOOL-PRO-MASTER-2026";

export async function POST(request: Request) {
  const rawText = await request.text();
  
  try {
    const data = JSON.parse(rawText);
    const schoolId = data.schoolId || "DEFAULT_SCHOOL";
    const incomingApiKey = data.apiKey;

    console.log(`>>> [SERVER] SYNC POUR ECOLE: ${schoolId}`);

    // 1. Récupérer les données existantes de l'école
    const { data: school, error: fetchError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = Not found
      return NextResponse.json({ success: false, error: "Erreur database: " + fetchError.message }, { status: 500 });
    }

    // 2. Vérification de la Clé API
    if (school && school.api_key) {
      if (school.api_key !== incomingApiKey) {
        console.warn(`!!! [AUTH] Tentative de synchro non autorisée pour: ${schoolId}`);
        return NextResponse.json(
          { success: false, error: "Clé API invalide" },
          { status: 401 },
        );
      }
    }

    // 3. Vérification de Licence (Si l'entreprise a bloqué l'école)
    if (school && school.is_active === false) {
      console.warn(`!!! [LICENCE] Ecole Bloquée: ${schoolId}`);
      return NextResponse.json(
        { success: false, error: "Licence suspendue ou expirée" },
        { status: 403 },
      );
    }

    // 4. Upsert des données dans Supabase
    const { error: upsertError } = await supabase
      .from('schools')
      .upsert({
        id: schoolId,
        api_key: incomingApiKey,
        data: data,
        is_active: school ? school.is_active : true,
        last_sync: new Date().toISOString()
      });

    if (upsertError) {
      return NextResponse.json({ success: false, error: "Échec de l'enregistrement: " + upsertError.message }, { status: 500 });
    }

    await logEvent('SYNC', schoolId);

    return NextResponse.json({ success: true, message: `Données reçues pour ${schoolId} !` });
  } catch (error) {
    console.error("!!! [SERVER] ERREUR SYNC:", error);
    return NextResponse.json({ success: false, error: "Format invalide" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get('schoolId');
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json({ error: "Clé API requise" }, { status: 401 });
  }

  // MASTER MODE: Voir toutes les écoles (Pour l'entreprise)
  if (apiKey === MASTER_API_KEY) {
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*');
    
    // Pour les logs, on en prend 100
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Re-formater pour correspondre à ce que le Dashboard Master attend (Map de ID -> Data)
    const schoolsMap: Record<string, any> = {};
    schools?.forEach(s => {
      schoolsMap[s.id] = {
        ...s.data,
        isActive: s.is_active,
        receivedAt: s.last_sync
      };
    });

    const logsMapped = logs?.map(l => ({
      id: l.id,
      type: l.type,
      schoolId: l.school_id,
      timestamp: l.created_at,
      details: l.details
    })) || [];

    return NextResponse.json({
      role: "MASTER_ADMIN",
      schools: schoolsMap,
      logs: logsMapped
    });
  }

  if (!schoolId) {
    return NextResponse.json({ error: "Identifiant École requis" }, { status: 401 });
  }

  // Récupérer les données de l'école
  const { data: school, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();

  if (!school || error) {
    return NextResponse.json({ error: `Aucune donnée pour l'école ${schoolId}` }, { status: 404 });
  }

  if (school.api_key !== apiKey) {
    return NextResponse.json({ error: "Clé API invalide" }, { status: 401 });
  }

  if (school.is_active === false) {
    return NextResponse.json({ error: "Accès suspendu" }, { status: 403 });
  }

  const isRestore = searchParams.get('restore') === 'true';
  await logEvent(isRestore ? 'RESTORE' : 'LOGIN', schoolId);

  return NextResponse.json(school.data);
}


