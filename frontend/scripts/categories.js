// categories.js — Gestione categorie (CRUD)

// ── STATO ─────────────────────────────────────────────────────────────────────

var allCategories = []; // [{id, name, type, description, user_profile_id}]

// ── CARICAMENTO ───────────────────────────────────────────────────────────────

async function loadCategories() {
    try {
        allCategories = await apiGetCategories();
        renderCategoriesList();
        renderCategorySelects();
    } catch (err) {
        showError("categories-error", err.message);
    }
}

// ── RENDER LISTA CATEGORIE ────────────────────────────────────────────────────

function renderCategoriesList() {
    var container = document.getElementById("categories-list");
    container.innerHTML = "";

    if (allCategories.length === 0) {
        container.innerHTML = "<p>Nessuna categoria disponibile.</p>";
        return;
    }

    allCategories.forEach(function (cat) {
        var isGlobal = !cat.user_profile_id; // categorie predefinite hanno user_profile_id null

        var div = document.createElement("div");
        div.className = "category-item";

        var actions = "";
        if (!isGlobal) {
            // Solo le categorie dell'utente possono essere modificate/eliminate
            actions =
                " <button onclick=\"openEditCategory('" + cat.id + "')\">Modifica</button>" +
                " <button onclick=\"openDeleteCategory('" + cat.id + "')\">Elimina</button>";
        }

        div.innerHTML =
            "<strong>" + escapeHtml(cat.name) + "</strong>" +
            " [" + cat.type + "]" +
            (cat.description ? " — " + escapeHtml(cat.description) : "") +
            (isGlobal ? " <em>(predefinita)</em>" : "") +
            actions;

        container.appendChild(div);
    });
}

// ── RENDER SELECT CATEGORIE (usato da transactions.js e dashboard.js) ──────────

function renderCategorySelects() {
    var selects = document.querySelectorAll(".select-category");
    selects.forEach(function (sel) {
        var currentValue = sel.value;
        sel.innerHTML = "<option value=''>-- Tutte le categorie --</option>";
        allCategories.forEach(function (cat) {
            var opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name + " (" + cat.type + ")";
            sel.appendChild(opt);
        });
        sel.value = currentValue;
    });

    // Select filtrate per tipo (usate nel form di inserimento transazione)
    renderCategorySelectsByType();
}

// Select categoria filtrata per tipo income/expense
// Usata nel form transazione (cambia in base al radio entrata/uscita)
function renderCategorySelectsByType() {
    var typeRadios = document.querySelectorAll("input[name='tx-type']");
    var selectedType = "expense"; // default
    typeRadios.forEach(function (r) {
        if (r.checked) selectedType = r.value;
    });

    var sel = document.getElementById("tx-category");
    if (!sel) return;
    sel.innerHTML = "<option value=''>-- Seleziona categoria --</option>";
    allCategories.forEach(function (cat) {
        if (cat.type === selectedType) {
            var opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name;
            sel.appendChild(opt);
        }
    });
}

// ── CREA CATEGORIA ────────────────────────────────────────────────────────────

async function submitNewCategory() {
    var name = document.getElementById("new-cat-name").value.trim();
    var type = document.getElementById("new-cat-type").value;
    var description = document.getElementById("new-cat-description").value.trim();

    if (!name) {
        showError("categories-error", "Il nome è obbligatorio.");
        return;
    }
    if (!type) {
        showError("categories-error", "Seleziona un tipo (entrata/uscita).");
        return;
    }

    try {
        await apiCreateCategory(name, type, description || null);
        document.getElementById("new-cat-name").value = "";
        document.getElementById("new-cat-type").value = "";
        document.getElementById("new-cat-description").value = "";
        clearError("categories-error");
        await loadCategories();
    } catch (err) {
        showError("categories-error", err.message);
    }
}

// ── MODIFICA CATEGORIA ────────────────────────────────────────────────────────

function openEditCategory(categoryId) {
    var cat = allCategories.find(function (c) { return c.id === categoryId; });
    if (!cat) return;

    document.getElementById("edit-cat-id").value = cat.id;
    document.getElementById("edit-cat-name").value = cat.name;
    document.getElementById("edit-cat-type").value = cat.type;
    document.getElementById("edit-cat-description").value = cat.description || "";
    document.getElementById("edit-cat-form").style.display = "block";
}

async function submitEditCategory() {
    var id = document.getElementById("edit-cat-id").value;
    var name = document.getElementById("edit-cat-name").value.trim();
    var type = document.getElementById("edit-cat-type").value;
    var description = document.getElementById("edit-cat-description").value.trim();

    if (!name || !type) {
        showError("categories-error", "Nome e tipo sono obbligatori.");
        return;
    }

    try {
        await apiUpdateCategory(id, name, type, description || null);
        document.getElementById("edit-cat-form").style.display = "none";
        clearError("categories-error");
        await loadCategories();
    } catch (err) {
        showError("categories-error", err.message);
    }
}

function cancelEditCategory() {
    document.getElementById("edit-cat-form").style.display = "none";
}

// ── ELIMINA CATEGORIA ─────────────────────────────────────────────────────────

function openDeleteCategory(categoryId) {
    var cat = allCategories.find(function (c) { return c.id === categoryId; });
    if (!cat) return;

    document.getElementById("delete-cat-id").value = categoryId;
    document.getElementById("delete-cat-name-label").textContent = cat.name;

    var sel = document.getElementById("delete-cat-replace");
    sel.innerHTML = "<option value=''>-- Nessuna (operazione bloccata se ci sono transazioni) --</option>";
    allCategories.forEach(function (c) {
        if (c.id !== categoryId && c.type === cat.type) {
            var opt = document.createElement("option");
            opt.value = c.id;
            opt.textContent = c.name;
            sel.appendChild(opt);
        }
    });

    document.getElementById("delete-cat-form").style.display = "block";
}

async function submitDeleteCategory() {
    var id = document.getElementById("delete-cat-id").value;
    var replaceWith = document.getElementById("delete-cat-replace").value || null;

    try {
        await apiDeleteCategory(id, replaceWith);
        document.getElementById("delete-cat-form").style.display = "none";
        clearError("categories-error");
        await loadCategories();
    } catch (err) {
        showError("categories-error", err.message);
    }
}

function cancelDeleteCategory() {
    document.getElementById("delete-cat-form").style.display = "none";
}
