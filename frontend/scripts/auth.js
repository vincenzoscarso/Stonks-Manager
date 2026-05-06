// auth.js — Authentication management via Supabase Auth JS SDK
// Frontend gets JWT directly from Supabase, then passes it to backend

// NOTE: `supabase` variable is created by supabaseClient defined inline in index.html
// (or by a small script block calling createClient before loading this file)

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────

var currentUser = null; // Supabase user object, null if not logged in

// ── INITIALIZATION ───────────────────────────────────────────────────────────

// Call once on app startup (in index.html onload or DOMContentLoaded)
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

    // Listen for session changes (automatic login/logout)
    window.sbClient.auth.onAuthStateChange(function (event, session) {
        if (session) {
            currentUser = session.user;
            localStorage.setItem("sb_access_token", session.access_token);
            showApp();
        } else {
            currentUser = null;
            localStorage.removeItem("sb_access_token");
            clearAppData(); // Cleans old user data
            showLoginSection();
        }
    });
}

// ── UI FORM MANAGEMENT ───────────────────────────────────────────────────────

function toggleAuthForm(mode) {
    clearError("auth-error");
    if (mode === 'register') {
        document.getElementById('form-login').style.display = 'none';
        document.getElementById('form-register').style.display = 'block';
        document.getElementById('auth-title').innerText = 'Registrati';
    } else {
        document.getElementById('form-register').style.display = 'none';
        document.getElementById('form-login').style.display = 'block';
        document.getElementById('auth-title').innerText = 'Accedi';
    }
}

async function handleLogin() {
    var email = document.getElementById("login-email").value.trim();
    var pass = document.getElementById("login-password").value;
    clearError("auth-error");
    if (!email || !pass) { showError("auth-error", "Inserisci email e password."); return; }
    try {
        await authLogin(email, pass);
    } catch (e) {
        showError("auth-error", "Login fallito: " + e.message);
    }
}

async function handleRegister() {
    var dname = document.getElementById("reg-displayname").value.trim();
    var email = document.getElementById("reg-email").value.trim();
    var pass = document.getElementById("reg-password").value;
    clearError("auth-error");
    if (!dname || !email || !pass) { showError("auth-error", "Compila tutti i campi."); return; }
    if (pass.length < 6) { showError("auth-error", "La password deve avere almeno 6 caratteri."); return; }
    try {
        await authRegister(email, pass, dname);
        document.getElementById("reg-success").style.display = "block";
        document.getElementById("reg-displayname").value = "";
        document.getElementById("reg-email").value = "";
        document.getElementById("reg-password").value = "";
    } catch (e) {
        showError("auth-error", "Errore registrazione: " + e.message);
    }
}

// ── LOGIN API ────────────────────────────────────────────────────────────────

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

// ── REGISTRATION ─────────────────────────────────────────────────────────────

// displayName is passed as metadata → SQL trigger uses it to create user_profile
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

// ── FULL APP DATA RESET ──────────────────────────────────────────────────────

/**
 * Clears ALL data and visible fields from DOM.
 * Called on logout to prevent old user data
 * from remaining visible to the next logging user.
 */
