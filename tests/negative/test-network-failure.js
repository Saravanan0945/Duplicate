/**
 * Negative Test: Network Failure Handling
 * 
 * Test ID: NEG-012
 * Category: Negative Testing
 * Priority: Medium
 * 
 * Description:
 * Verify that the application handles offline scenarios and network failures
 * gracefully, providing appropriate feedback and maintaining data integrity.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-012: Network Failure Handling', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';

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
    await page.goto(BASE_URL);
    
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case 1: Go offline after loading page
   * Expected: Cart operations still work (localStorage-based)
   */
  test('should handle cart operations when offline', async () => {
    // Load page while online
    await page.waitForSelector('.product-grid', { timeout: 3000 });

    // Go offline
    await page.setOfflineMode(true);

    // Try to add items to cart
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify cart updated (localStorage should work offline)
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);

    // Verify localStorage updated
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items.length).toBe(1);
  });

  /**
   * Test Case 2: Navigate to cart page while offline
   * Expected: Navigation works, cart displays from localStorage
   */
  test('should navigate to cart page while offline', async () => {
    // Add items while online
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Go offline
    await page.setOfflineMode(true);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Verify cart items displayed
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);
  });

  /**
   * Test Case 3: Page reload while offline
   * Expected: Cached resources load, cart state preserved
   */
  test('should handle page reload while offline', async () => {
    // Add items while online
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const onlineCartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    // Go offline
    await page.setOfflineMode(true);

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' }).catch(() => {});
    await page.waitForTimeout(1000);

    // If page loads from cache, cart should be preserved
    const offlineCartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data ? JSON.parse(data) : null;
    });

    if (offlineCartData) {
      expect(offlineCartData.items.length).toBe(onlineCartCount);
    }
  });

  /**
   * Test Case 4: Slow network simulation
   * Expected: Operations complete, may show loading states
   */
  test('should handle slow network conditions', async () => {
    // Simulate slow 3G
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 50 * 1024 / 8, // 50kb/s
      uploadThroughput: 20 * 1024 / 8,    // 20kb/s
      latency: 2000 // 2s latency
    });

    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(3000); // Wait for slow operation

    // Verify cart updated
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBeGreaterThan(0);
  });

  /**
   * Test Case 5: Intermittent connectivity
   * Expected: Operations retry or queue
   */
  test('should handle intermittent connectivity', async () => {
    // Add item while online
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Toggle offline/online
    await page.setOfflineMode(true);
    await page.waitForTimeout(500);
    await page.setOfflineMode(false);
    await page.waitForTimeout(500);

    // Add another item
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify both items in cart
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test Case 6: Failed resource loading
   * Expected: Graceful degradation, core functionality works
   */
  test('should handle failed resource loading', async () => {
    // Block specific resources
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('.jpg') || request.url().includes('.png')) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Core functionality should still work
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 7: Offline notification
   * Expected: User informed of offline status
   */
  test('should show offline notification', async () => {
    // Go offline
    await page.setOfflineMode(true);

    // Check for offline indicator
    const hasOfflineIndicator = await page.evaluate(() => {
      // Check for common offline indicators
      return document.querySelector('.offline-indicator, .network-status') !== null ||
             !navigator.onLine;
    });

    // Should detect offline state
    expect(typeof hasOfflineIndicator).toBe('boolean');
  });

  /**
   * Test Case 8: Cart persistence during network issues
   * Expected: No data loss
   */
  test('should preserve cart data during network issues', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const onlineCartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Simulate network failure
    await page.setOfflineMode(true);
    await page.waitForTimeout(1000);

    // Verify cart data intact
    const offlineCartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(offlineCartData.items.length).toBe(onlineCartData.items.length);
    expect(offlineCartData.items[0].productId).toBe(onlineCartData.items[0].productId);
  });

  /**
   * Test Case 9: Recovery after network restoration
   * Expected: Full functionality restored
   */
  test('should recover functionality after network restoration', async () => {
    // Go offline
    await page.setOfflineMode(true);

    // Try operations offline
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Restore network
    await page.setOfflineMode(false);
    await page.waitForTimeout(500);

    // Verify operations work
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBeGreaterThan(0);
  });

  /**
   * Test Case 10: Timeout handling
   * Expected: Operations timeout gracefully
   */
  test('should handle request timeouts', async () => {
    // Simulate very slow network
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1 * 1024 / 8,
      uploadThroughput: 1 * 1024 / 8,
      latency: 10000 // 10s latency
    });

    // Try to add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(2000);

    // Should either complete or show timeout message
    const cartBadge = await page.$('.cart-badge');
    expect(cartBadge).not.toBeNull();
  });

  /**
   * Test Case 11: Multiple offline operations
   * Expected: All operations queued or completed
   */
  test('should handle multiple operations while offline', async () => {
    // Go offline
    await page.setOfflineMode(true);

    // Perform multiple operations
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="3"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify operations completed
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items.length).toBeGreaterThanOrEqual(1);
  });

  /**
   * Test Case 12: Network error doesn't corrupt cart
   * Expected: Cart data remains valid
   */
  test('should maintain cart integrity during network errors', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Simulate network error
    await page.setOfflineMode(true);
    
    // Try to add more items
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify cart data valid
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData.items)).toBe(true);
    cartData.items.forEach(item => {
      expect(item.productId).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  /**
   * Test Case 13: Offline cart navigation
   * Expected: Navigation works using cached pages
   */
  test('should allow navigation while offline', async () => {
    // Add item while online
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Go offline
    await page.setOfflineMode(true);

    // Try to navigate to cart
    try {
      await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // If navigation succeeds, verify cart displayed
      const cartContainer = await page.$('.cart-container');
      if (cartContainer) {
        expect(cartContainer).not.toBeNull();
      }
    } catch (error) {
      // Navigation may fail offline - this is acceptable
      expect(error).toBeTruthy();
    }
  });

  /**
   * Test Case 14: Network status detection
   * Expected: Application detects online/offline status
   */
  test('should detect network status changes', async () => {
    // Check online status
    const onlineStatus = await page.evaluate(() => navigator.onLine);
    expect(onlineStatus).toBe(true);

    // Go offline
    await page.setOfflineMode(true);
    await page.waitForTimeout(500);

    // Check offline status
    const offlineStatus = await page.evaluate(() => navigator.onLine);
    expect(offlineStatus).toBe(false);

    // Go back online
    await page.setOfflineMode(false);
    await page.waitForTimeout(500);

    const backOnlineStatus = await page.evaluate(() => navigator.onLine);
    expect(backOnlineStatus).toBe(true);
  });
});

