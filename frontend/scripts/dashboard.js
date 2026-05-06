// dashboard.js — Saldo globale e grafico a torta (Chart.js)

// ── STATO ─────────────────────────────────────────────────────────────────────

var pieChart = null; // istanza Chart.js, null finché non è inizializzata
var dashPeriod = "month"; // periodo selezionato: "day", "week", "month", "year"
var dashChartType = "expense"; // "income" o "expense"

// ── AGGIORNAMENTO DASHBOARD ────────────────────────────────────────────────────

// Chiamata ogni volta che allTransactions o allAccounts cambiano
function updateDashboard() {
    updateGlobalBalance();
    updatePieChart();
    updateCategoryList();
}

// ── SALDO GLOBALE ─────────────────────────────────────────────────────────────

function updateGlobalBalance() {
    var balance = calculateGlobalBalance(); // definita in accounts.js
    var el = document.getElementById("dashboard-balance");
    el.textContent = formatCurrency(balance);
    // Colora in rosso se negativo
    el.style.color = (balance < 0) ? "#cc0000" : "";
}

// ── PERIODO ───────────────────────────────────────────────────────────────────

function setDashPeriod(period) {
    dashPeriod = period;
    updatePieChart();
    updateCategoryList();
}

// Restituisce le transazioni filtrate per il periodo corrente
function getTransactionsForPeriod() {
    var now = new Date();
    var start;

    if (dashPeriod === "day") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dashPeriod === "week") {
        // Inizio della settimana corrente (lunedì)
        var day = now.getDay(); // 0=domenica, 1=lunedì...
        var diff = (day === 0) ? 6 : day - 1;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    } else if (dashPeriod === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dashPeriod === "year") {
        start = new Date(now.getFullYear(), 0, 1);
    }

    return allTransactions.filter(function (t) {
        var txDate = new Date(t.date);
        return txDate >= start && txDate <= now;
    });
}

// ── GRAFICO A TORTA ────────────────────────────────────────────────────────────

function updatePieChart() {
    var transactions = getTransactionsForPeriod();

    // Filtra per tipo (income o expense)
    var filtered = transactions.filter(function (t) { return t.type === dashChartType; });

    // Raggruppa per categoria
    var groups = {};
    filtered.forEach(function (t) {
        var catName = getCategoryName(t.category_id);
        if (!groups[catName]) groups[catName] = 0;
        groups[catName] += parseFloat(t.amount);
    });

    var labels = Object.keys(groups);
    var data   = Object.values(groups);
    var colors = generateColors(labels.length);

    var canvas = document.getElementById("pie-chart");

    if (pieChart) {
        // Aggiorna i dati esistenti
        pieChart.data.labels = labels;
        pieChart.data.datasets[0].data = data;
        pieChart.data.datasets[0].backgroundColor = colors;
        pieChart.update();
    } else {
        // Prima inizializzazione
        pieChart = new Chart(canvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                var val = context.parsed;
                                return context.label + ": " + formatCurrency(val);
                            }
                        }
                    }
                }
            }
        });
    }
}

// ── LISTA CATEGORIE SOTTO IL GRAFICO ──────────────────────────────────────────

function updateCategoryList() {
    var transactions = getTransactionsForPeriod();
    var filtered = transactions.filter(function (t) { return t.type === dashChartType; });

    var groups = {};
    filtered.forEach(function (t) {
        var catName = getCategoryName(t.category_id);
        if (!groups[catName]) groups[catName] = 0;
        groups[catName] += parseFloat(t.amount);
    });

    var container = document.getElementById("dashboard-category-list");
    container.innerHTML = "";

    var entries = Object.entries(groups).sort(function (a, b) { return b[1] - a[1]; });

    if (entries.length === 0) {
        container.innerHTML = "<p>Nessun dato per questo periodo.</p>";
        return;
    }

    entries.forEach(function (entry) {
        var name  = entry[0];
        var total = entry[1];
        
        var div = document.createElement("div");
        div.className = "dashboard-category-item";
        
        var nameSpan = document.createElement("span");
        nameSpan.className = "name";
        nameSpan.textContent = name;
        
        var amountSpan = document.createElement("span");
        amountSpan.className = "amount " + dashChartType;
        amountSpan.textContent = formatCurrency(total);
        
        div.appendChild(nameSpan);
        div.appendChild(amountSpan);
        container.appendChild(div);
    });
}

// Cambia il tipo di grafico (income/expense)
function setDashChartType(type) {
    dashChartType = type;
    updatePieChart();
    updateCategoryList();
}

// ── GENERAZIONE COLORI ────────────────────────────────────────────────────────

function generateColors(count) {
    var palette = [
        "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
        "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac"
    ];
    var colors = [];
    for (var i = 0; i < count; i++) {
        colors.push(palette[i % palette.length]);
    }
    return colors;
}
