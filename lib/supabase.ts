import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.SUPABASE_URL || '').trim();
const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// On garantit que l'URL est syntaxiquement valide pour createClient, même pendant le build
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co';
const supabaseServiceKey = rawKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
