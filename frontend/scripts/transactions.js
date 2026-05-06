// transactions.js — Gestione storico movimenti con visualizzazione a Card

let currentFilters = {};

/**
 * Carica le transazioni applicando i filtri attuali
 */
async function loadTransactions(filters = null) {
    if (filters) currentFilters = filters;
    
    const container = document.getElementById("transactions-cards-container");
    const errorDiv = document.getElementById("transactions-error");

    try {
        const transactions = await apiGetTransactions(currentFilters);
        // Salviamo globalmente per reference (modifica/elimina)
        window.allTransactions = transactions;
        
        renderTransactionsCards(transactions);
        
        // Aggiorna anche dashboard e conti
        if (typeof updateDashboard === "function") updateDashboard();
        if (typeof renderAccountsList === "function") renderAccountsList();
        
        if (errorDiv) errorDiv.style.display = "none";
    } catch (err) {
        if (errorDiv) {
            errorDiv.innerText = "Errore caricamento transazioni: " + err.message;
            errorDiv.style.display = "block";
        }
        container.innerHTML = "<p>Impossibile caricare i dati.</p>";
    }
}

/**
 * Renderizza la lista di transazioni come Card (seguendo lo schizzo)
 */
function renderTransactionsCards(transactions) {
    const container = document.getElementById("transactions-cards-container");
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = "<p>Nessun movimento trovato per i filtri selezionati.</p>";
        return;
    }

    // Ordina per data decrescente (più recenti in alto)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = ""; // Pulisce il container

    transactions.forEach(tx => {
        const card = document.createElement("div");
        card.className = "transaction-card";

        // Formattazione data italiana (DD/MM/YYYY)
        const dateObj = new Date(tx.date);
        const formattedDate = dateObj.toLocaleDateString("it-IT");

        // Trova nome categoria e conto
        const catName = getCategoryName(tx.category_id);
        const accName = getAccountName(tx.account_id);

        const sign = tx.type === "income" ? "+" : "-";
        const amountClass = tx.type === "income" ? "income" : "expense";

        card.innerHTML = `
            <div class="card-top">
                <div class="card-category">${catName}</div>
                <div class="card-date">${formattedDate}</div>
            </div>
            <div class="card-description">${tx.description || ""}</div>
            <div class="card-bottom">
                <div class="card-amount ${amountClass}">${sign} ${parseFloat(tx.amount).toFixed(2)} €</div>
            </div>
            <div class="card-actions">
                <button class="btn-secondary" onclick="editTransaction('${tx.id}')">Modifica</button>
                <button class="btn-danger" onclick="deleteTransaction('${tx.id}')">Elimina</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Filtri
 */
function applyTransactionFilters() {
    currentFilters = {
        startDate:  document.getElementById("filter-start-date").value || null,
        endDate:    document.getElementById("filter-end-date").value || null,
        categoryId: document.getElementById("filter-category").value || null,
        accountId:  document.getElementById("filter-account").value || null,
        type:       document.getElementById("filter-type").value || null
    };
    loadTransactions();
}

function resetTransactionFilters() {
    document.getElementById("filter-start-date").value = "";
    document.getElementById("filter-end-date").value = "";
    document.getElementById("filter-category").value = "";
    document.getElementById("filter-account").value = "";
    document.getElementById("filter-type").value = "";
    currentFilters = {};
    loadTransactions();
}

/**
 * Modifica: recupera i dati e apre il Modal
 */
async function editTransaction(id) {
    const tx = window.allTransactions.find(t => t.id === id);
    if (tx) {
        // Prepariamo i dati per il modal
        const modalData = {
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            date: tx.date.substring(0, 10), // formato YYYY-MM-DD
            category_id: tx.category_id,
            account_id: tx.account_id,
            description: tx.description
        };
        openTransactionModal("edit", modalData);
    }
}

/**
 * Elimina
 */
async function deleteTransaction(id) {
    if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

    try {
        await apiDeleteTransaction(id);
        loadAccounts(); // aggiorna saldi
        loadTransactions(); // aggiorna lista
    } catch (err) {
        alert("Errore nell'eliminazione: " + err.message);
    }
}

/**
 * Utility per nomi (fallback se i dati non sono ancora arrivati)
 */
function getCategoryName(categoryId) {
    const cat = window.allCategories ? window.allCategories.find(c => c.id === categoryId) : null;
    return cat ? cat.name : "N/D";
}

function getAccountName(accountId) {
    const acc = window.allAccounts ? window.allAccounts.find(a => a.id === accountId) : null;
    return acc ? acc.name : "N/D";
}
