const { rp, esc, toast } = PC;

const $ = s => document.querySelector(s);

/* ===== menu HP ===== */
const mb = $('#menu-btn'), mn = $('#mobile-nav');
function setMenu(open) {
    mn.classList.toggle('hidden', !open);
    mb.setAttribute('aria-expanded', String(open));
    mb.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
}
mb.onclick = () => setMenu(mn.classList.contains('hidden'));
mn.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
PC.updateBadge();

/* ===== kelas Tailwind yang dipakai ulang ===== */
const K = {
    h2: 'mb-4 font-(family-name:--font-display) text-2xl font-bold',
    h3: 'font-(family-name:--font-display) text-lg font-semibold',
    grid: 'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5',
    card: 'card p-5',
    mut: 'text-sm text-(--muted)',
    price: 'font-extrabold text-(--brand-strong)',
    star: 'font-extrabold text-[#E39A1F]',
    label: 'block mt-3 mb-1 text-sm font-bold',
    input: 'search-input w-full px-4 py-2.5 rounded-2xl select-text',
    row: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    formBox: 'max-w-lg rounded-[22px] border-[1.5px] border-(--line) bg-white p-5 sm:p-6',
    total: 'mt-4 px-4 py-3 rounded-2xl bg-(--tint-1) font-bold',
    btn: 'mt-5 px-6 py-3 rounded-full font-extrabold bg-(--brand) text-(--on-brand) cursor-pointer focus-visible:outline-3 focus-visible:outline-(--brand-strong) focus-visible:outline-offset-2',
    tabOn: 'bg-(--bg) text-(--brand-strong)',
    tabOff: 'text-(--ink) opacity-70'
};

/* ===== DATA LAYER (kontrak JSON untuk semua halaman) =====
   Urutan baca: localStorage -> data/db.json -> SEED di bawah.
   Browser tidak bisa menulis file langsung, jadi perubahan disimpan di localStorage
   dan bisa diunduh lewat tombol "Unduh db.json". Untuk tulis ke file asli, perlu backend kecil. */
