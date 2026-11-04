// Stock: equipment and materials. Every "Use" lowers the quantity and is logged against a job.
checkAuth();
const CATS = ["Networking", "CCTV", "Cabling", "Power", "Computer parts", "Phone parts", "Other"];
const COMMON = [["Wi-Fi router", "Networking", "pcs"], ["Wi-Fi extender", "Networking", "pcs"], ["Network switch", "Networking", "pcs"],
    ["CAT6 cable", "Cabling", "m"], ["RJ45 connectors", "Cabling", "pcs"], ["Patch cable", "Cabling", "pcs"], ["Coaxial cable", "Cabling", "m"],
    ["HDMI cable", "Cabling", "pcs"], ["CCTV camera", "CCTV", "pcs"], ["DVR / NVR recorder", "CCTV", "pcs"], ["BNC connectors", "CCTV", "pcs"],
    ["CCTV power supply", "Power", "pcs"], ["Power adapter", "Power", "pcs"], ["Hard drive", "Computer parts", "pcs"]];

let items = load("stock_items", []), log = load("stock_log", []);
let query = "", filter = "all", editId = null, mv = null;
const saveAll = () => { save("stock_items", items); save("stock_log", log); };
const num = n => Math.round(n * 100) / 100;
const state = i => i.qty <= 0 ? "out" : (i.min > 0 && i.qty <= i.min ? "low" : "ok");
const label = { ok: "In stock", low: "Low", out: "Out of stock" };

