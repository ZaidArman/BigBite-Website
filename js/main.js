// ================================================================
// main.js — BigBite Restaurant
// SEO / Accessibility improvements:
//   - toggleMobileMenu now syncs aria-expanded on the hamburger button
//   - All other logic unchanged
// ================================================================

// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile menu — with aria-expanded sync
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    const isOpen = menu.classList.toggle('open');

    // Keep aria-expanded in sync so screen readers announce state correctly
    if (hamburger) {
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

// Deals tab switcher
function switchDeal(btn, panelId) {
    document.querySelectorAll('.deals-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.deals-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + panelId).classList.add('active');
}

// Menu search
function searchMenu(val) {
    const q = val.toLowerCase().trim();
    document.querySelectorAll('.menu-item-card').forEach(card => {
        const name = (card.dataset.name || '').toLowerCase();
        card.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
    });
    // Hide/show category sections based on visible items
    document.querySelectorAll('.menu-category').forEach(cat => {
        const visible = [...cat.querySelectorAll('.menu-item-card')].some(c => c.style.display !== 'none');
        cat.style.display = visible ? 'block' : 'none';
    });
}

// Menu filter
function filterMenu(btn, cat) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('menuSearch').value = '';
    if (cat === 'all') {
        document.querySelectorAll('.menu-item-card').forEach(c => c.style.display = 'flex');
        document.querySelectorAll('.menu-category').forEach(c => c.style.display = 'block');
    } else {
        document.querySelectorAll('.menu-item-card').forEach(card => {
            card.style.display = card.dataset.cat === cat ? 'flex' : 'none';
        });
        document.querySelectorAll('.menu-category').forEach(section => {
            const visible = [...section.querySelectorAll('.menu-item-card')].some(c => c.style.display !== 'none');
            section.style.display = visible ? 'block' : 'none';
        });
    }
}

// Scroll-reveal animation (Intersection Observer)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Active nav link highlight on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a');
window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) cur = s.id;
    });
    navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
});


// Hero multiple image slider — changes every 2 seconds
function initHeroFoodSlider() {
    const slider = document.getElementById('heroFoodSlider');

    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    const dotsWrap = slider.querySelector('.hero-slider-dots');

    if (!slides.length) return;

    let currentIndex = 0;

    // Create dots automatically
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'hero-slider-dot';
        if (index === 0) dot.classList.add('active');
        dotsWrap.appendChild(dot);
    });

    const dots = dotsWrap.querySelectorAll('.hero-slider-dot');

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }, 5000);
}

initHeroFoodSlider();



// ================================================================
// BigBite Static Cart + WhatsApp Checkout
// No backend. No database. No JSON saving. Cart persists in localStorage.
// ================================================================

const BIGBITE_WHATSAPP_NUMBER = '923349032551';
const CART_STORAGE_KEY = 'bigbite_cart';

let cart = [];

function addToCart(name, price) {
    const cleanName = String(name || '').trim();
    const unitPrice = Number(price);

    if (!cleanName || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        showCartToast('Invalid item. Price missing.');
        return;
    }

    const existingItem = cart.find(item => item.name === cleanName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: cleanName,
            unit_price: unitPrice,
            quantity: 1
        });
    }

    saveCartToLocalStorage();
    updateCartUI();
    showCartToast(`${cleanName} added to cart`);
}

function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    saveCartToLocalStorage();
    updateCartUI();
}

function increaseQty(name) {
    const item = cart.find(item => item.name === name);
    if (!item) return;

    item.quantity += 1;
    saveCartToLocalStorage();
    updateCartUI();
}

function decreaseQty(name) {
    const item = cart.find(item => item.name === name);
    if (!item) return;

    item.quantity -= 1;

    if (item.quantity <= 0) {
        removeFromCart(name);
        return;
    }

    saveCartToLocalStorage();
    updateCartUI();
}

