/**
 * Unit Tests for Cart Storage Module
 * Tests: localStorage operations, data validation, error handling
 */

import {
  saveCart,
  loadCart,
  clearStorage,
  isStorageAvailable,
  getStorageInfo
} from '../js/cart-storage.js';

describe('Cart Storage Module - Unit Tests', () => {
  
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // POSITIVE TESTS

  describe('saveCart() - Positive Tests', () => {
    
    test('should save valid cart data to localStorage', () => {
      const cartData = {
        items: [
          { productId: 'prod-001', quantity: 2 },
          { productId: 'prod-002', quantity: 1 }
        ]
      };

      const result = saveCart(cartData);
      
      expect(result).toBe(true);
      expect(localStorage.getItem('shopping_cart')).toBeTruthy();
    });

    test('should include version and timestamp in saved data', () => {
      const cartData = { items: [] };
      saveCart(cartData);

      const stored = JSON.parse(localStorage.getItem('shopping_cart'));
      
      expect(stored.version).toBe('1.0');
      expect(stored.timestamp).toBeDefined();
      expect(typeof stored.timestamp).toBe('number');
    });

    test('should save empty cart', () => {
      const cartData = { items: [] };
      const result = saveCart(cartData);
      
      expect(result).toBe(true);
    });

    test('should overwrite existing cart data', () => {
      const cartData1 = { items: [{ productId: 'prod-001', quantity: 1 }] };
      const cartData2 = { items: [{ productId: 'prod-002', quantity: 2 }] };

      saveCart(cartData1);
      saveCart(cartData2);

      const loaded = loadCart();
      expect(loaded.items[0].productId).toBe('prod-002');
    });
  });

  describe('loadCart() - Positive Tests', () => {
    
    test('should load valid cart data from localStorage', () => {
      const cartData = {
        items: [{ productId: 'prod-001', quantity: 2 }]
      };
      saveCart(cartData);

      const loaded = loadCart();
      
      expect(loaded).toBeTruthy();
      expect(loaded.items.length).toBe(1);
      expect(loaded.items[0].productId).toBe('prod-001');
    });

    test('should return null when no cart data exists', () => {
      const loaded = loadCart();
      expect(loaded).toBeNull();
    });

    test('should load cart with multiple items', () => {
      const cartData = {
        items: [
          { productId: 'prod-001', quantity: 1 },
          { productId: 'prod-002', quantity: 2 },
          { productId: 'prod-003', quantity: 3 }
        ]
      };
      saveCart(cartData);

      const loaded = loadCart();
      expect(loaded.items.length).toBe(3);
    });
  });

  describe('clearStorage() - Positive Tests', () => {
    
    test('should remove cart data from localStorage', () => {
      const cartData = { items: [{ productId: 'prod-001', quantity: 1 }] };
      saveCart(cartData);

      const result = clearStorage();
      
      expect(result).toBe(true);
      expect(localStorage.getItem('shopping_cart')).toBeNull();
    });

    test('should succeed even when no data exists', () => {
      const result = clearStorage();
      expect(result).toBe(true);
    });
  });

  // NEGATIVE TESTS

  describe('saveCart() - Negative Tests', () => {
    
    test('should reject null cart data', () => {
      const result = saveCart(null);
      expect(result).toBe(false);
    });

    test('should reject undefined cart data', () => {
      const result = saveCart(undefined);
      expect(result).toBe(false);
    });

    test('should reject non-object cart data', () => {
      expect(saveCart('string')).toBe(false);
      expect(saveCart(123)).toBe(false);
      expect(saveCart(true)).toBe(false);
    });

    test('should handle storage quota exceeded error', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const cartData = { items: [] };
      const result = saveCart(cartData);

      Storage.prototype.setItem = originalSetItem;
      
      expect(result).toBe(false);
    });
  });

  describe('loadCart() - Negative Tests', () => {
    
    test('should handle corrupted JSON data', () => {
      localStorage.setItem('shopping_cart', '{invalid json}');
      
      const loaded = loadCart();
      
      expect(loaded).toBeNull();
      expect(localStorage.getItem('shopping_cart')).toBeNull();
    });

    test('should reject data with wrong version', () => {
      const invalidData = {
        version: '0.5',
        timestamp: Date.now(),
        cart: { items: [] }
      };
      localStorage.setItem('shopping_cart', JSON.stringify(invalidData));

      const loaded = loadCart();
      
      expect(loaded).toBeNull();
    });

    test('should reject expired data (>7 days old)', () => {
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000);
      const expiredData = {
        version: '1.0',
        timestamp: oldTimestamp,
        cart: { items: [] }
      };
      localStorage.setItem('shopping_cart', JSON.stringify(expiredData));

      const loaded = loadCart();
      
      expect(loaded).toBeNull();
    });

    test('should handle missing cart property', () => {
      const invalidData = {
        version: '1.0',
        timestamp: Date.now()
      };
      localStorage.setItem('shopping_cart', JSON.stringify(invalidData));

      const loaded = loadCart();
      
      expect(loaded).toBeNull();
    });
  });

  // UTILITY FUNCTIONS

  describe('isStorageAvailable()', () => {
    
    test('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    test('should return false when localStorage throws error', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage disabled');
      });

      const result = isStorageAvailable();

      Storage.prototype.setItem = originalSetItem;
      
      expect(result).toBe(false);
    });
  });

  describe('getStorageInfo()', () => {
    
    test('should return info when cart exists', () => {
      const cartData = { items: [{ productId: 'prod-001', quantity: 1 }] };
      saveCart(cartData);

      const info = getStorageInfo();
      
      expect(info.exists).toBe(true);
      expect(info.size).toBeGreaterThan(0);
      expect(info.timestamp).toBeDefined();
    });

    test('should return empty info when no cart exists', () => {
      const info = getStorageInfo();
      
      expect(info.exists).toBe(false);
      expect(info.size).toBe(0);
      expect(info.timestamp).toBeNull();
    });
  });

  // BOUNDARY VALUE TESTS

  describe('Boundary Value Tests', () => {
    
    test('should handle very large cart data', () => {
      const largeCart = {
        items: Array(1000).fill(null).map((_, i) => ({
          productId: `prod-${i}`,
          quantity: 1
        }))
      };

      const result = saveCart(largeCart);
      expect(result).toBe(true);

      const loaded = loadCart();
      expect(loaded.items.length).toBe(1000);
    });

    test('should handle cart with maximum quantity values', () => {
      const cartData = {
        items: [{ productId: 'prod-001', quantity: 999 }]
      };

      saveCart(cartData);
      const loaded = loadCart();
      
      expect(loaded.items[0].quantity).toBe(999);
    });

    test('should handle timestamp at boundary (exactly 7 days)', () => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const boundaryData = {
        version: '1.0',
        timestamp: sevenDaysAgo,
        cart: { items: [] }
      };
      localStorage.setItem('shopping_cart', JSON.stringify(boundaryData));

      const loaded = loadCart();
      
      expect(loaded).toBeTruthy();
    });
  });

  // PERFORMANCE TESTS

  describe('Performance Tests', () => {
    
    test('should save cart data quickly', () => {
      const cartData = {
        items: Array(100).fill(null).map((_, i) => ({
          productId: `prod-${i}`,
          quantity: 1
        }))
      };

      const startTime = performance.now();
      saveCart(cartData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });

    test('should load cart data quickly', () => {
      const cartData = {
        items: Array(100).fill(null).map((_, i) => ({
          productId: `prod-${i}`,
          quantity: 1
        }))
      };
      saveCart(cartData);

      const startTime = performance.now();
      loadCart();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});