function render() {
    const low = items.filter(i => state(i) !== "ok");
    $("summary").innerHTML = `
        <div class="m-stat"><span>Items</span><b>${items.length}</b></div>
        <div class="m-stat ${low.length ? "warn" : ""}"><span>Low or out of stock</span><b>${low.length}</b></div>
        <div class="m-stat"><span>Stock value</span><b>${money(items.reduce((a, i) => a + i.qty * (i.cost || 0), 0))}</b></div>`;

    $("common").innerHTML = COMMON.map(([n, c, u]) => {
        const has = items.some(i => i.name.toLowerCase() === n.toLowerCase());
        return `<button type="button" class="m-chip ${has ? "added" : ""}" ${has ? "disabled" : ""} data-common="${esc(n)}">${has ? "✓ " : "+ "}${esc(n)}</button>`;
    }).join("");

    const q = query.trim().toLowerCase();
    const shown = items.filter(i => (filter === "all" || state(i) !== "ok") && (!q || (i.name + " " + i.category).toLowerCase().includes(q)));
    $("rows").innerHTML = shown.length ? shown.map(i => `<tr>
        <td><b>${esc(i.name)}</b></td><td>${esc(i.category)}</td>
        <td><span class="big">${num(i.qty)}</span> <span class="sub">${esc(i.unit)}</span></td>
        <td><span class="m-badge ${state(i)}">${label[state(i)]}</span></td>
        <td>${i.cost ? money(i.qty * i.cost) : "-"}</td>
        <td style="white-space:nowrap"><button class="m-btn small" data-use="${i.id}">Use</button> <button class="m-btn small ghost" data-in="${i.id}">Restock</button> <button class="m-btn small ghost" data-edit="${i.id}" aria-label="Edit ${esc(i.name)}">Edit</button> <button class="m-btn small danger" data-del="${i.id}" aria-label="Delete ${esc(i.name)}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="6" class="m-empty">${items.length ? "Nothing matches." : "No stock yet. Add an item or tap a quick-add item above."}</td></tr>`;

    $("log").innerHTML = log.length ? log.slice(0, 25).map(l => `<tr>
        <td>${esc(fmtDate(l.date))}</td><td>${esc(l.itemName)}</td>
        <td><b style="color:${l.type === "in" ? "#15803d" : "#b91c1c"}">${l.type === "in" ? "+" : "-"}${num(l.qty)}</b> <span class="sub">${esc(l.unit)}</span></td>
        <td>${esc(l.ticketNumber || "")}</td><td>${esc(l.note || "")}</td></tr>`).join("") : `<tr><td colspan="5" class="m-empty">No movements yet.</td></tr>`;
}

// Quick add
$("common").addEventListener("click", e => {
    const b = e.target.closest("[data-common]"); if (!b) return;
    const c = COMMON.find(x => x[0] === b.dataset.common); if (!c) return;
    items.push({ id: Date.now(), name: c[0], category: c[1], unit: c[2], qty: 0, min: 1, cost: 0 });
    saveAll(); render(); toast(c[0] + " added. Tap Restock to enter how many you have.");
});

// Add / edit item
$("iCat").innerHTML = CATS.map(c => `<option>${esc(c)}</option>`).join("");
$("addItem").onclick = () => {
    editId = null; $("itemTitle").textContent = "Add item"; $("itemForm").reset();
    $("iQtyWrap").style.display = ""; $("iUnit").value = "pcs"; $("iMin").value = 1; $("itemDlg").showModal();
};
$("itemForm").addEventListener("submit", e => {
    e.preventDefault();
    const data = { name: $("iName").value.trim(), category: $("iCat").value, unit: $("iUnit").value.trim() || "pcs", min: parseFloat($("iMin").value) || 0, cost: parseFloat($("iCost").value) || 0 };
    if (!data.name) return;
    if (editId) Object.assign(items.find(i => i.id === editId), data);
    else {
        const qty = parseFloat($("iQty").value) || 0;
        const item = { id: Date.now(), qty, ...data }; items.push(item);
        if (qty > 0) log.unshift({ id: Date.now() + 1, itemId: item.id, itemName: item.name, unit: item.unit, type: "in", qty, ticketNumber: "", note: "Opening stock", date: new Date().toISOString() });
    }
    saveAll(); $("itemDlg").close(); render(); toast("Item saved");
});

// Use / restock
$("rows").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const id = +(b.dataset.use || b.dataset.in || b.dataset.edit || b.dataset.del), item = items.find(i => i.id === id); if (!item) return;
    if (b.dataset.edit) {
        editId = id; $("itemTitle").textContent = "Edit item";
        $("iName").value = item.name; $("iCat").value = item.category; $("iUnit").value = item.unit; $("iMin").value = item.min; $("iCost").value = item.cost || "";
        $("iQtyWrap").style.display = "none"; $("itemDlg").showModal();
    } else if (b.dataset.del) {
        if (confirm("Delete " + item.name + " from your stock list? Past movements stay in the history.")) { items = items.filter(i => i.id !== id); saveAll(); render(); }
    } else {
        mv = { item, type: b.dataset.use ? "out" : "in" };
        $("mvTitle").textContent = mv.type === "out" ? "Use stock on a job" : "Restock";
        $("mvItem").textContent = item.name + " · " + num(item.qty) + " " + item.unit + " in stock";
        $("mvQty").value = ""; $("mvNote").value = ""; $("mvErr").textContent = "";
        $("mvTicketWrap").style.display = mv.type === "out" ? "" : "none";
        $("mvTicket").innerHTML = '<option value="">Not linked to a job</option>' + getTickets().sort(newestFirst).map(t => `<option value="${esc(t.ticketNumber)}">${esc(ticketLabel(t))}</option>`).join("");
        $("mvDlg").showModal();
    }
});
$("mvForm").addEventListener("submit", e => {
    e.preventDefault();
    const qty = parseFloat($("mvQty").value);
    if (!(qty > 0) || !mv) return;
    if (mv.type === "out" && qty > mv.item.qty) { $("mvErr").textContent = "You only have " + num(mv.item.qty) + " " + mv.item.unit + " left."; return; }
    mv.item.qty = num(mv.type === "in" ? mv.item.qty + qty : mv.item.qty - qty);
    log.unshift({ id: Date.now(), itemId: mv.item.id, itemName: mv.item.name, unit: mv.item.unit, type: mv.type, qty, ticketNumber: mv.type === "out" ? $("mvTicket").value : "", note: $("mvNote").value.trim(), date: new Date().toISOString() });
    saveAll(); $("mvDlg").close(); render();
    toast(mv.type === "out" ? num(mv.item.qty) + " " + mv.item.unit + " of " + mv.item.name + " left" : "Stock updated");
});
document.querySelectorAll("[data-close]").forEach(b => b.onclick = () => b.closest("dialog").close());

$("q").addEventListener("input", e => { query = e.target.value; render(); });
$("seg").addEventListener("click", e => {
    const f = e.target.dataset.f; if (!f) return;
    filter = f; [...$("seg").children].forEach(b => b.classList.toggle("on", b.dataset.f === f)); render();
});
render();
