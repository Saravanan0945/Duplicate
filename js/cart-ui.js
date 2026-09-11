/**
 * Cart UI Module
 * Handles all UI updates for the shopping cart
 */

/**
 * Update cart badge with item count
 * @param {number} count - Number of items in cart
 */
function updateCartBadge(count) {
  const badge = document.getElementById('cart-count');
  if (!badge) {
    console.warn('Cart badge element not found');
    return;
  }

  const validCount = Math.max(0, parseInt(count) || 0);
  badge.textContent = validCount;
  badge.style.display = validCount > 0 ? 'flex' : 'none';
  
  if (validCount > 99) {
    badge.textContent = '99+';
  }

  badge.classList.add('badge-pulse');
  setTimeout(() => badge.classList.remove('badge-pulse'), 300);
}

/**
 * Render cart items on cart page
 * @param {Array} items - Array of cart items with product details
 */
function renderCartItems(items) {
  const container = document.getElementById('cart-items');
  if (!container) {
    console.warn('Cart items container not found');
    return;
  }

  if (!items || items.length === 0) {
    toggleEmptyCartMessage(true);
    container.innerHTML = '';
    return;
  }

  toggleEmptyCartMessage(false);

  container.innerHTML = items.map(item => `
    <div class="cart-item" data-product-id="${item.id}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-image">
      <div class="cart-item-details">
        <h3 class="cart-item-name">${escapeHtml(item.name)}</h3>
        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
        <div class="quantity-controls">
          <button class="quantity-btn decrease" data-product-id="${item.id}" aria-label="Decrease quantity">
            <i class="fas fa-minus"></i>
          </button>
          <input 
            type="number" 
            class="quantity-input" 
            value="${item.quantity}" 
            min="1" 
            max="${item.stock || 999}"
            data-product-id="${item.id}"
            aria-label="Quantity"
          >
          <button class="quantity-btn increase" data-product-id="${item.id}" aria-label="Increase quantity">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      <div class="cart-item-actions">
        <p class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</p>
        <button class="remove-btn" data-product-id="${item.id}" aria-label="Remove item">
          <i class="fas fa-trash"></i> Remove
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Render product grid on main page
 * @param {Array} products - Array of product objects
 */
function renderProductGrid(products) {
  const container = document.getElementById('product-grid');
  if (!container) {
    console.warn('Product grid container not found');
    return;
  }

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="no-products">No products available</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="product-image">
      <div class="product-info">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="product-footer">
          <span class="product-price">$${product.price.toFixed(2)}</span>
          <button 
            class="add-to-cart-btn" 
            data-product-id="${product.id}"
            ${product.stock === 0 ? 'disabled' : ''}
          >
            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
        ${product.stock < 10 && product.stock > 0 ? `<p class="low-stock">Only ${product.stock} left!</p>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  const container = document.getElementById('notification-container') || createNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  const icon = getNotificationIcon(type);
  notification.innerHTML = `
    <i class="${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  
  container.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Update cart summary totals
 * @param {number} subtotal - Subtotal amount
 * @param {number} tax - Tax amount
 * @param {number} total - Total amount
 */
function updateCartSummary(subtotal, tax, total) {
  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalEl = document.getElementById('total');

  if (subtotalEl) {
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  }

  if (taxEl) {
    taxEl.textContent = `$${tax.toFixed(2)}`;
  }

  if (totalEl) {
    totalEl.textContent = `$${total.toFixed(2)}`;
  }
}

/**
 * Toggle empty cart message visibility
 * @param {boolean} isEmpty - Whether cart is empty
 */
function toggleEmptyCartMessage(isEmpty) {
  const emptyMessage = document.getElementById('empty-cart-message');
  const cartContent = document.getElementById('cart-content');
  const cartSummary = document.getElementById('cart-summary');

  if (emptyMessage) {
    emptyMessage.style.display = isEmpty ? 'block' : 'none';
  }

  if (cartContent) {
    cartContent.style.display = isEmpty ? 'none' : 'block';
  }

  if (cartSummary) {
    cartSummary.style.display = isEmpty ? 'none' : 'block';
  }
}

/**
 * Show loading spinner
 * @param {boolean} show - Whether to show spinner
 */
function showLoadingSpinner(show) {
  let spinner = document.getElementById('loading-spinner');
  
  if (show && !spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(spinner);
  } else if (!show && spinner) {
    spinner.remove();
  }
}

/**
 * Update "Go to Cart" button state
 * @param {boolean} hasItems - Whether cart has items
 */
function updateGoToCartButton(hasItems) {
  const goToCartBtn = document.getElementById('go-to-cart-btn');
  if (!goToCartBtn) {
    return;
  }

  if (hasItems) {
    goToCartBtn.classList.add('has-items');
    goToCartBtn.disabled = false;
  } else {
    goToCartBtn.classList.remove('has-items');
  }
}

// Helper Functions

/**
 * Create notification container if it doesn't exist
 * @returns {HTMLElement} Notification container
 */
function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notification-container';
  container.className = 'notification-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Get icon class for notification type
 * @param {string} type - Notification type
 * @returns {string} Icon class
 */
function getNotificationIcon(type) {
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  return icons[type] || icons.info;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export {
  updateCartBadge,
  renderCartItems,
  renderProductGrid,
  showNotification,
  updateCartSummary,
  toggleEmptyCartMessage,
  showLoadingSpinner,
  updateGoToCartButton
};

