## Tabella dei contenuti <!-- omit from toc -->

- [Configurazione](#configurazione)
  - [1. Clonazione e accesso al progetto](#1-clonazione-e-accesso-al-progetto)
  - [2. Creazione e attivazione dell'ambiente virtuale di Python](#2-creazione-e-attivazione-dellambiente-virtuale-di-python)
  - [3. Installazione delle dipendenze](#3-installazione-delle-dipendenze)
  - [4. Configurazione delle variabili di ambiente](#4-configurazione-delle-variabili-di-ambiente)
  - [5. Configurazione del database](#5-configurazione-del-database)
- [Esecuzione dell'applicazione](#esecuzione-dellapplicazione)
  - [Avvio dell'API backend](#avvio-dellapi-backend)
  - [Avvio del server frontend (in un nuovo terminale)](#avvio-del-server-frontend-in-un-nuovo-terminale)
- [Task disponibili (invoke tasks)](#task-disponibili-invoke-tasks)


## Configurazione

> [!NOTE]
> Prima della clonazione è necessaria l'installazione di [Python](https://www.python.org/downloads/release/python-3132/) (con pip) e [Git](https://git-scm.com/install/) 


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
invoke runBack
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


## Task disponibili (invoke tasks)

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

Verifica che nessuna variabile di ambiente da `.env` sia presente nella cronologia di Git.
