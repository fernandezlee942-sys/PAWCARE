const KEY = { cart: "pawcare_cart_v2", wish: "pawcare_wish_v2", trx: "pawcare_trx_v2", stock: "pawcare_stock_v2" };
const catLabel = (p) => p.cats.join(" · ");
const FREE_SHIP_MIN = 150000;
const SHIP_FEE = 15000;
const VOUCHERS = { PAWCARE10: 0.10 };

const $ = (s) => document.querySelector(s);
const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function load(key, fallback) {
    try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
}
function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* abaikan */ }
}

const state = {
    // cart: [{ id, qty, checked }]
    cart: load(KEY.cart, [{ id: 1, qty: 1, checked: true }, { id: 7, qty: 2, checked: true }]),
    wish: load(KEY.wish, []),
    trx: load(KEY.trx, []),
    stock: load(KEY.stock, Object.fromEntries(CATALOG.map((p) => [p.id, p.stock]))),
    voucher: null,
};

const prod = (id) => CATALOG.find((p) => p.id === id);
const stockOf = (id) => (state.stock[id] ?? prod(id)?.stock ?? 0);

function persist() {
    save(KEY.cart, state.cart);
    save(KEY.wish, state.wish);
    save(KEY.trx, state.trx);
    save(KEY.stock, state.stock);
}

