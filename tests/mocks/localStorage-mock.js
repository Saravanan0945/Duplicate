/**
 * localStorage Mock for Testing
 * 
 * Provides a complete mock implementation of the Web Storage API
 * for use in Jest tests and other testing environments.
 * 
 * Features:
 * - Full localStorage API compatibility
 * - Storage quota simulation (5MB default)
 * - Error simulation (quota exceeded, access denied)
 * - Event simulation (storage events)
 * - State inspection and manipulation
 * - Clear and reset functionality
 * 
 * Usage:
 *   import { createLocalStorageMock } from './localStorage-mock.js';
 *   global.localStorage = createLocalStorageMock();
 */

class LocalStorageMock {
  constructor(quota = 5 * 1024 * 1024) { // 5MB default
    this.store = {};
    this.quota = quota;
    this.length = 0;
    this.simulateQuotaExceeded = false;
    this.simulateAccessDenied = false;
    this.eventListeners = [];
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @returns {string|null} - Stored value or null
   */
  getItem(key) {
    if (this.simulateAccessDenied) {
      throw new Error('Access denied');
    }
    return this.store[key] || null;
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   * @throws {Error} - If quota exceeded or access denied
   */
  setItem(key, value) {
    if (this.simulateAccessDenied) {
      throw new Error('Access denied');
    }

    const stringValue = String(value);
    const currentSize = this._calculateSize();
    const newItemSize = key.length + stringValue.length;
    const existingItemSize = this.store[key] ? key.length + this.store[key].length : 0;
    const sizeAfterUpdate = currentSize - existingItemSize + newItemSize;

    if (this.simulateQuotaExceeded || sizeAfterUpdate > this.quota) {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    }

    const oldValue = this.store[key];
    this.store[key] = stringValue;
    
    if (!oldValue) {
      this.length++;
    }

    // Simulate storage event
    this._triggerStorageEvent(key, oldValue, stringValue);
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    if (this.simulateAccessDenied) {
      throw new Error('Access denied');
    }

    if (this.store[key]) {
      const oldValue = this.store[key];
      delete this.store[key];
      this.length--;
      this._triggerStorageEvent(key, oldValue, null);
    }
  }

  /**
   * Clear all items from storage
   */
  clear() {
    if (this.simulateAccessDenied) {
      throw new Error('Access denied');
    }

    this.store = {};
    this.length = 0;
    this._triggerStorageEvent(null, null, null);
  }

  /**
   * Get key at index
   * @param {number} index - Index
   * @returns {string|null} - Key at index or null
   */
  key(index) {
    if (this.simulateAccessDenied) {
      throw new Error('Access denied');
    }

    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  /**
   * Calculate current storage size in bytes
   * @private
   * @returns {number} - Size in bytes
   */
  _calculateSize() {
    let size = 0;
    for (const key in this.store) {
      if (this.store.hasOwnProperty(key)) {
        size += key.length + this.store[key].length;
      }
    }
    return size;
  }

  /**
   * Get current storage size
   * @returns {number} - Size in bytes
   */
  getSize() {
    return this._calculateSize();
  }

  /**
   * Get remaining storage quota
   * @returns {number} - Remaining bytes
   */
  getRemainingQuota() {
    return this.quota - this._calculateSize();
  }

  /**
   * Trigger storage event
   * @private
   * @param {string} key - Storage key
   * @param {string} oldValue - Old value
   * @param {string} newValue - New value
   */
  _triggerStorageEvent(key, oldValue, newValue) {
    const event = {
      key,
      oldValue,
      newValue,
      url: 'http://localhost',
      storageArea: this
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in storage event listener:', error);
      }
    });
  }

  /**
   * Add storage event listener
   * @param {Function} listener - Event listener function
   */
  addEventListener(listener) {
    this.eventListeners.push(listener);
  }

  /**
   * Remove storage event listener
   * @param {Function} listener - Event listener function
   */
  removeEventListener(listener) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Enable quota exceeded simulation
   */
  enableQuotaExceededError() {
    this.simulateQuotaExceeded = true;
  }

  /**
   * Disable quota exceeded simulation
   */
  disableQuotaExceededError() {
    this.simulateQuotaExceeded = false;
  }

  /**
   * Enable access denied simulation
   */
  enableAccessDeniedError() {
    this.simulateAccessDenied = true;
  }

  /**
   * Disable access denied simulation
   */
  disableAccessDeniedError() {
    this.simulateAccessDenied = false;
  }

  /**
   * Set storage quota
   * @param {number} quota - Quota in bytes
   */
  setQuota(quota) {
    this.quota = quota;
  }

  /**
   * Get all stored data
   * @returns {Object} - All stored key-value pairs
   */
  getAllData() {
    return { ...this.store };
  }

  /**
   * Set all stored data (for test setup)
   * @param {Object} data - Data to set
   */
  setAllData(data) {
    this.clear();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        this.setItem(key, data[key]);
      }
    }
  }

  /**
   * Reset mock to initial state
   */
  reset() {
    this.store = {};
    this.length = 0;
    this.simulateQuotaExceeded = false;
    this.simulateAccessDenied = false;
    this.eventListeners = [];
  }

  /**
   * Corrupt specific key (for testing error handling)
   * @param {string} key - Key to corrupt
   */
  corruptKey(key) {
    if (this.store[key]) {
      this.store[key] = '{invalid json}';
    }
  }

  /**
   * Simulate storage full condition
   */
  fillStorage() {
    const largeData = 'x'.repeat(this.quota - 100);
    this.setItem('__filler__', largeData);
  }

  /**
   * Check if storage is available
   * @returns {boolean} - True if available
   */
  isAvailable() {
    return !this.simulateAccessDenied;
  }
}

