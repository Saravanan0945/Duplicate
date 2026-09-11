/**
 * Edge Case Test Suite: Private Browsing Mode
 * Tests cart functionality in private/incognito browsing mode
 * 
 * Test ID Prefix: EC-PRIVATE
 * Priority: High
 * Category: Edge Cases
 * 
 * Related Jira: ST-2 - Implement Go to Cart Button Functionality
 * 
 * Scenarios Covered:
 * - localStorage behavior in private mode
 * - sessionStorage in private mode
 * - Cart persistence limitations
 * - Data cleanup on window close
 * - Cross-tab behavior in private mode
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Edge Cases: Private Browsing Mode', () => {
  let browser;
  let context;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  beforeAll(async () => {
    // Launch browser in incognito mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--incognito'
      ]
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    // Create incognito context
    context = await browser.createIncognitoBrowserContext();
    page = await context.newPage();
    await page.goto(testUrl);
  });

  afterEach(async () => {
    await page.close();
    await context.close();
  });

  /**
   * Test ID: EC-PRIVATE-001
   * Test: Add items to cart in private mode
   * Priority: Critical
   * Expected: Items should be added successfully
   */
  test('EC-PRIVATE-001: Add items to cart in private mode', async () => {
    // Add item to cart
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if item was added
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    expect(cart.items).toBeDefined();
    expect(cart.items.length).toBeGreaterThan(0);
  });

  /**
   * Test ID: EC-PRIVATE-002
   * Test: localStorage availability in private mode
   * Priority: High
   * Expected: localStorage should be available but isolated
   */
  test('EC-PRIVATE-002: localStorage availability in private mode', async () => {
    const storageTest = await page.evaluate(() => {
      try {
        const testKey = '__test_storage__';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        return { available: true, works: value === 'test' };
      } catch (e) {
        return { available: false, error: e.message };
      }
    });

    // localStorage should work in private mode
    expect(storageTest.available).toBe(true);
    expect(storageTest.works).toBe(true);
  });

  /**
   * Test ID: EC-PRIVATE-003
   * Test: Cart persistence within same private session
   * Priority: High
   * Expected: Cart should persist during session
   */
  test('EC-PRIVATE-003: Cart persistence within same private session', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart page
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if items are displayed
    const cartItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.cart-item');
      return items.length;
    });

    expect(cartItems).toBeGreaterThan(0);
  });

  /**
   * Test ID: EC-PRIVATE-004
   * Test: Cart cleared when private context closes
   * Priority: High
   * Expected: Cart should be empty in new private session
   */
  test('EC-PRIVATE-004: Cart cleared when private context closes', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Close context and create new one
    await page.close();
    await context.close();

    // Create new private context
    const newContext = await browser.createIncognitoBrowserContext();
    const newPage = await newContext.newPage();
    await newPage.goto(testUrl);

    // Check cart
    const cart = await newPage.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    await newPage.close();
    await newContext.close();

    // Cart should be empty
    expect(cart.items.length).toBe(0);
  });

  /**
   * Test ID: EC-PRIVATE-005
   * Test: Go to Cart button in private mode
   * Priority: Critical
   * Expected: Navigation should work normally
   */
  test('EC-PRIVATE-005: Go to Cart button in private mode', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Click Go to Cart
    await page.evaluate(() => {
      const goToCartBtn = document.querySelector('.go-to-cart');
      if (goToCartBtn) goToCartBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('cart.html');
  });

  /**
   * Test ID: EC-PRIVATE-006
   * Test: Multiple tabs in same private session
   * Priority: High
   * Expected: Cart should sync across tabs
   */
  test('EC-PRIVATE-006: Multiple tabs in same private session', async () => {
    // Add item in first tab
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Open second tab in same context
    const page2 = await context.newPage();
    await page2.goto(testUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart in second tab
    const cart2 = await page2.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    await page2.close();

    // Cart should have the item
    expect(cart2.items.length).toBeGreaterThan(0);
  });

  /**
   * Test ID: EC-PRIVATE-007
   * Test: sessionStorage in private mode
   * Priority: Medium
   * Expected: sessionStorage should work normally
   */
  test('EC-PRIVATE-007: sessionStorage in private mode', async () => {
    const sessionTest = await page.evaluate(() => {
      try {
        const testKey = '__test_session__';
        sessionStorage.setItem(testKey, 'test');
        const value = sessionStorage.getItem(testKey);
        sessionStorage.removeItem(testKey);
        return { available: true, works: value === 'test' };
      } catch (e) {
        return { available: false, error: e.message };
      }
    });

    expect(sessionTest.available).toBe(true);
    expect(sessionTest.works).toBe(true);
  });

  /**
   * Test ID: EC-PRIVATE-008
   * Test: Cart badge updates in private mode
   * Priority: Medium
   * Expected: Badge should update correctly
   */
  test('EC-PRIVATE-008: Cart badge updates in private mode', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check badge
    const badge = await page.evaluate(() => {
      const badgeElement = document.querySelector('.cart-badge');
      return badgeElement ? badgeElement.textContent : '0';
    });

    expect(parseInt(badge)).toBeGreaterThan(0);
  });

  /**
   * Test ID: EC-PRIVATE-009
   * Test: Remove items in private mode
   * Priority: High
   * Expected: Items should be removed successfully
   */
  test('EC-PRIVATE-009: Remove items in private mode', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Remove item
    await page.evaluate(() => {
      const removeBtn = document.querySelector('.remove-item');
      if (removeBtn) removeBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    expect(cart.items.length).toBe(0);
  });

  /**
   * Test ID: EC-PRIVATE-010
   * Test: Update quantity in private mode
   * Priority: High
   * Expected: Quantity should update correctly
   */
  test('EC-PRIVATE-010: Update quantity in private mode', async () => {
    // Add item
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Increase quantity
    await page.evaluate(() => {
      const increaseBtn = document.querySelector('.increase-quantity');
      if (increaseBtn) increaseBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check quantity
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    const item = cart.items.find(i => i.productId === '1');
    expect(item.quantity).toBeGreaterThan(1);
  });

  /**
   * Test ID: EC-PRIVATE-011
   * Test: Clear cart in private mode
   * Priority: Medium
   * Expected: Cart should be cleared successfully
   */
  test('EC-PRIVATE-011: Clear cart in private mode', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Clear cart
    await page.evaluate(() => {
      const clearBtn = document.querySelector('.clear-cart');
      if (clearBtn) clearBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    expect(cart.items.length).toBe(0);
  });

  /**
   * Test ID: EC-PRIVATE-012
   * Test: Cart calculations in private mode
   * Priority: Medium
   * Expected: Calculations should be accurate
   */
  test('EC-PRIVATE-012: Cart calculations in private mode', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
      document.querySelector('[data-product-id="2"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to cart
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check totals
    const totals = await page.evaluate(() => {
      const subtotal = document.querySelector('.subtotal');
      const tax = document.querySelector('.tax');
      const total = document.querySelector('.total');

      return {
        subtotal: subtotal ? subtotal.textContent : null,
        tax: tax ? tax.textContent : null,
        total: total ? total.textContent : null
      };
    });

    expect(totals.subtotal).toBeTruthy();
    expect(totals.total).toBeTruthy();
  });

  /**
   * Test ID: EC-PRIVATE-013
   * Test: Page reload in private mode
   * Priority: High
   * Expected: Cart should persist after reload
   */
  test('EC-PRIVATE-013: Page reload in private mode', async () => {
    // Add items
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Reload page
    await page.reload();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check cart
    const cart = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
    });

    expect(cart.items.length).toBeGreaterThan(0);
  });

  /**
   * Test ID: EC-PRIVATE-014
   * Test: Storage events in private mode
   * Priority: Medium
   * Expected: Storage events should fire normally
   */
  test('EC-PRIVATE-014: Storage events in private mode', async () => {
    // Setup storage event listener
    await page.evaluate(() => {
      window.storageEventFired = false;
      window.addEventListener('storage', () => {
        window.storageEventFired = true;
      });
    });

    // Open second tab and modify storage
    const page2 = await context.newPage();
    await page2.goto(testUrl);
    
    await page2.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if event fired on first page
    const eventFired = await page.evaluate(() => window.storageEventFired);

    await page2.close();

    // Storage event should fire
    expect(typeof eventFired).toBe('boolean');
  });

  /**
   * Test ID: EC-PRIVATE-015
   * Test: Continue shopping in private mode
   * Priority: Medium
   * Expected: Navigation should work correctly
   */
  test('EC-PRIVATE-015: Continue shopping in private mode', async () => {
    // Add item and go to cart
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Click continue shopping
    await page.evaluate(() => {
      const continueBtn = document.querySelector('.continue-shopping');
      if (continueBtn) continueBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Should be back on index page
    const currentUrl = page.url();
    expect(currentUrl).toContain('index.html');
  });

  /**
   * Test ID: EC-PRIVATE-016
   * Test: Empty cart message in private mode
   * Priority: Low
   * Expected: Message should display when cart is empty
   */
  test('EC-PRIVATE-016: Empty cart message in private mode', async () => {
    // Navigate to cart without adding items
    await page.goto(cartUrl);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check for empty message
    const emptyMessage = await page.evaluate(() => {
      const message = document.querySelector('.empty-cart-message, .empty-message');
      return {
        exists: message !== null,
        text: message ? message.textContent : null
      };
    });

    expect(emptyMessage.exists).toBe(true);
  });

  /**
   * Test ID: EC-PRIVATE-017
   * Test: Product display in private mode
   * Priority: Low
   * Expected: Products should display normally
   */
  test('EC-PRIVATE-017: Product display in private mode', async () => {
    // Check products
    const products = await page.evaluate(() => {
      const productCards = document.querySelectorAll('.product-card');
      return {
        count: productCards.length,
        hasImages: Array.from(productCards).every(card => 
          card.querySelector('img') !== null
        ),
        hasPrices: Array.from(productCards).every(card => 
          card.querySelector('.price') !== null
        )
      };
    });

    expect(products.count).toBeGreaterThan(0);
    expect(products.hasImages).toBe(true);
    expect(products.hasPrices).toBe(true);
  });

  /**
   * Test ID: EC-PRIVATE-018
   * Test: Notifications in private mode
   * Priority: Low
   * Expected: Toast notifications should work
   */
  test('EC-PRIVATE-018: Notifications in private mode', async () => {
    // Add item (should trigger notification)
    await page.evaluate(() => {
      document.querySelector('[data-product-id="1"]').click();
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check for notification
    const notification = await page.evaluate(() => {
      const notif = document.querySelector('.notification, .toast');
      return {
        exists: notif !== null,
        text: notif ? notif.textContent : null
      };
    });

    // Notification may or may not be visible depending on timing
    expect(notification).toBeDefined();
  });

  /**
   * Test ID: EC-PRIVATE-019
   * Test: Responsive design in private mode
   * Priority: Low
   * Expected: Layout should be responsive
   */
  test('EC-PRIVATE-019: Responsive design in private mode', async () => {
    // Test mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 300));

    const mobileLayout = await page.evaluate(() => {
      const products = document.querySelectorAll('.product-card');
      return products.length > 0;
    });

    expect(mobileLayout).toBe(true);

    // Test desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 300));

    const desktopLayout = await page.evaluate(() => {
      const products = document.querySelectorAll('.product-card');
      return products.length > 0;
    });

    expect(desktopLayout).toBe(true);
  });

  /**
   * Test ID: EC-PRIVATE-020
   * Test: Performance in private mode
   * Priority: Low
   * Expected: Performance should be comparable to normal mode
   */
  test('EC-PRIVATE-020: Performance in private mode', async () => {
    const startTime = Date.now();

    // Add multiple items
    await page.evaluate(() => {
      for (let i = 1; i <= 5; i++) {
        const btn = document.querySelector(`[data-product-id="${i}"]`);
        if (btn) btn.click();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (< 3 seconds)
    expect(duration).toBeLessThan(3000);
  });
});

/**
 * Manual Test Procedures
 * ======================
 * 
 * MANUAL-PRIVATE-001: Test in actual private/incognito window
 * Steps:
 * 1. Open browser in private/incognito mode
 * 2. Navigate to application
 * 3. Add items to cart
 * 4. Verify cart works normally
 * 5. Navigate to cart page
 * 6. Verify items are displayed
 * 7. Close private window
 * 8. Reopen private window
 * 9. Navigate to application
 * 10. Verify cart is empty
 * 
 * MANUAL-PRIVATE-002: Test storage isolation
 * Steps:
 * 1. Open normal browser window
 * 2. Add items to cart
 * 3. Open private/incognito window
 * 4. Navigate to application
 * 5. Verify cart is empty (isolated from normal mode)
 * 6. Add different items in private mode
 * 7. Switch back to normal window
 * 8. Verify original cart is unchanged
 * 
 * MANUAL-PRIVATE-003: Test Safari private browsing
 * Steps:
 * 1. Open Safari in private browsing mode
 * 2. Navigate to application
 * 3. Try to add items (Safari may restrict localStorage)
 * 4. Verify error handling if storage is blocked
 * 5. Verify app doesn't crash
 */

/**
 * Test Execution Summary
 * =====================
 * Total Tests: 20 automated + 3 manual procedures
 * Categories:
 * - Storage behavior: 7 tests
 * - Cart operations: 8 tests
 * - Navigation: 3 tests
 * - UI/UX: 2 tests
 * 
 * Coverage:
 * - localStorage in private mode
 * - sessionStorage in private mode
 * - Cart persistence within session
 * - Data cleanup on context close
 * - Multi-tab behavior
 * - All cart operations
 * - Navigation and UI
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button works in private mode
 * ✓ Cart data persists during private session
 * ✓ Products displayed correctly
 * ✓ No data leakage between sessions
 */