function thumb(p) {
    // kalau gambar gagal dimuat, tampilkan emoji sebagai cadangan
    const inner = p.img
        ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" data-fb="${esc(p.emoji || "🐾")}" onerror="this.parentNode.textContent=this.dataset.fb">`
        : (p.emoji || "🐾");
    return `<span class="img-wrap">${inner}</span>`;
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Tabs ---------- */
function showTab(name) {
    document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    ["cart", "wish", "log"].forEach((n) => $("#tab-" + n).classList.toggle("hidden", n !== name));
}
document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

/* ---------- Troli ---------- */
function renderCart() {
    // buang item yang produknya sudah tidak ada & rapikan qty terhadap stok
    state.cart = state.cart.filter((c) => prod(c.id));
    state.cart.forEach((c) => {
        const s = stockOf(c.id);
        if (s === 0) c.checked = false;
        if (c.qty > s && s > 0) c.qty = s;
        if (c.qty < 1) c.qty = 1;
    });

    const list = $("#cartList");
    list.innerHTML = state.cart.map((c) => {
        const p = prod(c.id);
        const s = stockOf(c.id);
        const sold = s === 0;
        const liked = state.wish.includes(c.id);
        const note = sold ? "Stok habis" : s <= 5 ? `Sisa ${s} lagi!` : `Stok: ${s}`;
        return `
        <article class="cart-item ${sold ? "soldout" : ""}" data-id="${c.id}">
            <input type="checkbox" class="check" data-act="check" aria-label="Pilih ${esc(p.name)}" ${c.checked ? "checked" : ""} ${sold ? "disabled" : ""}>
            <div class="thumb">${thumb(p)}</div>
            <div class="item-info">
                <span class="tag">${esc(catLabel(p))}</span>
                <div class="item-name">${esc(p.name)}</div>
                <div class="item-price">${rp(p.price)}</div>
                <div class="stock-note ${s <= 5 ? "low" : ""}">${note}</div>
            </div>
            <div class="item-row2">
                <div class="qty">
                    <button data-act="dec" aria-label="Kurangi" ${c.qty <= 1 || sold ? "disabled" : ""}>−</button>
                    <span>${c.qty}</span>
                    <button data-act="inc" aria-label="Tambah" ${c.qty >= s ? "disabled" : ""}>+</button>
                </div>
                <div class="item-sub">${rp(p.price * c.qty)}</div>
                <div class="item-actions">
                    <button class="icon-btn ${liked ? "on" : ""}" data-act="wish" aria-label="Wishlist">${liked ? "❤️" : "🤍"}</button>
                    <button class="icon-btn trash" data-act="del" aria-label="Hapus">🗑️</button>
                </div>
            </div>
        </article>`;
    }).join("");

    const empty = state.cart.length === 0;
    $("#cartEmpty").classList.toggle("hidden", !empty);
    $(".cart-head").classList.toggle("hidden", empty);

    const selectable = state.cart.filter((c) => stockOf(c.id) > 0);
    $("#checkAll").checked = selectable.length > 0 && selectable.every((c) => c.checked);

    renderSummary();
    renderCounts();
    persist();
}

function calc() {
    const sel = state.cart.filter((c) => c.checked && stockOf(c.id) > 0);
    const qty = sel.reduce((a, c) => a + c.qty, 0);
    const sub = sel.reduce((a, c) => a + prod(c.id).price * c.qty, 0);
    const ship = sub === 0 || sub >= FREE_SHIP_MIN ? 0 : SHIP_FEE;
    const disc = state.voucher ? Math.floor(sub * VOUCHERS[state.voucher]) : 0;
    return { sel, qty, sub, ship, disc, total: sub + ship - disc };
}

function renderSummary() {
    const r = calc();
    $("#sumQty").textContent = r.qty;
    $("#sumSub").textContent = rp(r.sub);
    $("#sumShip").textContent = r.ship === 0 && r.sub > 0 ? "Gratis" : rp(r.ship);
    $("#sumDisc").textContent = "-" + rp(r.disc);
    $("#sumTotal").textContent = rp(r.total);
    $("#btnCheckout").disabled = r.qty === 0;
}

function renderCounts() {
    const n = state.cart.reduce((a, c) => a + c.qty, 0);
    $("#navBadge").textContent = n;
    $("#cntCart").textContent = state.cart.length;
    $("#cntWish").textContent = state.wish.length;
    $("#cntLog").textContent = state.trx.length;
}

$("#cartList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = Number(btn.closest(".cart-item").dataset.id);
    const item = state.cart.find((c) => c.id === id);
    const act = btn.dataset.act;
    if (act === "inc" && item.qty < stockOf(id)) item.qty++;
    else if (act === "dec" && item.qty > 1) item.qty--;
    else if (act === "del") { state.cart = state.cart.filter((c) => c.id !== id); toast("Item dihapus dari troli"); }
    else if (act === "wish") toggleWish(id, false);
    renderCart();
    renderWish();
    renderRec();
});
$("#cartList").addEventListener("change", (e) => {
    if (e.target.dataset.act !== "check") return;
    const id = Number(e.target.closest(".cart-item").dataset.id);
    state.cart.find((c) => c.id === id).checked = e.target.checked;
    renderCart();
});
$("#checkAll").addEventListener("change", (e) => {
    state.cart.forEach((c) => { if (stockOf(c.id) > 0) c.checked = e.target.checked; });
    renderCart();
});
$("#btnRemoveSel").addEventListener("click", () => {
    const n = state.cart.filter((c) => c.checked).length;
    if (!n) return toast("Pilih item yang ingin dihapus");
    state.cart = state.cart.filter((c) => !c.checked);
    toast(`${n} item dihapus`);
    renderCart();
});

/* ---------- Voucher ---------- */
$("#btnVoucher").addEventListener("click", () => {
    const code = $("#voucherInput").value.trim().toUpperCase();
    const msg = $("#voucherMsg");
    if (VOUCHERS[code]) {
        state.voucher = code;
        msg.textContent = `Voucher ${code} dipakai: diskon ${VOUCHERS[code] * 100}%`;
        msg.className = "text-sm mt-2 min-h-5 text-ok";
    } else {
        state.voucher = null;
        msg.textContent = code ? "Kode voucher tidak valid" : "Masukkan kode voucher dulu";
        msg.className = "text-sm mt-2 min-h-5 text-danger";
    }
    renderSummary();
});

/* ---------- Wishlist ---------- */
function toggleWish(id, rerender = true) {
    const i = state.wish.indexOf(id);
    if (i >= 0) { state.wish.splice(i, 1); toast("Dihapus dari wishlist"); }
    else { state.wish.push(id); toast("Ditambahkan ke wishlist ❤️"); }
    persist();
    if (rerender) { renderWish(); renderRec(); renderCart(); }
}

