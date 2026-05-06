// accounts.js — Gestione conti (CRUD) e calcolo saldo combinato

// ── STATO ─────────────────────────────────────────────────────────────────────

var allAccounts = []; // array di oggetti account [{id, name, include_in_total}]
var allTransactions = []; // cache delle transazioni — popolata da transactions.js

// ── CARICAMENTO ───────────────────────────────────────────────────────────────

async function loadAccounts() {
    try {
        allAccounts = await apiGetAccounts();
        renderAccountsList();
        renderAccountSelects(); // aggiorna tutti i <select> con i conti
    } catch (err) {
        showError("accounts-error", err.message);
    }
}

// ── RENDER LISTA CONTI ────────────────────────────────────────────────────────

function renderAccountsList() {
    var container = document.getElementById("accounts-list");
    container.innerHTML = "";

    if (allAccounts.length === 0) {
        container.innerHTML = "<p>Nessun conto. Creane uno!</p>";
        return;
    }

    allAccounts.forEach(function (account) {
        var balance = calculateAccountBalance(account.id);

        var div = document.createElement("div");
        div.className = "account-item";
        div.dataset.id = account.id;

        div.innerHTML =
            "<strong>" + escapeHtml(account.name) + "</strong>" +
            " — Saldo: <span class='balance'>" + formatCurrency(balance) + "</span>" +
            " [incluso nel totale: " + (account.include_in_total ? "Sì" : "No") + "]" +
            " <button onclick=\"openEditAccount('" + account.id + "')\">Modifica</button>" +
            " <button onclick=\"openDeleteAccount('" + account.id + "')\">Elimina</button>";

        container.appendChild(div);
    });
}

// ── CALCOLO SALDO ─────────────────────────────────────────────────────────────

// Calcola il saldo di UN singolo conto sommando le sue transazioni (da cache)
// amount è sempre positivo, il segno dipende dal type
function calculateAccountBalance(accountId) {
    var balance = 0;
    allTransactions.forEach(function (t) {
        if (t.account_id === accountId) {
            if (t.type === "income") {
                balance += parseFloat(t.amount);
            } else {
                balance -= parseFloat(t.amount);
            }
        }
    });
    return balance;
}

// Calcola il saldo totale dei conti selezionati con le checkbox
function calculateCombinedBalance() {
    var checkboxes = document.querySelectorAll("#accounts-combine-list input[type=checkbox]:checked");
    var total = 0;
    checkboxes.forEach(function (cb) {
        total += calculateAccountBalance(cb.value);
    });
    document.getElementById("combined-balance-result").textContent = formatCurrency(total);
}

// Calcola il saldo GLOBALE (tutti i conti marcati include_in_total)
function calculateGlobalBalance() {
    var balance = 0;
    allAccounts.forEach(function (account) {
        if (account.include_in_total) {
            balance += calculateAccountBalance(account.id);
        }
    });
    return balance;
}

// ── RENDER CHECKBOX PER SALDO COMBINATO ───────────────────────────────────────

function renderCombineCheckboxes() {
    var container = document.getElementById("accounts-combine-list");
    container.innerHTML = "";
    allAccounts.forEach(function (account) {
        var label = document.createElement("label");
        label.innerHTML =
            "<input type='checkbox' value='" + account.id + "'> " +
            escapeHtml(account.name);
        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    });
}

// ── RENDER SELECT CONTI (usato da transactions.js e dashboard.js) ──────────────

function renderAccountSelects() {
    var selects = document.querySelectorAll(".select-account");
    selects.forEach(function (sel) {
        var currentValue = sel.value;
        sel.innerHTML = "<option value=''>-- Tutti i conti --</option>";
        allAccounts.forEach(function (account) {
            var opt = document.createElement("option");
            opt.value = account.id;
            opt.textContent = account.name;
            sel.appendChild(opt);
        });
        sel.value = currentValue; // ripristina la selezione precedente
    });

    renderCombineCheckboxes();
}

// ── CREA CONTO ────────────────────────────────────────────────────────────────

async function submitNewAccount() {
    var name = document.getElementById("new-account-name").value.trim();
    var includeInTotal = document.getElementById("new-account-include").checked;

    if (!name) {
        showError("accounts-error", "Il nome del conto è obbligatorio.");
        return;
    }

    try {
        await apiCreateAccount(name, includeInTotal);
        document.getElementById("new-account-name").value = "";
        document.getElementById("new-account-include").checked = true;
        clearError("accounts-error");
        await loadAccounts();
        await loadTransactions(); // ricarica le transazioni per aggiornare i saldi
        updateDashboard();
    } catch (err) {
        showError("accounts-error", err.message);
    }
}

// ── MODIFICA CONTO ────────────────────────────────────────────────────────────

function openEditAccount(accountId) {
    var account = allAccounts.find(function (a) { return a.id === accountId; });
    if (!account) return;

    document.getElementById("edit-account-id").value = account.id;
    document.getElementById("edit-account-name").value = account.name;
    document.getElementById("edit-account-include").checked = account.include_in_total;
    document.getElementById("edit-account-form").style.display = "block";
}

async function submitEditAccount() {
    var id = document.getElementById("edit-account-id").value;
    var name = document.getElementById("edit-account-name").value.trim();
    var includeInTotal = document.getElementById("edit-account-include").checked;

    if (!name) {
        showError("accounts-error", "Il nome del conto è obbligatorio.");
        return;
    }

    try {
        await apiUpdateAccount(id, name, includeInTotal);
        document.getElementById("edit-account-form").style.display = "none";
        clearError("accounts-error");
        await loadAccounts();
        updateDashboard();
    } catch (err) {
        showError("accounts-error", err.message);
    }
}

function cancelEditAccount() {
    document.getElementById("edit-account-form").style.display = "none";
}

// ── ELIMINA CONTO ─────────────────────────────────────────────────────────────

function openDeleteAccount(accountId) {
    var account = allAccounts.find(function (a) { return a.id === accountId; });
    if (!account) return;

    document.getElementById("delete-account-id").value = accountId;
    document.getElementById("delete-account-name-label").textContent = account.name;

    // Popola il select di sostituzione con gli altri conti
    var sel = document.getElementById("delete-account-replace");
    sel.innerHTML = "<option value=''>-- Nessuna (elimina tutte le transazioni collegate) --</option>";
    allAccounts.forEach(function (a) {
        if (a.id !== accountId) {
            var opt = document.createElement("option");
            opt.value = a.id;
            opt.textContent = a.name;
            sel.appendChild(opt);
        }
    });

    document.getElementById("delete-account-form").style.display = "block";
}

async function submitDeleteAccount() {
    var id = document.getElementById("delete-account-id").value;
    var replaceWith = document.getElementById("delete-account-replace").value || null;

    try {
        await apiDeleteAccount(id, replaceWith);
        document.getElementById("delete-account-form").style.display = "none";
        clearError("accounts-error");
        await loadAccounts();
        await loadTransactions();
        updateDashboard();
    } catch (err) {
        showError("accounts-error", err.message);
    }
}

function cancelDeleteAccount() {
    document.getElementById("delete-account-form").style.display = "none";
}
