-- ==========================================
-- SEED DATA FOR STONKS MANAGER
-- ==========================================

DO $$ 
DECLARE
    -- Sostituisci questi UUID con ID reali di auth.users se necessario
    user_1_id UUID := '66c05264-3e07-46e7-a70a-cb2789aadf30';
    user_2_id UUID := '00000000-0000-0000-0000-000000000002';
    
    cat_stipendio_id UUID;
    cat_spesa_id UUID;
    cat_affitto_id UUID;
    
    acc_principale_id UUID;
    acc_risparmio_id UUID;
BEGIN

    -- 1. CATEGORIE GLOBALI (Predefinite)
    -- user_profile_id è NULL per renderle visibili a tutti
    INSERT INTO public.category (name, type, description, user_profile_id)
    VALUES 
        ('Alimentari', 'expense', 'Spesa per cibo e bevande', NULL),
        ('Trasporti', 'expense', 'Carburante, abbonamenti e mezzi', NULL),
        ('Salute', 'expense', 'Spese mediche e farmacia', NULL),
        ('Tempo Libero', 'expense', 'Hobby, cinema e divertimento', NULL),
        ('Bonus', 'income', 'Entrate extra una tantum', NULL)
    ON CONFLICT DO NOTHING;

    -- 2. UTENTI (Mock)
    -- Nota: In un ambiente reale, questi vengono creati dal trigger handle_new_user()
    -- Ma per il seed diretto nelle tabelle public:
    INSERT INTO public.user_profile (id, display_name, email)
    VALUES 
        (user_1_id, 'Mario Rossi', 'mario.rossi@example.com'),
        (user_2_id, 'Luigi Bianchi', 'luigi.bianchi@example.com')
    ON CONFLICT (id) DO NOTHING;

    -- 3. CATEGORIE PERSONALIZZATE (Per Utente 1)
    INSERT INTO public.category (name, type, user_profile_id)
    VALUES ('Stipendio Tech', 'income', user_1_id)
    RETURNING id INTO cat_stipendio_id;

    INSERT INTO public.category (name, type, user_profile_id)
    VALUES ('Affitto Casa', 'expense', user_1_id)
    RETURNING id INTO cat_affitto_id;

    -- 4. CONTI (Per Utente 1)
    INSERT INTO public.account (name, include_in_total, user_profile_id)
    VALUES ('Conto Corrente Intesa', TRUE, user_1_id)
    RETURNING id INTO acc_principale_id;

    INSERT INTO public.account (name, include_in_total, user_profile_id)
    VALUES ('Fondo Emergenza', TRUE, user_1_id)
    RETURNING id INTO acc_risparmio_id;

    -- Recuperiamo un ID categoria globale per i test
    SELECT id INTO cat_spesa_id FROM public.category WHERE name = 'Alimentari' LIMIT 1;

    -- 5. TRANSAZIONI (Per Utente 1)
    INSERT INTO public.transaction (type, description, amount, date, account_id, category_id)
    VALUES 
        ('income', 'Stipendio Aprile', 2500.00, NOW() - INTERVAL '5 days', acc_principale_id, cat_stipendio_id),
        ('expense', 'Affitto mensile', 800.00, NOW() - INTERVAL '4 days', acc_principale_id, cat_affitto_id),
        ('expense', 'Cena fuori', 45.50, NOW() - INTERVAL '2 days', acc_principale_id, cat_spesa_id),
        ('expense', 'Spesa Esselunga', 120.00, NOW() - INTERVAL '1 day', acc_principale_id, cat_spesa_id);

    -- Trasferimento simulato (Prelievo da uno e deposito nell'altro)
    INSERT INTO public.transaction (type, description, amount, date, account_id, category_id)
    VALUES 
        ('expense', 'Risparmio mensile', 200.00, NOW(), acc_principale_id, cat_spesa_id), -- Placeholder cat
        ('income', 'Accantonamento', 200.00, NOW(), acc_risparmio_id, cat_stipendio_id);  -- Placeholder cat

END $$;