function updateCartUI() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = getCartTotal();

    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalQuantity;
    });

    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    if (cartTotalEl) {
        cartTotalEl.textContent = `Rs. ${totalAmount}`;
    }

    if (!cartItemsEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="cart-empty">
                Your cart is empty. Add something tasty first.
            </div>
        `;
        return;
    }

    cartItemsEl.innerHTML = cart.map(item => {
        const subtotal = item.unit_price * item.quantity;

        return `
            <div class="cart-item">
                <div>
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-price">Rs. ${item.unit_price} each</div>

                    <div class="cart-qty-controls">
                        <button type="button" data-cart-action="decrease" data-name="${escapeHtml(item.name)}" aria-label="Decrease quantity">−</button>
                        <span class="cart-qty-number">${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-name="${escapeHtml(item.name)}" aria-label="Increase quantity">+</button>
                        <button type="button" class="cart-remove-btn" data-cart-action="remove" data-name="${escapeHtml(item.name)}">
                            Remove
                        </button>
                    </div>
                </div>

                <div class="cart-item-subtotal">Rs. ${subtotal}</div>
            </div>
        `;
    }).join('');

    cartItemsEl.querySelectorAll('[data-cart-action]').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.cartAction;
            const name = button.dataset.name;

            if (action === 'increase') increaseQty(name);
            if (action === 'decrease') decreaseQty(name);
            if (action === 'remove') removeFromCart(name);
        });
    });
}

function openCart() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');

    if (overlay) overlay.classList.add('open');

    if (drawer) {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
    }

    document.body.classList.add('cart-open');
    clearCartError();
    updateCartUI();
}

function closeCart() {
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');

    if (overlay) overlay.classList.remove('open');

    if (drawer) {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
    }

    document.body.classList.remove('cart-open');
}

function getCartTotal() {
    return cart.reduce((sum, item) => {
        return sum + (Number(item.unit_price) * Number(item.quantity));
    }, 0);
}

function saveCartToLocalStorage() {
    if (!cart.length) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];

        if (!Array.isArray(parsedCart)) {
            cart = [];
            return;
        }

        cart = parsedCart
            .map(item => ({
                name: String(item.name || '').trim(),
                unit_price: Number(item.unit_price),
                quantity: Number(item.quantity)
            }))
            .filter(item => item.name && item.unit_price > 0 && item.quantity > 0);
    } catch (error) {
        cart = [];
        localStorage.removeItem(CART_STORAGE_KEY);
    }
}

function placeOrderOnWhatsApp() {
    clearCartError();

    const order = buildOrderObjectFromForm();
    if (!order) return;

    order.order_id = generateLocalOrderId();

    const whatsappMessage = buildWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/${BIGBITE_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    cart = [];
    saveCartToLocalStorage();
    updateCartUI();

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) checkoutForm.reset();

    toggleAddressField();
    closeCart();

    window.location.href = whatsappUrl;
}

function buildOrderObjectFromForm() {
    if (cart.length === 0) {
        showCartError('Your cart is empty. Add something tasty first.');
        return null;
    }

    const name = getInputValue('customerName');
    const phone = getInputValue('customerPhone');
    const email = getInputValue('customerEmail');
    const orderType = getInputValue('orderType');
    const deliveryAddress = getInputValue('customerAddress');
    const totalAmount = getCartTotal();

    if (!name) {
        showCartError('Name is required.');
        return null;
    }

    if (!phone) {
        showCartError('Phone number is required.');
        return null;
    }

    if (!orderType) {
        showCartError('Order type is required.');
        return null;
    }

    if (orderType === 'Delivery' && !deliveryAddress) {
        showCartError('Delivery address is required for delivery orders.');
        return null;
    }

    if (totalAmount <= 0) {
        showCartError('Total amount must be greater than 0.');
        return null;
    }

    return {
        name,
        phone,
        email,
        order_type: orderType,
        delivery_address: orderType === 'Delivery' ? deliveryAddress : '',
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.unit_price * item.quantity
        })),
        total_amount: totalAmount
    };
}

function buildWhatsAppMessage(order) {
    const lines = [];

    lines.push('Hi BigBite,');
    lines.push('');
    lines.push(`Order ID: ${order.order_id}`);
    lines.push('');
    lines.push('Customer Details:');
    lines.push(`Name: ${order.name}`);
    lines.push(`Phone: ${order.phone}`);

    if (order.email) {
        lines.push(`Email: ${order.email}`);
    }

    lines.push('');
    lines.push(`Order Type: ${order.order_type}`);

    if (order.order_type === 'Delivery') {
        lines.push(`Delivery Address: ${order.delivery_address}`);
    }

    lines.push('');
    lines.push('Order Details:');

    order.items.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.name} x ${item.quantity} = Rs. ${item.subtotal}`);
    });

    lines.push('');
    lines.push(`Total Amount: Rs. ${order.total_amount}`);
    lines.push('');
    lines.push('Please confirm my order.');

    return lines.join('\n');
}