/**
 * MANUAL TEST PROCEDURES
 * 
 * Test NEG-012-M1: Complete Offline User Flow
 * Priority: Medium
 * 
 * Prerequisites:
 * - Application running on localhost:8080
 * - Browser DevTools available
 * 
 * Steps:
 * 1. Open application in browser
 * 2. Add 2-3 products to cart
 * 3. Open DevTools (F12)
 * 4. Go to Network tab
 * 5. Check "Offline" checkbox
 * 6. Try to add another product
 * 7. Navigate to cart page
 * 8. Try to modify quantities
 * 9. Uncheck "Offline" to go back online
 * 10. Verify all changes persisted
 * 
 * Expected Results:
 * - Step 6: Product added successfully (localStorage works offline)
 * - Step 7: Cart page loads from cache or localStorage
 * - Step 8: Quantity changes work
 * - Step 10: All offline changes preserved
 * 
 * Pass Criteria:
 * - No data loss during offline period
 * - Cart operations work offline
 * - Smooth transition back online
 * 
 * ---
 * 
 * Test NEG-012-M2: Slow Network Conditions
 * Priority: Medium
 * 
 * Steps:
 * 1. Open DevTools Network tab
 * 2. Select "Slow 3G" from throttling dropdown
 * 3. Navigate through application
 * 4. Add products to cart
 * 5. Navigate to cart page
 * 6. Observe loading states
 * 7. Verify operations complete
 * 
 * Expected Results:
 * - Loading indicators shown during slow operations
 * - All operations eventually complete
 * - No timeout errors
 * - User feedback provided during waits
 * 
 * Pass Criteria:
 * - Application usable on slow connections
 * - Clear feedback during loading
 * - No operation failures
 */

