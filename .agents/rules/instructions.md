**Progetto**: "Stonks-Manager"

**Regole Sviluppo:**
1. **Lingua:** Codice in inglese; UI in italiano.
2. **Flusso:** Chiedere conferma prima di azioni non richieste.
3. **Architettura (`high-level-architecture.md`):**
   - **Frontend:** HTML, CSS, JS. Integrazione Supabase Auth (invio JWT al backend).
   - **Backend:** Python (modalità *strict* per Pyright).
   - **Database:** Supabase (PostgreSQL). Consultare Glossario e Schema in `docs/db/`.
4. **Style guide**:
   - **Nomi classi**: CamelCase (prima lettera maiuscola)
   - **Nomi funzioni**: camelCase (prima lettera minuscola)
   - **Nomi variabili**: snake_case

**Note Tecniche:** 
- Backend deve validare i dati e gestire la logica dell integrazione IA.
- Massima attenzione alla coerenza con lo schema fisico del DB fornito.