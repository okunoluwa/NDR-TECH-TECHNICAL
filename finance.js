checkAuth();

let financeChart = null;

function initFinance() {
    loadSummary();
    loadTransactions();
    loadReports();
    loadIncomeTicketDropdown();
    loadTechnicianDropdown();
}

function loadIncomeTicketDropdown() {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    // Show only completed tickets (Ready or Collected) that have a technician assigned
    let completedTickets = tickets.filter(t => t.status === "Ready" || t.status === "Collected");
    let select = document.getElementById("incomeTicket");
    select.innerHTML = '<option value="">-- Link to Ticket (optional) --</option>';
    completedTickets.forEach(ticket => {
        let tech = ticket.assignedTo || "";
        select.innerHTML += `<option value="${ticket.ticketNumber}" data-tech="${tech}" data-amount="500">${ticket.ticketNumber} - ${ticket.customerName} (${ticket.deviceType})</option>`;
    });
}

function autoFillIncomeFromTicket() {
    let select = document.getElementById("incomeTicket");
    let selectedOption = select.options[select.selectedIndex];
    let tech = selectedOption.getAttribute("data-tech") || "";
    let amount = selectedOption.getAttribute("data-amount") || "";
    if (tech) {
        document.getElementById("incomeTechnician").value = tech;
        document.getElementById("incomeDescription").value = `Repair for ticket ${select.value}`;
    }
    if (amount) document.getElementById("incomeAmount").value = amount;
}

function loadTechnicianDropdown() {
    let techs = JSON.parse(localStorage.getItem("technicians")) || [];
    let select = document.getElementById("incomeTechnician");
    select.innerHTML = '<option value="">-- Select Technician (optional) --</option>';
    techs.forEach(tech => {
        select.innerHTML += `<option value="${tech}">${tech}</option>`;
    });
}

function loadSummary() {
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
    let totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    let totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    let profit = totalIncome - totalExpense;
    document.getElementById("totalIncome").innerText = `R${totalIncome.toLocaleString()}`;
    document.getElementById("totalExpenses").innerText = `R${totalExpense.toLocaleString()}`;
    document.getElementById("netProfit").innerText = `R${profit.toLocaleString()}`;
}

function switchFinanceTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelectorAll('.finance-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    if (tabId === 'transactions') loadTransactions();
    if (tabId === 'reports') loadReports();
}

// Income Form (updated with ticket and technician)
document.getElementById("incomeForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const category = document.getElementById("incomeCategory").value;
    const amount = parseFloat(document.getElementById("incomeAmount").value);
    const description = document.getElementById("incomeDescription").value;
    const date = document.getElementById("incomeDate").value;
    const ticketNumber = document.getElementById("incomeTicket").value;
    const technician = document.getElementById("incomeTechnician").value;
    if (!category || !amount || !date) return;
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    incomes.push({
        id: Date.now(),
        category,
        amount,
        description,
        date,
        ticketNumber: ticketNumber || null,
        technician: technician || null,
        type: "income"
    });
    localStorage.setItem("finance_incomes", JSON.stringify(incomes));
    alert("Income added.");
    document.getElementById("incomeForm").reset();
    loadSummary();
    loadTransactions();
    loadReports();
    loadIncomeTicketDropdown(); // refresh dropdown
});

// Expense Form (unchanged)
document.getElementById("expenseForm")?.addEventListener("submit", function(e) {
    e.preventDefault();
    const category = document.getElementById("expenseCategory").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const description = document.getElementById("expenseDescription").value;
    const date = document.getElementById("expenseDate").value;
    if (!category || !amount || !date) return;
    let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
    expenses.push({
        id: Date.now(),
        category,
        amount,
        description,
        date,
        type: "expense"
    });
    localStorage.setItem("finance_expenses", JSON.stringify(expenses));
    alert("Expense added.");
    document.getElementById("expenseForm").reset();
    loadSummary();
    loadTransactions();
    loadReports();
});

function loadTransactions() {
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
    let all = [...incomes.map(i => ({...i, type: "income"})), ...expenses.map(e => ({...e, type: "expense"}))];
    all.sort((a,b) => new Date(b.date) - new Date(a.date));
    const typeFilter = document.getElementById("transTypeFilter").value;
    const monthFilter = document.getElementById("transMonthFilter").value;
    let filtered = all;
    if (typeFilter !== "all") filtered = filtered.filter(t => t.type === typeFilter);
    if (monthFilter) filtered = filtered.filter(t => t.date.startsWith(monthFilter));
    const tbody = document.getElementById("transactionsBody");
    tbody.innerHTML = "";
    filtered.forEach(t => {
        const amountClass = t.type === "income" ? "style='color:#22c55e'" : "style='color:#ef4444'";
        const technicianDisplay = t.technician ? t.technician : (t.ticketNumber ? `Ticket ${t.ticketNumber}` : "-");
        tbody.innerHTML += `
            <tr>
                <td>${t.date}</td>
                <td><span class="badge ${t.type}">${t.type === "income" ? "Income" : "Expense"}</span></td>
                <td>${t.category}</td>
                <td>${t.description || "-"}</td>
                <td ${amountClass}>R${t.amount.toLocaleString()}</td>
                <td>${technicianDisplay}</td>
                <td><button class="delete-transaction" onclick="deleteTransaction(${t.id}, '${t.type}')">Delete</button></td>
            </tr>
        `;
    });
    if (filtered.length === 0) tbody.innerHTML = '<tr><td colspan="7">No transactions found.</td></tr>';
}

function deleteTransaction(id, type) {
    if (confirm("Delete this transaction?")) {
        if (type === "income") {
            let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
            incomes = incomes.filter(i => i.id !== id);
            localStorage.setItem("finance_incomes", JSON.stringify(incomes));
        } else {
            let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
            expenses = expenses.filter(e => e.id !== id);
            localStorage.setItem("finance_expenses", JSON.stringify(expenses));
        }
        loadTransactions();
        loadSummary();
        loadReports();
    }
}

function loadReports() {
    const period = document.getElementById("reportPeriod").value;
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
    let now = new Date();
    let filteredIncomes = filterByPeriod(incomes, period, now);
    let filteredExpenses = filterByPeriod(expenses, period, now);
    let totalIncome = filteredIncomes.reduce((s,i) => s + i.amount, 0);
    let totalExpense = filteredExpenses.reduce((s,e) => s + e.amount, 0);
    let profit = totalIncome - totalExpense;
    document.getElementById("reportIncome").innerText = `R${totalIncome.toLocaleString()}`;
    document.getElementById("reportExpenses").innerText = `R${totalExpense.toLocaleString()}`;
    document.getElementById("reportProfit").innerText = `R${profit.toLocaleString()}`;
    updateChart(filteredIncomes, filteredExpenses);
}

function filterByPeriod(items, period, now) {
    return items.filter(item => {
        let itemDate = new Date(item.date);
        if (period === "today") return itemDate.toDateString() === now.toDateString();
        if (period === "week") {
            let weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return itemDate >= weekAgo;
        }
        if (period === "month") return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        if (period === "year") return itemDate.getFullYear() === now.getFullYear();
        return true;
    });
}

function updateChart(incomes, expenses) {
    const ctx = document.getElementById("financeChart").getContext("2d");
    if (financeChart) financeChart.destroy();
    let totalIncome = incomes.reduce((s,i) => s + i.amount, 0);
    let totalExpense = expenses.reduce((s,e) => s + e.amount, 0);
    financeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [totalIncome, totalExpense],
                backgroundColor: ['#22c55e', '#ef4444']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}