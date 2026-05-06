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

// ── RESET COMPLETO DATI APP ───────────────────────────────────────────────────

/**
 * Pulisce TUTTI i dati e campi visibili dal DOM.
 * Chiamata al logout per evitare che i dati del vecchio utente
 * restino visibili al prossimo utente che accede.
 */
function clearAppData() {

    // ── DATI GLOBALI IN MEMORIA ──────────────────────────────────────────────
    if (typeof allAccounts !== "undefined")     allAccounts    = [];
    if (typeof allCategories !== "undefined")   allCategories  = [];
    if (typeof allTransactions !== "undefined") allTransactions = [];
    // Alias window usato da transactions.js
    window.allAccounts    = [];
    window.allCategories  = [];
    window.allTransactions = [];

    // ── UTENTE ───────────────────────────────────────────────────────────────
    var userNameEl = document.getElementById("user-display-name");
    if (userNameEl) userNameEl.textContent = "—";

    // ── DASHBOARD ────────────────────────────────────────────────────────────
    var balanceEl = document.getElementById("dashboard-balance");
    if (balanceEl) balanceEl.textContent = "—";

    var catListEl = document.getElementById("dashboard-category-list");
    if (catListEl) catListEl.innerHTML = "<p>Caricamento...</p>";

    // Distruggi grafico Chart.js se esiste
    if (window.myPieChart) { window.myPieChart.destroy(); window.myPieChart = null; }
    // Variabile usata da dashboard.js
    if (typeof pieChart !== "undefined" && pieChart) { pieChart.destroy(); pieChart = null; }

    // ── TRANSAZIONI ──────────────────────────────────────────────────────────
    var txContainer = document.getElementById("transactions-cards-container");
    if (txContainer) txContainer.innerHTML = "<p>Caricamento...</p>";

    // Reset filtri transazioni
    var filterIds = ["filter-start-date", "filter-end-date", "filter-category", "filter-account", "filter-type"];
    filterIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
    });
    if (typeof currentFilters !== "undefined") currentFilters = {};

    // ── CONTI ────────────────────────────────────────────────────────────────
    var accountsList = document.getElementById("accounts-list");
    if (accountsList) accountsList.innerHTML = "";

    var combineList = document.getElementById("accounts-combine-list");
    if (combineList) combineList.innerHTML = "";

    var combinedResult = document.getElementById("combined-balance-result");
    if (combinedResult) combinedResult.textContent = "—";

    // Reset form nuovo conto
    var newAccName = document.getElementById("new-account-name");
    if (newAccName) newAccName.value = "";
    var newAccInclude = document.getElementById("new-account-include");
    if (newAccInclude) newAccInclude.checked = true;

    // Chiudi e svuota modal modifica conto
    var editAccModal = document.getElementById("account-edit-modal");
    if (editAccModal) editAccModal.style.display = "none";
    ["edit-account-id", "edit-account-name"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
    });
    var editAccInclude = document.getElementById("edit-account-include");
    if (editAccInclude) editAccInclude.checked = true;

    // Chiudi e svuota modal elimina conto
    var delAccModal = document.getElementById("account-delete-modal");
    if (delAccModal) delAccModal.style.display = "none";
    var delAccId = document.getElementById("delete-account-id");
    if (delAccId) delAccId.value = "";
    var delAccLabel = document.getElementById("delete-account-name-label");
    if (delAccLabel) delAccLabel.textContent = "";
    var delAccReplace = document.getElementById("delete-account-replace");
    if (delAccReplace) delAccReplace.innerHTML = "";

    // ── CATEGORIE ────────────────────────────────────────────────────────────
    var categoriesList = document.getElementById("categories-list");
    if (categoriesList) categoriesList.innerHTML = "";

    // Reset form nuova categoria
    ["new-cat-name", "new-cat-description"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
    });
    var newCatType = document.getElementById("new-cat-type");
    if (newCatType) newCatType.value = "";

    // Chiudi e svuota modal modifica categoria
    var editCatModal = document.getElementById("category-edit-modal");
    if (editCatModal) editCatModal.style.display = "none";
    ["edit-cat-id", "edit-cat-name", "edit-cat-description"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
    });
    var editCatType = document.getElementById("edit-cat-type");
    if (editCatType) editCatType.value = "expense";
    var editCatCharCount = document.getElementById("edit-cat-char-count");
    if (editCatCharCount) editCatCharCount.textContent = "0";

    // Chiudi e svuota modal elimina categoria
    var delCatModal = document.getElementById("category-delete-modal");
    if (delCatModal) delCatModal.style.display = "none";
    var delCatId = document.getElementById("delete-cat-id");
    if (delCatId) delCatId.value = "";
    var delCatLabel = document.getElementById("delete-cat-name-label");
    if (delCatLabel) delCatLabel.textContent = "";
    var delCatReplace = document.getElementById("delete-cat-replace");
    if (delCatReplace) delCatReplace.innerHTML = "";

    // ── MODAL TRANSAZIONE ────────────────────────────────────────────────────
    var txModal = document.getElementById("transaction-modal");
    if (txModal) txModal.style.display = "none";

    // ── MODAL AI ─────────────────────────────────────────────────────────────
    var aiQuickModal = document.getElementById("ai-quick-insert-modal");
    if (aiQuickModal) aiQuickModal.style.display = "none";
    var quickText = document.getElementById("quick-insert-text");
    if (quickText) quickText.value = "";
    var quickCharCount = document.getElementById("ai-char-count");
    if (quickCharCount) quickCharCount.textContent = "0";
    var quickErr = document.getElementById("quick-insert-error");
    if (quickErr) { quickErr.textContent = ""; quickErr.style.display = "none"; }

    var aiScanModal = document.getElementById("ai-scan-receipt-modal");
    if (aiScanModal) aiScanModal.style.display = "none";
    var receiptFile = document.getElementById("receipt-file");
    if (receiptFile) receiptFile.value = "";
    var scanErr = document.getElementById("scan-receipt-error");
    if (scanErr) { scanErr.textContent = ""; scanErr.style.display = "none"; }

    // ── SELECT CONTI E CATEGORIE (svuota i dropdown) ─────────────────────────
    document.querySelectorAll(".select-account").forEach(function (sel) {
        sel.innerHTML = "<option value=''>-- Tutti i conti --</option>";
    });
    document.querySelectorAll(".select-category").forEach(function (sel) {
        sel.innerHTML = "<option value=''>-- Tutte le categorie --</option>";
    });

    // ── MESSAGGI DI ERRORE ───────────────────────────────────────────────────
    ["accounts-error", "categories-error", "transactions-error", "modal-error"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.textContent = ""; el.style.display = "none"; }
    });
    // ── PROFILO UTENTE ───────────────────────────────────────────────────────
    var profName = document.getElementById("profile-display-name");
    if (profName) profName.value = "";
    var profEmail = document.getElementById("profile-email");
    if (profEmail) profEmail.value = "";
    var profErr = document.getElementById("profile-error");
    if (profErr) { profErr.textContent = ""; profErr.style.display = "none"; }
    var profSucc = document.getElementById("profile-success");
    if (profSucc) profSucc.style.display = "none";
    
    var delProfModal = document.getElementById("profile-delete-modal");
    if (delProfModal) delProfModal.style.display = "none";

    // ── SIDEBAR E MENU ───────────────────────────────────────────────────────
    var sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");
    var overlay = document.getElementById("sidebar-overlay");
    if (overlay) overlay.classList.remove("visible");
}