function generateLocalOrderId() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `BB-${year}${month}${day}-${hour}${minute}${second}`;
}

function getInputValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function toggleAddressField() {
    const orderType = document.getElementById('orderType');
    const address = document.getElementById('customerAddress');

    if (!orderType || !address) return;

    if (orderType.value === 'Delivery') {
        address.style.display = 'block';
        address.setAttribute('required', 'required');
        address.placeholder = 'Delivery Address';
    } else {
        address.style.display = 'none';
        address.removeAttribute('required');
        address.value = '';
    }
}

function showCartError(message) {
    const errorEl = document.getElementById('cartError');
    if (errorEl) errorEl.textContent = message;
}

function clearCartError() {
    const errorEl = document.getElementById('cartError');
    if (errorEl) errorEl.textContent = '';
}

function showCartToast(message) {
    const toast = document.getElementById('cartToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(showCartToast.timer);
    showCartToast.timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1800);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initCartFeature() {
    loadCartFromLocalStorage();
    updateCartUI();
    toggleAddressField();

    document.addEventListener('click', event => {
        const button = event.target.closest('.add-to-cart-btn');
        if (!button) return;

        event.preventDefault();

        const name = button.dataset.name;
        const price = button.dataset.price;

        addToCart(name, price);
    });

    const orderType = document.getElementById('orderType');
    if (orderType) {
        orderType.addEventListener('change', toggleAddressField);
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', event => {
            event.preventDefault();
            placeOrderOnWhatsApp();
        });
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeCart();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartFeature);
} else {
    initCartFeature();
}




/* ===================== AUTO REVIEWS SLIDER ===================== */

const reviews = [
    {
        stars: "★★★★★",
        text: "Best burger in hangu! Fast delivery and absolutely incredible deals. BigBite is my go-to place now.",
        avatar: "ZU",
        name: "Zaid Ullah",
        date: "Regular Customer"
    },
    {
        stars: "★★★★★",
        text: "The pizza was fresh and loaded with toppings. Crown Crust is amazing absolutely worth every rupee!",
        avatar: "SB",
        name: "Sana Bibi",
        date: "Pizza Lover"
    },
    {
        stars: "★★★★★",
        text: "MashaAllah best and delicious food. ",
        avatar: "MR",
        name: "M. Rashid",
        date: "Satisfied Customer"
    },
    {
        stars: "★★★★★",
        text: "The zinger burger was crispy, juicy, and full of flavor. Delivery was quick and the food was still hot.",
        avatar: "HS",
        name: "Hamza Shah",
        date: "Satisfied Customer"
    },
    {
        stars: "★★★★★",
        text: "Amazing taste and very reasonable prices. Their loaded fries are seriously addictive.",
        avatar: "FA",
        name: "Fatima Ali",
        date: "Food Lover"
    },
    {
        stars: "★★★★★",
        text: "I ordered for my friends and everyone loved it. The deals are perfect for group orders.",
        avatar: "UK",
        name: "Usman Khalid",
        date: "Group Order"
    },
    {
        stars: "★★★★★",
        text: "Fresh food, clean packing, and great taste. This is exactly what a fast food place should be.",
        avatar: "AN",
        name: "Ayesha Noor",
        date: "Satisfied Customer"
    },
    {
        stars: "★★★★★",
        text: "The pizza crust was soft, the cheese was perfect, and the flavor was excellent. Highly recommended.",
        avatar: "BI",
        name: "Bilal Iqbal",
        date: "Pizza Customer"
    },
    {
        stars: "★★★★★",
        text: "Fast service and delicious food. Their family deals are budget-friendly and filling.",
        avatar: "RK",
        name: "Rabia Khan",
        date: "Family Deal Customer"
    },
    {
        stars: "★★★★★",
        text: "Bhut Maza ka food hai. JazakAllah!",
        avatar: "L",
        name: "Laiba",
        date: "Satisfied Customer"
    },
];

