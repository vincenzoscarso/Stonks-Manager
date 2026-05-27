-- ==========================================
-- LOCAL DEVELOPMENT MOCK SETUP
-- ==========================================
-- Questo script deve essere eseguito SOLO su un'istanza PostgreSQL locale
-- per simulare l'ambiente di Supabase.
-- NON eseguire su un progetto Supabase live.

-- 1. Crea lo schema 'auth', che in produzione è gestito da Supabase.
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Crea una tabella 'users' fittizia all'interno dello schema 'auth'.
-- Questa tabella necessita solo delle colonne a cui fa riferimento il tuo schema pubblico
-- (id, email, raw_user_meta_data).
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    raw_user_meta_data JSONB
);