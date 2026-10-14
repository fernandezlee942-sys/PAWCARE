const { rp, esc, toast, JAM, tanggalLokal } = PC;
const $ = s => document.querySelector(s);

/* ===== KELAS TAILWIND ===== */
const K = {
    grid: 'mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 items-stretch',
    h2: 'font-display text-2xl sm:text-3xl font-bold',
    sub: 'mt-1 text-muted',
    card: 'card flex h-full flex-col hover:transform-none!',
    panel: 'card p-6 hover:transform-none!',
    garis: 'border-t-[1.5px] border-line',
    input: 'search-input w-full px-4 py-2.5 rounded-2xl select-text aria-invalid:border-(--brand-strong)!',
    btnGhost: 'w-full cursor-pointer rounded-full border-[1.5px] border-brand-strong bg-transparent px-6 py-3 font-bold text-brand-strong hover:bg-(--tint-1)',
    btnKecil: 'cursor-pointer rounded-full border-[1.5px] border-brand-strong bg-transparent px-5 py-2.5 font-bold text-brand-strong hover:bg-(--tint-1)',
    btnMain: 'mt-5 w-full cursor-pointer rounded-full bg-brand px-6 py-3 font-bold text-on-brand',
    total: 'mt-2 rounded-2xl bg-(--tint-1) px-4 py-3 font-bold',
    star: 'font-extrabold text-[#E39A1F]',
    tabOn: 'bg-(--bg) text-brand-strong',
    tabOff: 'text-ink opacity-70 hover:opacity-100'
};

const PILIH = '<option value="">-- Pilih --</option>';
const KAT = { vet: 'Dokter', hotel: 'Pet hotel' };

/* ===== DATA AWAL ===== */
const DB_KEY = 'pawcare_db';
const SEED = {
    users: [{ id_user: 'u1', nama: 'BebekTerbang', role: 'user' }],
    pets: [{ id_pet: 'p1', user_id: 'u1', nama: 'Mochi', jenis: 'Kucing' }],
    branches: [{ id_branch: 'b1', nama: 'PawCare Medan Kota' }, { id_branch: 'b2', nama: 'PawCare Medan Selayang' }],
    kennels: [{ id_kennel: 'k1', branch_id: 'b1', nama: 'Kennel A1' }, { id_kennel: 'k2', branch_id: 'b1', nama: 'Kennel A2' }, { id_kennel: 'k3', branch_id: 'b2', nama: 'Kennel B1' }],
    services: [
        { id_service: 's1', nama: 'Konsultasi Dokter Hewan', kategori: 'vet', harga: 120000, desc: 'Pemeriksaan umum dan konsultasi.' },
        { id_service: 's2', nama: 'Vaksinasi', kategori: 'vet', harga: 200000, desc: 'Vaksin rutin sesuai usia dan jenis hewan.' },
        { id_service: 's4', nama: 'Pet Hotel (per malam)', kategori: 'hotel', harga: 90000, desc: 'Kennel bersih dengan pengawasan harian.' }],
    veterinarians: [
        { id_dokter: 'd1', nama: 'drh. Rina Sembiring', spesialis: 'Penyakit dalam', branch_id: 'b1' },
        { id_dokter: 'd2', nama: 'drh. Andre Siregar', spesialis: 'Bedah ringan', branch_id: 'b2' }],
    service_bookings: [],
    pet_medical_records: [{ id_medical_record: 'm1', pet_id: 'p1', booking_id: '-', dokter_id: 'd1', diagnosis: 'Flu ringan', resep_obat: 'Vitamin C kucing', tindakan: 'Observasi', record_date: '2026-09-20' }],
    reviews: [
        { id_review: 'r1', target_type: 'doctor', target_id: 'd1', user_id: 'u1', rating: 5, ulasan: 'Sabar dan jelas menjelaskan.', tanggal_ulasan: '2026-09-21' },
        { id_review: 'r2', target_type: 'service', target_id: 's4', user_id: 'u1', rating: 4, ulasan: 'Kennel bersih, update foto tiap hari.', tanggal_ulasan: '2026-09-25' }]
};

