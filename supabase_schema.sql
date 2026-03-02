-- 1. Table des Écoles et leurs données synchronisées
CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    api_key TEXT,
    data JSONB,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des Logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT,
    type TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des Licences valides
CREATE TABLE IF NOT EXISTS licenses (
    key TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertion de quelques clés de licence par défaut (Optionnel)
INSERT INTO licenses (key) VALUES 
('ADMIN-PRO26-JOTEK-ESCH1'),
('ALPHA-BETA1-GAMMA2-DELTA'),
('TEKOR-A2026-SCHOOL-PRO1')
ON CONFLICT DO NOTHING;
