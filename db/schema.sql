-- ==========================================
-- 0. NOTES FOR THE FUTURE
-- ==========================================

-- Required: PostgreSQL >= 15
-- Also required: citext extension

-- ==========================================
-- 1. SETUP AND EXTENSIONS
-- ==========================================

-- Enable 'citext' for case-insensitive email comparisons
CREATE EXTENSION IF NOT EXISTS citext;

-- Create ENUM for transaction types (Income vs Expense)
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- ==========================================
-- 2. AUTOMATION FUNCTIONS
-- ==========================================

-- Function to automatically update the 'updated_at' timestamp on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. TABLES DEFINITION
-- ==========================================

-- A. USER PROFILE (Linked to Supabase Auth)
CREATE TABLE user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER tr_user_profile_updated_at
BEFORE UPDATE ON user_profile
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- B. CATEGORY
CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_profile_id UUID REFERENCES user_profile(id) ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- UNIQUE constraint allowing NULL for global/default categories
    CONSTRAINT uq_category_name_per_user UNIQUE NULLS NOT DISTINCT (name, user_profile_id)
);

CREATE INDEX idx_category_user_id ON category(user_profile_id);

CREATE TRIGGER tr_category_updated_at
BEFORE UPDATE ON category
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- C. ACCOUNT (e.g., Bank, Cash, Credit Card)
CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    include_in_total BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_profile_id UUID NOT NULL REFERENCES user_profile(id) ON UPDATE CASCADE ON DELETE CASCADE,
    
    CONSTRAINT uq_account_name_per_user UNIQUE (name, user_profile_id)
);

CREATE INDEX idx_account_user_id ON account(user_profile_id);

CREATE TRIGGER tr_account_updated_at
BEFORE UPDATE ON account
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- D. TRANSACTION
CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type transaction_type NOT NULL,
    description TEXT,
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_id UUID NOT NULL REFERENCES account(id) ON UPDATE CASCADE ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES category(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_transaction_account_id ON transaction(account_id);
CREATE INDEX idx_transaction_category_id ON transaction(category_id);

CREATE TRIGGER tr_transaction_updated_at
BEFORE UPDATE ON transaction
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 4. SUPABASE AUTH INTEGRATION
-- ==========================================

-- Automatically create a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger triggered by auth.users (internal Supabase table)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
