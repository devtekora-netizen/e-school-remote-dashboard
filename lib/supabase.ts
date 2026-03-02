import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

// On utilise le Service Role Key pour contourner les RLS (Row Level Security) 
// car il s'agit d'opérations d'administration/synchronisation.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
