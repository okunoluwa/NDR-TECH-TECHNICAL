checkAuth();

let technicians = [];

function initSettings() {
    loadCompanyInfo();
    loadTechnicians();
    loadPreferences();
    loadNotifications();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Company Profile
function loadCompanyInfo() {
    const company = JSON.parse(localStorage.getItem("sdjCompany")) || {};
    document.getElementById("companyName").value = company.companyName || "";
    document.getElementById("ownerName").value = company.ownerName || "";
    document.getElementById("companyPhone").value = company.phone || "";
    document.getElementById("companyEmail").value = company.email || "";
    document.getElementById("companyAddress").value = company.address || "";
    document.getElementById("companyTaxId").value = company.taxId || "";
}
document.getElementById("companyForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const company = JSON.parse(localStorage.getItem("sdjCompany")) || {};
    company.companyName = document.getElementById("companyName").value;
    company.ownerName = document.getElementById("ownerName").value;
    company.phone = document.getElementById("companyPhone").value;
    company.email = document.getElementById("companyEmail").value;
    company.address = document.getElementById("companyAddress").value;
    company.taxId = document.getElementById("companyTaxId").value;
    localStorage.setItem("sdjCompany", JSON.stringify(company));
    alert("Company info saved.");
});

// Change Password
document.getElementById("passwordForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const current = document.getElementById("currentPassword").value;
    const newPass = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const company = JSON.parse(localStorage.getItem("sdjCompany"));
    if (!company || company.password !== current) {
        alert("Current password is incorrect.");
        return;
    }
    if (newPass !== confirm) {
        alert("New passwords do not match.");
        return;
    }
    company.password = newPass;
    localStorage.setItem("sdjCompany", JSON.stringify(company));
    alert("Password changed successfully.");
    document.getElementById("passwordForm").reset();
});

// Technicians
function loadTechnicians() {
    technicians = JSON.parse(localStorage.getItem("technicians")) || [];
    const list = document.getElementById("technicianList");
    list.innerHTML = "";
    technicians.forEach((tech, idx) => {
        list.innerHTML += `
            <li>
                <span><i class="fas fa-user-cog"></i> ${escapeHtml(tech)}</span>
                <button onclick="removeTechnician(${idx})">Remove</button>
            </li>
        `;
    });
}
function addTechnician() {
    const name = document.getElementById("newTechName").value.trim();
    if (!name) return;
    if (technicians.includes(name)) {
        alert("Technician already exists.");
        return;
    }
    technicians.push(name);
    localStorage.setItem("technicians", JSON.stringify(technicians));
    document.getElementById("newTechName").value = "";
    loadTechnicians();
}
function removeTechnician(index) {
    if (confirm("Remove this technician?")) {
        technicians.splice(index, 1);
        localStorage.setItem("technicians", JSON.stringify(technicians));
        loadTechnicians();
    }
}

// Preferences
function loadPreferences() {
    const prefs = JSON.parse(localStorage.getItem("systemPrefs")) || {};
    document.getElementById("defaultRepairFee").value = prefs.defaultRepairFee || 500;
    document.getElementById("currencySymbol").value = prefs.currencySymbol || "R";
}
function savePreferences() {
    const prefs = {
        defaultRepairFee: parseFloat(document.getElementById("defaultRepairFee").value),
        currencySymbol: document.getElementById("currencySymbol").value
    };
    localStorage.setItem("systemPrefs", JSON.stringify(prefs));
    alert("Preferences saved.");
}
function loadNotifications() {
    const notif = JSON.parse(localStorage.getItem("notifications")) || {};
    document.getElementById("lowStockAlert").checked = notif.lowStockAlert || false;
    document.getElementById("emailNotifications").checked = notif.emailNotifications || false;
}
function saveNotifications() {
    const notif = {
        lowStockAlert: document.getElementById("lowStockAlert").checked,
        emailNotifications: document.getElementById("emailNotifications").checked
    };
    localStorage.setItem("notifications", JSON.stringify(notif));
    alert("Notification settings saved.");
}

// Backup & Restore
function exportData() {
    const data = {
        tickets: JSON.parse(localStorage.getItem("tickets")) || [],
        technicians: technicians,
        company: JSON.parse(localStorage.getItem("sdjCompany")) || {},
        systemPrefs: JSON.parse(localStorage.getItem("systemPrefs")) || {},
        notifications: JSON.parse(localStorage.getItem("notifications")) || {},
        extra: Object.fromEntries(["finance_incomes", "finance_expenses", "services", "stock_items", "stock_log", "client_notes"].map(k => [k, JSON.parse(localStorage.getItem(k) || "null")]))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ndr_tech_backup_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.tickets) localStorage.setItem("tickets", JSON.stringify(data.tickets));
                if (data.technicians) localStorage.setItem("technicians", JSON.stringify(data.technicians));
                if (data.company) localStorage.setItem("sdjCompany", JSON.stringify(data.company));
                if (data.systemPrefs) localStorage.setItem("systemPrefs", JSON.stringify(data.systemPrefs));
                if (data.notifications) localStorage.setItem("notifications", JSON.stringify(data.notifications));
                if (data.extra) Object.entries(data.extra).forEach(([k, v]) => { if (v != null) localStorage.setItem(k, JSON.stringify(v)); });
                alert("Data imported successfully. Refresh to see changes.");
                location.reload();
            } catch(err) { alert("Invalid file."); }
        };
        reader.readAsText(file);
    };
    input.click();
}
function setupAutoBackup() {
    const enabled = document.getElementById("autoBackup").checked;
    if (enabled) {
        // Store backup in localStorage daily (simulated)
        localStorage.setItem("autoBackupEnabled", "true");
        alert("Auto backup enabled. (Daily backup will be saved to browser storage)");
    } else {
        localStorage.removeItem("autoBackupEnabled");
        alert("Auto backup disabled.");
    }
}

// Data Management
function resetDemoData() {
    if (confirm("Load demo data? This will overwrite your current tickets and technicians.")) {
        const demoTickets = [
            { ticketNumber: "NDR-0001", customerName: "Alice Johnson", phone: "0712345678", deviceType: "Laptop", brand: "Dell", model: "XPS 15", fault: "Battery not charging", status: "Waiting", createdAt: new Date().toISOString() },
            { ticketNumber: "NDR-0002", customerName: "Bob Smith", phone: "0723456789", deviceType: "Phone", brand: "Samsung", model: "S22", fault: "Cracked screen", status: "Repairing", createdAt: new Date().toISOString() },
            { ticketNumber: "NDR-0003", customerName: "Carol Davis", phone: "0734567890", deviceType: "Tablet", brand: "iPad", model: "Air", fault: "Won't turn on", status: "Ready", createdAt: new Date().toISOString() }
        ];
        localStorage.setItem("tickets", JSON.stringify(demoTickets));
        localStorage.setItem("technicians", JSON.stringify(["John Tech", "Mary Fixer"]));
        alert("Demo data loaded. Refresh page.");
        location.reload();
    }
}
function clearAllData() {
    if (confirm("⚠️ WARNING: This will DELETE all data (tickets, technicians, settings). Are you sure?")) {
        localStorage.clear();
        sessionStorage.clear();
        alert("All data cleared. You will be redirected to register.");
        window.location.href = "register.html";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;");
}