const reviewsGrid = document.getElementById("reviewsGrid");
const reviewsDots = document.getElementById("reviewsDots");

let currentReviewIndex = 0;
let reviewInterval;

function getReviewsPerView() {
    if (window.innerWidth <= 576) {
        return 1;
    }

    if (window.innerWidth <= 992) {
        return 2;
    }

    return 3;
}

function createReviewCard(review) {
    return `
        <div class="review-card">
            <div class="review-stars">${review.stars}</div>

            <div class="review-text">
                "${review.text}"
            </div>

            <div class="review-author">
                <div class="review-avatar">${review.avatar}</div>
                <div>
                    <div class="review-name">${review.name}</div>
                    <div class="review-date">${review.date}</div>
                </div>
            </div>
        </div>
    `;
}

function renderReviews() {
    if (!reviewsGrid) return;

    const reviewsPerView = getReviewsPerView();
    let visibleReviews = [];

    for (let i = 0; i < reviewsPerView; i++) {
        const reviewIndex = (currentReviewIndex + i) % reviews.length;
        visibleReviews.push(reviews[reviewIndex]);
    }

    reviewsGrid.classList.add("is-changing");

    setTimeout(() => {
        reviewsGrid.innerHTML = visibleReviews
            // .map((review, index) => createReviewCard(review, index))
            .map((review) => createReviewCard(review))
            .join("");

        renderReviewDots();
        reviewsGrid.classList.remove("is-changing");
    }, 300);
}

function renderReviewDots() {
    if (!reviewsDots) return;

    const reviewsPerView = getReviewsPerView();
    const totalDots = Math.ceil(reviews.length / reviewsPerView);
    const activeDot = Math.floor(currentReviewIndex / reviewsPerView);

    reviewsDots.innerHTML = "";

    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement("button");
        dot.className = "review-dot";

        if (i === activeDot) {
            dot.classList.add("active");
        }

        dot.setAttribute("aria-label", `Show review group ${i + 1}`);

        dot.addEventListener("click", () => {
            currentReviewIndex = i * reviewsPerView;
            renderReviews();
            restartReviewSlider();
        });

        reviewsDots.appendChild(dot);
    }
}

function nextReviews() {
    const reviewsPerView = getReviewsPerView();

    currentReviewIndex += reviewsPerView;

    if (currentReviewIndex >= reviews.length) {
        currentReviewIndex = 0;
    }

    renderReviews();
}

function startReviewSlider() {
    reviewInterval = setInterval(nextReviews, 5000);
}

function stopReviewSlider() {
    clearInterval(reviewInterval);
}

function restartReviewSlider() {
    stopReviewSlider();
    startReviewSlider();
}

if (reviewsGrid) {
    renderReviews();
    startReviewSlider();

    window.addEventListener("resize", () => {
        currentReviewIndex = 0;
        renderReviews();
        restartReviewSlider();
    });

    reviewsGrid.addEventListener("mouseenter", stopReviewSlider);
    reviewsGrid.addEventListener("mouseleave", startReviewSlider);
}
