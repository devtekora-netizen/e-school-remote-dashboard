import { NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Clé "Maître" pour l'entreprise
const MASTER_API_KEY = process.env.MASTER_API_KEY || "E-SCHOOL-PRO-MASTER-2026";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: "Clé manquante" }, { status: 400 });
  }

  // Vérification dans Supabase
  const { data, error } = await supabase
    .from('licenses')
    .select('key')
    .eq('key', key.toUpperCase())
    .single();

  if (data && !error) {
    console.log(`[LICENSE] Activation réussie pour la clé: ${key}`);
    await logEvent('LICENSE_ACTIVATE', 'NEW_SCHOOL', `Activation réussie avec la clé ${key.substring(0, 8)}...`);
    return NextResponse.json({ 
      success: true, 
      message: "Clé de produit valide et activée." 
    });
  }

  console.warn(`[LICENSE] Tentative d'activation avec clé invalide: ${key}`);
  return NextResponse.json({ 
    success: false, 
    error: "Clé de produit invalide ou déjà utilisée." 
  }, { status: 401 });
}

export async function POST(request: Request) {
  const { masterKey, newKey } = await request.json();

  // Seule l'entreprise peut générer des clés avec sa MASTER_KEY
  if (masterKey !== MASTER_API_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (newKey) {
    const { error } = await supabase
      .from('licenses')
      .insert([{ key: newKey.toUpperCase() }]);

    if (error) {
       return NextResponse.json({ error: "Échec de la génération: " + error.message }, { status: 500 });
    }

    await logEvent('LICENSE_GEN', 'MASTER', `Nouvelle clé générée : ${newKey.substring(0, 8)}...`);
    return NextResponse.json({ success: true, message: `Clé générée: ${newKey}` });
  }

  return NextResponse.json({ error: "Données invalides" }, { status: 400 });
}
