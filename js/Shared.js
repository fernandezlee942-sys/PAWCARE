window.PC = (() => {

    /* ===== KUNCI PENYIMPANAN ===== */
    const KEY = {
        cart: "pawcare_cart_v2",
        wish: "pawcare_wish_v2",
        trx: "pawcare_trx_v2",
        stock: "pawcare_stock_v2",
        session: "pawcare_session"
    };

    /* ===== HELPER UMUM ===== */
    const rp = n => "Rp" + Math.round(n).toLocaleString("id-ID");
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const load = (k, f) => { try { const v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch { return f; } };
    const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };

    /* ===== KATALOG PRODUK ===== */
    const catalog = () => (typeof CATALOG !== "undefined" ? CATALOG : []);
    const prod = id => catalog().find(p => p.id === id);
    const stockOf = id => (load(KEY.stock, {})[id] ?? prod(id)?.stock ?? 0);

    /* ===== KERANJANG ===== */
    const getCart = () => load(KEY.cart, []);
    const cartCount = () => getCart().reduce((a, c) => a + (c.qty || 0), 0);

    function updateBadge() {
        const n = cartCount();
        document.querySelectorAll(".cart-badge").forEach(b => b.textContent = n);
    }

    function addToCart(id, buyNow = false) {
        const p = prod(id);
        if (!p) return { ok: false, msg: "Produk tidak ditemukan" };
        const s = stockOf(id);
        if (s <= 0) return { ok: false, msg: "Maaf, stok habis" };

        const cart = getCart();
        let item = cart.find(c => c.id === id);
        if (!item) {
            item = { id, qty: 1, checked: true };
            cart.push(item);
        } else if (!buyNow) {
            if (item.qty >= s) return { ok: false, msg: "Jumlah sudah mencapai stok" };
            item.qty++;
        }
        if (buyNow) cart.forEach(c => { c.checked = c.id === id; });
        save(KEY.cart, cart);
        return { ok: true, msg: "Masuk ke troli 🛒" };
    }

    /* ===== WISHLIST ===== */
    function toggleWish(id) {
        const w = load(KEY.wish, []);
        const i = w.indexOf(id);
        if (i >= 0) {
            w.splice(i, 1);
            save(KEY.wish, w);
            return "Dihapus dari wishlist";
        }
        w.push(id);
        save(KEY.wish, w);
        return "Ditambahkan ke wishlist ❤️";
    }

    /* ===== TOAST ===== */
    let timer;
    function toast(msg) {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        t.style.display = "block";
        clearTimeout(timer);
        timer = setTimeout(() => {
            t.classList.remove("show");
            t.style.display = "none";
        }, 2400);
    }

    /* ===== MENU HP ===== */
    function initMenu() {
        const btn = document.getElementById("menu-btn");
        const nav = document.getElementById("mobile-nav");
        if (!btn || !nav) return;

        const setOpen = open => {
            nav.classList.toggle("hidden", !open);
            btn.setAttribute("aria-expanded", String(open));
            btn.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
        };

        btn.addEventListener("click", () => setOpen(nav.classList.contains("hidden")));
        nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
    }

    /* ===== INISIALISASI OTOMATIS ===== */
    initMenu();
    updateBadge();
    window.addEventListener("pageshow", updateBadge);

    return { KEY, rp, esc, load, save, prod, catalog, stockOf, getCart, cartCount, updateBadge, addToCart, toggleWish, toast };
})();