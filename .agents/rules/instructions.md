**Project**: "Stonks-Manager"

**Development Rules:**
1. **Language:** Code in English; UI in Italian.
2. **Flow:** Ask for confirmation before performing unsolicited actions.
3. **Architecture (`high-level-architecture.md`):**
   - **Frontend:** HTML, CSS, JS. Supabase Auth integration (sending JWT to the backend).
   - **Backend:** Python (*strict* mode for Pyright).
   - **Database:** Supabase (PostgreSQL). Consult Glossary and Schema in `docs/db/`.
4. **Style guide**:
   - **Class names**: CamelCase (uppercase first letter)
   - **Function names**: camelCase (lowercase first letter)
   - **Variable names**: snake_case

**Technical Notes:**
- Backend must validate data and manage the AI integration logic.
- Maximum attention to consistency with the provided physical DB schema.