// ── VISIBILITÀ SEZIONI ────────────────────────────────────────────────────────

function showLoginSection() {
    document.getElementById("section-auth").style.display = "block";
    document.getElementById("section-app").style.display = "none";
    // Nascondi il FAB group sulla pagina di login
    var fab = document.getElementById("fab-group");
    if (fab) fab.style.display = "none";
}

function showApp() {
    document.getElementById("section-auth").style.display = "none";
    document.getElementById("section-app").style.display = "block";
    // Carica tutti i dati iniziali quando l'utente è loggato
    appInit();
}

// ── GESTIONE PROFILO UTENTE ───────────────────────────────────────────────────

async function submitEditProfile() {
    var displayName = document.getElementById("profile-display-name").value.trim();
    var email = document.getElementById("profile-email").value.trim(); // sola lettura

    clearError("profile-error");
    document.getElementById("profile-success").style.display = "none";

    if (!displayName) {
        showError("profile-error", "Il nome visualizzato non può essere vuoto.");
        return;
    }

    try {
        await apiUpdateUser(displayName, email);
        document.getElementById("profile-success").style.display = "block";
        
        // Aggiorna anche l'header/sidebar se ci fosse il nome lì, oppure il currentUserProfile
        if (window.currentUserProfile) {
            window.currentUserProfile.display_name = displayName;
        }
        
        setTimeout(() => {
            document.getElementById("profile-success").style.display = "none";
        }, 3000);
    } catch (err) {
        showError("profile-error", err.message);
    }
}

function openDeleteProfileModal() {
    document.getElementById("profile-delete-modal").style.display = "flex";
}

function cancelDeleteProfile() {
    document.getElementById("profile-delete-modal").style.display = "none";
}

async function submitDeleteProfile() {
    try {
        await apiDeleteUser();
        // L'eliminazione nel backend cancellerà i dati e il record utente.
        // Dobbiamo anche sloggare l'utente da Supabase
        await authLogout();
    } catch (err) {
        document.getElementById("profile-delete-error").textContent = err.message;
        document.getElementById("profile-delete-error").style.display = "block";
    }
}
