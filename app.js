const PRODUCTS = [
  {id:1,name:"Hand-thrown mug",cat:"Ceramics",price:4500,icon:"☕",color:"#f3d9c4"},
  {id:2,name:"Stoneware dinner plate",cat:"Ceramics",price:6000,icon:"🍽️",color:"#d7e6e3"},
  {id:3,name:"Glazed serving bowl",cat:"Ceramics",price:9500,icon:"🥣",color:"#e3dcef"},
  {id:4,name:"Cane storage basket",cat:"Baskets",price:12000,icon:"🧺",color:"#f1e4b8"},
  {id:5,name:"Woven fruit tray",cat:"Baskets",price:7500,icon:"🍊",color:"#f7d6c0"},
  {id:6,name:"Raffia laundry hamper",cat:"Baskets",price:18500,icon:"👕",color:"#e5ead1"},
  {id:7,name:"Iroko chopping board",cat:"Kitchen",price:8000,icon:"🔪",color:"#e2cfc0"},
  {id:8,name:"Cast iron skillet",cat:"Kitchen",price:22000,icon:"🍳",color:"#cfd6de"},
  {id:9,name:"Wooden spoon set",cat:"Kitchen",price:3500,icon:"🥄",color:"#f0dcc2"},
  {id:10,name:"Soy candle jar",cat:"Decor",price:5500,icon:"🕯️",color:"#f6e7ae"},
  {id:11,name:"Ceramic bud vase",cat:"Decor",price:6500,icon:"🏺",color:"#cfe4ea"},
  {id:12,name:"Adire table runner",cat:"Decor",price:14000,icon:"🧵",color:"#c9d3ee"}
];
const $ = id => document.getElementById(id);
const naira = n => "₦" + n.toLocaleString("en-NG");
const state = {query:"",cats:new Set(),max:30000,sort:"featured",cart:{}};

try { state.cart = JSON.parse(localStorage.getItem("cart")) || {}; } catch { state.cart = {}; }
const save = () => { try { localStorage.setItem("cart", JSON.stringify(state.cart)); } catch {} };

// Filters
const cats = [...new Set(PRODUCTS.map(p => p.cat))];
$("categories").innerHTML = cats.map(c =>
  `<label><input type="checkbox" value="${c}"> ${c}</label>`).join("");

function visible() {
  let list = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(state.query) &&
    (!state.cats.size || state.cats.has(p.cat)) &&
    p.price <= state.max);
  const sorts = {low:(a,b)=>a.price-b.price, high:(a,b)=>b.price-a.price, name:(a,b)=>a.name.localeCompare(b.name)};
  if (sorts[state.sort]) list.sort(sorts[state.sort]);
  return list;
}

// Components
const ProductCard = p => `
  <article class="card">
    <div class="thumb" style="background:${p.color}" aria-hidden="true">${p.icon}</div>
    <div class="info">
      <h3>${p.name}</h3><span class="cat">${p.cat}</span>
      <span class="price">${naira(p.price)}</span>
      <button class="add" data-add="${p.id}">Add to cart</button>
    </div>
  </article>`;

const CartItem = (p, qty) => `
  <div class="item">
    <div class="mini" style="background:${p.color}" aria-hidden="true">${p.icon}</div>
    <div><strong>${p.name}</strong><div>${naira(p.price)}</div>
      <div class="qty">
        <button data-dec="${p.id}" aria-label="Decrease quantity of ${p.name}">−</button>
        <span>${qty}</span>
        <button data-inc="${p.id}" aria-label="Increase quantity of ${p.name}">+</button>
      </div></div>
    <button class="remove" data-rm="${p.id}">Remove</button>
  </div>`;

function renderGrid() {
  const list = visible();
  $("resultCount").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  $("grid").innerHTML = list.length ? list.map(ProductCard).join("")
    : `<div class="empty">No products match. Try a different search or clear the filters.</div>`;
}

function renderCart() {
  const entries = Object.entries(state.cart).filter(([id]) => PRODUCTS.some(p => p.id == id));
  $("cartItems").innerHTML = entries.length
    ? entries.map(([id, q]) => CartItem(PRODUCTS.find(p => p.id == id), q)).join("")
    : `<p class="muted" style="padding-top:1rem">Nothing on the receipt yet. Pick something off the shelf.</p>`;
  const count = entries.reduce((s, [, q]) => s + q, 0);
  const total = entries.reduce((s, [id, q]) => s + q * PRODUCTS.find(p => p.id == id).price, 0);
  $("cartCount").textContent = count;
  $("subtotal").textContent = naira(total);
  $("checkout").disabled = !count;
  save();
}

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}
function setDrawer(open) {
  $("drawer").classList.toggle("open", open);
  $("drawer").setAttribute("aria-hidden", !open);
  $("overlay").hidden = !open;
  if (open) $("closeCart").focus(); else $("cartBtn").focus();
}

// Events
$("search").addEventListener("input", e => { state.query = e.target.value.trim().toLowerCase(); renderGrid(); });
$("categories").addEventListener("change", e => {
  e.target.checked ? state.cats.add(e.target.value) : state.cats.delete(e.target.value); renderGrid();
});
$("price").addEventListener("input", e => { state.max = +e.target.value; $("priceOut").textContent = naira(state.max); renderGrid(); });
$("sort").addEventListener("change", e => { state.sort = e.target.value; renderGrid(); });
$("reset").addEventListener("click", () => {
  state.query = ""; state.cats.clear(); state.max = 30000; state.sort = "featured";
  $("search").value = ""; $("price").value = 30000; $("sort").value = "featured";
  document.querySelectorAll("#categories input").forEach(i => i.checked = false);
  $("priceOut").textContent = naira(30000); renderGrid();
});
$("grid").addEventListener("click", e => {
  const id = e.target.dataset.add; if (!id) return;
  state.cart[id] = (state.cart[id] || 0) + 1; renderCart();
  toast(`${PRODUCTS.find(p => p.id == id).name} added to cart`);
});
$("cartItems").addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.inc) state.cart[d.inc]++;
  if (d.dec && --state.cart[d.dec] < 1) delete state.cart[d.dec];
  if (d.rm) delete state.cart[d.rm];
  renderCart();
});
$("clear").addEventListener("click", () => { state.cart = {}; renderCart(); });
$("checkout").addEventListener("click", () => { state.cart = {}; renderCart(); setDrawer(false); toast("Paid. Thank you (demo)"); });
$("cartBtn").addEventListener("click", () => setDrawer(true));
$("closeCart").addEventListener("click", () => setDrawer(false));
$("overlay").addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") setDrawer(false); });

$("priceOut").textContent = naira(state.max);
renderGrid(); renderCart();
