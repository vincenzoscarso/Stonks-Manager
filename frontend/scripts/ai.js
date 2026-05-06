// ai.js — Integrazione con i servizi AI del backend (Quick Insert & Scan Receipt)

/**
 * Inserimento Rapido AI
 */
async function runQuickInsert() {
    const input = document.getElementById("quick-insert-text");
    const text = input.value.trim();
    const btn = document.getElementById("btn-quick-insert");
    const loading = document.getElementById("quick-insert-loading");
    const errorDiv = document.getElementById("ai-error");

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
        
        // Invece di mostrare un'anteprima statica, apriamo il Modal unificato
        // pre-popolato con i dati suggeriti dall'AI
        openTransactionModal("add", {
            type: result.type,
            amount: result.amount,
            date: result.date ? result.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category_id: result.category_id,
            account_id: result.account_id,
            description: result.description
        });

        input.value = ""; // pulisce l'input dopo il successo
    } catch (err) {
        errorDiv.innerText = "Errore AI: " + err.message;
        errorDiv.style.display = "block";
    } finally {
        btn.disabled = false;
        loading.style.display = "none";
    }
}

/**
 * Scansione Ricevuta AI
 */
async function runScanReceipt() {
    const fileInput = document.getElementById("receipt-file");
    const btn = document.getElementById("btn-scan-receipt");
    const loading = document.getElementById("scan-receipt-loading");
    const errorDiv = document.getElementById("ai-error");

    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Seleziona prima un'immagine.");
        return;
    }

    errorDiv.style.display = "none";
    btn.disabled = true;
    loading.style.display = "inline";

    try {
        const result = await apiScanReceipt(fileInput.files[0]);
        
        // Apriamo il Modal con i dati della ricevuta
        openTransactionModal("add", {
            type: result.type || "expense",
            amount: result.amount,
            date: result.date ? result.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category_id: result.category_id,
            account_id: result.account_id,
            description: result.description || "Scansione ricevuta"
        });

        fileInput.value = ""; // reset file input
    } catch (err) {
        errorDiv.innerText = "Errore Scansione: " + err.message;
        errorDiv.style.display = "block";
    } finally {
        btn.disabled = false;
        loading.style.display = "none";
    }
}

