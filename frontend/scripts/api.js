// api.js — Wrapper centralizzato per tutte le chiamate al backend
// Il backend gira su localhost:8000, il frontend su localhost:3000

const BACKEND_URL = "http://localhost:8000";

// Recupera il token JWT salvato in localStorage (messo da auth.js)
function getToken() {
    return localStorage.getItem("sb_access_token");
}

// Funzione base per fare fetch con Authorization header
// method: "GET", "POST", "PUT", "DELETE"
// body: oggetto JS (viene convertito in JSON automaticamente)
async function apiFetch(path, method, body) {
    const token = getToken();

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

    var response = await fetch(BACKEND_URL + path, options);

    if (!response.ok) {
        var errorData = await response.json().catch(function () { return {}; });
        var message = (errorData.detail) ? errorData.detail : "Errore " + response.status;
        throw new Error(message);
    }

    // DELETE restituisce spesso body vuoto, gestiamolo
    var text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
}

// Versione speciale per upload file (multipart/form-data — scan ricevuta)
async function apiFetchFile(path, formData) {
    const token = getToken();

    var options = {
        method: "POST",
        headers: {},
        body: formData,
    };

    if (token) {
        options.headers["Authorization"] = "Bearer " + token;
    }

    var response = await fetch(BACKEND_URL + path, options);

    if (!response.ok) {
        var errorData = await response.json().catch(function () { return {}; });
        var message = (errorData.detail) ? errorData.detail : "Errore " + response.status;
        throw new Error(message);
    }

    return await response.json();
}

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

function apiGetAccounts() {
    return apiFetch("/accounts", "GET");
}

function apiCreateAccount(name, includeInTotal) {
    return apiFetch("/accounts", "POST", {
        name: name,
        include_in_total: includeInTotal,
    });
}

function apiUpdateAccount(accountId, name, includeInTotal) {
    return apiFetch("/accounts/" + accountId, "PUT", {
        name: name,
        include_in_total: includeInTotal,
    });
}

function apiDeleteAccount(accountId, replaceWithId) {
    var path = "/accounts/" + accountId;
    if (replaceWithId) {
        path += "?replace_with=" + replaceWithId;
    }
    return apiFetch(path, "DELETE");
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

function apiGetCategories() {
    return apiFetch("/categories", "GET");
}

function apiCreateCategory(name, type, description) {
    return apiFetch("/categories", "POST", {
        name: name,
        type: type,
        description: description || null,
    });
}

function apiUpdateCategory(categoryId, name, type, description) {
    return apiFetch("/categories/" + categoryId, "PUT", {
        name: name,
        type: type,
        description: description || null,
    });
}

function apiDeleteCategory(categoryId, replaceWithId) {
    var path = "/categories/" + categoryId;
    if (replaceWithId) {
        path += "?replace_with=" + replaceWithId;
    }
    return apiFetch(path, "DELETE");
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

// filters: oggetto con campi opzionali { startDate, endDate, categoryId, accountId, type }
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
    var path = "/transactions" + (query ? "?" + query : "");
    return apiFetch(path, "GET");
}

function apiCreateTransaction(data) {
    // data: { type, amount, date, account_id, category_id, description }
    return apiFetch("/transactions", "POST", data);
}

function apiUpdateTransaction(transactionId, data) {
    return apiFetch("/transactions/" + transactionId, "PUT", data);
}

function apiDeleteTransaction(transactionId) {
    return apiFetch("/transactions/" + transactionId, "DELETE");
}

// ── USER PROFILE ──────────────────────────────────────────────────────────────

function apiGetUser() {
    return apiFetch("/users", "GET");
}

function apiCreateUser(displayName, email) {
    return apiFetch("/users", "POST", {
        display_name: displayName,
        email: email,
    });
}

function apiUpdateUser(displayName, email) {
    return apiFetch("/users", "PUT", {
        display_name: displayName,
        email: email,
    });
}

// ── AI ────────────────────────────────────────────────────────────────────────

function apiQuickInsert(text) {
    return apiFetch("/quick-insert", "POST", { text: text });
}

function apiScanReceipt(imageFile) {
    var formData = new FormData();
    formData.append("file", imageFile);
    return apiFetchFile("/scan-receipt", formData);
}
