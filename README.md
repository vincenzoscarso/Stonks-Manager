# Stonks Manager





## Prerequisiti

- Python
- Git
- Un progetto Supabase (per il database e l'autenticazione)

## Configurazione

### 1. Clona e accedi al progetto

```bash
git clone <repository-url>
cd Stonks-Manager
```

### 2. Crea e attiva l'ambiente virtuale

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux/macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Installa le dipendenze

```bash
pip install -r requirements.txt
```

### 4. Configura le variabili di ambiente

Crea un file `.env` nella radice del progetto con le seguenti variabili:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anonymous_key
API_BASE_URL=http://localhost:8000/api
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

Sostituisci i valori con le tue credenziali Supabase effettive.

### 5. Configura il database

Se è la prima volta che esegui il progetto, inizializza il database Supabase eseguendo gli script SQL nella cartella `database/` in questo ordine:

1. `schema.sql` - Crea le tabelle principali
2. `default_categories.sql` - Popola le categorie di transazione predefinite
3. `local_auth_setup.sql` - Configura l'autenticazione locale (se necessario)

## Esecuzione dell'applicazione

L'applicazione è costituita da due server che devono essere eseguiti contemporaneamente:

### Avvia il backend API

**Windows:**
```powershell
inv run
```

**Linux/macOS:**
```bash
invoke run
```

Questo avvia il server FastAPI su `http://localhost:8000/api`

### Avvia il server frontend (in un nuovo terminale)

**Windows:**
```powershell
python ui_server.py
```

**Linux/macOS:**
```bash
python3 ui_server.py
```

Questo serve il frontend su `http://localhost:3000`

Quindi apri il browser e accedi a `http://localhost:3000`

## Attività disponibili

Il progetto utilizza Invoke per l'automazione delle attività. Esegui uno di questi comandi dalla radice del progetto:

**Esegui il server backend:**
```
invoke run
```

**Esegui i test delle route:**
```
invoke routeTest
```

Testa tutti gli endpoint API. Passa flag facoltativi:
- `--jwt` - Recupera solo il token JWT senza eseguire i test
- `--no-cleanup` - Salta la pulizia dei dati di test dopo i test
- `--keep-user` - Mantieni l'utente di test dopo i test

Esempio:
```
invoke routeTest --keep-user
```

**Pulisci la cache:**
```
invoke clean
```

Rimuove le cartelle `__pycache__` e i file `.pytest_cache`.

**Verifica i segreti nella cronologia di Git:**
```
invoke checkLeaks
```

Verifica che nessuna variabile di ambiente da `.env` sia stata eseguita il commit nella cronologia di Git.

## Struttura del progetto

```
backend/          - Applicazione FastAPI
├── app/
│   ├── main.py              - Punto di ingresso dell'applicazione
│   ├── config/              - Configurazione e prompt
│   ├── models/              - Modelli del database
│   ├── routes/              - Endpoint API
│   ├── services/            - Logica di business
│   └── utils/               - Funzioni di utilità
├── tests/         - File di test

frontend/         - Frontend HTML/CSS/JS
├── index.html     - Pagina principale
├── pages/         - Singole pagine
├── scripts/       - Logica JavaScript
└── styles/        - Fogli di stile CSS

database/         - Script di configurazione SQL
docs/             - Documentazione
ui_server.py      - Server HTTP frontend
tasks.py          - Definizioni di attività Invoke
requirements.txt  - Dipendenze Python
```

## Test

Esegui i test delle route per verificare che tutti gli endpoint API funzionino:

```
invoke routeTest
```

Lo script di test eseguirà:
- Creazione dei dati di test (categorie, account, transazioni)
- Test di tutte le operazioni CRUD
- Test delle route AI per la scansione delle ricevute
- Pulizia dei dati di test successivamente (a meno che non venga passato `--no-cleanup`)

## Note di sviluppo

- Il backend API viene eseguito sulla porta 8000
- Il server frontend viene eseguito sulla porta 3000
- Le variabili di ambiente vengono caricate da `.env` utilizzando il percorso relativo dalla radice del progetto
- Le query del database utilizzano la libreria client Supabase
- La suite di test richiede credenziali Supabase valide in `.env`

## Risoluzione dei problemi

**Errore "User already exists" nei test:**
Usa `invoke routeTest --keep-user` alla prima esecuzione, quindi riutilizza lo stesso utente per i test successivi.

**Variabili di ambiente mancanti:**
Assicurati che tutte le variabili richieste in `.env` siano impostate. L'app genererà un errore elencando le variabili mancanti.

**Porta già in uso:**
Se la porta 8000 o 3000 è già in uso, modifica i file di configurazione del server pertinenti per utilizzare porte diverse.

