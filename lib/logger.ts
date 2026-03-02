import { supabase } from './supabase';

// Types d'événements pour la traçabilité
export type EventType = 
  | 'SYNC' 
  | 'LOGIN' 
  | 'RESTORE' 
  | 'LICENSE_GEN' 
  | 'LICENSE_ACTIVATE' 
  | 'ADMIN_BLOCK' 
  | 'ADMIN_UNBLOCK'
  | 'HEARTBEAT_START';

/**
 * Enregistre un événement dans la base de données Supabase
 */
export const logEvent = async (type: EventType, schoolId: string, details?: string) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{
      type,
      school_id: schoolId,
      details,
      created_at: new Date().toISOString()
    }]);

  if (error) {
    console.error(`[LOG ERROR] ${error.message}`);
  }

  console.log(`[LOG] ${type} | ${schoolId} | ${details || ''}`);
};

/**
 * Récupère les 100 derniers logs depuis Supabase
 */
export const getLogs = async () => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error(`[GET LOGS ERROR] ${error.message}`);
    return [];
  }

  return data;
};
