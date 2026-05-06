// transactions.js — History management with Card visualization

let currentFilters = {};

/**
 * Loads transactions applying current filters
 */
async function loadTransactions(filters = null) {
    if (filters) currentFilters = filters;
    
    const container = document.getElementById("transactions-cards-container");
    const errorDiv = document.getElementById("transactions-error");

    try {
        const transactions = await apiGetTransactions(currentFilters);
        // Save globally for reference (edit/delete)
        window.allTransactions = transactions;
        
        renderTransactionsCards(transactions);
        
        // Also update dashboard and accounts
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
 * Renders transaction list as Cards (following sketch)
 */
function renderTransactionsCards(transactions) {
    const container = document.getElementById("transactions-cards-container");
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = "<p>Nessun movimento trovato per i filtri selezionati.</p>";
        return;
    }

    // Order by descending date (newest top)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = ""; // Clears the container

    transactions.forEach(tx => {
        const card = document.createElement("div");
        card.className = "transaction-card";

        // European date formatting (DD/MM/YYYY)
        const dateObj = new Date(tx.date);
        const formattedDate = dateObj.toLocaleDateString("it-IT");

        // Find category and account name
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
 * Filters
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
 * Edit: retrieve data and open Modal
 */
async function editTransaction(id) {
    const tx = window.allTransactions.find(t => t.id === id);
    if (tx) {
        // Prepare data for modal
        const modalData = {
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            date: tx.date.substring(0, 10), // YYYY-MM-DD format
            category_id: tx.category_id,
            account_id: tx.account_id,
            description: tx.description
        };
        openTransactionModal("edit", modalData);
    }
}

/**
 * Delete
 */
async function deleteTransaction(id) {
    if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

    try {
        await apiDeleteTransaction(id);
        loadAccounts(); // update balances
        loadTransactions(); // update list
    } catch (err) {
        alert("Errore nell'eliminazione: " + err.message);
    }
}

/**
 * Name utility (fallback if data not arrived yet)
 */
function getCategoryName(categoryId) {
    const cat = window.allCategories ? window.allCategories.find(c => c.id === categoryId) : null;
    return cat ? cat.name : "N/D";
}

function getAccountName(accountId) {
    const acc = window.allAccounts ? window.allAccounts.find(a => a.id === accountId) : null;
    return acc ? acc.name : "N/D";
}
