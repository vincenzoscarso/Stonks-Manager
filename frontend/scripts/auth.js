// auth.js — Gestione autenticazione tramite Supabase Auth JS SDK
// Il frontend ottiene il JWT direttamente da Supabase, poi lo passa al backend

// NOTA: la variabile `supabase` viene creata da supabaseClient definito inline in index.html
// (o da un piccolo blocco script che chiama createClient prima di caricare questo file)

// ── STATO GLOBALE ─────────────────────────────────────────────────────────────

var currentUser = null; // oggetto Supabase user, null se non loggato

// ── INIZIALIZZAZIONE ──────────────────────────────────────────────────────────

// Da chiamare una sola volta all'avvio dell'app (in index.html onload o DOMContentLoaded)
async function authInit() {
    var sessionResult = await window.sbClient.auth.getSession();
    var session = sessionResult.data.session;

    if (session) {
        currentUser = session.user;
        localStorage.setItem("sb_access_token", session.access_token);
        showApp();
    } else {
        showLoginSection();
    }

    // Ascolta i cambiamenti di sessione (login/logout automatici)
    window.sbClient.auth.onAuthStateChange(function (event, session) {
        if (session) {
            currentUser = session.user;
            localStorage.setItem("sb_access_token", session.access_token);
            showApp();
        } else {
            currentUser = null;
            localStorage.removeItem("sb_access_token");
            clearAppData(); // Pulisce i dati del vecchio utente
            showLoginSection();
        }
    });
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────

async function authLogin(email, password) {
    var result = await window.sbClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (result.error) {
        throw new Error(result.error.message);
    }

    return result.data;
}

// ── REGISTRAZIONE ─────────────────────────────────────────────────────────────

// displayName viene passato come metadata → il trigger SQL lo usa per creare user_profile
async function authRegister(email, password, displayName) {
    var result = await window.sbClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                display_name: displayName,
            },
        },
    });

    if (result.error) {
        throw new Error(result.error.message);
    }

    return result.data;
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────

async function authLogout() {
    await window.sbClient.auth.signOut();
    currentUser = null;
    localStorage.removeItem("sb_access_token");
    clearAppData();
    showLoginSection();
}

function clearAppData() {
    // Pulisce saldi e liste per evitare "flash" di dati del vecchio utente
    if (document.getElementById("dashboard-balance")) document.getElementById("dashboard-balance").innerText = "—";
    if (document.getElementById("transactions-cards-container")) document.getElementById("transactions-cards-container").innerHTML = "<p>Caricamento...</p>";
    if (document.getElementById("accounts-list")) document.getElementById("accounts-list").innerHTML = "";
    if (document.getElementById("categories-list")) document.getElementById("categories-list").innerHTML = "";
    
    // Distruggi il grafico se esiste (Chart.js)
    if (window.myPieChart) {
        window.myPieChart.destroy();
        window.myPieChart = null;
    }
}

// ── VISIBILITÀ SEZIONI ────────────────────────────────────────────────────────

function showLoginSection() {
    document.getElementById("section-auth").style.display = "block";
    document.getElementById("section-app").style.display = "none";
}

function showApp() {
    document.getElementById("section-auth").style.display = "none";
    document.getElementById("section-app").style.display = "block";
    // Carica tutti i dati iniziali quando l'utente è loggato
    appInit();
}
