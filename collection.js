checkAuth();

function loadCollectionTickets() {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const container = document.getElementById("collectionList");
    container.innerHTML = "";

    const readyTickets = tickets.filter(t => t.status === "Ready");

    if (readyTickets.length === 0) {
        container.innerHTML = "<p><i class='fas fa-check-circle'></i> No items ready for collection.</p>";
        return;
    }

    readyTickets.forEach(t => {
        const createdDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Unknown";

        container.innerHTML += `
        <div class="card">
            <div class="card-header">
                <div class="ticket-number">
                    <i class="fas fa-hashtag"></i> ${escapeHtml(t.ticketNumber)}
                </div>
                <div class="status-badge">
                    <i class="fas fa-check-circle"></i> Ready for Pickup
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
                    <div class="info-icon"><i class="fas fa-phone"></i></div>
                    <div class="info-content">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${escapeHtml(t.phone || "Not provided")}</div>
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
                    <div class="info-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="info-content">
                        <div class="info-label">Ready Since</div>
                        <div class="info-value">${createdDate}</div>
                    </div>
                </div>
                ${t.note ? `
                <div class="note-section">
                    <div class="info-label"><i class="fas fa-pen"></i> Technician Note</div>
                    <div class="info-value" style="margin-top:6px;">${escapeHtml(t.note)}</div>
                </div>
                ` : ""}
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-coins"></i></div>
                    <div class="info-content">
                        <div class="info-label">Repair Cost</div>
                        <div class="info-value">R${t.repairCost ? t.repairCost.toLocaleString() : getDefaultRepairCost().toLocaleString()}</div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn btn-collect" onclick="collectAndPay('${t.ticketNumber}')">
                    <i class="fas fa-hand-holding-usd"></i> Collect & Pay
                </button>
                <button class="action-btn btn-print" onclick="printPaymentReceipt('${t.ticketNumber}')">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </div>
        </div>
        `;
    });
}

function getDefaultRepairCost() {
    let prefs = JSON.parse(localStorage.getItem("systemPrefs"));
    return prefs?.defaultRepairFee || 500;
}

function collectAndPay(ticketNumber) {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const index = tickets.findIndex(t => t.ticketNumber === ticketNumber);
    if (index === -1) return;

    const ticket = tickets[index];
    const defaultCost = getDefaultRepairCost();
    let amountPaid = parseFloat(prompt(`Enter amount paid for ticket ${ticketNumber} (Repair cost: R${defaultCost}):`, defaultCost));
    if (isNaN(amountPaid) || amountPaid <= 0) {
        alert("Invalid amount.");
        return;
    }

    // Record payment as income
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    const paymentRecord = {
        id: Date.now(),
        category: "Repairs",
        amount: amountPaid,
        description: `Payment for ticket ${ticketNumber} - ${ticket.customerName}`,
        date: new Date().toISOString().slice(0,10),
        ticketNumber: ticketNumber,
        technician: ticket.assignedTo || null,
        type: "income"
    };
    incomes.push(paymentRecord);
    localStorage.setItem("finance_incomes", JSON.stringify(incomes));

    // Update ticket status to Collected and store payment info
    tickets[index].status = "Collected";
    tickets[index].paymentAmount = amountPaid;
    tickets[index].paymentDate = new Date().toISOString();
    localStorage.setItem("tickets", JSON.stringify(tickets));

    alert(`Payment of R${amountPaid} recorded. Ticket ${ticketNumber} marked as collected.`);

    // Ask user if they want to print receipt
    if (confirm("Print payment receipt now?")) {
        printPaymentReceipt(ticketNumber);
    }
    loadCollectionTickets(); // refresh list
}

function printPaymentReceipt(ticketNumber) {
    let tickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const ticket = tickets.find(t => t.ticketNumber === ticketNumber);
    if (!ticket) {
        alert("Ticket not found.");
        return;
    }

    // Get payment record from incomes (most recent for this ticket)
    let incomes = JSON.parse(localStorage.getItem("finance_incomes")) || [];
    const payment = incomes.filter(i => i.ticketNumber === ticketNumber).pop();

    if (!payment && ticket.status !== "Collected") {
        alert("No payment recorded for this ticket yet.");
        return;
    }

    const content = generatePaymentReceiptHTML(ticket, payment);
    printViaIframe(content);
}

