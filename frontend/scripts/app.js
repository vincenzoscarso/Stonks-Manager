/**
 * app.js — Global utilities and application initialization
 */

// ── GLOBAL UTILITIES ─────────────────────────────────────────────────────────

/**
 * Formats a number as currency (Euro).
 * @param {number} amount - Amount to format.
 * @returns {string} Formatted string (e.g. "10,50 €").
 */
function formatCurrency(amount) {
    return amount.toFixed(2).replace(".", ",") + " €";
}

/**
 * Formats an ISO string to a European format date (DD/MM/YYYY).
 * @param {string} isoString - ISO format date (e.g. "2026-05-06T15:00:00Z")
 * @returns {string} Formatted date (e.g. "06/05/2026")
 */
function formatDate(isoString) {
    var d = new Date(isoString);
    var day = String(d.getDate()).padStart(2, "0");
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var year = d.getFullYear();
    return day + "/" + month + "/" + year;
}

/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns {string} (e.g. "2026-05-06")
 */
function getTodayString() {
    var d = new Date();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - Original string.
 * @returns {string} Sanitized string.
 */
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Shows an error message in a specific element.
 * @param {string} elementId - HTML element ID.
 * @param {string} message - Message to show.
 */
function showError(elementId, message) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = "block";
}

/**
 * Hides and clears an error message.
 * @param {string} elementId - HTML element ID.
 */
function clearError(elementId) {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = "";
    el.style.display = "none";
}

// ── DATA INITIALIZATION (AFTER LOGIN) ────────────────────────────────────────

/**
 * Loads application data (Accounts, Categories, Transactions, Profile).
 * Called by showApp() in auth.js or ui_logic.js after successful login.
 */
async function appInit() {
    try {
        await Promise.all([
            loadAccounts(),
            loadCategories()
        ]);
        await loadTransactions();
        
        // Set default filters (current month)
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, "0");
        document.getElementById("filter-start-date").value = y + "-" + m + "-01";
        var lastDay = new Date(y, now.getMonth() + 1, 0);
        document.getElementById("filter-end-date").value = y + "-" + m + "-" + String(lastDay.getDate()).padStart(2, "0");
        applyTransactionFilters();

        // Load profile data
        try {
            var profileData = await apiGetUser();
            window.currentUserProfile = profileData;
            document.getElementById("profile-display-name").value = profileData.display_name || "";
            document.getElementById("profile-email").value = profileData.email || "";
            
            // Update name in header or elsewhere if needed
            var userNameEl = document.getElementById("user-display-name");
            if (userNameEl) {
                userNameEl.textContent = profileData.display_name;
            }
        } catch(e) {
            console.error("Impossibile caricare profilo utente", e);
        }

        updateDashboard();
        showPage("dashboard");
    } catch (err) {
        alert("Errore caricamento dati iniziali: " + err.message);
    }
}
