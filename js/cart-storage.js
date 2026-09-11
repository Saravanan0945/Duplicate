/**
 * Cart Storage Module
 * Handles localStorage operations for shopping cart data
 */

const CART_STORAGE_KEY = 'shopping_cart';
const STORAGE_VERSION = '1.0';

/**
 * Save cart data to localStorage
 * @param {Object} cartData - Cart data to save
 * @returns {boolean} Success status
 */
function saveCart(cartData) {
  try {
    if (!cartData || typeof cartData !== 'object') {
      console.error('Invalid cart data provided');
      return false;
    }

    const dataToSave = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      cart: cartData
    };

    const serialized = JSON.stringify(dataToSave);
    localStorage.setItem(CART_STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded. Clearing old data...');
      try {
        clearStorage();
        const dataToSave = {
          version: STORAGE_VERSION,
          timestamp: Date.now(),
          cart: cartData
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToSave));
        return true;
      } catch (retryError) {
        console.error('Failed to save cart after clearing storage:', retryError);
        return false;
      }
    }
    console.error('Error saving cart to localStorage:', error);
    return false;
  }
}

/**
 * Load cart data from localStorage
 * @returns {Object|null} Cart data or null if not found/invalid
 */
function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    
    if (!parsed || !parsed.cart) {
      console.warn('Invalid cart data structure');
      clearStorage();
      return null;
    }

    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Cart data version mismatch. Clearing old data.');
      clearStorage();
      return null;
    }

    const dayInMs = 24 * 60 * 60 * 1000;
    if (parsed.timestamp && (Date.now() - parsed.timestamp > 7 * dayInMs)) {
      console.warn('Cart data expired (>7 days old). Clearing.');
      clearStorage();
      return null;
    }

    return parsed.cart;
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    clearStorage();
    return null;
  }
}

/**
 * Clear cart data from localStorage
 * @returns {boolean} Success status
 */
function clearStorage() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cart storage:', error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns {boolean} Availability status
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
function getStorageInfo() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return {
      exists: !!stored,
      size: stored ? new Blob([stored]).size : 0,
      timestamp: stored ? JSON.parse(stored).timestamp : null
    };
  } catch (error) {
    return { exists: false, size: 0, timestamp: null };
  }
}

export {
  saveCart,
  loadCart,
  clearStorage,
  isStorageAvailable,
  getStorageInfo
};

