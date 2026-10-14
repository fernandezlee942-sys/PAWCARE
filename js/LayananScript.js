const { rp, esc, load, save, toast } = PC;
const $ = s => document.querySelector(s);

/* ===== DATA PAKET ===== */
const PAKET = {
  basic: {
    nama: "Paket Basic", harga: 50000, durasi: "±45 menit", populer: false,
    ringkas: "Mandi bersih dan pengeringan.",
    fasilitas: ["Mandi dengan shampo hewan", "Pengeringan bulu", "Cocok untuk perawatan rutin"]
  },
  premium: {
    nama: "Paket Premium", harga: 100000, durasi: "±75 menit", populer: true,
    ringkas: "Mandi, potong kuku, bersihkan telinga, sisir bulu.",
    fasilitas: ["Semua fasilitas Basic", "Potong kuku", "Bersihkan telinga", "Sisir bulu"]
  },
  deluxe: {
    nama: "Paket Deluxe", harga: 175000, durasi: "±120 menit", populer: false,
    ringkas: "Perawatan lengkap dengan potong bulu dan parfum.",
    fasilitas: ["Semua fasilitas Premium", "Potong bulu (trimming)", "Parfum hewan", "Aksesori pita atau bandana"]
  }
};

const CABANG_AWAL = [
  { id_branch: "b1", nama: "PawCare Medan Kota" },
  { id_branch: "b2", nama: "PawCare Medan Selayang" }
];

const JAM = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const KEY_BOOKING = "pawcare_grooming";

/* ===== ELEMEN ===== */
const form = $("#form-booking");
const sukses = $("#sukses");
const selPaket = $("#layanan-pilihan");
const selCabang = $("#cabang");
const selJam = $("#jam");
const ringkasan = $("#ringkasan");

/* ===== TANGGAL LOKAL ===== */
function tanggalLokal(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().split("T")[0];
}
const hariIni = tanggalLokal();
$("#tanggal").min = hariIni;

/* ===== KARTU PAKET ===== */
function renderPaket() {
  const garis = "border-t-[1.5px] border-(--line)";

  $("#paket-grid").innerHTML = Object.entries(PAKET).map(([key, p]) => `
    <article data-paket="${key}" data-aktif="false"
      class="card group relative flex h-full flex-col border-2! border-(--line)! data-[aktif=true]:border-(--brand-strong)! hover:transform-none!">

      ${p.populer ? `<span class="tag absolute top-4 right-4">Paling populer</span>` : ""}

      <div class="p-6">
        <h3 class="font-display text-xl font-semibold ${p.populer ? "pr-28" : ""}">${esc(p.nama)}</h3>
        <p class="mt-1 min-h-10 text-sm text-muted">${esc(p.ringkas)}</p>
      </div>

      <div class="px-6 py-4 ${garis}">
        <p class="font-display text-3xl font-bold text-brand-strong">${rp(p.harga)}</p>
        <p class="text-sm font-semibold text-muted">${esc(p.durasi)}</p>
      </div>

      <ul class="grid flex-1 content-start gap-2 px-6 py-4 text-sm ${garis}">
        ${p.fasilitas.map(f => `
        <li class="flex items-start gap-2.5">
          <span class="mt-2 size-1.5 shrink-0 rounded-full bg-(--brand-strong)" aria-hidden="true"></span>
          <span>${esc(f)}</span>
        </li>`).join("")}
      </ul>

      <div class="p-6 ${garis}">
        <button type="button" data-pilih="${key}" aria-pressed="false"
          class="w-full cursor-pointer rounded-full border-[1.5px] border-(--brand-strong) bg-transparent px-6 py-3 font-bold text-(--brand-strong) hover:bg-(--tint-1) group-data-[aktif=true]:bg-(--brand) group-data-[aktif=true]:text-(--on-brand) group-data-[aktif=true]:hover:bg-(--brand)">Pilih paket</button>
      </div>
    </article>`).join("");
}

/* ===== PILIHAN FORM ===== */
function renderPilihan() {
  selPaket.innerHTML = `<option value="">-- Pilih --</option>` +
    Object.entries(PAKET).map(([k, p]) => `<option value="${k}">${esc(p.nama)} - ${rp(p.harga)}</option>`).join("");

  const db = load("pawcare_db", null);
  const cabang = (db && db.branches && db.branches.length) ? db.branches : CABANG_AWAL;
  selCabang.innerHTML = `<option value="">-- Pilih --</option>` +
    cabang.map(b => `<option value="${esc(b.id_branch)}">${esc(b.nama)}</option>`).join("");

  selJam.innerHTML = `<option value="">-- Pilih --</option>` +
    JAM.map(j => `<option value="${j}">${j}</option>`).join("");
}

