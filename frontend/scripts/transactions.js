// transactions.js — Gestione transazioni: CRUD, storico, filtri

// ── STATO ─────────────────────────────────────────────────────────────────────

// allTransactions è definita in accounts.js per condivisione, ma la carichiamo qui
// La variabile è: allTransactions = []

// ── CARICAMENTO ───────────────────────────────────────────────────────────────

async function loadTransactions(filters) {
    try {
        allTransactions = await apiGetTransactions(filters || null);
        renderTransactionsTable(allTransactions);
        renderAccountsList(); // aggiorna i saldi mostrati
        updateDashboard();    // aggiorna il grafico e il saldo globale
    } catch (err) {
        showError("transactions-error", err.message);
    }
}

// ── RENDER TABELLA STORICO ────────────────────────────────────────────────────

function renderTransactionsTable(transactions) {
    var tbody = document.getElementById("transactions-tbody");
    tbody.innerHTML = "";

    if (transactions.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7'>Nessuna transazione trovata.</td></tr>";
        return;
    }

    // Ordina per data decrescente (più recente prima)
    var sorted = transactions.slice().sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    sorted.forEach(function (t) {
        var catName = getCategoryName(t.category_id);
        var accName = getAccountName(t.account_id);
        var dateStr = formatDate(t.date);
        var sign = (t.type === "income") ? "+" : "-";
        var amountStr = sign + formatCurrency(parseFloat(t.amount));

        var tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + dateStr + "</td>" +
            "<td>" + t.type + "</td>" +
            "<td>" + escapeHtml(catName) + "</td>" +
            "<td>" + amountStr + "</td>" +
            "<td>" + escapeHtml(accName) + "</td>" +
            "<td>" + escapeHtml(t.description || "") + "</td>" +
            "<td>" +
            "<button onclick=\"openEditTransaction('" + t.id + "')\">Modifica</button> " +
            "<button onclick=\"deleteTransaction('" + t.id + "')\">Elimina</button>" +
            "</td>";
        tbody.appendChild(tr);
    });
}

// ── FILTRI ────────────────────────────────────────────────────────────────────

function applyTransactionFilters() {
    var startDate  = document.getElementById("filter-start-date").value || null;
    var endDate    = document.getElementById("filter-end-date").value || null;
    var categoryId = document.getElementById("filter-category").value || null;
    var accountId  = document.getElementById("filter-account").value || null;
    var type       = document.getElementById("filter-type").value || null;

    loadTransactions({ startDate, endDate, categoryId, accountId, type });
}

function resetTransactionFilters() {
    document.getElementById("filter-start-date").value = "";
    document.getElementById("filter-end-date").value = "";
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-account").value = "";
    document.getElementById("filter-type").value = "";
    loadTransactions();
}

// ── AGGIUNGI TRANSAZIONE (form manuale) ───────────────────────────────────────

async function submitNewTransaction() {
    var type        = document.querySelector("input[name='tx-type']:checked");
    var amount      = document.getElementById("tx-amount").value;
    var date        = document.getElementById("tx-date").value;
    var categoryId  = document.getElementById("tx-category").value;
    var accountId   = document.getElementById("tx-account").value;
    var description = document.getElementById("tx-description").value.trim();

    if (!type) {
        showError("tx-error", "Seleziona Entrata o Uscita.");
        return;
    }
    if (!amount || parseFloat(amount) <= 0) {
        showError("tx-error", "Inserisci un importo valido (maggiore di 0).");
        return;
    }
    if (!date) {
        showError("tx-error", "Inserisci una data.");
        return;
    }
    if (!categoryId) {
        showError("tx-error", "Seleziona una categoria.");
        return;
    }
    if (!accountId) {
        showError("tx-error", "Seleziona un conto.");
        return;
    }

    var data = {
        type:        type.value,
        amount:      parseFloat(amount),
        date:        date,             // es. "2025-03-15" — il backend accetta TIMESTAMPTZ
        category_id: categoryId,
        account_id:  accountId,
        description: description || null,
    };

    try {
        await apiCreateTransaction(data);
        clearError("tx-error");
        resetNewTransactionForm();
        await loadTransactions();
    } catch (err) {
        showError("tx-error", err.message);
    }
}

function resetNewTransactionForm() {
    // Imposta la data di default a oggi
    document.getElementById("tx-date").value = getTodayString();
    document.getElementById("tx-amount").value = "";
    document.getElementById("tx-category").value = "";
    document.getElementById("tx-account").value = "";
    document.getElementById("tx-description").value = "";
}

// ── MODIFICA TRANSAZIONE ──────────────────────────────────────────────────────

function openEditTransaction(transactionId) {
    var t = allTransactions.find(function (tx) { return tx.id === transactionId; });
    if (!t) return;

    document.getElementById("edit-tx-id").value = t.id;
    document.getElementById("edit-tx-amount").value = t.amount;
    // Imposta il radio corretto
    var radios = document.querySelectorAll("input[name='edit-tx-type']");
    radios.forEach(function (r) { r.checked = (r.value === t.type); });
    // Popola la select categoria filtrata per il tipo della transazione
    renderEditCategorySelect(t.type, t.category_id);
    document.getElementById("edit-tx-account").value = t.account_id;
    // Converti la data ISO in formato YYYY-MM-DD per l'input date
    document.getElementById("edit-tx-date").value = t.date.substring(0, 10);
    document.getElementById("edit-tx-description").value = t.description || "";

    document.getElementById("edit-tx-form").style.display = "block";
}

function renderEditCategorySelect(type, selectedId) {
    var sel = document.getElementById("edit-tx-category");
    sel.innerHTML = "<option value=''>-- Seleziona categoria --</option>";
    allCategories.forEach(function (cat) {
        if (cat.type === type) {
            var opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name;
            sel.appendChild(opt);
        }
    });
    if (selectedId) sel.value = selectedId;
}

async function submitEditTransaction() {
    var id          = document.getElementById("edit-tx-id").value;
    var type        = document.querySelector("input[name='edit-tx-type']:checked");
    var amount      = document.getElementById("edit-tx-amount").value;
    var date        = document.getElementById("edit-tx-date").value;
    var categoryId  = document.getElementById("edit-tx-category").value;
    var accountId   = document.getElementById("edit-tx-account").value;
    var description = document.getElementById("edit-tx-description").value.trim();

    if (!type || !amount || !date || !categoryId || !accountId) {
        showError("tx-error", "Compila tutti i campi obbligatori.");
        return;
    }

    var data = {
        type:        type.value,
        amount:      parseFloat(amount),
        date:        date,
        category_id: categoryId,
        account_id:  accountId,
        description: description || null,
    };

    try {
        await apiUpdateTransaction(id, data);
        document.getElementById("edit-tx-form").style.display = "none";
        clearError("tx-error");
        await loadTransactions();
    } catch (err) {
        showError("tx-error", err.message);
    }
}

function cancelEditTransaction() {
    document.getElementById("edit-tx-form").style.display = "none";
}

// ── ELIMINA TRANSAZIONE ───────────────────────────────────────────────────────

async function deleteTransaction(transactionId) {
    if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

    try {
        await apiDeleteTransaction(transactionId);
        await loadTransactions();
    } catch (err) {
        showError("transactions-error", err.message);
    }
}

// ── UTILITY ───────────────────────────────────────────────────────────────────

function getCategoryName(categoryId) {
    var cat = allCategories.find(function (c) { return c.id === categoryId; });
    return cat ? cat.name : categoryId;
}

function getAccountName(accountId) {
    var acc = allAccounts.find(function (a) { return a.id === accountId; });
    return acc ? acc.name : accountId;
}
