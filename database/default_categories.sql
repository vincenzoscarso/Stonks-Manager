-- ==========================================
-- INSERT DEFAULT CATEGORIES
-- ==========================================

INSERT INTO public.category (name, type, description, user_profile_id)
VALUES 
    -- Expense Categories
    ('Altro', 'expense', 'Spese non categorizzate', NULL),
    ('Regali', 'expense', 'Spese dovute a regali', NULL),
    ('Alimentari', 'expense', 'Spesa quotidiana e cibo', NULL),
    ('Trasporti', 'expense', 'Carburante, mezzi pubblici e manutenzione mezzi', NULL),
    ('Salute', 'expense', 'Spese mediche e farmaci', NULL),
    ('Intrattenimento', 'expense', 'Cinema, hobby e tempo libero', NULL),
    ('Ristoranti', 'expense', 'Cene fuori e take-away', NULL),
    ('Utilità', 'expense', 'Bollette luce, gas, acqua e internet', NULL),
    ('Shopping', 'expense', 'Abbigliamento e articoli personali', NULL),
    
    -- Income Categories
    ('Altro', 'income', 'Entrate non categorizzate', NULL),
    ('Regali', 'income', 'Entrate da regali o bonus occasionali', NULL),
    ('Lavoro', 'income', 'Entrate da attività lavorative', NULL);