// ai.js — Inserimento intelligente e scan ricevuta (AI)

// ── INSERIMENTO INTELLIGENTE (Quick Insert) ───────────────────────────────────

// Stato dell'anteprima (la risposta AI prima della conferma)
var quickInsertPreview = null;

async function runQuickInsert() {
    var text = document.getElementById("quick-insert-text").value.trim();
    if (!text) {
        showError("ai-error", "Scrivi qualcosa prima di premere Analizza.");
        return;
    }

    clearError("ai-error");
    document.getElementById("quick-insert-preview").style.display = "none";
    document.getElementById("quick-insert-loading").style.display = "inline";

    try {
        var result = await apiQuickInsert(text);
        document.getElementById("quick-insert-loading").style.display = "none";
        quickInsertPreview = result;
        showQuickInsertPreview(result);
    } catch (err) {
        document.getElementById("quick-insert-loading").style.display = "none";
        showError("ai-error", "Errore AI: " + err.message);
    }
}

// Mostra l'anteprima restituita dall'AI in campi modificabili prima della conferma
function showQuickInsertPreview(result) {
    // Popola i campi di anteprima con i dati restituiti dall'AI
    // result atteso: { type, amount, date, category_id, description }
    var typeRadios = document.querySelectorAll("input[name='qi-type']");
    typeRadios.forEach(function (r) {
        r.checked = (r.value === result.type);
    });

    document.getElementById("qi-amount").value   = result.amount   || "";
    document.getElementById("qi-date").value     = (result.date ? result.date.substring(0, 10) : getTodayString());
    document.getElementById("qi-description").value = result.description || "";

    // Popola la select categoria con il valore suggerito dall'AI
    var catSel = document.getElementById("qi-category");
    catSel.innerHTML = "<option value=''>-- Seleziona categoria --</option>";
    allCategories.forEach(function (cat) {
        var opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name + " (" + cat.type + ")";
        catSel.appendChild(opt);
    });
    if (result.category_id) catSel.value = result.category_id;

    // Popola la select conto
    var accSel = document.getElementById("qi-account");
    accSel.innerHTML = "<option value=''>-- Seleziona conto --</option>";
    allAccounts.forEach(function (acc) {
        var opt = document.createElement("option");
        opt.value = acc.id;
        opt.textContent = acc.name;
        accSel.appendChild(opt);
    });
    if (result.account_id) accSel.value = result.account_id;

    document.getElementById("quick-insert-preview").style.display = "block";
}

async function confirmQuickInsert() {
    var type        = document.querySelector("input[name='qi-type']:checked");
    var amount      = document.getElementById("qi-amount").value;
    var date        = document.getElementById("qi-date").value;
    var categoryId  = document.getElementById("qi-category").value;
    var accountId   = document.getElementById("qi-account").value;
    var description = document.getElementById("qi-description").value.trim();

    if (!type || !amount || !date || !categoryId || !accountId) {
        showError("ai-error", "Completa tutti i campi obbligatori prima di confermare.");
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
        await apiCreateTransaction(data);
        clearError("ai-error");
        document.getElementById("quick-insert-text").value = "";
        document.getElementById("quick-insert-preview").style.display = "none";
        quickInsertPreview = null;
        await loadTransactions();
    } catch (err) {
        showError("ai-error", "Errore salvataggio: " + err.message);
    }
}

function cancelQuickInsert() {
    document.getElementById("quick-insert-preview").style.display = "none";
    quickInsertPreview = null;
}

// ── SCAN RICEVUTA ─────────────────────────────────────────────────────────────

var scanReceiptPreview = null;

async function runScanReceipt() {
    var fileInput = document.getElementById("receipt-file");
    if (!fileInput.files || fileInput.files.length === 0) {
        showError("ai-error", "Seleziona un'immagine della ricevuta.");
        return;
    }

    clearError("ai-error");
    document.getElementById("scan-receipt-preview").style.display = "none";
    document.getElementById("scan-receipt-loading").style.display = "inline";

    try {
        var result = await apiScanReceipt(fileInput.files[0]);
        document.getElementById("scan-receipt-loading").style.display = "none";
        scanReceiptPreview = result;
        showScanReceiptPreview(result);
    } catch (err) {
        document.getElementById("scan-receipt-loading").style.display = "none";
        showError("ai-error", "Errore scansione: " + err.message);
    }
}

function showScanReceiptPreview(result) {
    var typeRadios = document.querySelectorAll("input[name='sr-type']");
    typeRadios.forEach(function (r) {
        r.checked = (r.value === result.type);
    });

    document.getElementById("sr-amount").value      = result.amount || "";
    document.getElementById("sr-date").value        = (result.date ? result.date.substring(0, 10) : getTodayString());
    document.getElementById("sr-description").value = result.description || "";

    var catSel = document.getElementById("sr-category");
    catSel.innerHTML = "<option value=''>-- Seleziona categoria --</option>";
    allCategories.forEach(function (cat) {
        var opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name + " (" + cat.type + ")";
        catSel.appendChild(opt);
    });
    if (result.category_id) catSel.value = result.category_id;

    var accSel = document.getElementById("sr-account");
    accSel.innerHTML = "<option value=''>-- Seleziona conto --</option>";
    allAccounts.forEach(function (acc) {
        var opt = document.createElement("option");
        opt.value = acc.id;
        opt.textContent = acc.name;
        accSel.appendChild(opt);
    });
    if (result.account_id) accSel.value = result.account_id;

    document.getElementById("scan-receipt-preview").style.display = "block";
}

async function confirmScanReceipt() {
    var type        = document.querySelector("input[name='sr-type']:checked");
    var amount      = document.getElementById("sr-amount").value;
    var date        = document.getElementById("sr-date").value;
    var categoryId  = document.getElementById("sr-category").value;
    var accountId   = document.getElementById("sr-account").value;
    var description = document.getElementById("sr-description").value.trim();

    if (!type || !amount || !date || !categoryId || !accountId) {
        showError("ai-error", "Completa tutti i campi obbligatori prima di confermare.");
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
        await apiCreateTransaction(data);
        clearError("ai-error");
        document.getElementById("receipt-file").value = "";
        document.getElementById("scan-receipt-preview").style.display = "none";
        scanReceiptPreview = null;
        await loadTransactions();
    } catch (err) {
        showError("ai-error", "Errore salvataggio: " + err.message);
    }
}

function cancelScanReceipt() {
    document.getElementById("scan-receipt-preview").style.display = "none";
    scanReceiptPreview = null;
}
