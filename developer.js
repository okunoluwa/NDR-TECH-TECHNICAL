checkAuth();

function initDevTools() {
    updateCounts();
}

function updateCounts() {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    let techs = JSON.parse(localStorage.getItem("technicians")) || [];
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    let expenses = JSON.parse(localStorage.getItem("finance_expenses")) || [];
    document.getElementById("ticketCount").innerText = tickets.length;
    document.getElementById("techCount").innerText = techs.length;
    document.getElementById("incomeCount").innerText = incomes.length;
    document.getElementById("expenseCount").innerText = expenses.length;
}

// Clear functions
function clearTickets() {
    if (confirm("Delete ALL tickets? This cannot be undone.")) {
        localStorage.setItem("tickets", JSON.stringify([]));
        updateCounts();
        alert("All tickets deleted.");
    }
}
function clearTechnicians() {
    if (confirm("Delete ALL technicians? This will unassign any tickets assigned to them.")) {
        localStorage.setItem("technicians", JSON.stringify([]));
        // Also unassign tickets
        let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
        tickets.forEach(t => t.assignedTo = "");
        localStorage.setItem("tickets", JSON.stringify(tickets));
        updateCounts();
        alert("All technicians removed.");
    }
}
function clearIncomes() {
    if (confirm("Delete ALL income records?")) {
        localStorage.setItem("finance_incomes", JSON.stringify([]));
        updateCounts();
        alert("Income records cleared.");
    }
}
function clearExpenses() {
    if (confirm("Delete ALL expense records?")) {
        localStorage.setItem("finance_expenses", JSON.stringify([]));
        updateCounts();
        alert("Expense records cleared.");
    }
}
function clearCompanySettings() {
    if (confirm("Reset company profile, password, and preferences? You will need to re-register or re-enter company details.")) {
        localStorage.removeItem("sdjCompany");
        localStorage.removeItem("systemPrefs");
        localStorage.removeItem("notifications");
        alert("Company settings reset. You will be redirected to register page.");
        window.location.href = "registration.html";
    }
}
function fullReset() {
    let confirmMsg = "⚠️ COMPLETE RESET WILL DELETE EVERYTHING:\n- All tickets\n- All technicians\n- All finance records\n- Company profile and settings\n\nThis action cannot be undone. Are you ABSOLUTELY sure?";
    if (confirm(confirmMsg)) {
        localStorage.clear();  // wipes everything
        sessionStorage.clear();
        alert("All data deleted. Redirecting to registration.");
        window.location.href = "registration.html";
    }
}

function viewSampleData(type) {
    let data = [];
    if (type === 'tickets') data = JSON.parse(localStorage.getItem("tickets")) || [];
    else if (type === 'technicians') data = JSON.parse(localStorage.getItem("technicians")) || [];
    const pre = document.getElementById("sampleDataPre");
    pre.innerText = JSON.stringify(data, null, 2);
    document.getElementById("sampleModal").style.display = "block";
}
function closeModal() {
    document.getElementById("sampleModal").style.display = "none";
}
window.onclick = function(event) {
    let modal = document.getElementById("sampleModal");
    if (event.target === modal) modal.style.display = "none";
}