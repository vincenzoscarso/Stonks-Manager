/**
 * ui_logic.js — Centralized logic for interface (SPA Navigation, Transaction Modal, Errors)
 */

/**
 * ui_logic.js — Centralized interface logic (SPA Navigation, Modals, Errors)
 */

// ── DYNAMIC HTML LOADING ─────────────────────────────────────────────────────

/**
 * Asynchronously loads HTML files for pages and components.
 * Injects HTML into respective containers or directly to body for modals.
 */
async function loadComponents() {
    const pages = [
        { id: 'dashboard', path: 'pages/dashboard.html', container: 'page-container', classes: 'page' },
        { id: 'history', path: 'pages/transactions.html', container: 'page-container', classes: 'page' },
        { id: 'accounts', path: 'pages/accounts.html', container: 'page-container', classes: 'page' },
        { id: 'categories', path: 'pages/categories.html', container: 'page-container', classes: 'page' },
        { id: 'profile', path: 'pages/profile.html', container: 'page-container', classes: 'page' },
        { id: 'info', path: 'pages/info.html', container: 'page-container', classes: 'page' },
        { id: 'auth', path: 'pages/auth.html', container: 'section-auth', classes: '' }
    ];

    const components = [
        { path: 'components/modals.html', container: 'body' },
        { path: 'components/fab.html', container: 'body' }
    ];

    try {
        // Load pages
        for (let p of pages) {
            let html = await fetch(p.path).then(r => r.text());
            let targetDiv = (p.id === 'auth') ? document.getElementById(p.container) : null;
            
            if (!targetDiv) {
                targetDiv = document.createElement('div');
                targetDiv.id = `page-${p.id}`;
                if (p.classes) targetDiv.className = p.classes;
                targetDiv.style.display = 'none'; // hidden by default
                document.getElementById(p.container).appendChild(targetDiv);
            }
            targetDiv.innerHTML = html;
        }

        // Load components (modals and FAB)
        for (let c of components) {
            let html = await fetch(c.path).then(r => r.text());
            let div = document.createElement('div');
            div.innerHTML = html;
            // Move div children to target
            const target = (c.container === 'body') ? document.body : document.getElementById(c.container);
            while (div.firstChild) {
                target.appendChild(div.firstChild);
            }
        }
        
        // Bind events depending on newly loaded HTML
        bindDynamicEvents();

        console.log("Componenti HTML caricati con successo.");
    } catch (e) {
        console.error("Errore nel caricamento dei componenti HTML:", e);
    }
}

/**
 * Binds event listeners to dynamically loaded elements.
 */
function bindDynamicEvents() {
    const desc = document.getElementById("modal-tx-description");
    if (desc) desc.addEventListener("input", updateCharCount);
}


// ── SPA NAVIGATION ───────────────────────────────────────────────────────────

/**
 * Opens or closes lateral menu (Sidebar) and manages mobile overlay.
 */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
        overlay.classList.remove("visible");
    } else {
        sidebar.classList.add("open");
        overlay.classList.add("visible");
    }
}

/**
 * Handles page change in Single Page Application.
 * Hides all views and shows only the requested one.
 * @param {string} pageId - Page identifier to show (e.g. "dashboard", "history").
 */
function showPage(pageId) {
    const loader = document.getElementById("global-page-loader");
    if (loader) loader.style.display = "flex";

    // A small timeout to show the fast spinning Gemini face during page transitions
    setTimeout(() => {
        // Hide all pages
        const pages = document.querySelectorAll(".page");
        pages.forEach(p => {
            p.style.display = "none";
            p.classList.remove("active");
        });

        // Show requested page
        const target = document.getElementById("page-" + pageId);
        if (target) {
            target.style.display = "block";
            target.classList.add("active");

            // Manage FAB group visibility (only on dashboard)
            const fab = document.getElementById("fab-group");
            if (fab) {
                fab.style.display = (pageId === "dashboard") ? "flex" : "none";
            }
        }

        // Close sidebar if open on mobile
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        if (sidebar && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
            overlay.classList.remove("visible");
        }

        if (loader) loader.style.display = "none";
    }, 250);
}


// ── TRANSACTION MODAL ─────────────────────────────────────────────────────────────

let currentModalMode = "add";

