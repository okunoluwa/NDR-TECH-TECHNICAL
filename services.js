// Services: the tech jobs the company can do. Saved in this browser as "services".
checkAuth();

const PRESETS = [
    { cat: "Networking & Wi-Fi", jobs: ["Wi-Fi installation", "Router setup and configuration", "Network cabling", "Wi-Fi extender or mesh setup", "Fibre router installation"] },
    { cat: "CCTV & Security", jobs: ["CCTV camera installation", "CCTV maintenance and repair", "Alarm system installation", "Access control and biometrics", "Intercom installation"] },
    { cat: "Computers & Laptops", jobs: ["Laptop repair", "Desktop repair", "Screen replacement", "Virus and malware removal", "Windows installation", "Data recovery", "RAM and SSD upgrades"] },
    { cat: "Phones & Tablets", jobs: ["Phone screen replacement", "Battery replacement", "Software repair and updates", "Water damage repair"] },
    { cat: "Printers", jobs: ["Printer repair", "Printer setup and drivers", "Printer servicing"] },
    { cat: "Software & IT Support", jobs: ["Software installation", "Email and cloud setup", "Remote support", "Office network setup", "Backup setup"] },
    { cat: "Home & Office Tech", jobs: ["TV mounting", "DStv and satellite installation", "Smart home setup", "UPS and inverter backup setup", "Projector and meeting room setup"] }
];
const OTHER = "Other tech jobs";

let services = [];
try { services = JSON.parse(localStorage.getItem("services")) || []; } catch (e) { services = []; }
if (!Array.isArray(services)) services = [];

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const save = () => localStorage.setItem("services", JSON.stringify(services));
const find = id => services.find(s => s.id === id);

function renderPicker() {
    $("picker").innerHTML = PRESETS.map(g => `
        <div class="svc-group">
            <h4>${esc(g.cat)}</h4>
            <div class="svc-chips">
                ${g.jobs.map(j => {
                    const on = !!find("p:" + j);
                    return `<button type="button" class="svc-chip ${on ? "on" : ""}" aria-pressed="${on}" data-preset="${esc(j)}" data-cat="${esc(g.cat)}">${on ? "✓ " : ""}${esc(j)}</button>`;
                }).join("")}
            </div>
        </div>`).join("");
}

function renderList() {
    $("count").textContent = services.length;
    if (!services.length) {
        $("list").innerHTML = '<p class="svc-empty">No services selected yet. Pick the jobs you do above.</p>';
        return;
    }
    $("list").innerHTML = services.map(s => `
        <div class="svc-row">
            <span class="svc-name">${esc(s.name)}</span>
            <span><span class="svc-tag">${esc(s.category)}</span></span>
            <input type="number" min="0" step="0.01" placeholder="Starting price (R)" value="${esc(s.price)}" data-id="${esc(s.id)}" data-field="price" aria-label="Starting price for ${esc(s.name)}">
            <input type="text" maxlength="120" placeholder="Short note" value="${esc(s.note)}" data-id="${esc(s.id)}" data-field="note" aria-label="Note for ${esc(s.name)}">
            <button type="button" class="svc-remove" data-remove="${esc(s.id)}" aria-label="Remove ${esc(s.name)}"><i class="fas fa-trash"></i> Remove</button>
        </div>`).join("");
}

function renderAll() { renderPicker(); renderList(); }

// Pick or un-pick a ready-made job
$("picker").addEventListener("click", e => {
    const b = e.target.closest("[data-preset]");
    if (!b) return;
    const id = "p:" + b.dataset.preset;
    if (find(id)) services = services.filter(s => s.id !== id);
    else services.push({ id, name: b.dataset.preset, category: b.dataset.cat, price: "", note: "", custom: false });
    save(); renderAll();
});

// Edit price / note
$("list").addEventListener("change", e => {
    const f = e.target.dataset.field, s = find(e.target.dataset.id);
    if (!f || !s) return;
    s[f] = e.target.value.trim();
    save();
});

// Remove
$("list").addEventListener("click", e => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    services = services.filter(s => s.id !== b.dataset.remove);
    save(); renderAll();
});

// Add a custom job
$("cCategory").innerHTML = [...PRESETS.map(g => g.cat), OTHER].map(c => `<option>${esc(c)}</option>`).join("");
$("cCategory").value = OTHER;
$("customForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("cName").value.trim();
    if (!name) return;
    if (services.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        $("cError").textContent = "You already have a job called \"" + name + "\".";
        return;
    }
    $("cError").textContent = "";
    services.push({ id: "c:" + Date.now(), name, category: $("cCategory").value, price: $("cPrice").value, note: $("cNote").value.trim(), custom: true });
    save(); renderList(); e.target.reset(); $("cCategory").value = OTHER;
});

renderAll();
