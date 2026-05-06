// api.js — Centralized wrapper for all backend calls
// Automatically detect IP to allow phone operation on the same network
const BACKEND_HOST = window.location.hostname || "localhost";
const BACKEND_URL = `http://${BACKEND_HOST}:8000`;
const API_PREFIX  = "/api";   // prefix for accounts, categories, transactions, users
const AI_PREFIX   = "/ai";    // prefix for quick-insert, scan-receipt

// Retrieve JWT token, proactively refreshing it if needed via Supabase SDK
async function getToken() {
    if (window.sbClient && window.sbClient.auth) {
        const { data, error } = await window.sbClient.auth.getSession();
        if (data && data.session) {
            localStorage.setItem("sb_access_token", data.session.access_token);
            return data.session.access_token;
        }
    }
    return localStorage.getItem("sb_access_token");
}

// Base function to fetch with Authorization header
// method: "GET", "POST", "PUT", "DELETE"
// body: JS object (automatically converted to JSON)
async function apiFetch(path, method, body) {
    const token = await getToken();

    var options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
    };

    if (token) {
        options.headers["Authorization"] = "Bearer " + token;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    var response;
    try {
        response = await fetch(BACKEND_URL + path, options);
    } catch (networkErr) {
        // Network error (server offline, timeout, CORS, etc.)
        throw new Error("Impossibile contattare il server. Controlla la connessione.");
    }

    if (!response.ok) {
        // Global Auth Error Handling
        if (response.status === 401 || response.status === 403) {
            var banner = document.getElementById("global-auth-error");
            if (banner) banner.style.display = "flex";
            throw new Error("Sessione scaduta. Effettua nuovamente l'accesso.");
        }

        var errorData = await response.json().catch(function () { return {}; });

        // Rate Limit
        if (response.status === 429) {
            throw new Error("⚠️ Limite di richieste raggiunto. Riprova tra qualche minuto.");
        }
        // Timeout / AI service not available
        if (response.status === 503 || response.status === 504) {
            throw new Error("Servizio AI non disponibile, riprova tra qualche istante.");
        }

        var message = (errorData.detail) ? errorData.detail : "Errore " + response.status;
        throw new Error(message);
    }

    // DELETE often returns empty body, handle it
    var text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
}

// Special version for file upload (multipart/form-data — scan receipt)
async function apiFetchFile(path, formData) {
    const token = await getToken();

    var options = {
        method: "POST",
        headers: {},
        body: formData,
    };

    if (token) {
        options.headers["Authorization"] = "Bearer " + token;
    }

    var response;
    try {
        response = await fetch(BACKEND_URL + path, options);
    } catch (networkErr) {
        throw new Error("Impossibile contattare il server. Controlla la connessione.");
    }

    if (!response.ok) {
        // Global Auth Error Handling
        if (response.status === 401 || response.status === 403) {
            var banner = document.getElementById("global-auth-error");
            if (banner) banner.style.display = "flex";
            throw new Error("Sessione scaduta. Effettua nuovamente l'accesso.");
        }

        var errorData = await response.json().catch(function () { return {}; });

        // Rate Limit
        if (response.status === 429) {
            throw new Error("⚠️ Limite di richieste raggiunto. Riprova tra qualche minuto.");
        }
        // Timeout / AI service not available
        if (response.status === 503 || response.status === 504) {
            throw new Error("Servizio AI non disponibile, riprova tra qualche istante.");
        }

        var message = (errorData.detail) ? errorData.detail : "Errore " + response.status;
        throw new Error(message);
    }

    return await response.json();
}

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

function apiGetAccounts() {
    return apiFetch(API_PREFIX + "/accounts", "GET");
}

function apiCreateAccount(name, includeInTotal) {
    return apiFetch(API_PREFIX + "/accounts", "POST", {
        name: name,
        include_in_total: includeInTotal,
    });
}

function apiUpdateAccount(accountId, name, includeInTotal) {
    return apiFetch(API_PREFIX + "/accounts/" + accountId, "PUT", {
        name: name,
        include_in_total: includeInTotal,
    });
}

function apiDeleteAccount(accountId, replaceWithId) {
    var path = API_PREFIX + "/accounts/" + accountId;
    if (replaceWithId) {
        path += "?replace_with=" + replaceWithId;
    }
    return apiFetch(path, "DELETE");
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

function apiGetCategories() {
    return apiFetch(API_PREFIX + "/categories", "GET");
}

function apiCreateCategory(name, type, description) {
    return apiFetch(API_PREFIX + "/categories", "POST", {
        name: name,
        type: type,
        description: description || null,
    });
}

function apiUpdateCategory(categoryId, name, type, description) {
    return apiFetch(API_PREFIX + "/categories/" + categoryId, "PUT", {
        name: name,
        type: type,
        description: description || null,
    });
}

function apiDeleteCategory(categoryId, replaceWithId) {
    var path = API_PREFIX + "/categories/" + categoryId;
    if (replaceWithId) {
        path += "?replace_with=" + replaceWithId;
    }
    return apiFetch(path, "DELETE");
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

// filters: object with optional fields { startDate, endDate, categoryId, accountId, type }
function apiGetTransactions(filters) {
    var params = new URLSearchParams();
    if (filters) {
        if (filters.startDate)  params.append("start_date",  filters.startDate);
        if (filters.endDate)    params.append("end_date",    filters.endDate);
        if (filters.categoryId) params.append("category_id", filters.categoryId);
        if (filters.accountId)  params.append("account_id",  filters.accountId);
        if (filters.type)       params.append("type",        filters.type);
    }
    var query = params.toString();
    var path = API_PREFIX + "/transactions" + (query ? "?" + query : "");
    return apiFetch(path, "GET");
}

function apiCreateTransaction(data) {
    // data: { type, amount, date, account_id, category_id, description }
    return apiFetch(API_PREFIX + "/transactions", "POST", data);
}

function apiUpdateTransaction(transactionId, data) {
    return apiFetch(API_PREFIX + "/transactions/" + transactionId, "PUT", data);
}

function apiDeleteTransaction(transactionId) {
    return apiFetch(API_PREFIX + "/transactions/" + transactionId, "DELETE");
}

// ── USER PROFILE ──────────────────────────────────────────────────────────────

function apiGetUser() {
    return apiFetch(API_PREFIX + "/users", "GET");
}

function apiCreateUser(displayName, email) {
    return apiFetch(API_PREFIX + "/users", "POST", {
        display_name: displayName,
        email: email,
    });
}

function apiUpdateUser(displayName, email) {
    return apiFetch(API_PREFIX + "/users", "PUT", {
        display_name: displayName,
        email: email,
    });
}

function apiDeleteUser() {
    return apiFetch(API_PREFIX + "/users", "DELETE");
}

// ── AI ────────────────────────────────────────────────────────────────────────

function apiQuickInsert(text) {
    return apiFetch(AI_PREFIX + "/quick-insert", "POST", { text: text });
}

function apiScanReceipt(imageFile) {
    var formData = new FormData();
    formData.append("file", imageFile);
    return apiFetchFile(AI_PREFIX + "/scan-receipt", formData);
}
