![Stonks-Manager-banner](./resources/SM-Banner.png)

Stonks-Manager è una semplice app finanziaria che permette il controllo delle proprie spese giornaliere. Permette di salvare le spese con possibilità di categorizzazione e assegnazione ai relativi conti.

Stonks-Manager permette anche funzioni di inserimento intelligente delle spese questo è possibile in due modi:
- Tramite linguaggio umano ad esempio: "Ho mangiato una pizza con Luca sabato e ho speso 15 euro"
- Tramite scansione automatica della foto di uno scontrino
L'IA poi restituirà le informazioni nuovamente all'app che mostrera un form già compilato per la revisione dei dati inseriti.

## Tabella dei contenuti <!-- omit in toc -->

> [!NOTE]
> Per informazioni sulla configurazione della repository per avviare l'app in locale consultare le [istruzioni](./INSTRUCTIONS.md).

- [Architettura e struttura del progetto](#architettura-e-struttura-del-progetto)
  - [Il database](#il-database)
  - [Il backend](#il-backend)
  - [Il frontend](#il-frontend)
- [Note di sviluppo](#note-di-sviluppo)
- [Risoluzione dei problemi](#risoluzione-dei-problemi)

## Architettura e struttura del progetto

Il progetto si suddivide in tre parti principali: database, backend e frontend. Diagramma rappresentativo in [`high-level-architecture.md`](./docs/high-level-architecture.md) (oppure riportato quà sotto).

```mermaid
flowchart TD
    User((Utente)) --> Frontend[Frontend - Javascript]
    Frontend <-->|Auth / JWT| Auth[Supabase Auth]
    Frontend <-->|Richiesta + JWT / Risposta JSON| Backend[Backend - Python]
    Backend <-->|Prompt / JSON| AI[Mistral AI]
    Backend <-->|Query SQL / Dati| Database[(Supabase Database - PostgreSQL)]

    style Frontend fill:#FFE599,stroke:#333,stroke-width:1.5px
    style Backend fill:#B6D7A8,stroke:#333,stroke-width:1.5px
    style Database fill:#F9CB9C,stroke:#333,stroke-width:1.5px
    style Auth fill:#F9AB9C,stroke:#333,stroke-width:1.5px
    style User fill:#ABD2FA,stroke:#333,stroke-width:1.5px
    style AI fill:#FF62AD,stroke:#333,stroke-width:1.5px
```

Il flusso generale dell'applicazione è:
1. Validazione dell'utente da parte del frontend: Il frontend ottiene il JWT da Supabase
2. Dopo aver ottenuto il JWT il frontend effettua tutte le chiamate necessarie alle rotte del backend (creazione, ottenimento, modifica, eliminazione)
3. Il backend poi interpreterà la richiesta del client e la soddisferà (query su database o uso AI) 
4. Infine il frontend otterrà i dati richiesti e li interpreterà

### Il database

Il database è ospitato su Supabase contiene quattro entità principali:
- `user_profile`: Entità che raggruppa un insieme di persone fisiche registrate
- `account`: Entità che raggruppa un insieme di movimenti correlati
- `transaction`: Entità che rappresenta una transazione
- `category`: Entità che raggruppa un insieme di movimenti correlati. Può essere predefinita o creata dall'utente

Per un riferimento grafico ecco lo [schema E-R](https://docs.google.com/drawings/d/17DGczBNJ1Bi9Ii_ux6JzthXio1NgncwWv75dBQOGBaA/edit?usp=sharing) creato in fase di progettazione del database:

![img](./docs/database/SM-DB%20_SchemaER_v1-2.svg)


### Il backend 

Il backend in Python è suddiviso in tre "packages" principali:
- `models`: dichiara tutti i modelli delle tabelle nel database oltre che quelli che le richieste HTTP devono rispettare
- `routes`: definisce le rotte per la gestione delle entità del database 
- `services`: contiene l'implementazione della logica di ogni singola rotta

A servizio di questi packages principali ci sono anche:
- `utils`: che contiene varie utilità quali `getCurrentUser` ad esempio che permette l'ottenimento dell'identificativo di un utente dopo un controllo della validita del JWT
- `config`: che contiene alcuni parametri di configurazione come rate-limits, modelli specifici di IA da usare o i prompt di sistema per l'IA


### Il frontend

Dal punto di vista organizzativo suddiviso per: pagine, script e stili. Contiene tutto il codice necessario al funzionamento della UI, inclusa la logica di comunicazione con il backend con previo ottenimento del JWT. 

La UI è suddivisa in varie pagine:
- **Dashboard**: è la pagina principale dell'app con il calcolo del saldo dei conti inclusi nel saldo generale e un grafico che mostra entrate e uscite delle rispettive categorie
- **Transazioni**: la pagina dove è possibile consultare, modificare ed eliminare tutte le transazioni inserite
- **Categorie**: una pagina dedicata alla gestione delle categorie (default e non)
- **Conti**: la pagina dedicata alla gestione dei conti con possibilità di modifica ed eliminazione oltre che al calcolo del saldo tra conti selezionati
- **Profilo**: ovvero la pagina di gestione del profilo utente
- **Informazioni**: informazioni generali sull'applicazione e sulle risorse utilizzate


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

**Rate-limit:**
Dopo svariate richieste consecutive è possibile si vada in contro al raggiungimento del rate-limit del backend in tal caso ci si può trovare davanti a errori come "Errore AI: Si è verificato un problema".
