checkAuth();

let allTickets = [];
let technicians = [];

function initManagement() {
    loadTechnicians();
    loadTickets();
}

function loadTechnicians() {
    technicians = JSON.parse(localStorage.getItem("technicians")) || [];
    const list = document.getElementById("technicianList");
    list.innerHTML = "";
    const filterSelect = document.getElementById("filterTech");
    filterSelect.innerHTML = '<option value="">-- All technicians --</option>';
    technicians.forEach((tech, idx) => {
        list.innerHTML += `
            <li>
                <span><i class="fas fa-user-cog"></i> ${escapeHtml(tech)}</span>
                <button onclick="removeTechnician(${idx})"><i class="fas fa-trash"></i> Remove</button>
            </li>
        `;
        filterSelect.innerHTML += `<option value="${escapeHtml(tech)}">${escapeHtml(tech)}</option>`;
    });
    if (technicians.length === 0) {
        list.innerHTML = '<li style="background:transparent; color:#64748b;">No technicians added. Add one above.</li>';
    }
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
    loadTickets(); // refresh assignment list
}

function removeTechnician(index) {
    if (confirm(`Remove technician "${technicians[index]}"? This will unassign all their tickets.`)) {
        const techName = technicians[index];
        // Unassign tickets assigned to this technician
        let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
        tickets = tickets.map(t => {
            if (t.assignedTo === techName) {
                t.assignedTo = "";
            }
            return t;
        });
        localStorage.setItem("tickets", JSON.stringify(tickets));
        technicians.splice(index, 1);
        localStorage.setItem("technicians", JSON.stringify(technicians));
        loadTechnicians();
        loadTickets();
    }
}

function loadTickets() {
    allTickets = JSON.parse(localStorage.getItem("tickets")) || [];
    filterTicketsByTech();
}

function filterTicketsByTech() {
    const selectedTech = document.getElementById("filterTech").value;
    const selectedStatus = document.getElementById("filterStatus").value;
    let filtered = [...allTickets];
    if (selectedTech) {
        filtered = filtered.filter(t => t.assignedTo === selectedTech);
    }
    if (selectedStatus) {
        filtered = filtered.filter(t => t.status === selectedStatus);
    }
    renderAssignmentList(filtered);
}

function renderAssignmentList(tickets) {
    const container = document.getElementById("assignmentList");
    if (tickets.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#64748b;">No tickets match the filters.</p>';
        return;
    }
    container.innerHTML = "";
    tickets.forEach(ticket => {
        const statusClass = `status-${ticket.status.toLowerCase()}`;
        container.innerHTML += `
            <div class="assignment-item">
                <div class="assignment-info">
                    <strong>${escapeHtml(ticket.ticketNumber)}</strong> – ${escapeHtml(ticket.customerName)}
                    <p>${escapeHtml(ticket.deviceType)} ${escapeHtml(ticket.brand)} ${escapeHtml(ticket.model)} | Status: <span class="status-badge-sm ${statusClass}">${ticket.status}</span></p>
                    <p>Currently assigned: <strong>${escapeHtml(ticket.assignedTo || "Unassigned")}</strong></p>
                </div>
                <div class="assignment-actions">
                    <select onchange="assignTicket('${ticket.ticketNumber}', this.value)">
                        <option value="">-- Assign to --</option>
                        ${technicians.map(tech => `<option value="${escapeHtml(tech)}" ${ticket.assignedTo === tech ? 'selected' : ''}>${escapeHtml(tech)}</option>`).join('')}
                        <option value="">Unassign</option>
                    </select>
                </div>
            </div>
        `;
    });
}

function assignTicket(ticketNumber, techName) {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const index = tickets.findIndex(t => t.ticketNumber === ticketNumber);
    if (index !== -1) {
        tickets[index].assignedTo = techName || "";
        localStorage.setItem("tickets", JSON.stringify(tickets));
        loadTickets(); // refresh the list
        // Optional: show a small notification
        alert(`Ticket ${ticketNumber} ${techName ? "assigned to " + techName : "unassigned"}`);
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}