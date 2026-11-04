// Clients: built from your tickets. Charges live on the ticket; payments come from Finance.
checkAuth();
let query = "", filter = "all", selected = null, payTicket = null;

const notes = () => load("client_notes", {});
function incomeMap() {
    const m = {};
    getIncomes().forEach(i => { if (i.ticketNumber) m[i.ticketNumber] = (m[i.ticketNumber] || 0) + (Number(i.amount) || 0); });
    return m;
}
function usedMap() {
    const m = {};
    load("stock_log", []).forEach(l => { if (l.type === "out" && l.ticketNumber) (m[l.ticketNumber] = m[l.ticketNumber] || []).push(l); });
    return m;
}
function buildClients() {
    const inc = incomeMap(), map = {};
    getTickets().forEach(t => {
        const k = clientKey(t);
        const c = map[k] || (map[k] = { key: k, name: t.customerName, phone: t.phone, tickets: [], billed: 0, paid: 0, owing: 0, last: "" });
        const quote = Number(t.quote) || 0, paid = inc[t.ticketNumber] || 0;
        c.tickets.push(t); c.billed += quote; c.paid += paid;
        if (quote > 0) c.owing += Math.max(0, quote - paid);
        if (!c.last || String(t.createdAt || "") > c.last) { c.last = t.createdAt || c.last; c.name = t.customerName; c.phone = t.phone; }
    });
    return Object.values(map).sort((a, b) => String(b.last).localeCompare(String(a.last)));
}

function render() {
    const all = buildClients(), q = query.trim().toLowerCase(), qd = q.replace(/\D/g, ""), q2 = qd.replace(/^(27|0)/, "");
    const owingClients = all.filter(c => c.owing > 0.005);
    $("summary").innerHTML = `
        <div class="m-stat"><span>Clients</span><b>${all.length}</b></div>
        <div class="m-stat"><span>Jobs</span><b>${all.reduce((a, c) => a + c.tickets.length, 0)}</b></div>
        <div class="m-stat ${owingClients.length ? "warn" : ""}"><span>Clients who owe</span><b>${owingClients.length}</b></div>
        <div class="m-stat ${owingClients.length ? "warn" : ""}"><span>Total owed to you</span><b>${money(owingClients.reduce((a, c) => a + c.owing, 0))}</b></div>`;

    const shown = all.filter(c => {
        if (filter === "owing" && c.owing <= 0.005) return false;
        if (!q) return true;
        return String(c.name).toLowerCase().includes(q) || (q2 && c.tickets.some(t => String(t.phone || "").replace(/\D/g, "").slice(-9).includes(q2))) ||
            c.tickets.some(t => String(t.ticketNumber).toLowerCase().includes(q) || device(t).toLowerCase().includes(q));
    });
    $("clist").innerHTML = shown.length ? shown.map(c => `
        <button type="button" class="client-item ${c.key === selected ? "on" : ""}" data-key="${esc(c.key)}">
            <b>${esc(c.name)}</b>
            <span class="sub">${esc(c.phone || "No phone")} · ${c.tickets.length} job${c.tickets.length === 1 ? "" : "s"}${c.last ? " · last " + fmtDate(c.last) : ""}</span>
            ${c.owing > 0.005 ? `<span class="m-badge owe">Owes ${money(c.owing)}</span>` : `<span class="m-badge ok">Nothing owing</span>`}
        </button>`).join("") : `<p class="m-empty">${all.length ? "No clients match." : "No clients yet. Clients appear here when you create tickets."}</p>`;

    const c = all.find(x => x.key === selected);
    $("cdetail").innerHTML = c ? detail(c) : `<p class="m-empty">Select a client to see their history and what they owe.</p>`;
}

