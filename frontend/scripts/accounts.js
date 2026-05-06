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
        div.className = "transaction-card";
        div.dataset.id = account.id;

        var topDiv = document.createElement("div");
        topDiv.className = "card-top";
        topDiv.innerHTML = "<span class='card-category'>" + escapeHtml(account.name) + "</span>";

        var descDiv = document.createElement("div");
        descDiv.className = "card-description";
        descDiv.innerHTML = "Incluso nel totale globale: <strong>" + (account.include_in_total ? "Sì" : "No") + "</strong>";

        var bottomDiv = document.createElement("div");
        bottomDiv.className = "card-bottom";
        var amountClass = balance >= 0 ? "income" : "expense";
        bottomDiv.innerHTML = "<span class='card-amount " + amountClass + "'>" + formatCurrency(balance) + "</span>";

        var actionsDiv = document.createElement("div");
        actionsDiv.className = "card-actions";

        var editBtn = document.createElement("button");
        editBtn.className = "btn-secondary";
        editBtn.textContent = "Modifica";
        editBtn.onclick = function () { openEditAccount(account.id); };

        var delBtn = document.createElement("button");
        delBtn.className = "btn-danger";
        delBtn.textContent = "Elimina";
        delBtn.onclick = function () { openDeleteAccount(account.id); };

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);

        div.appendChild(topDiv);
        div.appendChild(descDiv);
        div.appendChild(bottomDiv);
        div.appendChild(actionsDiv);

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

// ── MODAL CONTO (CREAZIONE / MODIFICA) ────────────────────────────────────────

function openAddAccountModal() {
    document.getElementById("account-modal-title").innerText = "Nuovo Conto";
    document.getElementById("edit-account-id").value = "";
    document.getElementById("edit-account-name").value = "";
    document.getElementById("edit-account-include").checked = true;
    clearError("account-edit-error");
    var errName = document.getElementById("err-edit-account-name");
    if (errName) { errName.textContent = ""; errName.style.display = "none"; }

    document.getElementById("account-edit-modal").style.display = "flex";
}

function openEditAccount(accountId) {
    var account = allAccounts.find(function (a) { return a.id === accountId; });
    if (!account) return;

    document.getElementById("account-modal-title").innerText = "Modifica Conto";
    document.getElementById("edit-account-id").value = account.id;
    document.getElementById("edit-account-name").value = account.name;
    document.getElementById("edit-account-include").checked = account.include_in_total;
    clearError("account-edit-error");
    var errName = document.getElementById("err-edit-account-name");
    if (errName) { errName.textContent = ""; errName.style.display = "none"; }

    document.getElementById("account-edit-modal").style.display = "flex";
}

async function submitEditAccount() {
    var id = document.getElementById("edit-account-id").value;
    var name = document.getElementById("edit-account-name").value.trim();
    var includeInTotal = document.getElementById("edit-account-include").checked;

    clearError("account-edit-error");

    if (!name) {
        var errName = document.getElementById("err-edit-account-name");
        if (errName) { errName.textContent = "Il nome del conto è obbligatorio."; errName.style.display = "block"; }
        return;
    }

    try {
        if (id) {
            await apiUpdateAccount(id, name, includeInTotal);
        } else {
            await apiCreateAccount(name, includeInTotal);
        }
        document.getElementById("account-edit-modal").style.display = "none";
        await loadAccounts();
        await loadTransactions();
        updateDashboard();
    } catch (err) {
        showError("account-edit-error", err.message);
    }
}

function cancelEditAccount() {
    document.getElementById("account-edit-modal").style.display = "none";
}

// ── ELIMINA CONTO (modal overlay) ─────────────────────────────────────────────

function openDeleteAccount(accountId) {
    var account = allAccounts.find(function (a) { return a.id === accountId; });
    if (!account) return;

    document.getElementById("delete-account-id").value = accountId;
    document.getElementById("delete-account-name-label").textContent = account.name;
    clearError("account-delete-error");

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

    document.getElementById("account-delete-modal").style.display = "flex";
}

async function submitDeleteAccount() {
    var id = document.getElementById("delete-account-id").value;
    var replaceWith = document.getElementById("delete-account-replace").value || null;

    clearError("account-delete-error");

    try {
        await apiDeleteAccount(id, replaceWith);
        document.getElementById("account-delete-modal").style.display = "none";
        await loadAccounts();
        await loadTransactions();
        updateDashboard();
    } catch (err) {
        showError("account-delete-error", err.message);
    }
}

function cancelDeleteAccount() {
    document.getElementById("account-delete-modal").style.display = "none";
}