function generatePaymentReceiptHTML(ticket, payment) {
    const company = getCompanyData();
    const qrDataUrl = generateQRCode(ticket.ticketNumber);
    const date = payment ? new Date(payment.date).toLocaleDateString() : new Date().toLocaleDateString();
    const amount = payment ? payment.amount : (ticket.repairCost || getDefaultRepairCost());
    
    return `
        <div class="header">
            <img src="image/ndr-tech-logo.png" alt="NDR Tech" style="width:150px;height:auto;margin-bottom:8px;">
            <div class="company-name">${company.name}</div>
            <div class="company-details">${[company.address, [company.phone && "Tel: " + company.phone, company.email && "Email: " + company.email].filter(Boolean).join(" | ")].filter(Boolean).join("<br>")}</div>
        </div>
        <div class="receipt-title">💰 PAYMENT RECEIPT</div>
        <div class="info-row"><span class="label">Ticket No:</span><span class="value">${escapeHtml(ticket.ticketNumber)}</span></div>
        <div class="info-row"><span class="label">Date:</span><span class="value">${date}</span></div>
        <div class="info-row"><span class="label">Customer:</span><span class="value">${escapeHtml(ticket.customerName)}</span></div>
        <div class="info-row"><span class="label">Device:</span><span class="value">${escapeHtml(ticket.deviceType)} - ${escapeHtml(ticket.brand)} ${escapeHtml(ticket.model)}</span></div>
        <div class="info-row"><span class="label">Amount Paid:</span><span class="value">R${amount.toLocaleString()}</span></div>
        <div class="info-row"><span class="label">Payment Method:</span><span class="value">Cash / Card</span></div>
        <div class="info-row"><span class="label">Balance Due:</span><span class="value">R0.00</span></div>
        <div class="qr-section">
            <img src="${qrDataUrl}" alt="QR Code" style="width:100px;height:100px;">
            <div>Payment complete - Device collected</div>
        </div>
        <div class="footer">Thank you for your payment!<br>Device warranty applies as per policy.</div>
    `;
}

// Print using hidden iframe (bypasses popup blockers)
function printViaIframe(htmlContent) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Payment Receipt</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                .receipt { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white; }
                .header { text-align: center; border-bottom: 2px solid #0066e6; padding-bottom: 15px; margin-bottom: 15px; }
                .company-name { font-size: 22px; font-weight: bold; color: #0f172a; }
                .company-details { font-size: 12px; color: #475569; margin-top: 5px; }
                .receipt-title { font-size: 18px; font-weight: bold; margin: 15px 0; text-align: center; }
                .info-row { margin-bottom: 12px; border-bottom: 1px dotted #eee; padding-bottom: 8px; }
                .label { font-weight: bold; color: #0066e6; display: inline-block; width: 120px; }
                .value { color: #0f172a; }
                .qr-section { text-align: center; margin-top: 20px; }
                .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
                @media print { body { margin: 0; padding: 0; } .receipt { border: none; } }
            </style>
        </head>
        <body>
            <div class="receipt">${htmlContent}</div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.parent.document.body.removeChild(window.frameElement); }, 1000);
                };
            <\/script>
        </body>
        </html>
    `);
    iframeDoc.close();
}

// Helper functions
function getCompanyData() {
    const company = JSON.parse(localStorage.getItem("sdjCompany")) || {};
    return {
        name: company.companyName || "NDR TECH",
        owner: company.ownerName || "NDR Tech",
        phone: company.phone || "",
        email: company.email || "",
        address: company.address || ""
    };
}

function generateQRCode(text) {
    if (typeof qrcodeGenerator === 'undefined') {
        console.warn("QR code library not loaded");
        return "";
    }
    try {
        const qr = qrcodeGenerator(4, 'L');
        qr.addData(text);
        qr.make();
        return qr.createDataURL(4, 4);
    } catch(e) {
        console.error("QR generation error:", e);
        return "";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, m => m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;");
}