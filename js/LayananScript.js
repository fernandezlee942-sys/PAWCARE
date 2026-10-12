const dataPaket = {
  basic:   { nama: "Paket Basic",   fasilitas: ["Mandi dengan shampo hewan", "Pengeringan bulu", "Durasi sekitar 45 menit"] },
  premium: { nama: "Paket Premium", fasilitas: ["Semua fasilitas Basic", "Potong kuku", "Bersihkan telinga", "Sisir bulu"] },
  deluxe:  { nama: "Paket Deluxe",  fasilitas: ["Semua fasilitas Premium", "Potong bulu (trimming)", "Parfum hewan", "Aksesori pita/bandana"] }
};

const modal = document.getElementById("modal");
const daftar = document.getElementById("modal-fasilitas");
let paketTerpilih = "";

document.querySelectorAll(".btn-detail").forEach(function (tombol) {
  tombol.addEventListener("click", function () {
    paketTerpilih = tombol.dataset.paket;
    const paket = dataPaket[paketTerpilih];

    document.getElementById("modal-judul").textContent = paket.nama;
    daftar.innerHTML = "";
    paket.fasilitas.forEach(function (f) {
      const li = document.createElement("li");
      li.textContent = f;
      daftar.appendChild(li);
    });

    modal.hidden = false;  
  });
});

function tutupModal() {
  modal.hidden = true;     
}

document.getElementById("tutup").addEventListener("click", tutupModal);


modal.addEventListener("click", function (e) {
  if (e.target === modal) tutupModal();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") tutupModal();
});


document.getElementById("btn-pesan").addEventListener("click", function () {
  document.getElementById("layanan-pilihan").value = paketTerpilih;
  tutupModal();
  document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
  document.getElementById("pemilik").focus({ preventScroll: true });
});

const form = document.getElementById("form-booking");
const sukses = document.getElementById("sukses");

const hariIni = new Date().toISOString().split("T")[0];
document.getElementById("tanggal").min = hariIni;

function tampilkanError(input, pesan) {
  input.classList.add("salah");
  input.parentElement.querySelector(".pesan-error").textContent = pesan;
}

function bersihkanError(input) {
  input.classList.remove("salah");
  input.parentElement.querySelector(".pesan-error").textContent = "";
}

form.addEventListener("submit", function (e) {
  e.preventDefault();   
  sukses.hidden = true;
  let valid = true;

  const pemilik = form.pemilik;
  const hewan = form.hewan;
  const layanan = form.layanan;
  const tanggal = form.tanggal;

  [pemilik, hewan, layanan, tanggal].forEach(bersihkanError);

  if (pemilik.value.trim().length < 3) {
    tampilkanError(pemilik, "Nama pemilik minimal 3 karakter.");
    valid = false;
  }
  if (hewan.value === "") {
    tampilkanError(hewan, "Pilih jenis hewan.");
    valid = false;
  }
  if (layanan.value === "") {
    tampilkanError(layanan, "Pilih jenis layanan.");
    valid = false;
  }
  if (tanggal.value === "") {
    tampilkanError(tanggal, "Tanggal wajib diisi.");
    valid = false;
  } else if (tanggal.value < hariIni) {
    tampilkanError(tanggal, "Tanggal tidak boleh sudah lewat.");
    valid = false;
  }

  if (!valid) return;

  sukses.textContent =
    "Terima kasih, " + pemilik.value.trim() + "! Booking " +
    dataPaket[layanan.value].nama + " untuk " + hewan.value.toLowerCase() +
    " pada " + tanggal.value + " sudah kami catat.";
  sukses.hidden = false;
  form.reset();
});