function addToCart(id) {
    const s = stockOf(id);
    if (s === 0) return toast("Maaf, stok habis");
    const item = state.cart.find((c) => c.id === id);
    if (item) {
        if (item.qty >= s) return toast("Jumlah sudah mencapai stok");
        item.qty++;
    } else state.cart.push({ id, qty: 1, checked: true });
    toast("Masuk ke troli 🛒");
    renderCart();
}

function prodCard(p, mode) {
    const s = stockOf(p.id);
    const liked = state.wish.includes(p.id);
    const foot = mode === "wish"
        ? `<button class="btn-primary" data-act="cart" ${s === 0 ? "disabled" : ""}>${s === 0 ? "Habis" : "+ Troli"}</button>
           <button class="btn-outline" data-act="wish">Hapus</button>`
        : `<button class="btn-primary" data-act="cart" ${s === 0 ? "disabled" : ""}>${s === 0 ? "Habis" : "+ Troli"}</button>`;
    return `
    <article class="card prod" data-id="${p.id}">
        <div class="pic">
            ${thumb(p)}
            <button class="icon-btn heart ${liked ? "on" : ""}" data-act="wish" aria-label="Wishlist">${liked ? "❤️" : "🤍"}</button>
        </div>
        <div class="body">
            <span class="tag" style="align-self:flex-start">${esc(catLabel(p))}</span>
            <div class="name">${esc(p.name)}</div>
            <div class="price">${rp(p.price)}</div>
            <div class="stock-note ${s <= 5 ? "low" : ""}">${s === 0 ? "Stok habis" : s <= 5 ? `Sisa ${s} lagi!` : `Stok: ${s}`}</div>
            <div class="foot">${foot}</div>
        </div>
    </article>`;
}

function bindProdGrid(el) {
    el.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const id = Number(btn.closest(".prod").dataset.id);
        if (btn.dataset.act === "cart") addToCart(id);
        if (btn.dataset.act === "wish") toggleWish(id);
    });
}

function renderWish() {
    const items = state.wish.map(prod).filter(Boolean);
    $("#wishGrid").innerHTML = items.map((p) => prodCard(p, "wish")).join("");
    $("#wishEmpty").classList.toggle("hidden", items.length > 0);
    renderCounts();
}

/* Semua produk dari Home (dengan filter kategori + pencarian) */
const recFilter = { cat: "All", q: "" };

function renderRec() {
    const q = recFilter.q.trim().toLowerCase();
    const items = CATALOG.filter((p) =>
        (recFilter.cat === "All" || p.cats.includes(recFilter.cat)) &&
        (!q || p.name.toLowerCase().includes(q) || catLabel(p).toLowerCase().includes(q))
    );
    $("#recGrid").innerHTML = items.map((p) => prodCard(p, "rec")).join("");
    $("#recCount").textContent = `Menampilkan ${items.length} dari ${CATALOG.length} produk`;
    $("#recEmpty").classList.toggle("hidden", items.length > 0);
}

$("#recFilters").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    recFilter.cat = chip.dataset.cat;
    document.querySelectorAll("#recFilters .chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    renderRec();
});
$("#recSearch").addEventListener("input", (e) => {
    recFilter.q = e.target.value;
    renderRec();
});

bindProdGrid($("#wishGrid"));
bindProdGrid($("#recGrid"));

/* ---------- Checkout ---------- */
const dlg = $("#checkoutDialog");

$("#btnCheckout").addEventListener("click", () => {
    const r = calc();
    if (!r.qty) return;
    $("#dlgQty").textContent = r.qty;
    $("#dlgTotal").textContent = rp(r.total);
    $("#formErr").textContent = "";
    dlg.showModal();
});
$("#btnCloseDlg").addEventListener("click", () => dlg.close());
$("#btnCancelDlg").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

