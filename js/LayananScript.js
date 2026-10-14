const { rp, esc, load, save, toast, JAM, tanggalLokal } = PC;
const $ = s => document.querySelector(s);

const PAKET = {
  basic: {
    nama: "Paket Basic",
    harga: 50000,
    durasi: "±45 menit",
    populer: false,
    ringkas: "Mandi bersih dan pengeringan.",
    fasilitas: [
      "Mandi dengan shampo hewan",
      "Pengeringan bulu",
      "Cocok untuk perawatan rutin"
    ]
  },
  premium: {
    nama: "Paket Premium",
    harga: 100000,
    durasi: "±75 menit",
    populer: true,
    ringkas: "Mandi, potong kuku, bersihkan telinga, sisir bulu.",
    fasilitas: [
      "Semua fasilitas Basic",
      "Potong kuku",
      "Bersihkan telinga",
      "Sisir bulu"
    ]
  },
  deluxe: {
    nama: "Paket Deluxe",
    harga: 175000,
    durasi: "±120 menit",
    populer: false,
    ringkas: "Perawatan lengkap dengan potong bulu dan parfum.",
    fasilitas: [
      "Semua fasilitas Premium",
      "Potong bulu (trimming)",
      "Parfum hewan",
      "Aksesori pita atau bandana"
    ]
  }
};

const KEY_BOOKING = "pawcare_grooming";

const form = $("#form-booking");
const sukses = $("#sukses");
const selPaket = $("#layanan-pilihan");
const selCabang = $("#cabang");
const selJam = $("#jam");
const ringkasan = $("#ringkasan");
const gridPaket = $("#paket-grid");

const modalDetail = $("#modal-detail");
const detailNama = $("#detail-nama");
const detailHarga = $("#detail-harga");
const detailFasilitas = $("#detail-fasilitas");
const tutupDetail = $("#tutup-detail");
const pilihDetail = $("#pilih-detail");

let paketDetailAktif = "";

const hariIni = tanggalLokal();
$("#tanggal").min = hariIni;
console.log("Modal ditemukan:", !!modalDetail);
console.log("Modal terbuka saat halaman dimuat:", modalDetail.open);
console.log("Atribut open:", modalDetail.hasAttribute("open"));
function renderPaket() {
  const garis = "border-t-[1.5px] border-(--line)";

  gridPaket.innerHTML = Object.entries(PAKET).map(([key, p]) => `
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
      <div class="grid grid-cols-2 gap-3 p-6 ${garis}">
        <button type="button" data-detail="${key}"
          class="cursor-pointer rounded-full border-[1.5px] border-(--brand-strong) px-4 py-3 font-bold text-(--brand-strong) hover:bg-(--tint-1)">
          Detail
        </button>
        <button type="button" data-pilih="${key}" aria-pressed="false"
          class="cursor-pointer rounded-full border-[1.5px] border-(--brand-strong) bg-transparent px-4 py-3 font-bold text-(--brand-strong) hover:bg-(--tint-1) group-data-[aktif=true]:bg-(--brand) group-data-[aktif=true]:text-(--on-brand)">
          Pilih paket
        </button>
      </div>
    </article>
  `).join("");
}

function renderPilihan() {
  selPaket.innerHTML = `<option value="">-- Pilih --</option>` +
    Object.entries(PAKET).map(([key, p]) =>
      `<option value="${key}">${esc(p.nama)} - ${rp(p.harga)}</option>`
    ).join("");

  selCabang.innerHTML = `<option value="">-- Pilih --</option>` +
    PC.branches().map(b =>
      `<option value="${esc(b.id_branch)}">${esc(b.nama)}</option>`
    ).join("");

  selJam.innerHTML = `<option value="">-- Pilih --</option>` +
    JAM.map(j => `<option value="${esc(j)}">${esc(j)}</option>`).join("");
}

function updateRingkasan() {
  const key = selPaket.value;
  const paket = PAKET[key];

  ringkasan.textContent = paket
    ? `Total: ${rp(paket.harga)} · ${paket.nama} (${paket.durasi})`
    : "Total: pilih paket dulu";

  document.querySelectorAll("[data-paket]").forEach(card => {
    const aktif = card.dataset.paket === key;
    const btn = card.querySelector("[data-pilih]");

    card.dataset.aktif = String(aktif);
    btn.setAttribute("aria-pressed", String(aktif));
    btn.textContent = aktif ? "Paket dipilih" : "Pilih paket";
  });
}

function bukaDetail(key) {
  const paket = PAKET[key];

  if (!paket || !modalDetail || typeof modalDetail.showModal !== "function") {
    toast("Modal detail tidak tersedia. Periksa HTML modal.");
    return;
  }

  paketDetailAktif = key;
  detailNama.textContent = paket.nama;
  detailHarga.textContent = `${rp(paket.harga)} · ${paket.durasi}`;
  detailFasilitas.replaceChildren();

  paket.fasilitas.forEach(fasilitas => {
    const li = document.createElement("li");
    li.textContent = fasilitas;
    detailFasilitas.appendChild(li);
  });

if (!modalDetail.open) {
  modalDetail.showModal();
}}

