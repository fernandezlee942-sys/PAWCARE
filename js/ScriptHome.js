const products = [
    { n: "Kandang Tidur Empuk Kucing", c: "Cat", p: 185000, img: "produk/kandang-kucing.jpg", t: 1 },
    { n: "Pasir Kucing Gumpal 5 L", c: "Cat", p: 68000, img: "produk/pasir-kucing.jpg", t: 2 },
    { n: "Tongkat Mainan Bulu", c: "Cat", p: 35000, img: "produk/tongkat-bulu.jpg", t: 3 },
    { n: "Tiang Garukan Sisal", c: "Cat", p: 225000, img: "produk/tiang-garukan.jpg", t: 4 },
    { n: "Bola Karet Anjing", c: "Dog", p: 42000, img: "produk/bola-karet.jpg", t: 5 },
    { n: "Sampo Anjing Hipoalergenik", c: "Dog", p: 89000, img: "produk/sampo-anjing.jpg", t: 6 },
    { n: "Tempat Tidur Anjing Besar", c: "Dog", p: 310000, img: "produk/tempat-tidur-anjing.jpg", t: 2 },
    { n: "Tali Tuntun Reflektif", c: "Dog", p: 75000, img: "produk/tali-tuntun.jpg", t: 3 },
    { n: "Makanan Kucing Salmon 1 kg", c: "Food", p: 98000, img: "produk/makanan-kucing.jpg", t: 5 },
    { n: "Makanan Anjing Ayam 2 kg", c: "Food", p: 145000, img: "produk/makanan-anjing.jpg", t: 1 },
    { n: "Camilan Latih Anjing", c: "Food", p: 39000, img: "produk/camilan-anjing.jpg", t: 4 },
    { n: "Kalung Lonceng Warna-warni", c: "Accessories", p: 28000, img: "produk/kalung-lonceng.jpg", t: 6 },
    { n: "Tas Travel Hewan", c: "Accessories", p: 265000, img: "produk/tas-travel.jpg", t: 3 },
    { n: "Mangkuk Makan Anti Tumpah", c: "Accessories", p: 55000, img: "produk/mangkuk-makan.jpg", t: 2 },
];

const rp = v => "Rp " + v.toLocaleString("id-ID");

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const count = document.getElementById("count");
const search = document.getElementById("search");
const filters = document.getElementById("filters");

let activeCat = "All";

function render() {
    const q = search.value.trim().toLowerCase();

    const list = products.filter(x =>
        (activeCat === "All" || x.c === activeCat) &&
        x.n.toLowerCase().includes(q)
    );

    grid.innerHTML = list.map(x => `
    <article class="card">
      <div class="thumb" style="background: var(--tint-${x.t})">
        <img src="${x.img}" alt="${x.n}" loading="lazy"
             class="w-full h-full object-cover"
             onerror="this.replaceWith(document.createTextNode('${x.e}'))">
      </div>
      <div class="p-4">
        <span class="tag">${x.c}</span>
        <h3 class="mt-2 font-semibold leading-snug">${x.n}</h3>
        <p class="mt-1 font-bold text-brand-strong">${rp(x.p)}</p>
      </div>
    </article>
  `).join("");

    empty.classList.toggle("hidden", list.length > 0);
    count.textContent = list.length + " produk ditampilkan";
}

filters.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    filters.querySelectorAll(".chip").forEach(c =>
        c.setAttribute("aria-pressed", c === btn)
    );
    render();
});

search.addEventListener("input", render);
render();