/* ===== DATABASE ===== */
let db = null;

async function load() {
    try { const s = localStorage.getItem(DB_KEY); if (s) db = JSON.parse(s); } catch (e) { }
    if (!db) { try { const r = await fetch('data/db.json'); db = await r.json(); } catch (e) { db = SEED; } }

    const s = session();
    if (s && !db.users.some(u => u.id_user === s.id_user)) {
        db.users.push({ id_user: s.id_user, nama: s.nama || 'Pengguna', role: s.role || 'user' });
        save();
    }
}

function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { } }
function session() { return PC.load(PC.KEY.session, null); }
function user() { return session() || { id_user: 'guest', nama: 'Tamu', role: 'user' }; }

/* ===== HELPER ===== */
const find = (t, k, v) => db[t].find(x => x[k] === v);
const uid = p => p + Math.random().toString(36).slice(2, 8);
const layananVet = () => db.services.filter(s => s.kategori !== 'grooming');
const cabangNama = id => find('branches', 'id_branch', id)?.nama || '';

function rate(type, id) {
    const r = db.reviews.filter(x => x.target_type === type && x.target_id === id);
    if (!r.length) return '<span class="text-sm text-muted">Belum ada ulasan</span>';
    const a = (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1);
    return `<span class="${K.star}">★ ${a}</span> <span class="text-sm text-muted">(${r.length} ulasan)</span>`;
}

function targetNama(r) {
    return r.target_type === 'doctor'
        ? find('veterinarians', 'id_dokter', r.target_id)?.nama
        : layananVet().find(s => s.id_service === r.target_id)?.nama;
}

/* ===== KOMPONEN ===== */
function kartu({ label, judul, deskripsi, tengah, tombol, aksi, id }) {
    return `
  <article class="${K.card}">
    <div class="flex-1 p-6">
      <span class="tag">${esc(label)}</span>
      <h3 class="mt-3 font-display text-xl font-semibold">${esc(judul)}</h3>
      <p class="mt-1 text-sm text-muted">${esc(deskripsi)}</p>
    </div>
    <div class="px-6 py-4 ${K.garis}">${tengah}</div>
    <div class="p-6 ${K.garis}">
      <button type="button" data-aksi="${aksi}" data-id="${esc(id)}" class="${K.btnGhost}">${esc(tombol)}</button>
    </div>
  </article>`;
}

function field(id, label, control) {
    return `
    <div class="field">
      <label for="${id}" class="field-label">${label}</label>
      ${control}
      <p class="pesan-error min-h-5 text-sm text-brand-strong"></p>
    </div>`;
}

const selectEl = (id, opsi = '') => `<select id="${id}" name="${id}" class="${K.input}">${opsi}</select>`;
const inputEl = (id, type, extra = '') => `<input id="${id}" name="${id}" type="${type}" class="${K.input}" ${extra}>`;

function bannerLogin(teks) {
    return session() ? '' : `<div class="sub-banner mt-4 max-w-xl">${teks} <a href="Account.html" class="back-link">Masuk atau buat akun</a></div>`;
}

/* ===== TAB ===== */
const TABS = [['dokter', 'Dokter'], ['layanan', 'Layanan klinik'], ['booking', 'Booking'], ['ulasan', 'Ulasan'], ['riwayat', 'Riwayat saya']];
const tabDariHash = () => (TABS.find(t => t[0] === location.hash.slice(1)) || ['dokter'])[0];
let tab = tabDariHash();
let pilihan = {};

function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, l]) => `
    <button role="tab" aria-selected="${k === tab}" data-t="${k}"
      class="px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl cursor-pointer ${k === tab ? K.tabOn : K.tabOff}">${l}</button>`).join('');
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => bukaTab(b.dataset.t));
}

function bukaTab(nama, naikKeAtas = false) {
    tab = nama;
    history.replaceState(null, '', '#' + nama);
    render();
    if (naikKeAtas) $('#view').scrollIntoView({ behavior: 'smooth' });
}

function render() {
    renderTabs();
    $('#view').innerHTML = VIEWS[tab]();
    if (AFTER[tab]) AFTER[tab]();
}