/* ===== STATUS PAKET TERPILIH ===== */
function updateRingkasan() {
  const key = selPaket.value;
  const p = PAKET[key];

  ringkasan.textContent = p ? `Total: ${rp(p.harga)} · ${p.nama} (${p.durasi})` : "Total: pilih paket dulu";

  document.querySelectorAll("[data-paket]").forEach(card => {
    const aktif = card.dataset.paket === key;
    const btn = card.querySelector("[data-pilih]");
    card.dataset.aktif = String(aktif);
    btn.setAttribute("aria-pressed", String(aktif));
    btn.textContent = aktif ? "Paket dipilih" : "Pilih paket";
  });
}

/* ===== PILIH PAKET LANGSUNG KE BOOKING ===== */
$("#paket-grid").addEventListener("click", e => {
  const btn = e.target.closest("[data-pilih]");
  if (!btn) return;
  selPaket.value = btn.dataset.pilih;
  bersihkanError(selPaket);
  updateRingkasan();
  $("#booking").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => $("#pemilik").focus({ preventScroll: true }), 450);
});

selPaket.addEventListener("change", updateRingkasan);

/* ===== VALIDASI ===== */
function tampilkanError(input, pesan) {
  input.setAttribute("aria-invalid", "true");
  input.parentElement.querySelector(".pesan-error").textContent = pesan;
}

function bersihkanError(input) {
  input.removeAttribute("aria-invalid");
  input.parentElement.querySelector(".pesan-error").textContent = "";
}

form.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", () => bersihkanError(el));
});

/* ===== KIRIM BOOKING ===== */
form.addEventListener("submit", e => {
  e.preventDefault();
  sukses.hidden = true;
  let valid = true;

  const { pemilik, hewan, layanan, cabang, tanggal, jam } = form;
  [pemilik, hewan, layanan, cabang, tanggal, jam].forEach(bersihkanError);

  if (pemilik.value.trim().length < 3) { tampilkanError(pemilik, "Nama pemilik minimal 3 karakter."); valid = false; }
  if (!hewan.value) { tampilkanError(hewan, "Pilih jenis hewan."); valid = false; }
  if (!layanan.value) { tampilkanError(layanan, "Pilih paket grooming."); valid = false; }
  if (!cabang.value) { tampilkanError(cabang, "Pilih cabang."); valid = false; }
  if (!tanggal.value) {
    tampilkanError(tanggal, "Tanggal wajib diisi.");
    valid = false;
  } else if (tanggal.value < hariIni) {
    tampilkanError(tanggal, "Tanggal tidak boleh sudah lewat.");
    valid = false;
  }
  if (!jam.value) {
    tampilkanError(jam, "Pilih jam.");
    valid = false;
  } else if (tanggal.value && new Date(`${tanggal.value}T${jam.value}`) < new Date()) {
    tampilkanError(jam, "Jam ini sudah lewat.");
    valid = false;
  }

  if (!valid) {
    const pertama = form.querySelector("[aria-invalid]");
    if (pertama) pertama.focus();
    return;
  }

  const paket = PAKET[layanan.value];
  const u = load(PC.KEY.session, null);
  const kode = "PC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const semua = load(KEY_BOOKING, []);

  semua.push({
    id_booking: "bk" + Date.now().toString(36),
    booking_code: kode,
    user_id: u ? u.id_user : "guest",
    pemilik: pemilik.value.trim(),
    jenis_hewan: hewan.value,
    service_id: "grooming-" + layanan.value,
    branch_id: cabang.value,
    booking_time: `${tanggal.value}T${jam.value}`,
    total_biaya: paket.harga,
    status_booking: "menunggu"
  });
  save(KEY_BOOKING, semua);

  sukses.textContent =
    `Terima kasih, ${pemilik.value.trim()}! Booking ${paket.nama} untuk ${hewan.value.toLowerCase()} ` +
    `pada ${tanggal.value} pukul ${jam.value} sudah kami catat. Kode booking: ${kode}.`;
  sukses.hidden = false;
  sukses.scrollIntoView({ behavior: "smooth", block: "nearest" });
  toast("Booking grooming tersimpan");

  form.reset();
  updateRingkasan();
});

/* ===== MULAI ===== */
renderPaket();
renderPilihan();
updateRingkasan();