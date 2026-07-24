/* ==========================================================================
   MIKADO SKINCARE - JAVASCRIPT APP LOGIC
   WhatsApp Business: +51 914 424 034
   ========================================================================== */

const PHONE_WHATSAPP = "51914424034";

// Fallback default image URLs for K-Beauty categories
const DEFAULT_PLACEHOLDERS = {
  solares: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
  serums: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
  tonicos: "https://images.unsplash.com/photo-1608248597560-8451877b02c0?auto=format&fit=crop&w=600&q=80",
  limpiadores: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80",
  hidratantes: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
  mascarillas: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80",
  default: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80"
};

// Load products from products.js (generated from catalogo_mikado.xlsx)
const PRODUCTS = (typeof PRODUCTS_DATA !== "undefined" && PRODUCTS_DATA.length > 0) 
  ? PRODUCTS_DATA 
  : [];

// App State
let cart = [];
let currentCategory = "todos";

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  setupEventListeners();
  updateCartUI();
});

// Helper for image fallback
function getProductImageFallback(cat) {
  return DEFAULT_PLACEHOLDERS[cat] || DEFAULT_PLACEHOLDERS.default;
}

// Render Products Grid
function renderProducts(itemsToRender = PRODUCTS) {
  const container = document.getElementById("productsGrid");
  if (!container) return;

  if (itemsToRender.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--clr-text-muted);">
        <i class="fa-solid fa-sparkles" style="font-size: 2rem; margin-bottom: 12px; color: var(--clr-primary);"></i>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otra búsqueda o categoría.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = itemsToRender.map(product => {
    const rawRating = product.rating !== undefined ? product.rating : product.reviews;
    const ratingVal = rawRating ? Number(rawRating).toFixed(1) : (4.5 + ((product.id || 1) * 0.17) % 0.5).toFixed(1);

    return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-badge-group">
        ${product.badge ? `<span class="badge-tag ${product.badgeClass}">${product.badge}</span>` : ''}
      </div>
      
      <button class="wishlist-btn" onclick="toggleWishlist(this, ${product.id})" title="Añadir a favoritos">
        <i class="fa-regular fa-heart"></i>
      </button>

      <div class="product-img-box">
        <img src="${product.img}" alt="${product.title}" loading="lazy" onerror="this.onerror=null; this.src=getProductImageFallback('${product.category}');">
        <div class="quick-view-overlay">
          <button class="btn-quick-view" onclick="openQuickView(${product.id})">
            <i class="fa-solid fa-eye"></i> Vista Rápida
          </button>
        </div>
      </div>

      <div class="product-info">
        <span class="product-brand">${product.brand}</span>
        <h3 class="product-title" onclick="openQuickView(${product.id})" style="cursor:pointer;">${product.title}</h3>
        
        <div class="product-rating">
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <span class="rating-count">(${ratingVal})</span>
        </div>

        <div class="product-price-row">
          <span class="current-price">S/ ${product.price.toFixed(2)}</span>
          ${product.oldPrice ? `<span class="old-price">S/ ${product.oldPrice.toFixed(2)}</span>` : ''}
        </div>

        <div class="product-card-actions">
          <button class="btn-add-cart" onclick="addToCart(${product.id})">
            <i class="fa-solid fa-bag-shopping"></i> Agregar
          </button>
          <a class="btn-card-ws" href="${getWhatsAppProductUrl(product)}" target="_blank" title="Consultar o Comprar por WhatsApp">
            <i class="fa-brands fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </div>
  `;
  }).join("");
}

// Generate WhatsApp Direct Product Link
function getWhatsAppProductUrl(product) {
  const text = "Hola Mikado Skincare, me interesa adquirir o consultar sobre este producto de K-Beauty:\n\n*" + product.brand + " - " + product.title + "*\nPrecio: S/ " + product.price.toFixed(2) + "\n\n\u00bfTienen stock disponible y env\u00edos a mi ciudad?";
  return "https://wa.me/" + PHONE_WHATSAPP + "?text=" + encodeURIComponent(text);
}

// Event Listeners Setup
function setupEventListeners() {
  // Category Tabs
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      tabs.forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      
      const cat = e.target.getAttribute("data-category");
      currentCategory = cat;
      filterProducts();
    });
  });

  // Search Input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterProducts();
    });
  }
}

// Filter Logic (Category + Search)
function filterProducts() {
  const query = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  
  const filtered = PRODUCTS.filter(p => {
    const matchesCategory = (currentCategory === "todos") || (p.category === currentCategory);
    const matchesQuery = !query || 
      p.title.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
    
    return matchesCategory && matchesQuery;
  });

  renderProducts(filtered);
}

// Cart Functionality
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  openCartDrawer();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }

  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  updateCartUI();
}

function updateCartUI() {
  const cartBadge = document.getElementById("cartBadge");
  const cartBody = document.getElementById("cartBody");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (cartBadge) cartBadge.textContent = totalItems;
  if (cartSubtotal) cartSubtotal.textContent = `S/ ${totalAmount.toFixed(2)}`;
  if (cartTotal) cartTotal.textContent = `S/ ${totalAmount.toFixed(2)}`;

  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-basket-shopping cart-empty-icon"></i>
        <p>Tu carrito está vacío</p>
        <small style="color: var(--clr-text-light);">¡Explora nuestros favoritos K-Beauty!</small>
      </div>
    `;
    return;
  }

  cartBody.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">S/ ${item.price.toFixed(2)}</div>
        <div class="cart-item-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// Format Complete Cart Order to WhatsApp
function checkoutViaWhatsApp() {
  if (cart.length === 0) {
    alert("Tu carrito est\u00e1 vac\u00edo. A\u00f1ade productos antes de finalizar la compra.");
    return;
  }

  let text = "Hola *Mikado Skincare*, me gustar\u00eda realizar el pedido de los siguientes productos:\n\n";
  let total = 0;

  cart.forEach((item, index) => {
    const sub = item.price * item.qty;
    total += sub;
    text += (index + 1) + ". *" + item.brand + " - " + item.title + "*\n   Cantidad: " + item.qty + " x S/ " + item.price.toFixed(2) + " = S/ " + sub.toFixed(2) + "\n";
  });

  text += "\n*TOTAL A PAGAR: S/ " + total.toFixed(2) + "*\n\nQuedo a la espera para coordinar el pago (Yape/Plin/Tarjeta) y los datos de env\u00edo. \u00a1Muchas gracias!";

  const url = "https://wa.me/" + PHONE_WHATSAPP + "?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

// Drawer Controls
function openCartDrawer() {
  document.getElementById("cartOverlay")?.classList.add("active");
  document.getElementById("cartDrawer")?.classList.add("active");
}

function closeCartDrawer() {
  document.getElementById("cartOverlay")?.classList.remove("active");
  document.getElementById("cartDrawer")?.classList.remove("active");
}

// Quick View Modal Controls
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modalOverlay = document.getElementById("quickViewModal");
  if (!modalOverlay) return;

  document.getElementById("modalImg").src = product.img;
  document.getElementById("modalBrand").textContent = product.brand;
  document.getElementById("modalTitle").textContent = product.title;
  document.getElementById("modalPrice").textContent = `S/ ${product.price.toFixed(2)}`;
  document.getElementById("modalDesc").textContent = product.desc;
  
  const rawRating = product.rating !== undefined ? product.rating : product.reviews;
  const ratingVal = rawRating ? Number(rawRating).toFixed(1) : (4.5 + ((product.id || 1) * 0.17) % 0.5).toFixed(1);
  const modalRatingElem = document.getElementById("modalRatingVal");
  if (modalRatingElem) {
    modalRatingElem.textContent = `(${ratingVal})`;
  }
  
  const addBtn = document.getElementById("modalAddBtn");
  if (addBtn) {
    addBtn.onclick = () => {
      addToCart(product.id);
      closeQuickView();
    };
  }

  const wsBtn = document.getElementById("modalWsBtn");
  if (wsBtn) {
    wsBtn.href = getWhatsAppProductUrl(product);
  }

  modalOverlay.classList.add("active");
}

function closeQuickView() {
  document.getElementById("quickViewModal")?.classList.remove("active");
}

// Wishlist Heart Toggle
function toggleWishlist(btn, productId) {
  btn.classList.toggle("active");
  const icon = btn.querySelector("i");
  if (btn.classList.contains("active")) {
    icon.className = "fa-solid fa-heart";
  } else {
    icon.className = "fa-regular fa-heart";
  }
}
