checkAuth();

const form = document.getElementById("ticketForm");

form.addEventListener("submit", function(e){

    e.preventDefault();

    const customerName =
    document.getElementById("customerName").value;

    const phone =
    document.getElementById("phone").value;

    const deviceType =
    document.getElementById("deviceType").value;

    const brand =
    document.getElementById("brand").value;

    const model =
    document.getElementById("model").value;

    const fault =
    document.getElementById("fault").value;

    // Load existing tickets
    let tickets =
    JSON.parse(localStorage.getItem("tickets")) || [];

    // Generate ticket number
    const ticketNumber =
    "NDR-" + (tickets.length + 1).toString().padStart(4, "0");

    const newTicket = {
        ticketNumber,
        customerName,
        phone,
        deviceType,
        brand,
        model,
        fault,
        status: "Waiting",
        createdAt: new Date().toISOString()
    };

    tickets.push(newTicket);

    localStorage.setItem(
        "tickets",
        JSON.stringify(tickets)
    );

    alert("Ticket Created: " + ticketNumber);

    window.location.href = "dashboard.html";

});