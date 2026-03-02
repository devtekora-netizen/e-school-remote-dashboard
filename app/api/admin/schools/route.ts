import { NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";
import { supabase } from "@/lib/supabase";

const MASTER_API_KEY = process.env.MASTER_API_KEY || "E-SCHOOL-PRO-MASTER-2026";

export async function PATCH(request: Request) {
  try {
    const { masterKey, schoolId, isActive } = await request.json();

    // 1. Authentification de l'Admin Maître
    if (masterKey !== MASTER_API_KEY) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
    }

    if (!schoolId) {
        return NextResponse.json({ error: "SchoolID requis" }, { status: 400 });
    }

    // 2. Mise à jour de l'état dans Supabase
    const { error } = await supabase
      .from('schools')
      .update({ is_active: isActive })
      .eq('id', schoolId);

    if (error) {
       return NextResponse.json({ error: "Erreur database: " + error.message }, { status: 500 });
    }

    await logEvent(isActive ? 'ADMIN_UNBLOCK' : 'ADMIN_BLOCK', schoolId, `Action effectuée par Master Admin.`);
    console.log(`>>> [ADMIN] Changement Statut Ecole ${schoolId}: ${isActive ? 'ACTIVE' : 'BLOQUÉE'}`);
    
    return NextResponse.json({ success: true, schoolId, isActive });

  } catch (error) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }
}
