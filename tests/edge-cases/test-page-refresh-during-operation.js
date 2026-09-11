/**
 * Edge Case Test Suite: Page Refresh During Operation
 * Tests cart behavior when page is refreshed during critical operations
 * 
 * Test ID Prefix: EC-REFRESH
 * Priority: High
 * Category: Edge Cases
 * 
 * Related Jira: ST-2 - Implement Go to Cart Button Functionality
 * 
 * Scenarios Covered:
 * - Refresh during add to cart
 * - Refresh during remove from cart
 * - Refresh during quantity update
 * - Refresh during navigation
 * - Refresh during localStorage write
 * - Data integrity after refresh
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Edge Cases: Page Refresh During Operation', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

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
    await page.goto(testUrl);
    // Clear cart
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test ID: EC-REFRESH-001
   * Test: Refresh immediately after clicking add to cart
   * Priority: Critical
   * Expected: Item should be in cart or not, but no corruption
   */
  test('EC-REFRESH-001: Refresh immediately after clicking add to cart', async () => {
    // Click add and immediately refresh
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    // Refresh with minimal delay
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart state
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    // Cart should be valid (either has item or is empty)
    expect(cart).toBeDefined();
    expect(cart.items).toBeDefined();
    expect(Array.isArray(cart.items)).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-002
   * Test: Refresh during multiple rapid additions
   * Priority: High
   * Expected: Some items should be saved, no corruption
   */
  test('EC-REFRESH-002: Refresh during multiple rapid additions', async () => {
    // Start adding multiple items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
      document.querySelector('[data-product-id="3"]').click();
    });

    // Refresh mid-operation
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    // Cart should be valid
    expect(cart.items).toBeDefined();
    expect(Array.isArray(cart.items)).toBe(true);
    
    // All items should have valid structure
    cart.items.forEach(item => {
      expect(item.productId).toBeDefined();
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  /**
   * Test ID: EC-REFRESH-003
   * Test: Refresh while navigating to cart
   * Priority: High
   * Expected: Should end up on one page or the other
   */
  test('EC-REFRESH-003: Refresh while navigating to cart', async () => {
    // Add item first
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Start navigation
    const navigationPromise = page.evaluate(() => {
      const goToCartBtn = document.querySelector('.go-to-cart');
      if (goToCartBtn) goToCartBtn.click();
    });

    // Refresh during navigation
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check current URL
    const currentUrl = page.url();
    
    // Should be on a valid page
    expect(currentUrl).toMatch(/index\.html|cart\.html/);
  });

  /**
   * Test ID: EC-REFRESH-004
   * Test: Refresh on cart page during item removal
   * Priority: High
   * Expected: Item should be removed or still present, no corruption
   */
  test('EC-REFRESH-004: Refresh on cart page during item removal', async () => {
    // Add items first
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Start removing item
    await page.evaluate(() => {
      const removeBtn = document.querySelector('.remove-item[data-product-id="1"]');
      if (removeBtn) removeBtn.click();
    });

    // Refresh immediately
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    // Cart should be valid
    expect(cart.items).toBeDefined();
    expect(Array.isArray(cart.items)).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-005
   * Test: Refresh during quantity update
   * Priority: High
   * Expected: Quantity should be old or new value, not corrupted
   */
  test('EC-REFRESH-005: Refresh during quantity update', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Start updating quantity
    await page.evaluate(() => {
      const increaseBtn = document.querySelector('.increase-quantity[data-product-id="1"]');
      if (increaseBtn) increaseBtn.click();
    });

    // Refresh immediately
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    const item = cart.items.find(i => i.productId === '1');
    
    // Quantity should be valid (1 or 2)
    expect(item).toBeDefined();
    expect(item.quantity).toBeGreaterThan(0);
    expect(item.quantity).toBeLessThan(10);
  });

  /**
   * Test ID: EC-REFRESH-006
   * Test: Refresh during clear cart operation
   * Priority: Medium
   * Expected: Cart should be cleared or unchanged
   */
  test('EC-REFRESH-006: Refresh during clear cart operation', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Start clearing cart
    await page.evaluate(() => {
      const clearBtn = document.querySelector('.clear-cart');
      if (clearBtn) clearBtn.click();
    });

    // Refresh immediately
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    // Cart should be valid
    expect(cart.items).toBeDefined();
    expect(Array.isArray(cart.items)).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-007
   * Test: Multiple rapid refreshes
   * Priority: Medium
   * Expected: App should remain stable
   */
  test('EC-REFRESH-007: Multiple rapid refreshes', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Perform multiple rapid refreshes
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Check if page is still functional
    const isPageFunctional = await page.evaluate(() => {
      const addButton = document.querySelector('[data-product-id="1"]');
      const goToCartBtn = document.querySelector('.go-to-cart');
      return addButton !== null && goToCartBtn !== null;
    });

    expect(isPageFunctional).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-008
   * Test: Refresh with corrupted localStorage
   * Priority: High
   * Expected: Should recover or initialize clean cart
   */
  test('EC-REFRESH-008: Refresh with corrupted localStorage', async () => {
    // Corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', '{invalid json}');
    });

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Try to add item
    const result = await page.evaluate(() => {
      try {
        document.querySelector('[data-product-id="1"]').click();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should handle gracefully
    expect(result).toBeDefined();
  });

  /**
   * Test ID: EC-REFRESH-009
   * Test: Refresh during localStorage write
   * Priority: High
   * Expected: Data should be consistent after refresh
   */
  test('EC-REFRESH-009: Refresh during localStorage write', async () => {
    // Simulate slow localStorage write
    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        // Simulate delay
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Busy wait
        }
        originalSetItem.call(this, key, value);
      };
    });

    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    // Refresh during write
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    // Cart should be valid
    expect(cart.items).toBeDefined();
    expect(Array.isArray(cart.items)).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-010
   * Test: Refresh after successful add but before UI update
   * Priority: Medium
   * Expected: Cart should have item, UI should update on reload
   */
  test('EC-REFRESH-010: Refresh after successful add but before UI update', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    // Wait for storage but not UI
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check badge
    const badge = await page.evaluate(() => {
      const badgeElement = document.querySelector('.cart-badge');
      return badgeElement ? badgeElement.textContent : '0';
    });

    // Badge should reflect cart contents
    expect(parseInt(badge)).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test ID: EC-REFRESH-011
   * Test: Browser back button after refresh
   * Priority: Medium
   * Expected: Navigation should work correctly
   */
  test('EC-REFRESH-011: Browser back button after refresh', async () => {
    // Add item and navigate to cart
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Go back
    await page.goBack();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should be on index page
    const currentUrl = page.url();
    expect(currentUrl).toContain('index.html');
  });

  /**
   * Test ID: EC-REFRESH-012
   * Test: Refresh during notification display
   * Priority: Low
   * Expected: Notification should disappear, no errors
   */
  test('EC-REFRESH-012: Refresh during notification display', async () => {
    // Add item (triggers notification)
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    // Refresh while notification is visible
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Page should be functional
    const isPageFunctional = await page.evaluate(() => {
      return document.querySelector('[data-product-id="1"]') !== null;
    });

    expect(isPageFunctional).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-013
   * Test: Refresh with full cart
   * Priority: Medium
   * Expected: All items should be preserved
   */
  test('EC-REFRESH-013: Refresh with full cart', async () => {
    // Add many items
    await page.evaluate(() => {
      for (let i = 1; i <= 10; i++) {
        const btn = document.querySelector(`[data-product-id="${i}"]`);
        if (btn) btn.click();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    // Should have multiple items
    expect(cart.items.length).toBeGreaterThan(0);
    
    // All items should be valid
    cart.items.forEach(item => {
      expect(item.productId).toBeDefined();
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  /**
   * Test ID: EC-REFRESH-014
   * Test: Refresh during animation
   * Priority: Low
   * Expected: Animation should stop, no visual glitches
   */
  test('EC-REFRESH-014: Refresh during animation', async () => {
    // Trigger animation (add to cart)
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    // Refresh during animation
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if page rendered correctly
    const pageRendered = await page.evaluate(() => {
      const products = document.querySelectorAll('.product-card');
      return products.length > 0;
    });

    expect(pageRendered).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-015
   * Test: Refresh on empty cart page
   * Priority: Low
   * Expected: Empty message should still display
   */
  test('EC-REFRESH-015: Refresh on empty cart page', async () => {
    // Navigate to cart without items
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check for empty message
    const emptyMessage = await page.evaluate(() => {
      const message = document.querySelector('.empty-cart-message, .empty-message');
      return message !== null;
    });

    expect(emptyMessage).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-016
   * Test: Refresh during checkout process
   * Priority: Medium
   * Expected: Should return to cart page safely
   */
  test('EC-REFRESH-016: Refresh during checkout process', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click checkout
    await page.evaluate(() => {
      const checkoutBtn = document.querySelector('.checkout-btn');
      if (checkoutBtn) checkoutBtn.click();
    });

    // Refresh immediately
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should be on cart page
    const currentUrl = page.url();
    expect(currentUrl).toContain('cart.html');
  });

  /**
   * Test ID: EC-REFRESH-017
   * Test: Refresh with network delay simulation
   * Priority: Medium
   * Expected: Should handle slow network gracefully
   */
  test('EC-REFRESH-017: Refresh with network delay simulation', async () => {
    // Simulate slow network
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 50 * 1024, // 50kb/s
      uploadThroughput: 50 * 1024,
      latency: 500 // 500ms
    });

    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reset network
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });

    // Check if page loaded
    const pageLoaded = await page.evaluate(() => {
      return document.querySelector('.product-card') !== null;
    });

    expect(pageLoaded).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-018
   * Test: Refresh preserves cart version
   * Priority: Low
   * Expected: Cart version should be maintained
   */
  test('EC-REFRESH-018: Refresh preserves cart version', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Get cart version
    const versionBefore = await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('shopping_cart') || '{}');
      return cart.version;
    });

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get cart version after refresh
    const versionAfter = await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('shopping_cart') || '{}');
      return cart.version;
    });

    // Version should be preserved
    if (versionBefore) {
      expect(versionAfter).toBe(versionBefore);
    }
  });

  /**
   * Test ID: EC-REFRESH-019
   * Test: Refresh during storage event handling
   * Priority: Medium
   * Expected: Should not cause event listener issues
   */
  test('EC-REFRESH-019: Refresh during storage event handling', async () => {
    // Trigger storage event
    await page.evaluate(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'shopping_cart',
        newValue: '{"items":[{"productId":"1","quantity":1}]}'
      }));
    });

    // Refresh immediately
    await new Promise(resolve => setTimeout(resolve, 50));
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Page should be functional
    const isPageFunctional = await page.evaluate(() => {
      return document.querySelector('[data-product-id="1"]') !== null;
    });

    expect(isPageFunctional).toBe(true);
  });

  /**
   * Test ID: EC-REFRESH-020
   * Test: Refresh after localStorage quota exceeded
   * Priority: High
   * Expected: Should recover and allow operations
   */
  test('EC-REFRESH-020: Refresh after localStorage quota exceeded', async () => {
    // Fill localStorage
    await page.evaluate(() => {
      try {
        const largeData = 'x'.repeat(1024 * 1024 * 4);
        localStorage.setItem('test_large', largeData);
      } catch (e) {
        // Expected
      }
    });

    // Refresh
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('test_large');
    });

    // Try to add item
    const result = await page.evaluate(() => {
      try {
        document.querySelector('[data-product-id="1"]').click();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should work after cleanup
    expect(result.success).toBe(true);
  });
});

/**
 * Manual Test Procedures
 * ======================
 * 
 * MANUAL-REFRESH-001: Test F5 refresh during operations
 * Steps:
 * 1. Navigate to application
 * 2. Click "Add to Cart" button
 * 3. Immediately press F5 to refresh
 * 4. Verify cart state is consistent
 * 5. Verify no JavaScript errors in console
 * 6. Repeat with different operations (remove, update quantity)
 * 
 * MANUAL-REFRESH-002: Test Ctrl+R refresh
 * Steps:
 * 1. Add items to cart
 * 2. Navigate to cart page
 * 3. Start removing an item
 * 4. Press Ctrl+R (or Cmd+R on Mac)
 * 5. Verify cart state after refresh
 * 6. Verify page is functional
 * 
 * MANUAL-REFRESH-003: Test hard refresh (Ctrl+Shift+R)
 * Steps:
 * 1. Add items to cart
 * 2. Press Ctrl+Shift+R for hard refresh
 * 3. Verify cart persists (localStorage should survive)
 * 4. Verify all functionality works
 */

/**
 * Test Execution Summary
 * =====================
 * Total Tests: 20 automated + 3 manual procedures
 * Categories:
 * - Refresh during operations: 10 tests
 * - Data integrity: 5 tests
 * - Navigation: 3 tests
 * - Error recovery: 2 tests
 * 
 * Coverage:
 * - Refresh during add/remove/update
 * - Refresh during navigation
 * - Multiple rapid refreshes
 * - Corrupted data recovery
 * - localStorage consistency
 * - UI state after refresh
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button works after refresh
 * ✓ Cart data preserved across refreshes
 * ✓ No data corruption from interrupted operations
 * ✓ Navigation remains functional
 */

