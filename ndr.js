// Shared helpers for the Clients, Stock and Proof of Work pages
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const money = n => "R" + (Number(n) || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const getTickets = () => { const t = load("tickets", []); return Array.isArray(t) ? t : []; };
const getIncomes = () => { const i = load("finance_incomes", []); return Array.isArray(i) ? i : []; };
const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }); };
// One client = same phone number (last 9 digits), or the same name when there is no phone
const clientKey = t => { const d = String(t.phone || "").replace(/\D/g, ""); return d ? "p" + d.slice(-9) : "n" + String(t.customerName || "").trim().toLowerCase(); };
const device = t => [t.deviceType, t.brand, t.model].filter(Boolean).join(" ");
const ticketLabel = t => t.ticketNumber + " - " + t.customerName + (device(t) ? " (" + device(t) + ")" : "");
const newestFirst = (a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
let _tt;
function toast(msg) {
    const t = $("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("on");
    clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove("on"), 2400);
}
