import { createClient } from '@supabase/supabase-js';

const rawUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// On garantit que l'URL est syntaxiquement valide pour createClient
let supabaseUrl = rawUrl;
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
}
if (!supabaseUrl) {
    supabaseUrl = 'https://placeholder.supabase.co'; // Fallback pour éviter crash au build, mais causera fetch failed à l'exécution
}

const supabaseServiceKey = rawKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
