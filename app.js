// Product Data
const PRODUCTS = {
    1: {
        id: 1,
        name: 'Premium Wireless Headphones',
        price: 149.99,
        description: 'High-quality noise-cancelling headphones with 30-hour battery life',
        image: 'https://via.placeholder.com/300x300/4A90E2/ffffff?text=Wireless+Headphones'
    },
    2: {
        id: 2,
        name: 'Smart Fitness Watch',
        price: 199.99,
        description: 'Track your fitness goals with GPS, heart rate monitor, and sleep tracking',
        image: 'https://via.placeholder.com/300x300/50C878/ffffff?text=Smart+Watch'
    },
    3: {
        id: 3,
        name: 'Ergonomic Laptop Stand',
        price: 49.99,
        description: 'Adjustable aluminum stand for better posture and comfort',
        image: 'https://via.placeholder.com/300x300/FF6B6B/ffffff?text=Laptop+Stand'
    },
    4: {
        id: 4,
        name: 'RGB Mechanical Keyboard',
        price: 129.99,
        description: 'Cherry MX switches with customizable RGB lighting',
        image: 'https://via.placeholder.com/300x300/FFD93D/ffffff?text=Mechanical+Keyboard'
    },
    5: {
        id: 5,
        name: 'Precision Wireless Mouse',
        price: 39.99,
        description: 'Ergonomic design with adjustable DPI and silent clicks',
        image: 'https://via.placeholder.com/300x300/A78BFA/ffffff?text=Wireless+Mouse'
    },
    6: {
        id: 6,
        name: '7-in-1 USB-C Hub',
        price: 59.99,
        description: 'Multiple ports including HDMI, USB 3.0, and SD card reader',
        image: 'https://via.placeholder.com/300x300/FB923C/ffffff?text=USB-C+Hub'
    },
    7: {
        id: 7,
        name: '4K Ultra HD Webcam',
        price: 89.99,
        description: 'Professional video quality with auto-focus and noise reduction',
        image: 'https://via.placeholder.com/300x300/34D399/ffffff?text=Webcam+4K'
    },
    8: {
        id: 8,
        name: 'Adjustable Phone Stand',
        price: 24.99,
        description: 'Universal stand compatible with all smartphones and tablets',
        image: 'https://via.placeholder.com/300x300/F472B6/ffffff?text=Phone+Stand'
    },
    9: {
        id: 9,
        name: '1TB Portable SSD',
        price: 119.99,
        description: 'Ultra-fast external storage with USB-C connectivity',
        image: 'https://via.placeholder.com/300x300/60A5FA/ffffff?text=Portable+SSD'
    },
    10: {
        id: 10,
        name: 'Smart LED Desk Lamp',
        price: 44.99,
        description: 'Adjustable brightness and color temperature with USB charging port',
        image: 'https://via.placeholder.com/300x300/A3E635/ffffff?text=LED+Desk+Lamp'
    },
    11: {
        id: 11,
        name: 'Waterproof Bluetooth Speaker',
        price: 79.99,
        description: 'Portable speaker with 360° sound and 20-hour battery',
        image: 'https://via.placeholder.com/300x300/EC4899/ffffff?text=Bluetooth+Speaker'
    },
    12: {
        id: 12,
        name: 'Cable Management Kit',
        price: 19.99,
        description: 'Complete solution for organizing desk cables and accessories',
        image: 'https://via.placeholder.com/300x300/8B5CF6/ffffff?text=Cable+Organizer'
    }
};

// CartManager Class for State Management
class CartManager {
    constructor() {
        this.storageKey = 'shopping_cart';
        this.cart = this.loadCart();
    }

    loadCart() {
        try {
            const cartData = localStorage.getItem(this.storageKey);
            return cartData ? JSON.parse(cartData) : {};
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            return {};
        }
    }

    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }



    addToCart(productId, quantity = 1) {
        const id = String(productId);
        
        if (!PRODUCTS[id]) {
            console.error(`Product with ID ${id} not found`);
            return false;
        }

        if (quantity <= 0) {
            console.error('Quantity must be greater than 0');
            return false;
        }

        if (this.cart[id]) {
            this.cart[id].quantity += quantity;
        } else {
            this.cart[id] = {
                productId: id,
                quantity: quantity,
                addedAt: new Date().toISOString()
            };
        }

        this.saveCart();
        return true;
    }

    removeFromCart(productId) {
        const id = String(productId);
        
        if (this.cart[id]) {
            delete this.cart[id];
            this.saveCart();
            return true;
        }
        
        return false;
    }

    updateQuantity(productId, quantity) {
        const id = String(productId);
        
        if (!this.cart[id]) {
            console.error(`Product ${id} not in cart`);
            return false;
        }

        if (quantity <= 0) {
            return this.removeFromCart(id);
        }

        this.cart[id].quantity = quantity;
        this.saveCart();
        return true;
    }

    getCartItems() {
        const items = [];
        
        for (const [productId, cartItem] of Object.entries(this.cart)) {
            const product = PRODUCTS[productId];
            if (product) {
                items.push({
                    ...product,
                    quantity: cartItem.quantity,
                    addedAt: cartItem.addedAt
                });
            }
        }
        
        return items;
    }

    getCartTotal() {
        let subtotal = 0;
        
        for (const [productId, cartItem] of Object.entries(this.cart)) {
            const product = PRODUCTS[productId];
            if (product) {
                subtotal += product.price * cartItem.quantity;
            }
        }
        
        const tax = subtotal * 0.10;
        const total = subtotal + tax;
        
        return {
            subtotal: subtotal,
            tax: tax,
            total: total
        };
    }

    getCartCount() {
        return Object.values(this.cart).reduce((count, item) => count + item.quantity, 0);
    }

    clearCart() {
        this.cart = {};
        this.saveCart();
    }

    isInCart(productId) {
        return !!this.cart[String(productId)];
    }
}



