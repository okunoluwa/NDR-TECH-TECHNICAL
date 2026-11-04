checkAuth();

function loadRepairTickets() {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const container = document.getElementById("repairList");
    container.innerHTML = "";

    const repairTickets = tickets.filter(t => t.status !== "Collected");

    if (repairTickets.length === 0) {
        container.innerHTML = "<p><i class='fas fa-check-circle'></i> No active repairs. All caught up!</p>";
        return;
    }

    repairTickets.forEach(t => {
        // Get status badge class and icon
        let statusClass = "";
        let statusIcon = "";
        if (t.status === "Waiting") {
            statusClass = "status-waiting";
            statusIcon = "fa-clock";
        } else if (t.status === "Repairing") {
            statusClass = "status-repairing";
            statusIcon = "fa-wrench";
        } else if (t.status === "Ready") {
            statusClass = "status-ready";
            statusIcon = "fa-check-circle";
        }

        const createdDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Not recorded";

        container.innerHTML += `
        <div class="card">
            <div class="card-header">
                <div class="ticket-number">
                    <i class="fas fa-hashtag"></i> ${t.ticketNumber}
                </div>
                <div class="status-badge ${statusClass}">
                    <i class="fas ${statusIcon}"></i> ${t.status}
                </div>
            </div>
            <div class="card-body">
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-user"></i></div>
                    <div class="info-content">
                        <div class="info-label">Customer</div>
                        <div class="info-value">${escapeHtml(t.customerName)}</div>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-mobile-alt"></i></div>
                    <div class="info-content">
                        <div class="info-label">Device</div>
                        <div class="info-value">${escapeHtml(t.deviceType)} - ${escapeHtml(t.brand)} ${escapeHtml(t.model)}</div>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="info-content">
                        <div class="info-label">Fault Description</div>
                        <div class="info-value">${escapeHtml(t.fault)}</div>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="info-content">
                        <div class="info-label">Created</div>
                        <div class="info-value">${createdDate}</div>
                    </div>
                </div>
                ${t.note ? `
                <div class="note-section">
                    <div class="info-label"><i class="fas fa-pen"></i> Technician Note</div>
                    <div class="info-value" style="margin-top: 6px;">${escapeHtml(t.note)}</div>
                </div>
                ` : ""}
            </div>
            <div class="card-actions">
                <button class="action-btn btn-start" onclick="updateStatus('${t.ticketNumber}', 'Repairing')">
                    <i class="fas fa-play"></i> Start Repair
                </button>
                <button class="action-btn btn-ready" onclick="updateStatus('${t.ticketNumber}', 'Ready')">
                    <i class="fas fa-check"></i> Mark Ready
                </button>
                <button class="action-btn btn-collect" onclick="updateStatus('${t.ticketNumber}', 'Collected')">
                    <i class="fas fa-box"></i> Collected
                </button>
                <button class="action-btn btn-note" onclick="addNote('${t.ticketNumber}')">
                    <i class="fas fa-sticky-note"></i> Add Note
                </button>
            </div>
        </div>
        `;
    });
}

function updateStatus(ticketNumber, status) {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const index = tickets.findIndex(t => t.ticketNumber === ticketNumber);
    if (index === -1) return;
    tickets[index].status = status;
    localStorage.setItem("tickets", JSON.stringify(tickets));
    loadRepairTickets();
}

function addNote(ticketNumber) {
    let note = prompt("Add a professional note (e.g., parts needed, estimated completion):");
    if (!note || note.trim() === "") return;
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const index = tickets.findIndex(t => t.ticketNumber === ticketNumber);
    if (index === -1) return;
    tickets[index].note = note.trim();
    localStorage.setItem("tickets", JSON.stringify(tickets));
    loadRepairTickets();
}

// Simple XSS protection
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}