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

        // Colonna info
        var infoDiv = document.createElement("div");
        infoDiv.className = "category-item-info";
        infoDiv.innerHTML =
            "<strong>" + escapeHtml(cat.name) + "</strong>" +
            " <small>[" + cat.type + "]</small>" +
            (cat.description ? " — <span>" + escapeHtml(cat.description) + "</span>" : "") +
            (isGlobal ? " <em>(predefinita)</em>" : "");

        div.appendChild(infoDiv);

        // Colonna azioni (solo per categorie dell'utente)
        if (!isGlobal) {
            var actionsDiv = document.createElement("div");
            actionsDiv.className = "category-item-actions";

            var editBtn = document.createElement("button");
            editBtn.className = "btn-secondary";
            editBtn.textContent = "Modifica";
            editBtn.onclick = function () { openEditCategory(cat.id); };

            var delBtn = document.createElement("button");
            delBtn.className = "btn-danger";
            delBtn.textContent = "Elimina";
            delBtn.onclick = function () { openDeleteCategory(cat.id); };

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(delBtn);
            div.appendChild(actionsDiv);
        }

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

// ── MODIFICA CATEGORIA (modal overlay) ───────────────────────────────────────

function openEditCategory(categoryId) {
    var cat = allCategories.find(function (c) { return c.id === categoryId; });
    if (!cat) return;

    document.getElementById("edit-cat-id").value = cat.id;
    document.getElementById("edit-cat-name").value = cat.name;
    document.getElementById("edit-cat-type").value = cat.type;
    document.getElementById("edit-cat-description").value = cat.description || "";
    document.getElementById("edit-cat-char-count").textContent = (cat.description || "").length;
    clearError("category-edit-error");
    var errName = document.getElementById("err-edit-cat-name");
    if (errName) { errName.textContent = ""; errName.style.display = "none"; }

    document.getElementById("category-edit-modal").style.display = "flex";
}

async function submitEditCategory() {
    var id = document.getElementById("edit-cat-id").value;
    var name = document.getElementById("edit-cat-name").value.trim();
    var type = document.getElementById("edit-cat-type").value;
    var description = document.getElementById("edit-cat-description").value.trim();

    clearError("category-edit-error");

    if (!name) {
        var errName = document.getElementById("err-edit-cat-name");
        if (errName) { errName.textContent = "Il nome è obbligatorio."; errName.style.display = "block"; }
        return;
    }
    if (!type) {
        showError("category-edit-error", "Seleziona un tipo.");
        return;
    }
    if (description.length > 256) {
        showError("category-edit-error", "La descrizione è troppo lunga (max 256 caratteri).");
        return;
    }

    try {
        await apiUpdateCategory(id, name, type, description || null);
        document.getElementById("category-edit-modal").style.display = "none";
        clearError("category-edit-error");
        await loadCategories();
    } catch (err) {
        showError("category-edit-error", err.message);
    }
}

function cancelEditCategory() {
    document.getElementById("category-edit-modal").style.display = "none";
}

// ── ELIMINA CATEGORIA (modal overlay) ────────────────────────────────────────

function openDeleteCategory(categoryId) {
    var cat = allCategories.find(function (c) { return c.id === categoryId; });
    if (!cat) return;

    document.getElementById("delete-cat-id").value = categoryId;
    document.getElementById("delete-cat-name-label").textContent = cat.name;
    clearError("category-delete-error");

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

    document.getElementById("category-delete-modal").style.display = "flex";
}

async function submitDeleteCategory() {
    var id = document.getElementById("delete-cat-id").value;
    var replaceWith = document.getElementById("delete-cat-replace").value || null;

    clearError("category-delete-error");

    try {
        await apiDeleteCategory(id, replaceWith);
        document.getElementById("category-delete-modal").style.display = "none";
        await loadCategories();
    } catch (err) {
        showError("category-delete-error", err.message);
    }
}

function cancelDeleteCategory() {
    document.getElementById("category-delete-modal").style.display = "none";
}

// ── CHAR COUNTER DESCRIZIONE MODIFICA CATEGORIA ───────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    var editDesc = document.getElementById("edit-cat-description");
    if (editDesc) {
        editDesc.addEventListener("input", function () {
            var count = document.getElementById("edit-cat-char-count");
            if (count) count.textContent = editDesc.value.length;
        });
    }
});