/**
 * Create a new localStorage mock instance
 * @param {number} quota - Storage quota in bytes (default: 5MB)
 * @returns {LocalStorageMock} - Mock instance
 */
function createLocalStorageMock(quota = 5 * 1024 * 1024) {
  return new LocalStorageMock(quota);
}

/**
 * Setup localStorage mock for Jest
 * @param {number} quota - Storage quota in bytes
 */
function setupLocalStorageMock(quota) {
  const mock = createLocalStorageMock(quota);
  global.localStorage = mock;
  return mock;
}

/**
 * Restore original localStorage
 */
function restoreLocalStorage() {
  if (global.localStorage && global.localStorage.reset) {
    global.localStorage.reset();
  }
}

/**
 * Create localStorage mock with predefined cart data
 * @param {Object} cartData - Cart data to preload
 * @returns {LocalStorageMock} - Mock instance with data
 */
function createLocalStorageMockWithCart(cartData) {
  const mock = createLocalStorageMock();
  mock.setItem('shopping_cart', JSON.stringify(cartData));
  return mock;
}

/**
 * Simulate localStorage quota exceeded scenario
 * @returns {LocalStorageMock} - Mock instance with quota exceeded
 */
function createQuotaExceededMock() {
  const mock = createLocalStorageMock(100); // Very small quota
  mock.fillStorage();
  return mock;
}

/**
 * Simulate localStorage access denied scenario
 * @returns {LocalStorageMock} - Mock instance with access denied
 */
function createAccessDeniedMock() {
  const mock = createLocalStorageMock();
  mock.enableAccessDeniedError();
  return mock;
}

/**
 * Simulate corrupted localStorage data
 * @returns {LocalStorageMock} - Mock instance with corrupted data
 */
function createCorruptedStorageMock() {
  const mock = createLocalStorageMock();
  mock.setItem('shopping_cart', '{invalid json}');
  return mock;
}

// Export for CommonJS (Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LocalStorageMock,
    createLocalStorageMock,
    setupLocalStorageMock,
    restoreLocalStorage,
    createLocalStorageMockWithCart,
    createQuotaExceededMock,
    createAccessDeniedMock,
    createCorruptedStorageMock
  };
}

// Export for ES6 modules
export {
  LocalStorageMock,
  createLocalStorageMock,
  setupLocalStorageMock,
  restoreLocalStorage,
  createLocalStorageMockWithCart,
  createQuotaExceededMock,
  createAccessDeniedMock,
  createCorruptedStorageMock
};

