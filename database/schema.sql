-- ==========================================
-- 0. NOTES FOR THE FUTURE
-- ==========================================

-- Required: PostgreSQL >= 15
-- Also required: citext extension

-- ==========================================
-- 1. SETUP AND EXTENSIONS
-- ==========================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS internal;

CREATE EXTENSION IF NOT EXISTS citext SCHEMA extensions;

CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.category_type AS ENUM ('income', 'expense');

-- ==========================================
-- 2. AUTOMATION FUNCTIONS
-- ==========================================

-- Secure function to automatically update 'updated_at'
CREATE OR REPLACE FUNCTION internal.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions;

-- Global RLS Auto-Enabler
CREATE OR REPLACE FUNCTION internal.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, internal
AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
    END LOOP;
END;
$$;

-- ==========================================
-- 3. TABLES DEFINITION
-- ==========================================

-- A. USER PROFILE 
CREATE TABLE public.user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    email extensions.citext NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER tr_user_profile_updated_at
BEFORE UPDATE ON public.user_profile
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

-- B. CATEGORY
CREATE TABLE public.category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    type public.category_type NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_profile_id UUID REFERENCES public.user_profile(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_category_name_type_per_user UNIQUE NULLS NOT DISTINCT (name, type, user_profile_id)
);

CREATE INDEX idx_category_user_id ON public.category(user_profile_id);
CREATE INDEX idx_category_predefined ON public.category(name) WHERE user_profile_id IS NULL;

CREATE TRIGGER tr_category_updated_at
BEFORE UPDATE ON public.category
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

-- C. ACCOUNT
CREATE TABLE public.account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    include_in_total BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_profile_id UUID NOT NULL REFERENCES public.user_profile(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_account_name_per_user UNIQUE (name, user_profile_id)
);

CREATE INDEX idx_account_user_id ON public.account(user_profile_id);

CREATE TRIGGER tr_account_updated_at
BEFORE UPDATE ON public.account
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

-- D. TRANSACTION
CREATE TABLE public.transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.transaction_type NOT NULL,
    description TEXT,
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_id UUID NOT NULL REFERENCES public.account(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.category(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_transaction_account_id ON public.transaction(account_id);
CREATE INDEX idx_transaction_category_id ON public.transaction(category_id);

CREATE TRIGGER tr_transaction_updated_at
BEFORE UPDATE ON public.transaction
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();

-- ==========================================
-- 4. SUPABASE AUTH INTEGRATION
-- ==========================================

CREATE OR REPLACE FUNCTION internal.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Stonks Manager User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();

-- ==========================================
-- 5. CLEANUP AND GLOBAL TRIGGERS
-- ==========================================

-- Cleanup User Data on Account Deletion
CREATE OR REPLACE FUNCTION internal.cleanup_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Elimina prima le transazioni collegate agli account dell'utente
    DELETE FROM public.transaction 
    WHERE account_id IN (SELECT id FROM public.account WHERE user_profile_id = OLD.id);

    -- 2. Elimina gli account
    DELETE FROM public.account WHERE user_profile_id = OLD.id;

    -- 3. Elimina le categorie personalizzate
    DELETE FROM public.category WHERE user_profile_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_cleanup_user_data
BEFORE DELETE ON public.user_profile
FOR EACH ROW EXECUTE FUNCTION internal.cleanup_user_data();

-- Global RLS setup
DROP EVENT TRIGGER IF EXISTS ensure_rls;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.rls_auto_enable();

CREATE EVENT TRIGGER ensure_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION internal.rls_auto_enable();

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction ENABLE ROW LEVEL SECURITY;

-- Concedi i permessi di base sulle tabelle al ruolo authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profile TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- RLS policies to allow CRUD operations to users only on their own data
CREATE POLICY "Users can manage their own profile." ON public.user_profile FOR ALL TO authenticated USING ( (SELECT auth.uid()) = id ) WITH CHECK ( (SELECT auth.uid()) = id );
CREATE POLICY "Users can manage their own categories." ON public.category FOR ALL TO authenticated USING ( (SELECT auth.uid()) = user_profile_id ) WITH CHECK ( (SELECT auth.uid()) = user_profile_id );
CREATE POLICY "Users can manage their own accounts." ON public.account FOR ALL TO authenticated USING ( (SELECT auth.uid()) = user_profile_id ) WITH CHECK ( (SELECT auth.uid()) = user_profile_id );
CREATE POLICY "Users can manage transactions for their accounts." ON public.transaction FOR ALL TO authenticated USING ( account_id IN (SELECT id FROM public.account WHERE user_profile_id = (SELECT auth.uid())) ) WITH CHECK ( account_id IN (SELECT id FROM public.account WHERE user_profile_id = (SELECT auth.uid())) );
CREATE POLICY "Users can read global categories." ON public.category FOR SELECT TO authenticated USING ( user_profile_id IS NULL );
