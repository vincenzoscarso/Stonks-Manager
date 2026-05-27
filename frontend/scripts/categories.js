// categories.js — Categories management (CRUD)

// ── STATE ─────────────────────────────────────────────────────────────────────

var allCategories = []; // [{id, name, type, description, user_profile_id}]

// ── LOADING ───────────────────────────────────────────────────────────────────

async function loadCategories() {
    try {
        allCategories = await apiGetCategories();
        renderCategoriesList();
        renderCategorySelects();
    } catch (err) {
        showError("categories-error", err.message);
    }
}

// ── RENDER CATEGORIES LIST ────────────────────────────────────────────────────

function renderCategoriesList() {
    var container = document.getElementById("categories-list");
    container.innerHTML = "";

    if (allCategories.length === 0) {
        container.innerHTML = "<p>Nessuna categoria disponibile.</p>";
        return;
    }

    allCategories.forEach(function (cat) {
        var isGlobal = !cat.user_profile_id; // predefined categories have null user_profile_id

        var div = document.createElement("div");
        div.className = "transaction-card";

        var topDiv = document.createElement("div");
        topDiv.className = "card-top";
        topDiv.innerHTML = "<span class='card-category'>" + escapeHtml(cat.name) + (isGlobal ? " <em>(predefinita)</em>" : "") + "</span>" +
                           "<span class='card-date'>[" + (cat.type === 'expense' ? 'Uscita' : 'Entrata') + "]</span>";

        var descDiv = document.createElement("div");
        descDiv.className = "card-description";
        descDiv.textContent = cat.description || "";

        div.appendChild(topDiv);
        div.appendChild(descDiv);

        // Actions column (only for user categories)
        if (!isGlobal) {
            var actionsDiv = document.createElement("div");
            actionsDiv.className = "card-actions";

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

// ── RENDER CATEGORIES SELECT (used by transactions.js and dashboard.js) ──────

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

    // Selects filtered by type (used in transaction insert form)
    renderCategorySelectsByType();
}

// Filtered category select by income/expense type
// Used in transaction form (changes based on income/expense radio)
function renderCategorySelectsByType() {
    var typeRadios = document.querySelectorAll("input[name='modal-tx-type']");
    var selectedType = "expense"; // default
    typeRadios.forEach(function (r) {
        if (r.checked) selectedType = r.value;
    });

    var sel = document.getElementById("modal-tx-category");
    if (!sel) return;
    sel.innerHTML = "<option value=''>-- Seleziona --</option>";
    allCategories.forEach(function (cat) {
        if (cat.type === selectedType) {
            var opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.name;
            sel.appendChild(opt);
        }
    });
}

// ── CATEGORY MODAL (CREATE / EDIT) ────────────────────────────────────────────

function openAddCategoryModal() {
    document.getElementById("category-modal-title").innerText = "Nuova Categoria";
    document.getElementById("edit-cat-id").value = "";
    document.getElementById("edit-cat-name").value = "";
    document.querySelector('input[name="edit-cat-type"][value="expense"]').checked = true;
    document.getElementById("edit-cat-description").value = "";
    document.getElementById("edit-cat-char-count").textContent = "0";
    clearError("category-edit-error");
    var errName = document.getElementById("err-edit-cat-name");
    if (errName) { errName.textContent = ""; errName.style.display = "none"; }

    document.getElementById("category-edit-modal").style.display = "flex";
}

function openEditCategory(categoryId) {
    var cat = allCategories.find(function (c) { return c.id === categoryId; });
    if (!cat) return;

    document.getElementById("category-modal-title").innerText = "Modifica Categoria";
    document.getElementById("edit-cat-id").value = cat.id;
    document.getElementById("edit-cat-name").value = cat.name;
    document.querySelector(`input[name="edit-cat-type"][value="${cat.type}"]`).checked = true;
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
    var type = document.querySelector('input[name="edit-cat-type"]:checked').value;
    var description = document.getElementById("edit-cat-description").value.trim();

    clearError("category-edit-error");

    if (!name) {
        var errName = document.getElementById("err-edit-cat-name");
        if (errName) { errName.textContent = "Il nome è obbligatorio."; errName.style.display = "block"; }
        return;
    }
    if (description.length > 256) {
        showError("category-edit-error", "La descrizione è troppo lunga (max 256 caratteri).");
        return;
    }

    try {
        if (id) {
            await apiUpdateCategory(id, name, type, description || null);
        } else {
            await apiCreateCategory(name, type, description || null);
        }
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

// ── DELETE CATEGORY (modal overlay) ───────────────────────────────────────────

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

// ── EDIT CATEGORY DESCRIPTION CHAR COUNTER ────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    var editDesc = document.getElementById("edit-cat-description");
    if (editDesc) {
        editDesc.addEventListener("input", function () {
            var count = document.getElementById("edit-cat-char-count");
            if (count) count.textContent = editDesc.value.length;
        });
    }
});