window.addEventListener('hashchange', () => { tab = tabDariHash(); render(); });

/* ===== AKSI KARTU ===== */
$('#view').addEventListener('click', e => {
    const btn = e.target.closest('[data-aksi]');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.aksi === 'layanan') {
        pilihan = { service: id };
    } else {
        const d = find('veterinarians', 'id_dokter', id);
        const vet = layananVet().find(s => s.kategori === 'vet');
        pilihan = { service: vet ? vet.id_service : '', cabang: d.branch_id, dokter: id };
    }
    bukaTab('booking', true);
});

/* ===== TAMPILAN ===== */
const VIEWS = {
    dokter: () => `
    <h2 class="${K.h2}">Dokter hewan</h2>
    <p class="${K.sub}">Pilih dokter, lalu lanjut booking jadwal.</p>
    <div class="${K.grid}">${db.veterinarians.map(d => kartu({
        label: d.spesialis, judul: d.nama, deskripsi: cabangNama(d.branch_id),
        tengah: rate('doctor', d.id_dokter), tombol: 'Booking dokter ini', aksi: 'dokter', id: d.id_dokter
    })).join('')}</div>`,

    layanan: () => `
    <h2 class="${K.h2}">Layanan klinik</h2>
    <p class="${K.sub}">Grooming ada di halaman <a href="Layanan.html" class="back-link">Layanan</a>.</p>
    <div class="${K.grid}">${layananVet().map(s => kartu({
        label: KAT[s.kategori] || s.kategori, judul: s.nama, deskripsi: s.desc,
        tengah: `<p class="font-display text-3xl font-bold text-brand-strong">${rp(s.harga)}</p><div class="mt-1">${rate('service', s.id_service)}</div>`,
        tombol: 'Pilih layanan', aksi: 'layanan', id: s.id_service
    })).join('')}</div>`,

    booking: () => {
        const pets = db.pets.filter(p => p.user_id === user().id_user);
        return `
    <h2 class="${K.h2}">Booking</h2>
    <p class="${K.sub}">Pilih layanan, cabang, dan jadwal. Booking tercatat di Riwayat saya.</p>
    ${bannerLogin('Kamu belum login, booking dicatat sebagai tamu.')}

    <form id="bk" class="card form-card mt-5 max-w-xl p-5 sm:p-6 hover:transform-none!" novalidate>
      ${field('pet', 'Hewan', selectEl('pet', pets.map(p => `<option value="${esc(p.id_pet)}">${esc(p.nama)} (${esc(p.jenis)})</option>`).join('') + '<option value="new">+ Tambah hewan baru</option>'))}

      <div id="newpet" class="hidden">
        ${field('pn', 'Nama hewan', inputEl('pn', 'text'))}
        ${field('pj', 'Jenis hewan', selectEl('pj', PILIH + '<option>Kucing</option><option>Anjing</option><option>Lainnya</option>'))}
      </div>

      ${field('svc', 'Layanan', selectEl('svc'))}
      ${field('br', 'Cabang', selectEl('br'))}

      <div id="vetbox">${field('dr', 'Dokter', selectEl('dr'))}</div>

      <div id="hotelbox" class="hidden">
        ${field('kn', 'Kennel', selectEl('kn'))}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
          ${field('ci', 'Check-in', inputEl('ci', 'date'))}
          ${field('co', 'Check-out', inputEl('co', 'date'))}
        </div>
      </div>

      <div id="waktubox" class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
        ${field('bt', 'Tanggal', inputEl('bt', 'date'))}
        ${field('jm', 'Jam', selectEl('jm'))}
      </div>

      <div id="tot" class="${K.total}" aria-live="polite">Total: pilih layanan dulu</div>
      <button type="submit" class="${K.btnMain}">Kirim booking</button>
    </form>`;
    },

    ulasan: () => {
        const rows = [...db.reviews].reverse().filter(targetNama).map(r => `
      <article class="${K.panel}">
        <div class="stars" aria-label="Rating ${r.rating} dari 5">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <h3 class="mt-2 font-display text-lg font-semibold">${esc(targetNama(r))} <span class="tag align-middle">${r.target_type === 'doctor' ? 'dokter' : 'layanan'}</span></h3>
        <p class="mt-1">${esc(r.ulasan)}</p>
        <p class="mt-3 text-sm text-muted">${esc(find('users', 'id_user', r.user_id)?.nama || 'Tamu')} · ${esc(r.tanggal_ulasan)}</p>
      </article>`).join('');

        return `
    <h2 class="${K.h2}">Ulasan</h2>
    <p class="${K.sub}">Ceritakan pengalamanmu dengan dokter atau layanan kami.</p>
    ${bannerLogin('Masuk dulu untuk menulis ulasan.')}

    <form id="rv" class="card form-card mt-5 max-w-xl p-5 sm:p-6 hover:transform-none!" novalidate>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
        ${field('rt', 'Untuk', selectEl('rt', '<option value="service">Layanan</option><option value="doctor">Dokter</option>'))}
        ${field('rid', 'Pilih', selectEl('rid'))}
      </div>
      ${field('rr', 'Rating', selectEl('rr', [5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} bintang</option>`).join('')))}
      ${field('rx', 'Ulasan', `<textarea id="rx" name="rx" rows="3" maxlength="300" class="${K.input}"></textarea>`)}
      <button type="submit" class="${K.btnMain}">Kirim ulasan</button>
    </form>

    <div class="${K.grid}">${rows || '<p class="text-muted">Belum ada ulasan. Jadilah yang pertama.</p>'}</div>`;
    },

    riwayat: () => {
        const u = user();
        const pets = db.pets.filter(p => p.user_id === u.id_user).map(p => p.id_pet);

        const klinik = db.service_bookings.filter(b => b.user_id === u.id_user).map(b => ({
            kode: b.booking_code, status: b.status_booking, waktu: b.booking_time, total: b.total_biaya,
            nama: find('services', 'id_service', b.service_id)?.nama || 'Layanan klinik'
        }));
        const grooming = PC.load('pawcare_grooming', []).filter(b => b.user_id === u.id_user).map(b => {
            const paket = String(b.service_id).replace('grooming-', '');
            return {
                kode: b.booking_code, status: b.status_booking, waktu: b.booking_time, total: b.total_biaya,
                nama: 'Grooming ' + paket.charAt(0).toUpperCase() + paket.slice(1)
            };
        });
        const booking = [...klinik, ...grooming].sort((a, b) => b.waktu.localeCompare(a.waktu));
        const recs = db.pet_medical_records.filter(r => pets.includes(r.pet_id));

        return `
    <h2 class="${K.h2}">Booking saya</h2>
    <div class="${K.grid}">${booking.map(b => `
      <article class="${K.panel}">
        <span class="tag">${esc(b.status)}</span>
        <h3 class="mt-3 font-display text-xl font-semibold">${esc(b.kode)}</h3>
        <p class="mt-1 text-sm text-muted">${esc(b.nama)}<br>${esc(b.waktu.replace('T', ' '))}</p>
        <p class="mt-3 font-display text-2xl font-bold text-brand-strong">${rp(b.total)}</p>
      </article>`).join('') || '<p class="text-muted">Belum ada booking.</p>'}</div>

    <h2 class="${K.h2} mt-12">Rekam medis hewan</h2>
    <div class="${K.grid}">${recs.map(r => `
      <article class="${K.panel}">
        <h3 class="font-display text-xl font-semibold">${esc(find('pets', 'id_pet', r.pet_id)?.nama || '')}</h3>
        <p class="mt-1">${esc(r.diagnosis)}</p>
        <p class="mt-2 text-sm text-muted">Resep: ${esc(r.resep_obat)}<br>Tindakan: ${esc(r.tindakan)}<br>${esc(r.record_date)} · ${esc(find('veterinarians', 'id_dokter', r.dokter_id)?.nama || '')}</p>
      </article>`).join('') || '<p class="text-muted">Belum ada rekam medis.</p>'}</div>

    <div class="mt-12 pt-6 ${K.garis}">
      <p class="text-sm text-muted">Data booking tersimpan di browser ini. Unduh salinannya untuk dipindahkan ke tim.</p>
      <button type="button" id="dl" class="mt-3 ${K.btnKecil}">Unduh db.json</button>
    </div>`;
    }
};

/* ===== AKSI TIAP TAB ===== */
const AFTER = {
    booking() {
        const f = {};
        ['pet', 'pn', 'pj', 'svc', 'br', 'dr', 'kn', 'ci', 'co', 'bt', 'jm'].forEach(id => f[id] = $('#' + id));
        const hariIni = tanggalLokal();
        f.bt.min = f.ci.min = f.co.min = hariIni;

        f.svc.innerHTML = PILIH + layananVet().map(s => `<option value="${esc(s.id_service)}">${esc(s.nama)} - ${rp(s.harga)}</option>`).join('');
        f.br.innerHTML = PILIH + db.branches.map(b => `<option value="${esc(b.id_branch)}">${esc(b.nama)}</option>`).join('');
        f.jm.innerHTML = PILIH + JAM.map(j => `<option value="${j}">${j}</option>`).join('');

        if (pilihan.service) f.svc.value = pilihan.service;
        if (pilihan.cabang) f.br.value = pilihan.cabang;

        const layananDipilih = () => find('services', 'id_service', f.svc.value);

        function isi(el, items, kosong) {
            const lama = el.value;
            el.innerHTML = `<option value="">${kosong}</option>` + items.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('');
            if (items.some(([v]) => v === lama)) el.value = lama;
        }

        function malam() {
            if (!f.ci.value || !f.co.value) return 0;
            return Math.max(0, Math.round((new Date(f.co.value) - new Date(f.ci.value)) / 864e5));
        }

        function hitungTotal() {
            const s = layananDipilih();
            const out = $('#tot');
            if (!s) { out.textContent = 'Total: pilih layanan dulu'; return 0; }
            if (s.kategori === 'hotel') {
                const n = malam();
                out.textContent = n ? `Total: ${rp(s.harga * n)} · ${n} malam` : 'Total: isi tanggal check-in dan check-out';
                return s.harga * n;
            }
            out.textContent = `Total: ${rp(s.harga)} · ${s.nama}`;
            return s.harga;
        }

        function sync() {
            const kat = layananDipilih()?.kategori;
            $('#vetbox').classList.toggle('hidden', kat !== 'vet');
            $('#hotelbox').classList.toggle('hidden', kat !== 'hotel');
            $('#waktubox').classList.toggle('hidden', kat === 'hotel');

            const kosongDokter = f.br.value ? 'Belum ada dokter di cabang ini' : 'Pilih cabang dulu';
            isi(f.dr, f.br.value ? db.veterinarians.filter(d => d.branch_id === f.br.value).map(d => [d.id_dokter, d.nama]) : [], kosongDokter);
            isi(f.kn, f.br.value ? db.kennels.filter(k => k.branch_id === f.br.value).map(k => [k.id_kennel, k.nama]) : [], f.br.value ? 'Belum ada kennel' : 'Pilih cabang dulu');
            hitungTotal();
        }

        f.svc.onchange = f.br.onchange = sync;
        f.ci.onchange = f.co.onchange = hitungTotal;
        f.pet.onchange = () => $('#newpet').classList.toggle('hidden', f.pet.value !== 'new');

        if (!db.pets.some(p => p.user_id === user().id_user)) {
            f.pet.value = 'new';
            $('#newpet').classList.remove('hidden');
        }

        sync();
        if (pilihan.dokter) f.dr.value = pilihan.dokter;
        pilihan = {};

        $('#bk').querySelectorAll('input, select').forEach(el => el.addEventListener('input', () => PC.clearError(el)));

        $('#bk').addEventListener('submit', e => {
            e.preventDefault();
            Object.values(f).forEach(PC.clearError);

            let valid = true;
            const salah = (el, pesan) => { PC.showError(el, pesan); valid = false; };
            const s = layananDipilih();
            const kat = s?.kategori;

            if (f.pet.value === 'new') {
                if (f.pn.value.trim().length < 2) salah(f.pn, 'Isi nama hewan.');
                if (!f.pj.value) salah(f.pj, 'Pilih jenis hewan.');
            }
            if (!s) salah(f.svc, 'Pilih layanan.');
            if (!f.br.value) salah(f.br, 'Pilih cabang.');
            if (kat === 'vet' && !f.dr.value) salah(f.dr, 'Pilih dokter.');

            if (kat === 'hotel') {
                if (!f.kn.value) salah(f.kn, 'Pilih kennel.');
                if (!f.ci.value) salah(f.ci, 'Check-in wajib diisi.');
                else if (f.ci.value < hariIni) salah(f.ci, 'Tanggal tidak boleh sudah lewat.');
                if (!f.co.value) salah(f.co, 'Check-out wajib diisi.');
                else if (f.ci.value && f.co.value <= f.ci.value) salah(f.co, 'Check-out harus setelah check-in.');
            } else if (s) {
                if (!f.bt.value) salah(f.bt, 'Tanggal wajib diisi.');
                else if (f.bt.value < hariIni) salah(f.bt, 'Tanggal tidak boleh sudah lewat.');
                if (!f.jm.value) salah(f.jm, 'Pilih jam.');
                else if (f.bt.value && new Date(`${f.bt.value}T${f.jm.value}`) < new Date()) salah(f.jm, 'Jam ini sudah lewat.');
            }

            if (!valid) {
                const pertama = $('#bk').querySelector('[aria-invalid]');
                if (pertama) pertama.focus();
                return;
            }

            const u = user();
            let petId = f.pet.value;
            if (petId === 'new') {
                petId = uid('p');
                db.pets.push({ id_pet: petId, user_id: u.id_user, nama: f.pn.value.trim(), jenis: f.pj.value });
            }

            db.service_bookings.push({
                id_booking: uid('bk'), booking_code: 'PC-' + uid('').toUpperCase(), user_id: u.id_user, pet_id: petId,
                service_id: s.id_service, branch_id: f.br.value,
                kennel_id: kat === 'hotel' ? f.kn.value : null,
                dokter_id: kat === 'vet' ? f.dr.value : null,
                booking_time: kat === 'hotel' ? `${f.ci.value}T09:00` : `${f.bt.value}T${f.jm.value}`,
                check_in_time: kat === 'hotel' ? f.ci.value : null,
                check_out_time: kat === 'hotel' ? f.co.value : null,
                total_biaya: hitungTotal(), status_booking: 'menunggu'
            });
            save();
            toast('Booking tersimpan');
            bukaTab('riwayat', true);
        });
    },

    ulasan() {
        const rt = $('#rt'), rid = $('#rid'), rx = $('#rx');

        function isiTarget() {
            rid.innerHTML = rt.value === 'doctor'
                ? db.veterinarians.map(d => `<option value="${esc(d.id_dokter)}">${esc(d.nama)}</option>`).join('')
                : layananVet().map(s => `<option value="${esc(s.id_service)}">${esc(s.nama)}</option>`).join('');
        }
        rt.onchange = isiTarget;
        isiTarget();

        rx.addEventListener('input', () => PC.clearError(rx));

        $('#rv').addEventListener('submit', e => {
            e.preventDefault();
            PC.clearError(rx);
            if (!session()) return PC.showError(rx, 'Masuk dulu untuk menulis ulasan.');
            if (rx.value.trim().length < 5) return PC.showError(rx, 'Tulis ulasan minimal 5 karakter.');

            db.reviews.push({
                id_review: uid('r'), target_type: rt.value, target_id: rid.value, user_id: user().id_user,
                rating: +$('#rr').value, ulasan: rx.value.trim(), tanggal_ulasan: tanggalLokal()
            });
            save();
            toast('Ulasan terkirim');
            render();
        });
    },

    riwayat() {
        $('#dl').onclick = () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
            a.download = 'db.json';
            a.click();
        };
    }
};

/* ===== MULAI ===== */
load().then(render);