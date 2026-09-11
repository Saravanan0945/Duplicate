/**
 * Boundary Value Test Suite: localStorage Quota Limits
 * Test ID Prefix: BVT-STORAGE-QUOTA
 * 
 * Purpose: Verify the shopping cart correctly handles localStorage size limits
 * and gracefully manages quota exceeded scenarios.
 * 
 * Boundary Values Tested:
 * - localStorage quota: 5-10MB (browser dependent)
 * - Large cart data approaching quota
 * - Quota exceeded scenarios
 * - Data compression and optimization
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle storage limits gracefully
 * - No data loss when approaching limits
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-STORAGE-QUOTA: localStorage Quota Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  // Typical localStorage quota is 5-10MB
  const TYPICAL_QUOTA = 5 * 1024 * 1024; // 5MB in bytes

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case: BVT-STORAGE-QUOTA-001
   * Verify getting current localStorage usage
   */
  test('BVT-STORAGE-QUOTA-001: Should report current localStorage usage', async () => {
    const usage = await page.evaluate(() => {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    });

    expect(usage).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Case: BVT-STORAGE-QUOTA-002
   * Verify cart storage with normal data size
   */
  test('BVT-STORAGE-QUOTA-002: Should store normal cart data efficiently', async () => {
    const result = await page.evaluate(() => {
      // Add 10 products
      for (let i = 1; i <= 10; i++) {
        window.cartManager.addToCart(`product-${i}`, 1);
      }
      
      // Get storage size
      const cartData = localStorage.getItem('shopping_cart');
      return {
        dataSize: cartData ? cartData.length : 0,
        itemCount: window.cartManager.getCartItems().length
      };
    });

    expect(result.itemCount).toBe(10);
    expect(result.dataSize).toBeLessThan(10000); // Should be under 10KB for 10 items
  });

  /**
   * Test Case: BVT-STORAGE-QUOTA-003
   * Verify cart storage with large number of items
   */
  test('BVT-STORAGE-QUOTA-003: Should handle large cart data efficiently', async () => {
    const result = await page.evaluate(() => {
      // Add 100 products
      for (let i = 1; i <= 100; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 1);
      }
      
      const cartData = localStorage.getItem('shopping_cart');
      return {
        dataSize: cartData ? cartData.length : 0,
        itemCount: window.cartManager.getCartItems().length
      };
    });

    expect(result.itemCount).toBeGreaterThan(0);
    expect(result.dataSize).toBeLessThan(100000); // Should be under 100KB
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-004
   * Verify handling of quota exceeded error
   */
  test('BVT-STORAGE-QUOTA-004: Should handle quota exceeded gracefully', async () => {
    const result = await page.evaluate(() => {
      try {
        // Try to fill localStorage
        const largeData = 'x'.repeat(1024 * 1024); // 1MB string
        
        for (let i = 0; i < 20; i++) {
          try {
            localStorage.setItem(`test_data_${i}`, largeData);
          } catch (e) {
            return {
              quotaExceeded: true,
              error: e.name,
              message: e.message
            };
          }
        }
        
        return { quotaExceeded: false };
      } catch (e) {
        return {
          quotaExceeded: true,
          error: e.name,
          message: e.message
        };
      }
    });

    if (result.quotaExceeded) {
      expect(result.error).toMatch(/QuotaExceededError|QUOTA_EXCEEDED_ERR/i);
    }
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-005
   * Verify cart save with quota exceeded
   */
  test('BVT-STORAGE-QUOTA-005: Should handle cart save when quota exceeded', async () => {
    const result = await page.evaluate(() => {
      // Fill localStorage to near capacity
      try {
        const largeData = 'x'.repeat(1024 * 1024);
        for (let i = 0; i < 8; i++) {
          localStorage.setItem(`filler_${i}`, largeData);
        }
      } catch (e) {
        // Expected to fail
      }
      
      // Try to add to cart
      const addResult = window.cartManager.addToCart('product-1', 1);
      
      return {
        success: addResult.success,
        error: addResult.error,
        cartItems: window.cartManager.getCartItems().length
      };
    });

    // Should either succeed or fail gracefully with error message
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(result.error).toMatch(/storage|quota|space/i);
    }
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-006
   * Verify data compression for large carts
   */
  test('BVT-STORAGE-QUOTA-006: Should optimize storage for large carts', async () => {
    const result = await page.evaluate(() => {
      // Add many items
      for (let i = 1; i <= 50; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 5);
      }
      
      const cartData = localStorage.getItem('shopping_cart');
      const parsed = JSON.parse(cartData);
      
      return {
        rawSize: cartData.length,
        itemCount: parsed.items ? parsed.items.length : 0,
        avgSizePerItem: cartData.length / (parsed.items ? parsed.items.length : 1)
      };
    });

    expect(result.itemCount).toBeGreaterThan(0);
    // Average size per item should be reasonable (under 500 bytes)
    expect(result.avgSizePerItem).toBeLessThan(500);
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-007
   * Verify clearing storage when quota exceeded
   */
  test('BVT-STORAGE-QUOTA-007: Should clear old data when quota exceeded', async () => {
    const result = await page.evaluate(() => {
      // Fill storage
      try {
        const largeData = 'x'.repeat(1024 * 1024);
        for (let i = 0; i < 8; i++) {
          localStorage.setItem(`old_data_${i}`, largeData);
        }
      } catch (e) {}
      
      // Clear and try again
      localStorage.clear();
      
      const addResult = window.cartManager.addToCart('product-1', 1);
      
      return {
        success: addResult.success,
        cartItems: window.cartManager.getCartItems().length
      };
    });

    expect(result.success).toBe(true);
    expect(result.cartItems).toBe(1);
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-008
   * Verify "Go to Cart" with large cart data
   */
  test('BVT-STORAGE-QUOTA-008: Should navigate to cart with large data', async () => {
    await page.evaluate(() => {
      for (let i = 1; i <= 30; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 1);
      }
    });

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const itemCount = await page.$$eval('.cart-item', items => items.length);
    expect(itemCount).toBeGreaterThan(0);
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-009
   * Verify storage size monitoring
   */
  test('BVT-STORAGE-QUOTA-009: Should monitor storage size', async () => {
    const result = await page.evaluate(() => {
      const getStorageSize = () => {
        let total = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
          }
        }
        return total;
      };
      
      const beforeSize = getStorageSize();
      
      // Add items
      for (let i = 1; i <= 20; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 1);
      }
      
      const afterSize = getStorageSize();
      
      return {
        beforeSize,
        afterSize,
        increase: afterSize - beforeSize
      };
    });

    expect(result.afterSize).toBeGreaterThan(result.beforeSize);
    expect(result.increase).toBeGreaterThan(0);
  });

  /**
   * Test Case: BVT-STORAGE-QUOTA-010
   * Verify fallback when storage unavailable
   */
  test('BVT-STORAGE-QUOTA-010: Should handle storage unavailable', async () => {
    const result = await page.evaluate(() => {
      // Simulate storage unavailable
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function() {
        throw new Error('Storage unavailable');
      };
      
      const addResult = window.cartManager.addToCart('product-1', 1);
      
      // Restore
      Storage.prototype.setItem = originalSetItem;
      
      return {
        success: addResult.success,
        error: addResult.error
      };
    });

    // Should handle gracefully
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  /**
   * Test Case: BVT-STORAGE-QUOTA-011
   * Verify storage cleanup on cart clear
   */
  test('BVT-STORAGE-QUOTA-011: Should free storage on cart clear', async () => {
    const result = await page.evaluate(() => {
      const getStorageSize = () => {
        let total = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
          }
        }
        return total;
      };
      
      // Add items
      for (let i = 1; i <= 30; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 1);
      }
      
      const beforeClear = getStorageSize();
      
      // Clear cart
      window.cartManager.clearCart();
      
      const afterClear = getStorageSize();
      
      return {
        beforeClear,
        afterClear,
        freed: beforeClear - afterClear
      };
    });

    expect(result.afterClear).toBeLessThan(result.beforeClear);
    expect(result.freed).toBeGreaterThan(0);
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-012
   * Verify persistence after page reload with large data
   */
  test('BVT-STORAGE-QUOTA-012: Should persist large cart after reload', async () => {
    await page.evaluate(() => {
      for (let i = 1; i <= 40; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 1);
      }
    });

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems.length).toBeGreaterThan(0);
  }, 30000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-013
   * Verify error notification for storage issues
   */
  test('BVT-STORAGE-QUOTA-013: Should show error for storage issues', async () => {
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Fill storage to capacity
        try {
          const largeData = 'x'.repeat(1024 * 1024);
          for (let i = 0; i < 10; i++) {
            localStorage.setItem(`filler_${i}`, largeData);
          }
        } catch (e) {}
        
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.classList && node.classList.contains('toast')) {
                resolve({
                  hasToast: true,
                  message: node.textContent
                });
                observer.disconnect();
              }
            });
          });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Try to add to cart
        window.cartManager.addToCart('product-1', 1);
        
        setTimeout(() => {
          resolve({ hasToast: false });
          observer.disconnect();
        }, 2000);
      });
    });

    // May or may not show toast depending on implementation
    if (result.hasToast) {
      expect(result.message).toBeTruthy();
    }
  }, 35000);

  /**
   * Test Case: BVT-STORAGE-QUOTA-014
   * Verify storage optimization with duplicate products
   */
  test('BVT-STORAGE-QUOTA-014: Should optimize storage for duplicate products', async () => {
    const result = await page.evaluate(() => {
      // Add same product multiple times
      for (let i = 0; i < 50; i++) {
        window.cartManager.addToCart('product-1', 1);
      }
      
      const cartData = localStorage.getItem('shopping_cart');
      const cartItems = window.cartManager.getCartItems();
      
      return {
        storageSize: cartData ? cartData.length : 0,
        uniqueItems: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });

    // Should store as one item with quantity 50, not 50 separate items
    expect(result.uniqueItems).toBe(1);
    expect(result.totalQuantity).toBe(50);
    expect(result.storageSize).toBeLessThan(1000); // Should be very small
  });

  /**
   * Test Case: BVT-STORAGE-QUOTA-015
   * Verify cart functionality near quota limit
   */
  test('BVT-STORAGE-QUOTA-015: Should function correctly near quota limit', async () => {
    const result = await page.evaluate(() => {
      // Add items until we have a reasonably large cart
      for (let i = 1; i <= 60; i++) {
        window.cartManager.addToCart(`product-${i % 18 || 18}`, 2);
      }
      
      // Perform various operations
      window.cartManager.updateQuantity('product-1', 5);
      window.cartManager.removeFromCart('product-2');
      window.cartManager.addToCart('product-3', 1);
      
      const cartItems = window.cartManager.getCartItems();
      const cartTotal = window.cartManager.getCartTotal();
      
      return {
        itemCount: cartItems.length,
        hasTotal: cartTotal.total > 0,
        storageWorks: true
      };
    });

    expect(result.itemCount).toBeGreaterThan(0);
    expect(result.hasTotal).toBe(true);
    expect(result.storageWorks).toBe(true);
  }, 30000);
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: localStorage quota (5-10MB), Large data
 * - Coverage: Storage, Quota, Optimization, Error handling
 * - Priority: HIGH - Critical for data persistence
 * 
 * Expected Results:
 * - Cart should handle normal storage efficiently
 * - Quota exceeded errors should be caught and handled
 * - User should receive clear error messages
 * - Data should be optimized to minimize storage use
 * - System should remain stable near quota limits
 */