function detail(c) {
    const inc = incomeMap(), used = usedMap();
    const rows = [...c.tickets].sort(newestFirst).map(t => {
        const quote = Number(t.quote) || 0, paid = inc[t.ticketNumber] || 0, bal = quote - paid;
        const mats = (used[t.ticketNumber] || []).map(l => `${esc(l.itemName)} × ${l.qty}${l.unit && l.unit !== "pcs" ? " " + esc(l.unit) : ""}`).join(", ");
        const badge = quote > 0
            ? (bal > 0.005 ? `<span class="m-badge owe">Owes ${money(bal)}</span>` : bal < -0.005 ? `<span class="m-badge ok">Overpaid ${money(-bal)}</span>` : `<span class="m-badge ok">Paid</span>`)
            : `<span class="m-badge muted">No price set</span>`;
        return `<tr>
            <td><b>${esc(t.ticketNumber)}</b><div class="sub">${esc(fmtDate(t.createdAt))}</div></td>
            <td>${esc(device(t))}<div class="sub">${esc(String(t.fault || "").slice(0, 90))}</div>${mats ? `<div class="mats"><i class="fas fa-box"></i> ${mats}</div>` : ""}</td>
            <td>${esc(t.status || "")}</td>
            <td><input class="m-input" type="number" min="0" step="0.01" placeholder="Charge (R)" value="${quote || ""}" data-quote="${esc(t.ticketNumber)}" aria-label="Charge for ${esc(t.ticketNumber)}"></td>
            <td>${money(paid)}</td>
            <td>${badge}</td>
            <td><button type="button" class="m-btn small" data-pay="${esc(t.ticketNumber)}">Add payment</button> <a class="m-btn small ghost" href="proof.html?ticket=${encodeURIComponent(t.ticketNumber)}">Photos</a></td>
        </tr>`;
    }).join("");
    return `
        <div class="detail-head"><div><h2>${esc(c.name)}</h2><div class="sub">${esc(c.phone || "No phone")}</div></div></div>
        <div class="detail-stats">
            <div><span>Jobs</span><b>${c.tickets.length}</b></div>
            <div><span>Total charged</span><b>${money(c.billed)}</b></div>
            <div><span>Total paid</span><b>${money(c.paid)}</b></div>
            <div class="${c.owing > 0.005 ? "owes" : ""}"><span>Owes you</span><b>${money(c.owing)}</b></div>
        </div>
        <label>Notes about this client<textarea class="m-input" id="cNotes" maxlength="1000" placeholder="Address, gate code, preferences...">${esc(notes()[c.key] || "")}</textarea></label>
        <h3 style="margin:14px 0 8px">Job history</h3>
        <p class="m-hint">Type the charge for each job. What the client owes is the charge minus payments recorded for that ticket.</p>
        <div class="m-scroll"><table class="m-table"><thead><tr><th>Ticket</th><th>Job</th><th>Status</th><th>Charge</th><th>Paid</th><th>Balance</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

$("q").addEventListener("input", e => { query = e.target.value; render(); });
$("seg").addEventListener("click", e => {
    const f = e.target.dataset.f; if (!f) return;
    filter = f; [...$("seg").children].forEach(b => b.classList.toggle("on", b.dataset.f === f)); render();
});
$("clist").addEventListener("click", e => {
    const b = e.target.closest("[data-key]"); if (!b) return;
    selected = b.dataset.key; render();
    if (window.innerWidth < 1000) $("cdetail").scrollIntoView({ behavior: "smooth" });
});
$("cdetail").addEventListener("change", e => {
    if (e.target.dataset.quote) {
        const tickets = getTickets(), t = tickets.find(x => x.ticketNumber === e.target.dataset.quote);
        if (!t) return;
        const v = parseFloat(e.target.value);
        if (v > 0) t.quote = Math.round(v * 100) / 100; else delete t.quote;
        save("tickets", tickets); render(); toast("Charge saved");
    }
});
$("cdetail").addEventListener("focusout", e => {
    if (e.target.id === "cNotes") { const n = notes(); n[selected] = e.target.value.trim(); save("client_notes", n); }
});
$("cdetail").addEventListener("click", e => {
    const b = e.target.closest("[data-pay]"); if (!b) return;
    payTicket = getTickets().find(t => t.ticketNumber === b.dataset.pay); if (!payTicket) return;
    const bal = (Number(payTicket.quote) || 0) - (incomeMap()[payTicket.ticketNumber] || 0);
    $("payFor").textContent = ticketLabel(payTicket) + (bal > 0 ? " · balance " + money(bal) : "");
    $("payAmt").value = bal > 0 ? bal.toFixed(2) : "";
    $("payDlg").showModal();
});
$("payCancel").onclick = () => $("payDlg").close();
$("payForm").addEventListener("submit", e => {
    e.preventDefault();
    const amount = parseFloat($("payAmt").value);
    if (!(amount > 0) || !payTicket) return;
    const incomes = getIncomes();
    incomes.push({ id: Date.now(), category: "Repairs", amount, description: `Payment for ticket ${payTicket.ticketNumber} - ${payTicket.customerName}`, date: new Date().toISOString().slice(0, 10), ticketNumber: payTicket.ticketNumber, technician: payTicket.assignedTo || null, type: "income" });
    save("finance_incomes", incomes);
    $("payDlg").close(); render(); toast("Payment of " + money(amount) + " recorded");
});

render();