$("#checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#fName").value.trim();
    const phone = $("#fPhone").value.trim();
    const addr = $("#fAddr").value.trim();
    const err = $("#formErr");

    if (!name || !phone || !addr) { err.textContent = "Lengkapi nama, no. HP, dan alamat dulu ya."; return; }
    if (!/^[0-9+\-\s]{8,16}$/.test(phone)) { err.textContent = "Format no. HP belum benar."; return; }

    const r = calc();
    // cek stok terbaru
    const short = r.sel.find((c) => c.qty > stockOf(c.id));
    if (short) { err.textContent = `Stok ${prod(short.id).name} tidak cukup.`; return; }

    // stok langsung dikurangi (di-reserve) saat status pending
    r.sel.forEach((c) => { state.stock[c.id] = stockOf(c.id) - c.qty; });

    state.trx.unshift({
        id: "TRX-" + Date.now().toString().slice(-8),
        date: new Date().toISOString(),
        items: r.sel.map((c) => ({ id: c.id, name: prod(c.id).name, price: prod(c.id).price, qty: c.qty })),
        sub: r.sub, ship: r.ship, disc: r.disc, total: r.total,
        buyer: { name, phone, addr },
        pay: (document.querySelector('input[name="pay"]:checked') || {}).value || "Transfer Bank",
        status: "pending",
    });

    state.cart = state.cart.filter((c) => !r.sel.includes(c));
    state.voucher = null;
    $("#voucherInput").value = "";
    $("#voucherMsg").textContent = "";

    dlg.close();
    renderAll();
    showTab("log");
    toast("Pesanan dibuat. Silakan selesaikan pembayaran.");
});

/* ---------- Log transaksi ---------- */
const STATUS_LABEL = { pending: "Menunggu pembayaran", success: "Berhasil", canceled: "Dibatalkan" };

function renderLog() {
    $("#logList").innerHTML = state.trx.map((t) => {
        const d = new Date(t.date).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const items = t.items.map((i) => `<li><span>${esc(i.name)} × ${i.qty}</span><span>${rp(i.price * i.qty)}</span></li>`).join("");
        const actions = t.status === "pending"
            ? `<div class="flex gap-2">
                   <button class="btn-outline btn-sm" data-act="cancel">Batalkan</button>
                   <button class="btn-primary btn-sm" data-act="pay">Bayar sekarang</button>
               </div>` : "";
        return `
        <article class="card trx" data-id="${esc(t.id)}">
            <div class="trx-head">
                <div>
                    <div class="trx-id">${esc(t.id)}</div>
                    <div class="trx-date">${d}</div>
                </div>
                <span class="status ${t.status}">${STATUS_LABEL[t.status]}</span>
            </div>
            <ul class="trx-items">${items}</ul>
            <div class="trx-foot">
                <div>
                    <div class="font-bold">Total: <span class="text-brand-strong">${rp(t.total)}</span></div>
                    <div class="trx-meta">${esc(t.pay)} · ${esc(t.buyer.name)}</div>
                </div>
                ${actions}
            </div>
        </article>`;
    }).join("");
    $("#logEmpty").classList.toggle("hidden", state.trx.length > 0);
    renderCounts();
}

$("#logList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const t = state.trx.find((x) => x.id === btn.closest(".trx").dataset.id);
    if (!t || t.status !== "pending") return;

    if (btn.dataset.act === "pay") {
        t.status = "success";
        toast("Pembayaran berhasil ✅");
    } else if (btn.dataset.act === "cancel") {
        if (!confirm("Batalkan pesanan ini?")) return;
        t.status = "canceled";
        t.items.forEach((i) => { state.stock[i.id] = stockOf(i.id) + i.qty; }); // kembalikan stok
        toast("Pesanan dibatalkan, stok dikembalikan");
    }
    renderAll();
});

/* ---------- Init ---------- */
function renderAll() {
    renderCart();
    renderWish();
    renderRec();
    renderLog();
}
renderAll();