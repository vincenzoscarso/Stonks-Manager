## Frontend
L'interfaccia è suddivisa in tre macro blocchi:
1. il primo dedicato esclusivamente alla struttura delle pagine in HTML
2. il secondo contenente invece tutti gli stili e la formattazione degli elementi in CSS
3. e il terzo, il JavaScript, che riguarda invece la logica effettiva dell'interfaccia 

Nel JavaScript dell'interfaccia vediamo quattro file principali che svolgono le funzioni base e fondamentali al funzionamento. Questi sono `auth.js`, `app.js`, `api.js` e `ui_logic.js`.

### `auth.js`
In questo file è contenuta la logica per:
- la registrazione e l'accesso di un utente sia per l'interfaccia sia per la logica, che prevedono entrambi un collegamento al database per l'ottenimento del Json Web Token
- la gestione del profilo utente: cambio del nome visualizzato e eliminazione dell'account
- la logica di visualizzazione dell'app al login o della sua occultazione al logout

### `app.js`
Lo script principale contiene la logica per il caricamento dell'applicazione e alcune utility generiche.

### `api.js`
Si occupa dell'implementazione API del backend, all'interno di questo file vediamo:
- due funzioni principali `apiFetch()` e `apiFetchFile()` che impacchettano e inviano una richiesta HTTP al server con tanto di JWT (Json Web Token) come parametro di `Authorization` per permettere l'autenticazione
- le implementazioni API effettive del backend coprendo le principali operazioni CRUD (Create, Read, Update, Delete) per i vari elementi (utenti, categorie, transazioni, ...)

### `ui_logic.js`
Gestisce la logica generale dell'interfaccia:
- gestione della sidebar 
- gestione delle pagine tra cui: visualizzazione/occultamento
- gestione del modal delle transazioni:
  - mostra/nascondi
  - validazione dei dati
  - visualizzazione degli errori

---

Vediamo inoltre altri cinque file JavaScript che contengono codice relativo alla visualizzazione dinamica delle varie pagine. Vediamo quindi:
- `dashboard.js`: per la gestione della pagina principale con il saldo generale e il grafico
- `ai.js`: per la gestione dei modal dedicati all'inserimento intelligente tramite IA
- `transactions.js`: per la pagina di visualizzazione e modifica delle transazioni
- `categories.js`: per la pagina di gestione delle categorie
- `accounts.js`: per la pagina di gestione dei conti
