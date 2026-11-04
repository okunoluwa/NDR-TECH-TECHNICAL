// Proof of work: photos kept with each job. Stored in the browser's IndexedDB (room for many photos).
checkAuth();
const KINDS_ORDER = ["After work", "Before work", "Equipment and serial number", "Other"];
let photos = [], current = null;

function openDb() {
    return new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error("This browser cannot store photos."));
        const r = indexedDB.open("ndr_tech_db", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error || new Error("Could not open photo storage."));
    });
}
async function tx(mode, fn) {
    const db = await openDb();
    return new Promise((res, rej) => {
        const t = db.transaction("photos", mode), req = fn(t.objectStore("photos"));
        t.oncomplete = () => res(req && req.result);
        t.onerror = t.onabort = () => rej(t.error || new Error("Storage is full or unavailable."));
    });
}

// Resize, add a ticket/date stamp, and make a small thumbnail
function processFile(file, stamp) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => {
            const draw = max => {
                const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
                c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
                c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); return c;
            };
            const big = draw(1280), g = big.getContext("2d"), fs = Math.max(14, Math.round(big.width / 55));
            g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(0, big.height - fs * 2, big.width, fs * 2);
            g.fillStyle = "#fff"; g.font = "600 " + fs + "px Arial, sans-serif"; g.textBaseline = "middle";
            g.fillText(stamp, fs * 0.6, big.height - fs);
            URL.revokeObjectURL(url);
            resolve({ data: big.toDataURL("image/jpeg", 0.82), thumb: draw(360).toDataURL("image/jpeg", 0.75) });
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read \"" + file.name + "\". Please use a JPG or PNG photo.")); };
        img.src = url;
    });
}

async function refresh() {
    try { photos = (await tx("readonly", s => s.getAll())) || []; }
    catch (e) { $("upErr").textContent = e.message; photos = []; }
    renderGallery();
}

function renderGallery() {
    const tickets = getTickets(), byNo = {}; tickets.forEach(t => byNo[t.ticketNumber] = t);
    const q = $("q").value.trim().toLowerCase();
    const list = photos.filter(p => {
        const t = byNo[p.ticketNumber] || {};
        return !q || (p.ticketNumber + " " + (t.customerName || "") + " " + (p.note || "") + " " + p.kind).toLowerCase().includes(q);
    }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (!list.length) { $("gallery").innerHTML = `<p class="m-empty">${photos.length ? "No photos match." : "No photos yet. Upload your first proof of work above."}</p>`; return; }
    const groups = {}; list.forEach(p => (groups[p.ticketNumber] = groups[p.ticketNumber] || []).push(p));
    $("gallery").innerHTML = Object.entries(groups).map(([tn, ps]) => {
        const t = byNo[tn];
        return `<div class="pgroup"><h4>${esc(tn)}${t ? " · " + esc(t.customerName) + (device(t) ? " · " + esc(device(t)) : "") : ""} <span class="sub">(${ps.length} photo${ps.length === 1 ? "" : "s"})</span></h4>
        <div class="pgrid">${ps.map(p => `<button type="button" class="pthumb" data-id="${p.id}" aria-label="${esc(p.kind)} photo for ${esc(tn)}"><img src="${p.thumb}" alt="${esc(p.kind)}" loading="lazy"><span>${esc(p.kind)}</span></button>`).join("")}</div></div>`;
    }).join("");
}

function fillTickets() {
    const t = getTickets().sort(newestFirst), want = new URLSearchParams(location.search).get("ticket");
    $("upTicket").innerHTML = t.length ? t.map(x => `<option value="${esc(x.ticketNumber)}">${esc(ticketLabel(x))}</option>`).join("") : '<option value="">No tickets yet. Create a ticket first.</option>';
    if (want && t.some(x => x.ticketNumber === want)) { $("upTicket").value = want; $("q").value = want; }
}

$("upForm").addEventListener("submit", async e => {
    e.preventDefault(); $("upErr").textContent = "";
    const tn = $("upTicket").value, files = [...$("upFiles").files];
    if (!tn || !files.length) return;
    $("upBtn").disabled = true; $("upBtn").textContent = "Uploading...";
    let ok = 0;
    for (const f of files) {
        try {
            const stamp = tn + "  |  " + new Date().toLocaleString("en-ZA") + "  |  NDR Tech";
            const { data, thumb } = await processFile(f, stamp);
            await tx("readwrite", s => s.put({ id: Date.now() + Math.random(), ticketNumber: tn, kind: $("upKind").value, note: $("upNote").value.trim(), createdAt: new Date().toISOString(), data, thumb }));
            ok++;
        } catch (err) { $("upErr").textContent = err.message; }
    }
    $("upBtn").disabled = false; $("upBtn").innerHTML = '<i class="fas fa-upload"></i> Upload';
    if (ok) { $("upFiles").value = ""; $("upNote").value = ""; toast(ok + " photo" + (ok === 1 ? "" : "s") + " saved"); await refresh(); }
});

$("gallery").addEventListener("click", e => {
    const b = e.target.closest("[data-id]"); if (!b) return;
    current = photos.find(p => String(p.id) === b.dataset.id); if (!current) return;
    const t = getTickets().find(x => x.ticketNumber === current.ticketNumber);
    $("viewImg").src = current.data; $("viewImg").alt = current.kind + " photo for " + current.ticketNumber;
    $("viewMeta").innerHTML = `<b>${esc(current.ticketNumber)}</b> · ${esc(current.kind)}${t ? " · " + esc(t.customerName) : ""}<div class="sub">${esc(new Date(current.createdAt).toLocaleString("en-ZA"))}${current.note ? " · " + esc(current.note) : ""}</div>`;
    $("viewDl").href = current.data; $("viewDl").download = current.ticketNumber + "-" + current.kind.replace(/\W+/g, "-").toLowerCase() + ".jpg";
    $("viewDlg").showModal();
});
$("viewClose").onclick = () => $("viewDlg").close();
$("viewDlg").addEventListener("click", e => { if (e.target === $("viewDlg")) $("viewDlg").close(); });
$("viewDel").onclick = async () => {
    if (!current || !confirm("Delete this photo? This cannot be undone.")) return;
    await tx("readwrite", s => s.delete(current.id)); $("viewDlg").close(); toast("Photo deleted"); refresh();
};
$("q").addEventListener("input", renderGallery);
fillTickets(); refresh();
