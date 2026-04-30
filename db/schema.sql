-- ==========================================
-- 0. NOTES FOR THE FUTURE
-- ==========================================

-- Required: PostgreSQL >= 15
-- Also required: citext extension

-- ==========================================
-- 1. SETUP AND EXTENSIONS
-- ==========================================

-- Create a dedicated schema for extensions to improve security
CREATE SCHEMA IF NOT EXISTS extensions;

-- Create a dedicated schema for internal functions to hide them from the API
CREATE SCHEMA IF NOT EXISTS internal;

-- Install 'citext' in the dedicated schema for case-insensitive email handling
CREATE EXTENSION IF NOT EXISTS citext SCHEMA extensions;

-- Create custom ENUM type for transactions in the public schema
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- ==========================================
-- 2. AUTOMATION FUNCTIONS
-- ==========================================

-- Secure function to automatically update the 'updated_at' timestamp
-- SET search_path ensures the function only looks into specified schemas
CREATE OR REPLACE FUNCTION internal.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, extensions;

-- ==========================================
-- 3. TABLES DEFINITION
-- ==========================================

-- A. USER PROFILE (Linked to Supabase auth.users)
CREATE TABLE public.user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    email extensions.citext NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for user_profile timestamps
CREATE TRIGGER tr_user_profile_updated_at
BEFORE UPDATE ON public.user_profile
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();


-- B. CATEGORY
CREATE TABLE public.category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_profile_id UUID REFERENCES public.user_profile(id) ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- UNIQUE constraint allowing NULL for global/default categories (PostgreSQL 15+)
    CONSTRAINT uq_category_name_per_user UNIQUE NULLS NOT DISTINCT (name, user_profile_id)
);

-- Index for category foreign key performance
CREATE INDEX idx_category_user_id ON public.category(user_profile_id);

-- Trigger for category timestamps
CREATE TRIGGER tr_category_updated_at
BEFORE UPDATE ON public.category
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();


-- C. ACCOUNT (e.g., Bank, Cash, Wallets)
CREATE TABLE public.account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    include_in_total BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_profile_id UUID NOT NULL REFERENCES public.user_profile(id) ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- An account name must be unique per user
    CONSTRAINT uq_account_name_per_user UNIQUE (name, user_profile_id)
);

-- Index for account foreign key performance
CREATE INDEX idx_account_user_id ON public.account(user_profile_id);

-- Trigger for account timestamps
CREATE TRIGGER tr_account_updated_at
BEFORE UPDATE ON public.account
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();


-- D. TRANSACTION (Movements)
CREATE TABLE public.transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.transaction_type NOT NULL,
    description TEXT,
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_id UUID NOT NULL REFERENCES public.account(id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.category(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Indexes for transaction foreign key performance
CREATE INDEX idx_transaction_account_id ON public.transaction(account_id);
CREATE INDEX idx_transaction_category_id ON public.transaction(category_id);

-- Trigger for transaction timestamps
CREATE TRIGGER tr_transaction_updated_at
BEFORE UPDATE ON public.transaction
FOR EACH ROW EXECUTE FUNCTION internal.update_updated_at_column();


-- ==========================================
-- 4. SUPABASE AUTH INTEGRATION (SYNC)
-- ==========================================

-- Secure function to automatically create a profile when a user signs up
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

-- Trigger that listens to the internal auth.users table for new sign-ups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();


-- ==========================================
-- 5. CLEANUP
-- ==========================================
-- Drops the old vulnerable functions from the public schema if they exist
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();


-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction ENABLE ROW LEVEL SECURITY;

-- A. USER PROFILE
DROP POLICY IF EXISTS "Users can manage their own profile." ON public.user_profile;
CREATE POLICY "Users can manage their own profile."
ON public.user_profile FOR ALL TO authenticated 
USING ( (SELECT auth.uid()) = id ) 
WITH CHECK ( (SELECT auth.uid()) = id );

-- B. CATEGORY
DROP POLICY IF EXISTS "Users can manage their own categories." ON public.category;
CREATE POLICY "Users can manage their own categories."
ON public.category FOR ALL TO authenticated 
USING ( (SELECT auth.uid()) = user_profile_id ) 
WITH CHECK ( (SELECT auth.uid()) = user_profile_id );

-- C. ACCOUNT
DROP POLICY IF EXISTS "Users can manage their own accounts." ON public.account;
CREATE POLICY "Users can manage their own accounts."
ON public.account FOR ALL TO authenticated 
USING ( (SELECT auth.uid()) = user_profile_id ) 
WITH CHECK ( (SELECT auth.uid()) = user_profile_id );

-- D. TRANSACTION
DROP POLICY IF EXISTS "Users can manage transactions for their accounts." ON public.transaction;
CREATE POLICY "Users can manage transactions for their accounts."
ON public.transaction FOR ALL TO authenticated 
USING ( account_id IN (SELECT id FROM public.account WHERE user_profile_id = (SELECT auth.uid())) )
WITH CHECK ( account_id IN (SELECT id FROM public.account WHERE user_profile_id = (SELECT auth.uid())) );