function pilihPaket(key, fokusPemilik = true) {
  if (!PAKET[key]) return;

  selPaket.value = key;
  PC.clearError(selPaket);
  updateRingkasan();

  $("#booking").scrollIntoView({ behavior: "smooth" });

  if (fokusPemilik) {
    setTimeout(() => $("#pemilik").focus({ preventScroll: true }), 450);
  }
}

gridPaket.addEventListener("click", e => {
  const tombolDetail = e.target.closest("[data-detail]");
  const tombolPilih = e.target.closest("[data-pilih]");

  if (tombolDetail) {
    bukaDetail(tombolDetail.dataset.detail);
    return;
  }

  if (tombolPilih) {
    pilihPaket(tombolPilih.dataset.pilih);
  }
});

tutupDetail.addEventListener("click", () => {
  modalDetail.close();
});

modalDetail.addEventListener("click", e => {
  if (e.target === modalDetail) {
    modalDetail.close();
  }
});

pilihDetail.addEventListener("click", () => {
  const key = paketDetailAktif;

  if (!key || !PAKET[key]) return;

  modalDetail.close();
  pilihPaket(key);
});

selPaket.addEventListener("change", updateRingkasan);

form.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", () => PC.clearError(el));
  el.addEventListener("change", () => PC.clearError(el));
});

form.addEventListener("submit", e => {
  e.preventDefault();
  sukses.hidden = true;

  let valid = true;

  const pemilik = form.elements.namedItem("pemilik");
  const hewan = form.elements.namedItem("hewan");
  const layanan = form.elements.namedItem("layanan");
  const cabang = form.elements.namedItem("cabang");
  const tanggal = form.elements.namedItem("tanggal");
  const jam = form.elements.namedItem("jam");

  [pemilik, hewan, layanan, cabang, tanggal, jam].forEach(PC.clearError);

  const salah = (el, pesan) => {
    PC.showError(el, pesan);
    valid = false;
  };

  if (pemilik.value.trim().length < 3) {
    salah(pemilik, "Nama pemilik minimal 3 karakter.");
  }

  if (!hewan.value) {
    salah(hewan, "Pilih jenis hewan.");
  }

  if (!layanan.value || !PAKET[layanan.value]) {
    salah(layanan, "Pilih paket grooming.");
  }

  if (!cabang.value) {
    salah(cabang, "Pilih cabang.");
  }

  if (!tanggal.value) {
    salah(tanggal, "Tanggal wajib diisi.");
  } else if (tanggal.value < hariIni) {
    salah(tanggal, "Tanggal tidak boleh sudah lewat.");
  } else {
    const tanggalBooking = new Date(`${tanggal.value}T00:00:00`);
    const hari = tanggalBooking.getDay();

    if (hari === 0) {
      salah(tanggal, "Booking hanya tersedia Senin sampai Sabtu.");
    }
  }

  if (!jam.value) {
    salah(jam, "Pilih jam.");
  } else if (tanggal.value && tanggal.value >= hariIni) {
    const waktuBooking = new Date(`${tanggal.value}T${jam.value}`);
    const sekarang = new Date();

    if (Number.isNaN(waktuBooking.getTime())) {
      salah(jam, "Format jam tidak valid.");
    } else if (waktuBooking < sekarang) {
      salah(jam, "Jam ini sudah lewat.");
    }
  }

  if (!valid) {
    const pertama = form.querySelector("[aria-invalid]");
    if (pertama) pertama.focus();
    return;
  }
  const paket = PAKET[layanan.value];

  if (!paket) {
    toast("Pilih paket grooming yang valid.");
    return;
  }

  try {
    const user = load(PC.KEY.session, null);
    const semua = load(KEY_BOOKING, []);

    if (!Array.isArray(semua)) {
      throw new Error("Data booking tidak valid.");
    }

    let kode;

    do {
      kode = "PC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (semua.some(b => b.booking_code === kode));

    const booking = {
      id_booking: "bk" + Date.now().toString(36),
      booking_code: kode,
      user_id: user ? user.id_user : "guest",
      pemilik: pemilik.value.trim(),
      jenis_hewan: hewan.value,
      service_id: "grooming-" + layanan.value,
      branch_id: cabang.value,
      booking_time: `${tanggal.value}T${jam.value}`,
      total_biaya: paket.harga,
      status_booking: "menunggu"
    };

    semua.push(booking);
    save(KEY_BOOKING, semua);

    const tersimpan = load(KEY_BOOKING, []);

    if (
      !Array.isArray(tersimpan) ||
      !tersimpan.some(b => b.id_booking === booking.id_booking)
    ) {
      throw new Error("Booking gagal disimpan.");
    }

    sukses.textContent =
      `Terima kasih, ${pemilik.value.trim()}! Booking ${paket.nama} untuk ${hewan.value.toLowerCase()} pada ${tanggal.value} pukul ${jam.value} sudah kami catat. Kode booking: ${kode}.`;

    sukses.hidden = false;
    sukses.scrollIntoView({ behavior: "smooth", block: "nearest" });
    toast("Booking grooming tersimpan");

    form.reset();
    updateRingkasan();
  } catch (error) {
    console.error("Kesalahan penyimpanan booking:", error);
    toast("Booking gagal disimpan. Periksa penyimpanan browser.");
  }
});

renderPaket();
renderPilihan();
updateRingkasan();