const DB_KEY = 'pawcare_db';
const SEED = {
    users: [{ id_user: 'u1', nama: 'BebekTerbang', role: 'user' }],
    pets: [{ id_pet: 'p1', user_id: 'u1', nama: 'Mochi', jenis: 'Kucing' }],
    branches: [{ id_branch: 'b1', nama: 'PawCare Medan Kota' }, { id_branch: 'b2', nama: 'PawCare Medan Selayang' }],
    kennels: [{ id_kennel: 'k1', branch_id: 'b1', nama: 'Kennel A1' }, { id_kennel: 'k2', branch_id: 'b1', nama: 'Kennel A2' }, { id_kennel: 'k3', branch_id: 'b2', nama: 'Kennel B1' }],
    services: [
        { id_service: 's1', nama: 'Konsultasi Dokter Hewan', kategori: 'vet', harga: 120000, desc: 'Pemeriksaan umum dan konsultasi.' },
        { id_service: 's2', nama: 'Vaksinasi', kategori: 'vet', harga: 200000, desc: 'Vaksin rutin sesuai usia dan jenis hewan.' },
        { id_service: 's3', nama: 'Grooming Lengkap', kategori: 'grooming', harga: 150000, desc: 'Mandi, potong kuku, dan pembersihan telinga.' },
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
let db = null;
async function load() {
    try { const s = localStorage.getItem(DB_KEY); if (s) db = JSON.parse(s) } catch (e) { }
    if (!db) { try { const r = await fetch('data/db.json'); db = await r.json() } catch (e) { db = SEED } }
}
function save() { try { localStorage.setItem(DB_KEY, JSON.stringify(db)) } catch (e) { } }
function session() { return PC.load(PC.KEY.session, null) }

/* ===== helpers ===== */
const find = (t, k, v) => db[t].find(x => x[k] === v);
const uid = p => p + Math.random().toString(36).slice(2, 8);
function avg(type, id) {
    const r = db.reviews.filter(x => x.target_type === type && x.target_id === id);
    return r.length ? { a: (r.reduce((s, x) => s + x.rating, 0) / r.length).toFixed(1), n: r.length } : null
}
function stars(type, id) {
    const a = avg(type, id);
    return a ? `<span class="${K.star}">★ ${a.a}</span> <span class="${K.mut}">(${a.n} ulasan)</span>` : `<span class="${K.mut}">Belum ada ulasan</span>`
}
function user() { return session() || { id_user: 'guest', nama: 'Tamu', role: 'user' } }

/* ===== tabs ===== */
const TABS = [['layanan', 'Layanan'], ['dokter', 'Dokter'], ['booking', 'Booking'], ['ulasan', 'Ulasan'], ['riwayat', 'Riwayat saya']];
let tab = (TABS.find(t => t[0] === location.hash.slice(1)) || ['layanan'])[0];
function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-t="${k}"
        class="px-4 py-2.5 font-bold whitespace-nowrap rounded-t-xl cursor-pointer focus-visible:outline-3 focus-visible:outline-(--brand-strong) ${k === tab ? K.tabOn : K.tabOff}">${l}</button>`).join('');
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; history.replaceState(null, '', '#' + tab); render() });
}
function render() { renderTabs(); $('#view').innerHTML = VIEWS[tab](); if (AFTER[tab]) AFTER[tab]() }

const VIEWS = {
    layanan: () => `<h2 class="${K.h2}">Layanan</h2><div class="${K.grid}">${db.services.map(s => `
  <div class="${K.card}"><span class="tag">${esc(s.kategori)}</span><h3 class="${K.h3} mt-2">${esc(s.nama)}</h3>
  <p class="${K.mut} mt-1">${esc(s.desc)}</p><div class="${K.price} mt-2">${rp(s.harga)}</div><div class="mt-1">${stars('service', s.id_service)}</div></div>`).join('')}</div>`,

    dokter: () => `<h2 class="${K.h2}">Dokter hewan</h2><div class="${K.grid}">${db.veterinarians.map(d => `
  <div class="${K.card}"><h3 class="${K.h3}">${esc(d.nama)}</h3><p class="${K.mut} mt-1">${esc(d.spesialis)} · ${esc(find('branches', 'id_branch', d.branch_id)?.nama || '')}</p>
  <div class="mt-2">${stars('doctor', d.id_dokter)}</div></div>`).join('')}</div>`,

    booking: () => {
        const u = user(); const pets = db.pets.filter(p => p.user_id === u.id_user); return `<h2 class="${K.h2}">Booking layanan</h2>
 ${session() ? '' : '<div class="sub-banner mb-4">Kamu belum login, booking dicatat sebagai tamu. <a href="Account.html" class="back-link">Masuk atau buat akun</a></div>'}
 <form class="${K.formBox}" id="bk" onsubmit="return false">
  <label for="pet" class="${K.label} mt-0">Hewan</label>
  <select id="pet" class="${K.input}">${pets.map(p => `<option value="${p.id_pet}">${esc(p.nama)} (${esc(p.jenis)})</option>`).join('')}<option value="new">+ Tambah hewan baru</option></select>
  <div id="newpet" class="hidden"><label for="pn" class="${K.label}">Nama hewan</label><input id="pn" class="${K.input}"><label for="pj" class="${K.label}">Jenis</label><input id="pj" class="${K.input}" placeholder="Kucing, anjing, dll."></div>
  <label for="svc" class="${K.label}">Layanan</label>
  <select id="svc" class="${K.input}">${db.services.map(s => `<option value="${s.id_service}">${esc(s.nama)} - ${rp(s.harga)}</option>`).join('')}</select>
  <label for="br" class="${K.label}">Cabang</label>
  <select id="br" class="${K.input}">${db.branches.map(b => `<option value="${b.id_branch}">${esc(b.nama)}</option>`).join('')}</select>
  <div id="vetbox"><label for="dr" class="${K.label}">Dokter</label><select id="dr" class="${K.input}"></select></div>
  <label for="bt" class="${K.label}">Waktu booking</label><input type="datetime-local" id="bt" class="${K.input}">
  <div id="hotelbox" class="hidden">
   <label for="kn" class="${K.label}">Kennel</label><select id="kn" class="${K.input}"></select>
   <div class="${K.row}"><div><label for="ci" class="${K.label}">Check-in</label><input type="date" id="ci" class="${K.input}"></div><div><label for="co" class="${K.label}">Check-out</label><input type="date" id="co" class="${K.input}"></div></div>
  </div>
  <div class="${K.total}" id="tot">Total: -</div>
  <button type="button" class="${K.btn}" id="go">Booking sekarang</button>
 </form>`},

    ulasan: () => {
        const rows = [...db.reviews].reverse().map(r => {
            const t = r.target_type === 'doctor' ? find('veterinarians', 'id_dokter', r.target_id)?.nama : find('services', 'id_service', r.target_id)?.nama;
            const u = find('users', 'id_user', r.user_id)?.nama || 'Tamu';
            return `<div class="${K.card}"><span class="${K.star} tracking-widest">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
  <h3 class="${K.h3} mt-1">${esc(t || '-')} <span class="tag align-middle">${r.target_type === 'doctor' ? 'dokter' : 'layanan'}</span></h3>
  <p class="mt-1">${esc(r.ulasan)}</p><div class="${K.mut} mt-2">${esc(u)} · ${esc(r.tanggal_ulasan)}</div></div>`
        }).join('');
        return `<h2 class="${K.h2}">Ulasan</h2>
  <form class="${K.formBox} mb-6" id="rv" onsubmit="return false">
   <div class="${K.row}"><div><label for="rt" class="${K.label} mt-0">Untuk</label><select id="rt" class="${K.input}"><option value="service">Layanan</option><option value="doctor">Dokter</option></select></div>
   <div><label for="rid" class="${K.label} mt-0">Pilih</label><select id="rid" class="${K.input}"></select></div></div>
   <label for="rr" class="${K.label}">Rating</label><select id="rr" class="${K.input}">${[5, 4, 3, 2, 1].map(n => `<option>${n}</option>`).join('')}</select>
   <label for="rx" class="${K.label}">Ulasan</label><textarea id="rx" rows="3" maxlength="300" class="${K.input}"></textarea>
   <button type="button" class="${K.btn}" id="rsend">Kirim ulasan</button></form>
  <div class="${K.grid}">${rows || `<p class="${K.mut}">Belum ada ulasan. Jadilah yang pertama.</p>`}</div>`
    },

    riwayat: () => {
        const u = user(); const pets = db.pets.filter(p => p.user_id === u.id_user).map(p => p.id_pet);
        const bks = db.service_bookings.filter(b => b.user_id === u.id_user);
        const recs = db.pet_medical_records.filter(r => pets.includes(r.pet_id));
        return `<h2 class="${K.h2}">Booking saya</h2><div class="${K.grid}">${bks.map(b => `<div class="${K.card}"><span class="tag">${esc(b.status_booking)}</span>
  <h3 class="${K.h3} mt-2">${esc(b.booking_code)}</h3><p class="${K.mut} mt-1">${esc(find('services', 'id_service', b.service_id)?.nama || '')}<br>${esc(b.booking_time.replace('T', ' '))}</p>
  <div class="${K.price} mt-2">${rp(b.total_biaya)}</div></div>`).join('') || `<p class="${K.mut}">Belum ada booking.</p>`}</div>
 <h2 class="${K.h2} mt-8">Rekam medis hewan</h2><div class="${K.grid}">${recs.map(r => `<div class="${K.card}"><h3 class="${K.h3}">${esc(find('pets', 'id_pet', r.pet_id)?.nama || '')}</h3>
  <p class="mt-1">${esc(r.diagnosis)}</p><p class="${K.mut} mt-1">Resep: ${esc(r.resep_obat)}<br>Tindakan: ${esc(r.tindakan)}<br>${esc(r.record_date)} · ${esc(find('veterinarians', 'id_dokter', r.dokter_id)?.nama || '')}</p></div>`).join('') || `<p class="${K.mut}">Belum ada rekam medis.</p>`}</div>
 <p class="mt-8"><button type="button" class="px-6 py-3 rounded-full font-bold btn-ghost cursor-pointer" id="dl">Unduh db.json</button></p>`}
};

const AFTER = {
    booking() {
        const svc = $('#svc'), br = $('#br');
        function sync() {
            const s = find('services', 'id_service', svc.value);
            $('#vetbox').classList.toggle('hidden', s.kategori !== 'vet');
            $('#hotelbox').classList.toggle('hidden', s.kategori !== 'hotel');
            $('#dr').innerHTML = db.veterinarians.filter(d => d.branch_id === br.value).map(d => `<option value="${d.id_dokter}">${esc(d.nama)}</option>`).join('') || '<option value="">Belum ada dokter di cabang ini</option>';
            $('#kn').innerHTML = db.kennels.filter(k => k.branch_id === br.value).map(k => `<option value="${k.id_kennel}">${esc(k.nama)}</option>`).join('');
            total();
        }
        function nights() { const a = $('#ci').value, b = $('#co').value; if (!a || !b) return 0; return Math.max(0, Math.round((new Date(b) - new Date(a)) / 864e5)) }
        function total() {
            const s = find('services', 'id_service', svc.value);
            const t = s.kategori === 'hotel' ? s.harga * nights() : s.harga;
            $('#tot').textContent = 'Total: ' + (s.kategori === 'hotel' && !nights() ? 'isi tanggal check-in dan check-out' : rp(t)); return t
        }
        svc.onchange = br.onchange = sync; $('#ci').onchange = $('#co').onchange = total;
        $('#pet').onchange = e => $('#newpet').classList.toggle('hidden', e.target.value !== 'new');
        if (!db.pets.some(p => p.user_id === user().id_user)) { $('#pet').value = 'new'; $('#newpet').classList.remove('hidden') }
        sync();
        $('#go').onclick = () => {
            const u = user(), s = find('services', 'id_service', svc.value);
            let petId = $('#pet').value;
            if (petId === 'new') {
                const n = $('#pn').value.trim(); if (!n) return toast('Isi nama hewan dulu');
                petId = uid('p'); db.pets.push({ id_pet: petId, user_id: u.id_user, nama: n, jenis: $('#pj').value.trim() || '-' })
            }
            if (!$('#bt').value) return toast('Pilih waktu booking');
            if (s.kategori === 'vet' && !$('#dr').value) return toast('Pilih cabang yang punya dokter');
            if (s.kategori === 'hotel' && !nights()) return toast('Check-out harus setelah check-in');
            db.service_bookings.push({
                id_booking: uid('bk'), booking_code: 'PC-' + uid('').toUpperCase(), user_id: u.id_user, pet_id: petId,
                service_id: s.id_service, branch_id: br.value, kennel_id: s.kategori === 'hotel' ? $('#kn').value : null,
                dokter_id: s.kategori === 'vet' ? $('#dr').value : null, booking_time: $('#bt').value,
                check_in_time: s.kategori === 'hotel' ? $('#ci').value : null, check_out_time: s.kategori === 'hotel' ? $('#co').value : null,
                total_biaya: total(), status_booking: 'menunggu'
            });
            save(); toast('Booking tersimpan'); tab = 'riwayat'; history.replaceState(null, '', '#riwayat'); render();
        };
    },
    ulasan() {
        const fill = () => {
            $('#rid').innerHTML = $('#rt').value === 'doctor'
                ? db.veterinarians.map(d => `<option value="${d.id_dokter}">${esc(d.nama)}</option>`).join('')
                : db.services.map(s => `<option value="${s.id_service}">${esc(s.nama)}</option>`).join('')
        };
        $('#rt').onchange = fill; fill();
        $('#rsend').onclick = () => {
            if (!session()) return toast('Masuk lewat halaman Akun untuk menulis ulasan');
            const x = $('#rx').value.trim(); if (!x) return toast('Tulis ulasanmu dulu');
            db.reviews.push({
                id_review: uid('r'), target_type: $('#rt').value, target_id: $('#rid').value, user_id: user().id_user,
                rating: +$('#rr').value, ulasan: x, tanggal_ulasan: new Date().toISOString().slice(0, 10)
            });
            save(); toast('Ulasan terkirim'); render();
        };
    },
    riwayat() {
        $('#dl').onclick = () => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })); a.download = 'db.json'; a.click()
        };
    }
};

load().then(render);