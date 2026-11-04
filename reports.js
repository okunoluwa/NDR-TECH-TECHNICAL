checkAuth();

let statusChart, deviceChart, financeChart, techChart;

function initReports() {
    loadRepairReports();
    loadFinancialReports();
    loadTechnicianReports();
}

function switchReportTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    if (tab === 'repair') loadRepairReports();
    if (tab === 'financial') loadFinancialReports();
    if (tab === 'technician') loadTechnicianReports();
}

// ==================== REPAIR REPORTS (unchanged) ====================
function loadRepairReports() {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const period = document.getElementById("repairPeriod").value;
    const filtered = filterByDate(tickets, period);
    const total = filtered.length;
    const pending = filtered.filter(t => t.status === 'Waiting' || t.status === 'Repairing').length;
    const completed = filtered.filter(t => t.status === 'Ready' || t.status === 'Collected').length;
    const rate = total ? ((completed / total) * 100).toFixed(1) : 0;
    document.getElementById("repairTotal").innerText = total;
    document.getElementById("repairPending").innerText = pending;
    document.getElementById("repairCompleted").innerText = completed;
    document.getElementById("repairRate").innerText = rate + '%';
    updateStatusChart(filtered);
    updateDeviceChart(filtered);
}

function updateStatusChart(tickets) {
    const statusCount = { Waiting:0, Repairing:0, Ready:0, Collected:0 };
    tickets.forEach(t => statusCount[t.status]++);
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Waiting', 'Repairing', 'Ready', 'Collected'],
            datasets: [{ data: [statusCount.Waiting, statusCount.Repairing, statusCount.Ready, statusCount.Collected], backgroundColor: ['#f59e0b', '#1a8cff', '#22c55e', '#94a3b8'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function updateDeviceChart(tickets) {
    let deviceMap = new Map();
    tickets.forEach(t => {
        let type = t.deviceType || 'Other';
        deviceMap.set(type, (deviceMap.get(type) || 0) + 1);
    });
    const ctx = document.getElementById('deviceChart').getContext('2d');
    if (deviceChart) deviceChart.destroy();
    deviceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from(deviceMap.keys()),
            datasets: [{ label: 'Tickets', data: Array.from(deviceMap.values()), backgroundColor: '#0066e6' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// ==================== FINANCIAL REPORTS (unchanged) ====================
function loadFinancialReports() {
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
    const period = document.getElementById("financePeriod").value;
    const filteredIncome = filterByDate(incomes, period);
    const filteredExpense = filterByDate(expenses, period);
    let totalIncome = filteredIncome.reduce((s,i) => s + i.amount, 0);
    let totalExpense = filteredExpense.reduce((s,e) => s + e.amount, 0);
    let profit = totalIncome - totalExpense;
    let margin = totalIncome ? ((profit / totalIncome) * 100).toFixed(1) : 0;
    document.getElementById("financeIncome").innerText = `R${totalIncome.toLocaleString()}`;
    document.getElementById("financeExpense").innerText = `R${totalExpense.toLocaleString()}`;
    document.getElementById("financeProfit").innerText = `R${profit.toLocaleString()}`;
    document.getElementById("financeMargin").innerText = margin + '%';
    updateFinanceTrend(filteredIncome, filteredExpense, period);
}

function updateFinanceTrend(incomes, expenses, period) {
    let groups = new Map();
    let all = [...incomes.map(i => ({...i, type:'income'})), ...expenses.map(e => ({...e, type:'expense'}))];
    all.forEach(item => {
        let key;
        let date = new Date(item.date);
        if (period === 'today') key = date.toLocaleDateString();
        else if (period === 'week') key = `Week ${Math.ceil(date.getDate()/7)}`;
        else if (period === 'month') key = date.toLocaleDateString('en', { day:'numeric' });
        else if (period === 'year') key = date.toLocaleString('default', { month:'short' });
        else key = date.toLocaleDateString();
        if (!groups.has(key)) groups.set(key, { income:0, expense:0 });
        let g = groups.get(key);
        if (item.type === 'income') g.income += item.amount;
        else g.expense += item.amount;
    });
    let labels = Array.from(groups.keys());
    let incomeData = labels.map(l => groups.get(l).income);
    let expenseData = labels.map(l => groups.get(l).expense);
    const ctx = document.getElementById('financeTrendChart').getContext('2d');
    if (financeChart) financeChart.destroy();
    financeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Income', data: incomeData, borderColor: '#22c55e', tension: 0.3 },
                { label: 'Expenses', data: expenseData, borderColor: '#ef4444', tension: 0.3 }
            ]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// ==================== TECHNICIAN REPORTS (UPDATED – uses real income) ====================
function loadTechnicianReports() {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    let technicians = JSON.parse(localStorage.getItem("technicians")) || [];
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    const period = document.getElementById("techPeriod").value;
    
    // Filter incomes by period
    let filteredIncomes = filterByDate(incomes, period);
    
    // Completed tickets for count (optional)
    let completedTickets = tickets.filter(t => (t.status === 'Ready' || t.status === 'Collected') && t.assignedTo);
    completedTickets = filterByDate(completedTickets, period);
    
    let techStats = new Map();
    technicians.forEach(tech => techStats.set(tech, { count:0, revenue:0 }));
    
    // Count completed repairs per technician (from tickets)
    completedTickets.forEach(t => {
        if (techStats.has(t.assignedTo)) {
            let stat = techStats.get(t.assignedTo);
            stat.count++;
            techStats.set(t.assignedTo, stat);
        }
    });
    
    // Add revenue from income records that have a technician assigned
    filteredIncomes.forEach(inc => {
        if (inc.technician && techStats.has(inc.technician)) {
            let stat = techStats.get(inc.technician);
            stat.revenue += inc.amount;
            techStats.set(inc.technician, stat);
        }
    });
    
    const tbody = document.getElementById("techTableBody");
    tbody.innerHTML = "";
    let techNames = [], counts = [], revenues = [];
    techStats.forEach((stat, tech) => {
        techNames.push(tech);
        counts.push(stat.count);
        revenues.push(stat.revenue);
        let avg = stat.count ? (stat.revenue / stat.count).toFixed(0) : 0;
        tbody.innerHTML += `
            <tr>
                <td>${escapeHtml(tech)}</td>
                <td>${stat.count}</td>
                <td>R${stat.revenue.toLocaleString()}</td>
                <td>R${avg}</td>
            </tr>
        `;
    });
    if (technicians.length === 0) tbody.innerHTML = '<tr><td colspan="4">No technicians added yet.</td></tr>';
    updateTechChart(techNames, counts);
}

function updateTechChart(labels, data) {
    const ctx = document.getElementById('techChart').getContext('2d');
    if (techChart) techChart.destroy();
    techChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Repairs Completed', data: data, backgroundColor: '#8b5cf6' }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

// ==================== HELPER: Filter by date ====================
function filterByDate(items, period) {
    const now = new Date();
    return items.filter(item => {
        let itemDate = new Date(item.date || item.createdAt);
        if (!item.date && !item.createdAt) return true;
        if (period === 'today') return itemDate.toDateString() === now.toDateString();
        if (period === 'week') {
            let weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return itemDate >= weekAgo;
        }
        if (period === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (period === 'year') return itemDate.getFullYear() === now.getFullYear();
        return true;
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;");
}