// Initialize CartManager
const cartManager = new CartManager();

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update Cart Badge
function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = cartManager.getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Format Currency
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Handle Add to Cart Button Click
function handleAddToCart(event) {
    const button = event.target;
    const productId = button.getAttribute('data-product-id');
    
    if (!productId) {
        console.error('Product ID not found');
        return;
    }

    const product = PRODUCTS[productId];
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    const success = cartManager.addToCart(productId, 1);
    
    if (success) {
        showToast(`${product.name} added to cart!`, 'success');
        updateCartBadge();
        
        button.textContent = 'Added!';
        button.style.backgroundColor = '#3DB864';
        
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.style.backgroundColor = '';
        }, 1000);
    } else {
        showToast('Failed to add product to cart', 'error');
    }
}

// Handle Go to Cart Button Click
function handleGoToCart() {
    const cartCount = cartManager.getCartCount();
    
    if (cartCount === 0) {
        showToast('Your cart is empty. Add some products first!', 'error');
        return;
    }
    
    window.location.href = 'cart.html';
}

// Initialize Product Page
function initializeProductPage() {
    updateCartBadge();

    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', handleAddToCart);
    });

    const goToCartBtn = document.getElementById('goToCartBtn');
    if (goToCartBtn) {
        goToCartBtn.addEventListener('click', handleGoToCart);
    }
}



// Render Cart Items
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartContent = document.getElementById('cartContent');
    
    if (!cartItemsContainer) return;

    const items = cartManager.getCartItems();

    if (items.length === 0) {
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }

    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';

    cartItemsContainer.innerHTML = items.map(item => `
        <div class="cart-item" data-product-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">${formatCurrency(item.price)} each</p>
                <div class="quantity-controls">
                    <button class="quantity-btn decrease-btn" data-product-id="${item.id}" aria-label="Decrease quantity">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-product-id="${item.id}" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <span class="cart-item-total">${formatCurrency(item.price * item.quantity)}</span>
                <button class="remove-btn" data-product-id="${item.id}">Remove</button>
            </div>
        </div>
    `).join('');

    attachCartEventListeners();
    updateCartSummary();
}

// Update Cart Summary
function updateCartSummary() {
    const totals = cartManager.getCartTotal();
    
    const subtotalElement = document.getElementById('subtotalAmount');
    const taxElement = document.getElementById('taxAmount');
    const totalElement = document.getElementById('totalAmount');

    if (subtotalElement) subtotalElement.textContent = formatCurrency(totals.subtotal);
    if (taxElement) taxElement.textContent = formatCurrency(totals.tax);
    if (totalElement) totalElement.textContent = formatCurrency(totals.total);
}

// Attach Event Listeners for Cart Page
function attachCartEventListeners() {
    const decreaseButtons = document.querySelectorAll('.decrease-btn');
    decreaseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const items = cartManager.getCartItems();
            const item = items.find(i => i.id == productId);
            
            if (item) {
                const newQuantity = item.quantity - 1;
                if (newQuantity > 0) {
                    cartManager.updateQuantity(productId, newQuantity);
                    renderCartItems();
                } else {
                    cartManager.removeFromCart(productId);
                    renderCartItems();
                    showToast('Item removed from cart', 'success');
                }
            }
        });
    });

    const increaseButtons = document.querySelectorAll('.increase-btn');
    increaseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const items = cartManager.getCartItems();
            const item = items.find(i => i.id == productId);
            
            if (item) {
                cartManager.updateQuantity(productId, item.quantity + 1);
                renderCartItems();
            }
        });
    });

    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            const product = PRODUCTS[productId];
            
            if (cartManager.removeFromCart(productId)) {
                showToast(`${product.name} removed from cart`, 'success');
                renderCartItems();
            }
        });
    });
}

// Initialize Cart Page
function initializeCartPage() {
    renderCartItems();

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            showToast('Checkout functionality coming soon!', 'success');
        });
    }
}

// Page Initialization
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('cart.html')) {
        initializeCartPage();
    } else {
        initializeProductPage();
    }
});

