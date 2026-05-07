# Stonks Manager

Stonks-Manager è un app finanziaria (se così si puo definire) che permette il semplice controllo dei propri movimenti giornalieri. Permette di salvare i movimenti categorizzandoli opportunamente e assegnandoli ai dovuti conti di appartenenza. 

Stonks-Manager permette funzioni di inserimento intelligente dei movimenti questo he possibile in due modi:
- sia via linguaggio umano ad esempio: "Ho mangiato una pizza con Luca sabato e ho speso 15 euro"
- sia via scansione automatica della foto di uno scontrino
L'IA poi restituirà le informazioni nuovamente all'app che mostrera un form già compilato per la revisione dei dati inseriti.

## Configurazione

> [!NOTE]
> Prima della clonazione è necessaria l'installazione di: Python e Git 

### 1. Clonazione e accesso al progetto

```bash
git clone <repository-url>
cd Stonks-Manager
```

### 2. Creazione e attivazione dell'ambiente virtuale di Python

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

### 3. Installazione delle dipendenze

```bash
pip install -r requirements.txt
```

### 4. Configurazione delle variabili di ambiente

Crea un file `.env` nella radice del progetto o rinomina il file già esistente [.env.example](./.env.example). Sostituisci poi i valori con le tue credenziali e valori. 

### 5. Configurazione del database

Se è la prima volta che esegui il progetto, inizializza il database Supabase eseguendo gli script SQL nella cartella `database/` in questo ordine:

1. `schema.sql` - Crea le tabelle principali
2. `default_categories.sql` - Popola le categorie di transazione predefinite
3. `local_auth_setup.sql` - Configura l'autenticazione locale (SOLO per database locali)

## Esecuzione dell'applicazione

L'applicazione è costituita da due server che devono essere eseguiti contemporaneamente:

### Avvio dell'API backend

**Windows:**
```powershell
inv runBack
```

**Linux/macOS:**
```bash
invoke runBack
```

Questo avvia il server FastAPI su [http://localhost:8000](http://localhost:8000)

### Avvio del server frontend (in un nuovo terminale)

**Windows:**
```powershell
invoke runFront
```

**Linux/macOS:**
```bash
invoke runFront
```

Questo serve il frontend su [http://localhost:3000](http://localhost:3000)


## Task disponibili

Il progetto utilizza Invoke per l'automazione delle attività. Esegui uno di questi comandi dalla radice del progetto:

**Esegui il server backend:**
```
invoke runBack
```

**Esegui il server frontend:**
```
invoke runFront
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