function clearAppData() {

    // ── GLOBAL IN-MEMORY DATA ────────────────────────────────────────────────────
    if (typeof allAccounts !== "undefined")     allAccounts    = [];
    if (typeof allCategories !== "undefined")   allCategories  = [];
    if (typeof allTransactions !== "undefined") allTransactions = [];
    // Window alias used by transactions.js
    window.allAccounts    = [];
    window.allCategories  = [];
    window.allTransactions = [];

    // ── USER ─────────────────────────────────────────────────────────────────────
    var userNameEl = document.getElementById("user-display-name");
    if (userNameEl) userNameEl.textContent = "—";

    // ── DASHBOARD ────────────────────────────────────────────────────────────────
    var balanceEl = document.getElementById("dashboard-balance");
    if (balanceEl) balanceEl.textContent = "—";

    var catListEl = document.getElementById("dashboard-category-list");
    if (catListEl) catListEl.innerHTML = "<p>Caricamento...</p>";

    // Destroy Chart.js graph if it exists
    if (window.myPieChart) { window.myPieChart.destroy(); window.myPieChart = null; }
    // Variable used by dashboard.js
    if (typeof pieChart !== "undefined" && pieChart) { pieChart.destroy(); pieChart = null; }

    // ── TRANSACTIONS ─────────────────────────────────────────────────────────────
    var txContainer = document.getElementById("transactions-cards-container");
    if (txContainer) txContainer.innerHTML = "<p>Caricamento...</p>";

    // Reset transaction filters
    var filterIds = ["filter-start-date", "filter-end-date", "filter-category", "filter-account", "filter-type"];
    filterIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
    });
    if (typeof currentFilters !== "undefined") currentFilters = {};

    // ── ACCOUNTS ─────────────────────────────────────────────────────────────────
    var accountsList = document.getElementById("accounts-list");
    if (accountsList) accountsList.innerHTML = "";

    var combineList = document.getElementById("accounts-combine-list");
    if (combineList) combineList.innerHTML = "";

    var combinedResult = document.getElementById("combined-balance-result");
    if (combinedResult) combinedResult.textContent = "—";

    // Reset new account form
    var newAccName = document.getElementById("new-account-name");
    if (newAccName) newAccName.value = "";
    var newAccInclude = document.getElementById("new-account-include");
    if (newAccInclude) newAccInclude.checked = true;

    // Close and clear edit account modal
    var editAccModal = document.getElementById("account-edit-modal");
    if (editAccModal) editAccModal.style.display = "none";
    ["edit-account-id", "edit-account-name"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
    });
    var editAccInclude = document.getElementById("edit-account-include");
    if (editAccInclude) editAccInclude.checked = true;

    // Close and clear delete account modal
    var delAccModal = document.getElementById("account-delete-modal");
    if (delAccModal) delAccModal.style.display = "none";
    var delAccId = document.getElementById("delete-account-id");
    if (delAccId) delAccId.value = "";
    var delAccLabel = document.getElementById("delete-account-name-label");
    if (delAccLabel) delAccLabel.textContent = "";
    var delAccReplace = document.getElementById("delete-account-replace");
    if (delAccReplace) delAccReplace.innerHTML = "";

    // ── CATEGORIES ───────────────────────────────────────────────────────────────
    var categoriesList = document.getElementById("categories-list");
    if (categoriesList) categoriesList.innerHTML = "";

    // Reset new category form
    ["new-cat-name", "new-cat-description"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
    });
    var newCatType = document.getElementById("new-cat-type");
    if (newCatType) newCatType.value = "";

    // Close and clear edit category modal
    var editCatModal = document.getElementById("category-edit-modal");
    if (editCatModal) editCatModal.style.display = "none";
    ["edit-cat-id", "edit-cat-name", "edit-cat-description"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
    });
    var editCatType = document.getElementById("edit-cat-type");
    if (editCatType) editCatType.value = "expense";
    var editCatCharCount = document.getElementById("edit-cat-char-count");
    if (editCatCharCount) editCatCharCount.textContent = "0";

    // Close and clear delete category modal
    var delCatModal = document.getElementById("category-delete-modal");
    if (delCatModal) delCatModal.style.display = "none";
    var delCatId = document.getElementById("delete-cat-id");
    if (delCatId) delCatId.value = "";
    var delCatLabel = document.getElementById("delete-cat-name-label");
    if (delCatLabel) delCatLabel.textContent = "";
    var delCatReplace = document.getElementById("delete-cat-replace");
    if (delCatReplace) delCatReplace.innerHTML = "";

    // ── TRANSACTION MODAL ────────────────────────────────────────────────────────
    var txModal = document.getElementById("transaction-modal");
    if (txModal) txModal.style.display = "none";

    // ── AI MODAL ─────────────────────────────────────────────────────────────────
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

    // ── ACCOUNTS AND CATEGORIES SELECT (clear dropdowns) ─────────────────────────
    document.querySelectorAll(".select-account").forEach(function (sel) {
        sel.innerHTML = "<option value=''>-- Tutti i conti --</option>";
    });
    document.querySelectorAll(".select-category").forEach(function (sel) {
        sel.innerHTML = "<option value=''>-- Tutte le categorie --</option>";
    });

    // ── ERROR MESSAGES ───────────────────────────────────────────────────────────
    ["accounts-error", "categories-error", "transactions-error", "modal-error"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.textContent = ""; el.style.display = "none"; }
    });
    // ── USER PROFILE ─────────────────────────────────────────────────────────────
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

    // ── SIDEBAR AND MENU ─────────────────────────────────────────────────────────
    var sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("open");
    var overlay = document.getElementById("sidebar-overlay");
    if (overlay) overlay.classList.remove("visible");
}

// ── SECTIONS VISIBILITY ──────────────────────────────────────────────────────

function showLoginSection() {
    document.getElementById("section-auth").style.display = "block";
    document.getElementById("section-app").style.display = "none";
    // Hide FAB group on login page
    var fab = document.getElementById("fab-group");
    if (fab) fab.style.display = "none";
}

function showApp() {
    document.getElementById("section-auth").style.display = "none";
    document.getElementById("section-app").style.display = "block";
    // Load all initial data when user is logged in
    appInit();
}

// ── USER PROFILE MANAGEMENT ──────────────────────────────────────────────────

async function submitEditProfile() {
    var displayName = document.getElementById("profile-display-name").value.trim();
    var email = document.getElementById("profile-email").value.trim(); // read-only

    clearError("profile-error");
    document.getElementById("profile-success").style.display = "none";

    if (!displayName) {
        showError("profile-error", "Il nome visualizzato non può essere vuoto.");
        return;
    }

    try {
        await apiUpdateUser(displayName, email);
        document.getElementById("profile-success").style.display = "block";
        
        // Update header/sidebar if name is there, or currentUserProfile
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
        // Deletion in backend will delete data and user record.
        // We must also logout user from Supabase
        await authLogout();
    } catch (err) {
        document.getElementById("profile-delete-error").textContent = err.message;
        document.getElementById("profile-delete-error").style.display = "block";
    }
}
