// protect page
checkAuth();

function initDashboard() {

    const company =
        JSON.parse(localStorage.getItem("sdjCompany"));

    if (company) {
        document.getElementById("companyName").innerText =
            company.companyName;

        document.getElementById("ownerName").innerText =
            "Welcome, " + company.ownerName;
    }

    loadTickets();
}

function loadTickets() {

    const tickets =
        JSON.parse(localStorage.getItem("tickets")) || [];

    let waiting = 0;
    let repairing = 0;
    let ready = 0;
    let collected = 0;

    const table =
        document.getElementById("queueTable");

    table.innerHTML = "";

    if (tickets.length === 0) {
        table.innerHTML = `
        <tr>
            <td colspan="4">No tickets yet</td>
        </tr>`;
        return;
    }

    tickets.forEach(t => {

        if (t.status === "Waiting") waiting++;
        if (t.status === "Repairing") repairing++;
        if (t.status === "Ready") ready++;
        if (t.status === "Collected") collected++;

        table.innerHTML += `
        <tr>
            <td>${t.ticketNumber}</td>
            <td>${t.customerName}</td>
            <td>${t.status}</td>
            <td>
                <button onclick="editTicket('${t.ticketNumber}')">Edit</button>
                <button onclick="deleteTicket('${t.ticketNumber}')">Delete</button>
            </td>
        </tr>
        `;
    });

    document.getElementById("waitingCount").innerText = waiting;
    document.getElementById("repairingCount").innerText = repairing;
    document.getElementById("readyCount").innerText = ready;
    document.getElementById("collectedCount").innerText = collected;
}

function editTicket(ticketNumber) {

    let tickets =
        JSON.parse(localStorage.getItem("tickets")) || [];

    const index = tickets.findIndex(t =>
        t.ticketNumber === ticketNumber
    );

    if (index === -1) return;

    const newName =
        prompt("Edit Customer Name", tickets[index].customerName);

    const newStatus =
        prompt("Edit Status (Waiting / Repairing / Ready / Collected)", tickets[index].status);

    if (newName) {
        tickets[index].customerName = newName;
    }

    if (newStatus) {
        tickets[index].status = newStatus;
    }

    localStorage.setItem("tickets", JSON.stringify(tickets));

    loadTickets();
}

function deleteTicket(ticketNumber) {

    let tickets =
        JSON.parse(localStorage.getItem("tickets")) || [];

    const confirmDelete =
        confirm("Are you sure you want to delete ticket " + ticketNumber + "?");

    if (!confirmDelete) return;

    tickets = tickets.filter(t =>
        t.ticketNumber !== ticketNumber
    );

    localStorage.setItem("tickets", JSON.stringify(tickets));

    loadTickets();
}