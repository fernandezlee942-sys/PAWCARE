const { rp, esc, load, save, KEY } = PC;

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const count = document.getElementById("count");
const search = document.getElementById("search");
const filters = document.getElementById("filters");

const isSub = p => p.cats.includes("Food") || p.cats.includes("Obat");
const tint = p => (p.id % 6) + 1;
let activeCat = "All";

/* ===== DAFTAR PRODUK ===== */
function render() {
  const q = search.value.trim().toLowerCase();
  const wish = load(KEY.wish, []);

  const list = PC.catalog().filter(p =>
    (activeCat === "All" || p.cats.includes(activeCat)) &&
    (!q || p.name.toLowerCase().includes(q) || p.cats.join(" ").toLowerCase().includes(q))
  );

  grid.innerHTML = list.map(p => {
    const s = PC.stockOf(p.id);
    const sold = s <= 0;
    const liked = wish.includes(p.id);
    const note = sold ? "Stok habis" : s <= 5 ? `Sisa ${s} lagi!` : "";
    const pic = p.img
      ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" data-fb="${esc(p.emoji || "🐾")}" class="w-full h-full object-cover">`
      : esc(p.emoji || "🐾");

    return `
    <article class="card flex flex-col h-full" data-id="${p.id}">
      <div class="thumb relative shrink-0" style="background: var(--tint-${tint(p)})">
        ${pic}
        <button type="button" data-act="wish" aria-pressed="${liked}" aria-label="${liked ? "Hapus dari" : "Tambah ke"} wishlist"
          class="absolute top-2 right-2 w-10 h-10 rounded-full bg-white/90 border-[1.5px] border-line text-lg cursor-pointer">${liked ? "❤️" : "🤍"}</button>
      </div>

      <div class="p-4 flex flex-col flex-1">
        <span class="tag self-start">${esc(p.cats.join(" · "))}</span>
        <h3 class="mt-2 font-semibold leading-snug min-h-[2.75rem]">${esc(p.name)}</h3>
        <p class="mt-1 font-bold text-brand-strong">${rp(p.price)}</p>
        <p class="text-xs font-semibold min-h-4 ${s <= 5 ? "text-brand-strong" : "text-muted"}">${note}</p>

        <div class="mt-auto pt-3 flex flex-col gap-2">
          <div class="h-10">
            ${isSub(p) ? `<button type="button" data-act="sub"
              class="w-full h-10 rounded-full border-[1.5px] border-brand-strong text-brand-strong text-sm font-bold cursor-pointer hover:bg-tint-1">Langganan</button>` : ""}
          </div>
          <div class="grid grid-cols-[auto_1fr] gap-2">
            <button type="button" data-act="cart" ${sold ? "disabled" : ""} aria-label="Tambah ${esc(p.name)} ke keranjang"
              class="w-11 h-11 rounded-full border-[1.5px] border-brand-strong text-brand-strong text-2xl font-bold leading-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">+</button>
            <button type="button" data-act="buy" ${sold ? "disabled" : ""}
              class="h-11 rounded-full bg-brand text-on-brand font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">${sold ? "Habis" : "Beli"}</button>
          </div>
        </div>
      </div>
    </article>`;
  }).join("");

  empty.classList.toggle("hidden", list.length > 0);
  count.textContent = list.length + " produk ditampilkan";
}

/* ===== GAMBAR CADANGAN ===== */
grid.addEventListener("error", e => {
  if (e.target.tagName === "IMG") e.target.replaceWith(document.createTextNode(e.target.dataset.fb || "🐾"));
}, true);

/* ===== AKSI KARTU PRODUK ===== */
grid.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = Number(btn.closest("[data-id]").dataset.id);
  const act = btn.dataset.act;

  if (act === "cart") {
    const r = PC.addToCart(id);
    PC.toast(r.msg);
    PC.updateBadge();
    render();
  } else if (act === "buy") {
    const r = PC.addToCart(id, true);
    if (!r.ok) return PC.toast(r.msg);
    location.href = "Troli.html";
  } else if (act === "wish") {
    PC.toast(PC.toggleWish(id));
    render();
  } else if (act === "sub") {
    openSub(id);
  }
});

/* ===== FILTER DAN PENCARIAN ===== */
filters.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  filters.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c === btn));
  render();
});
search.addEventListener("input", render);

/* ===== LANGGANAN ===== */
const subDialog = document.getElementById("sub-dialog");
const subName = document.getElementById("sub-name");
const subNext = document.getElementById("sub-next");
const subFreq = document.getElementById("sub-freq");
let subItem = null;

const nextDate = d => { const t = new Date(); t.setDate(t.getDate() + +d); return t.toISOString().slice(0, 10); };

function openSub(id) {
  subItem = PC.prod(id);
  subName.textContent = subItem.name;
  subNext.textContent = "Pengiriman pertama: " + nextDate(subFreq.value);
  subDialog.showModal();
}

subFreq.addEventListener("change", () => subNext.textContent = "Pengiriman pertama: " + nextDate(subFreq.value));

document.getElementById("sub-form").addEventListener("submit", e => {
  if (e.submitter?.value !== "ok" || !subItem) return;
  const u = load(KEY.session, { id_user: "guest" });
  const store = load("pawcare_subscriptions", { auto_subscriptions: [], subscription_details: [] });
  const id = "sb" + Date.now().toString(36);
  store.auto_subscriptions.push({
    id_subscription: id, user_id: u.id_user, pet_id: null,
    frekuensi_pengiriman: +subFreq.value, next_delivery_date: nextDate(subFreq.value), status_langganan: "aktif"
  });
  store.subscription_details.push({
    id_subscription_detail: "sd" + id, subscription_id: id, variant_id: subItem.id,
    jumlah: +document.getElementById("sub-qty").value || 1
  });
  save("pawcare_subscriptions", store);
  PC.toast("Langganan " + subItem.name + " aktif");
});

/* ===== ULASAN TERBARU ===== */
const sample = [
  { rating: 5, ulasan: "Dokternya sabar dan menjelaskan dengan jelas.", who: "Dewi", tgt: "drh. Rina Sembiring" },
  { rating: 4, ulasan: "Kennel bersih, ada update foto tiap hari.", who: "Budi", tgt: "Pet Hotel" },
  { rating: 5, ulasan: "Grooming rapi, kucingku tidak stres.", who: "Sari", tgt: "Grooming Lengkap" }
];

function reviewList() {
  const db = load("pawcare_db", null);
  if (!db || !db.reviews || !db.reviews.length) return sample;
  return db.reviews.slice(-3).reverse().map(r => ({
    rating: r.rating,
    ulasan: r.ulasan,
    who: (db.users.find(u => u.id_user === r.user_id) || {}).nama || "Tamu",
    tgt: r.target_type === "doctor"
      ? (db.veterinarians.find(d => d.id_dokter === r.target_id) || {}).nama
      : (db.services.find(s => s.id_service === r.target_id) || {}).nama
  }));
}

document.getElementById("reviews").innerHTML = reviewList().map(r => `
  <article class="card review">
    <div class="stars" aria-label="Rating ${r.rating} dari 5">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
    <p class="mt-2">${esc(r.ulasan)}</p>
    <p class="mt-3 text-sm text-muted">${esc(r.who)} untuk ${esc(r.tgt)}</p>
  </article>`).join("");

render();
window.addEventListener("pageshow", render);