function openTransactionModal(mode = "add", data = null) {
    currentModalMode = mode;
    const modal = document.getElementById("transaction-modal");
    const title = document.getElementById("modal-title");

    clearModalFields();
    clearFieldErrors();
    document.getElementById("modal-error").style.display = "none";

    title.innerText = (mode === "edit") ? "Modifica Transazione" : "Nuova Transazione";

    renderModalSelects();

    if (data) {
        if (data.id) document.getElementById("modal-tx-id").value = data.id;
        if (data.type) {
            const radio = document.querySelector(`input[name="modal-tx-type"][value="${data.type}"]`);
            if (radio) radio.checked = true;
            updateModalCategories();
        }
        if (data.amount)      document.getElementById("modal-tx-amount").value = Math.abs(data.amount);
        if (data.date)        document.getElementById("modal-tx-date").value = data.date;
        if (data.category_id) document.getElementById("modal-tx-category").value = data.category_id;
        if (data.account_id)  document.getElementById("modal-tx-account").value = data.account_id;
        if (data.description) {
            document.getElementById("modal-tx-description").value = data.description;
            updateCharCount();
        }
    } else {
        document.getElementById("modal-tx-date").valueAsDate = new Date();
        updateModalCategories();
    }

    modal.style.display = "flex";
}

function closeTransactionModal() {
    document.getElementById("transaction-modal").style.display = "none";
}

function clearModalFields() {
    document.getElementById("modal-tx-id").value = "";
    document.getElementById("modal-tx-amount").value = "";
    document.getElementById("modal-tx-description").value = "";
    document.getElementById("char-count").innerText = "0";
}

function updateModalCategories() {
    const checked = document.querySelector('input[name="modal-tx-type"]:checked');
    if (!checked) return;
    const type = checked.value;
    const categorySelect = document.getElementById("modal-tx-category");

    const filtered = (window.allCategories || []).filter(c => c.type === type);

    categorySelect.innerHTML = '<option value="">-- Seleziona --</option>';
    filtered.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.innerText = c.name;
        categorySelect.appendChild(opt);
    });
}

function renderModalSelects() {
    const accountSelect = document.getElementById("modal-tx-account");
    accountSelect.innerHTML = '<option value="">-- Seleziona --</option>';
    (window.allAccounts || []).forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.innerText = a.name;
        accountSelect.appendChild(opt);
    });
}

function validateModalData() {
    clearFieldErrors();
    let isValid = true;

    const amount      = document.getElementById("modal-tx-amount").value;
    const date        = document.getElementById("modal-tx-date").value;
    const category    = document.getElementById("modal-tx-category").value;
    const account     = document.getElementById("modal-tx-account").value;
    const description = document.getElementById("modal-tx-description").value;

    if (!amount || amount <= 0) {
        showFieldError("amount", "Inserisci un importo valido");
        isValid = false;
    }
    if (!date) {
        showFieldError("date", "La data è obbligatoria");
        isValid = false;
    } else {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
            showFieldError("date", "Non puoi inserire date future");
            isValid = false;
        }
    }
    if (!category) {
        showFieldError("category", "Seleziona una categoria");
        isValid = false;
    }
    if (!account) {
        showFieldError("account", "Seleziona un conto");
        isValid = false;
    }
    if (description.length > 256) {
        showFieldError("description", "La descrizione è troppo lunga (max 256)");
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const errDiv = document.getElementById("err-" + fieldId);
    if (errDiv) {
        errDiv.innerText = message;
        errDiv.style.display = "block";
    }
}

function clearFieldErrors() {
    const errors = document.querySelectorAll(".field-error");
    errors.forEach(e => {
        e.innerText = "";
        e.style.display = "none";
    });
}

/**
 * Updates character counter for transaction description.
 */
function updateCharCount() {
    const el = document.getElementById("modal-tx-description");
    if (el) {
        document.getElementById("char-count").innerText = el.value.length;
    }
}

async function saveTransactionFromModal() {
    if (!validateModalData()) return;

    const id = document.getElementById("modal-tx-id").value;
    const data = {
        type:        document.querySelector('input[name="modal-tx-type"]:checked').value,
        amount:      parseFloat(document.getElementById("modal-tx-amount").value),
        date:        document.getElementById("modal-tx-date").value,
        category_id: document.getElementById("modal-tx-category").value,
        account_id:  document.getElementById("modal-tx-account").value,
        description: document.getElementById("modal-tx-description").value || null
    };

    try {
        if (id) {
            await apiUpdateTransaction(id, data);
        } else {
            await apiCreateTransaction(data);
        }
        closeTransactionModal();
        loadAccounts();
        loadTransactions();
    } catch (err) {
        const modalErr = document.getElementById("modal-error");
        modalErr.innerText = "Errore nel salvataggio: " + err.message;
        modalErr.style.display = "block";
    }
}

function openTransactionModalForAdd() {
    openTransactionModal("add");
}
