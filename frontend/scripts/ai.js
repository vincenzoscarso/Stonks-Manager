// ai.js — Modal AI: Inserimento Rapido e Scansione Scontrino
// Ogni modal ha errori completamente isolati dall'altro.

// ── INSERIMENTO RAPIDO ────────────────────────────────────────────────────────

function openQuickInsertModal() {
    // Chiudi l'altro modal AI se fosse aperto
    document.getElementById("ai-scan-receipt-modal").classList.remove("visible");
    document.getElementById("ai-scan-receipt-modal").style.display = "none";

    var modal = document.getElementById("ai-quick-insert-modal");
    modal.style.display = "flex";
    modal.classList.add("visible");
    document.getElementById("quick-insert-text").focus();
}

function closeQuickInsertModal() {
    var modal = document.getElementById("ai-quick-insert-modal");
    modal.style.display = "none";
    modal.classList.remove("visible");
}

async function runQuickInsert() {
    const input   = document.getElementById("quick-insert-text");
    const text    = input.value.trim();
    const btn     = document.getElementById("btn-quick-insert");
    const loading = document.getElementById("quick-insert-loading");
    const errorDiv = document.getElementById("quick-insert-error"); // errore ISOLATO

    if (!text) return;

    // Validazione lunghezza prompt
    if (text.length > 256) {
        errorDiv.innerText = "Il messaggio è troppo lungo (max 256 caratteri).";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    btn.disabled = true;
    loading.style.display = "inline";

    try {
        const result = await apiQuickInsert(text);

        // Chiudi il modal AI e apri il modal transazione pre-popolato
        closeQuickInsertModal();
        openTransactionModal("add", {
            type:        result.type,
            amount:      result.amount,
            date:        result.date ? result.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category_id: result.category_id,
            account_id:  result.account_id,
            description: result.description
        });

        input.value = "";
    } catch (err) {
        errorDiv.innerText = "Errore AI: " + err.message;
        errorDiv.style.display = "block";
    } finally {
        btn.disabled = false;
        loading.style.display = "none";
    }
}

// ── SCANSIONE SCONTRINO ───────────────────────────────────────────────────────

function openScanReceiptModal() {
    // Chiudi l'altro modal AI se fosse aperto
    document.getElementById("ai-quick-insert-modal").classList.remove("visible");
    document.getElementById("ai-quick-insert-modal").style.display = "none";

    var modal = document.getElementById("ai-scan-receipt-modal");
    modal.style.display = "flex";
    modal.classList.add("visible");
}

function closeScanReceiptModal() {
    var modal = document.getElementById("ai-scan-receipt-modal");
    modal.style.display = "none";
    modal.classList.remove("visible");
}

async function runScanReceipt() {
    const fileInput = document.getElementById("receipt-file");
    const btn       = document.getElementById("btn-scan-receipt");
    const loading   = document.getElementById("scan-receipt-loading");
    const errorDiv  = document.getElementById("scan-receipt-error"); // errore ISOLATO

    if (!fileInput.files || fileInput.files.length === 0) {
        errorDiv.innerText = "Seleziona prima un'immagine.";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    btn.disabled = true;
    loading.style.display = "inline";

    try {
        const result = await apiScanReceipt(fileInput.files[0]);

        // Chiudi il modal AI e apri il modal transazione pre-popolato
        closeScanReceiptModal();
        openTransactionModal("add", {
            type:        result.type || "expense",
            amount:      result.amount,
            date:        result.date ? result.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category_id: result.category_id,
            account_id:  result.account_id,
            description: result.description || "Scansione ricevuta"
        });

        fileInput.value = ""; // reset file input
    } catch (err) {
        errorDiv.innerText = "Errore scansione: " + err.message;
        errorDiv.style.display = "block";
    } finally {
        btn.disabled = false;
        loading.style.display = "none";
    }
}

// ── CHAR COUNTER QUICK INSERT ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    var aiText = document.getElementById("quick-insert-text");
    if (aiText) {
        aiText.addEventListener("input", function () {
            var count = document.getElementById("ai-char-count");
            if (count) count.textContent = aiText.value.length;
        });
    }
});
