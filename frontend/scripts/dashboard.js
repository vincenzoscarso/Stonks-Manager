// dashboard.js — Global balance and pie chart (Chart.js)

// ── STATE ─────────────────────────────────────────────────────────────────────

var pieChart = null; // Chart.js instance, null until initialized
var dashPeriod = "month"; // selected period: "day", "week", "month", "year"
var dashChartType = "expense"; // "income" or "expense"

// ── DASHBOARD UPDATE ──────────────────────────────────────────────────────────

// Called every time allTransactions or allAccounts change
function updateDashboard() {
    updateGlobalBalance();
    updatePieChart();
    updateCategoryList();
}

// ── GLOBAL BALANCE ────────────────────────────────────────────────────────────

function updateGlobalBalance() {
    var balance = calculateGlobalBalance(); // defined in accounts.js
    var el = document.getElementById("dashboard-balance");
    el.textContent = formatCurrency(balance);
    // Color red if negative
    el.style.color = (balance < 0) ? "#cc0000" : "";
}

// ── PERIOD ────────────────────────────────────────────────────────────────────

function setDashPeriod(period) {
    dashPeriod = period;
    updatePieChart();
    updateCategoryList();
}

// Returns filtered transactions for current period
function getTransactionsForPeriod() {
    var now = new Date();
    var start;

    if (dashPeriod === "day") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dashPeriod === "week") {
        // Start of current week (monday)
        var day = now.getDay(); // 0=sunday, 1=monday...
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

// ── PIE CHART ─────────────────────────────────────────────────────────────────

function updatePieChart() {
    var transactions = getTransactionsForPeriod();

    // Filter by type (income or expense)
    var filtered = transactions.filter(function (t) { return t.type === dashChartType; });

    // Group by category
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
        // Update existing data
        pieChart.data.labels = labels;
        pieChart.data.datasets[0].data = data;
        pieChart.data.datasets[0].backgroundColor = colors;
        pieChart.update();
    } else {
        // First initialization
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

// ── CATEGORIES LIST BELOW CHART ───────────────────────────────────────────────

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

// Change chart type (income/expense)
function setDashChartType(type) {
    dashChartType = type;
    updatePieChart();
    updateCategoryList();
}

// ── COLOR GENERATION ──────────────────────────────────────────────────────────

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
