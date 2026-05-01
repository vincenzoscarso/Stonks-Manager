-- ==========================================
-- SEED DATA FOR STONKS MANAGER
-- ==========================================

-- 1. MOCK USER (Supabase auth.users)
-- Inserting into auth.users will automatically trigger 'on_auth_user_created'
-- which populates the 'public.user_profile' table.
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'stonks.tester@example.com',
    '{"display_name": "Stonks Master"}'
) ON CONFLICT (id) DO NOTHING;

-- 2. CATEGORIES
-- Includes global categories (NULL user_profile_id) and user-specific ones.
INSERT INTO public.category (id, name, description, user_profile_id)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'Salary', 'Primary income from job', NULL),
    ('20000000-0000-0000-0000-000000000002', 'Groceries', 'Food and essentials', NULL),
    ('20000000-0000-0000-0000-000000000003', 'Gaming', 'Video games and microtransactions', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. ACCOUNTS
INSERT INTO public.account (id, name, include_in_total, user_profile_id)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'Main Checking', true, '10000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'High-Yield Savings', true, '10000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'Emergency Cash', false, '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 4. TRANSACTIONS
-- Amounts are > 0 to respect the CHECK constraint.
INSERT INTO public.transaction (id, type, description, amount, date, account_id, category_id)
VALUES
    ('40000000-0000-0000-0000-000000000001', 'income', 'March Salary', 4500.00, '2023-10-01 09:00:00+00', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
    ('40000000-0000-0000-0000-000000000002', 'expense', 'Trader Joes Run', 125.50, '2023-10-03 14:30:00+00', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
    ('40000000-0000-0000-0000-000000000003', 'expense', 'Steam Autumn Sale', 59.99, '2023-10-05 20:15:00+00', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;