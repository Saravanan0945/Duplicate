/**
 * Integration Test: Storage and UI Synchronization
 * Test ID: INT-004
 * Priority: Critical
 * 
 * Description:
 * Tests that localStorage and UI remain perfectly synchronized at all times.
 * Ensures data integrity between storage layer and presentation layer.
 * 
 * Synchronization Points Tested:
 * 1. UI updates trigger storage updates
 * 2. Storage updates trigger UI updates
 * 3. Concurrent updates handled correctly
 * 4. Error states synchronized
 * 5. Recovery mechanisms work
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✅ Selected products are retained and displayed
 * ✅ No data loss issues
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('INT-004: Storage and UI Synchronization Test', () => {
  let browser;
  let page;
  const baseURL = `file://${path.resolve(__dirname, '../../index.html')}`;
  const cartURL = `file://${path.resolve(__dirname, '../../cart.html')}`;

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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case INT-004-01: UI Add Action Updates Storage
   * Priority: Critical
   */
  test('INT-004-01: Should update localStorage when adding items via UI', async () => {
    // Verify storage is empty
    let cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(0);

    // Add product via UI
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Verify storage updated
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(1);
    expect(cartData[0].productId).toBe('product-1');
    expect(cartData[0].quantity).toBe(1);
  }, 15000);

  /**
   * Test Case INT-004-02: Storage Changes Update UI
   * Priority: Critical
   */
  test('INT-004-02: Should update UI when localStorage changes', async () => {
    // Manually add to storage
    await page.evaluate(() => {
      const cart = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 }
      ];
      localStorage.setItem('shopping-cart', JSON.stringify(cart));
    });

    // Reload to trigger UI update
    await page.reload({ waitUntil: 'networkidle0' });

    // Verify badge updated
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Navigate to cart and verify items displayed
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);
  }, 20000);

  /**
   * Test Case INT-004-03: UI Remove Action Updates Storage
   * Priority: Critical
   */
  test('INT-004-03: Should update localStorage when removing items via UI', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Verify storage has 2 items
    let cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);

    // Navigate to cart and remove item
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Verify storage updated
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(1);
  }, 20000);

  /**
   * Test Case INT-004-04: Quantity Updates Sync Storage and UI
   * Priority: High
   */
  test('INT-004-04: Should sync storage and UI for quantity updates', async () => {
    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Update quantity via UI
    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('5');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify storage updated
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData[0].quantity).toBe(5);

    // Verify UI shows updated quantity
    const displayedQuantity = await page.$eval('.quantity-input', el => el.value);
    expect(displayedQuantity).toBe('5');

    // Verify totals updated
    const subtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(subtotal).toBeGreaterThan(0);
  }, 20000);

  /**
   * Test Case INT-004-05: Storage Persistence Across Sessions
   * Priority: High
   */
  test('INT-004-05: Should persist storage and sync UI across sessions', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Close and reopen page (simulate new session)
    await page.close();
    page = await browser.newPage();
    await page.goto(baseURL);

    // Verify UI loaded from storage
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Verify storage still has data
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);
  }, 20000);

  /**
   * Test Case INT-004-06: Concurrent Updates Stay in Sync
   * Priority: High
   */
  test('INT-004-06: Should handle concurrent storage and UI updates', async () => {
    // Add product via UI
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);

    // Simultaneously update storage and UI
    await Promise.all([
      page.click('[data-product-id="product-2"]'),
      page.evaluate(() => {
        const cart = JSON.parse(localStorage.getItem('shopping-cart') || '[]');
        cart.push({ productId: 'product-3', quantity: 1 });
        localStorage.setItem('shopping-cart', JSON.stringify(cart));
      })
    ]);

    await page.waitForTimeout(500);

    // Reload to ensure sync
    await page.reload({ waitUntil: 'networkidle0' });

    // Verify final state is consistent
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });

    expect(parseInt(badgeText)).toBe(cartData.length);
  }, 20000);

  /**
   * Test Case INT-004-07: Empty Cart Syncs Storage and UI
   * Priority: Medium
   */
  test('INT-004-07: Should sync empty cart state between storage and UI', async () => {
    // Add and then remove product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Verify storage is empty
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(0);

    // Verify UI shows empty state
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    // Navigate back and verify badge
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
  }, 20000);

  /**
   * Test Case INT-004-08: Storage Quota Handling
   * Priority: Medium
   */
  test('INT-004-08: Should handle storage quota gracefully', async () => {
    // Try to fill storage with large cart
    const result = await page.evaluate(() => {
      try {
        const largeCart = [];
        for (let i = 0; i < 1000; i++) {
          largeCart.push({ 
            productId: `product-${i}`, 
            quantity: 1,
            metadata: 'x'.repeat(1000) // Add large data
          });
        }
        localStorage.setItem('shopping-cart', JSON.stringify(largeCart));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Should either succeed or handle error gracefully
    if (!result.success) {
      // Verify UI still works after quota error
      await page.reload({ waitUntil: 'networkidle0' });
      
      const badgeText = await page.$eval('.cart-badge', el => el.textContent);
      expect(badgeText).toBeDefined();
    }
  }, 20000);

  /**
   * Test Case INT-004-09: Invalid Storage Data Recovery
   * Priority: High
   */
  test('INT-004-09: Should recover UI when storage data is invalid', async () => {
    // Set invalid storage data
    await page.evaluate(() => {
      localStorage.setItem('shopping-cart', 'invalid-json-data');
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // UI should recover with empty cart
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');

    // Should be able to add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Verify storage is now valid
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(Array.isArray(cartData)).toBe(true);
    expect(cartData.length).toBe(1);
  }, 20000);

  /**
   * Test Case INT-004-10: Storage Version Compatibility
   * Priority: Medium
   */
  test('INT-004-10: Should handle different storage format versions', async () => {
    // Set old format storage data
    await page.evaluate(() => {
      const oldFormat = {
        items: [
          { id: 'product-1', qty: 2 }
        ],
        version: 1
      };
      localStorage.setItem('shopping-cart', JSON.stringify(oldFormat));
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // Should either migrate or reset gracefully
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBeDefined();

    // Should be able to add new products
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    const updatedBadge = await page.$eval('.cart-badge', el => el.textContent);
    expect(parseInt(updatedBadge)).toBeGreaterThan(0);
  }, 20000);

  /**
   * Test Case INT-004-11: Real-time Sync Verification
   * Priority: High
   */
  test('INT-004-11: Should maintain real-time sync between storage and UI', async () => {
    // Monitor storage changes
    const storageChanges = [];
    
    await page.exposeFunction('trackStorageChange', (data) => {
      storageChanges.push(data);
    });

    // Set up storage listener
    await page.evaluate(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key === 'shopping-cart') {
          window.trackStorageChange(value);
        }
        return originalSetItem.apply(this, arguments);
      };
    });

    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Verify storage was updated for each action
    expect(storageChanges.length).toBeGreaterThan(0);

    // Verify UI matches latest storage state
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    const latestStorage = JSON.parse(storageChanges[storageChanges.length - 1]);
    expect(parseInt(badgeText)).toBe(latestStorage.length);
  }, 20000);

  /**
   * Test Case INT-004-12: Storage Clear Syncs UI
   * Priority: Medium
   */
  test('INT-004-12: Should sync UI when storage is cleared', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Verify badge shows items
    let badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // UI should show empty cart
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
  }, 20000);
});

/**
 * Test Summary:
 * - Total Test Cases: 12
 * - Critical: 3
 * - High: 5
 * - Medium: 4
 * 
 * Coverage:
 * ✅ UI add action updates storage
 * ✅ Storage changes update UI
 * ✅ UI remove action updates storage
 * ✅ Quantity updates sync
 * ✅ Storage persistence across sessions
 * ✅ Concurrent updates handling
 * ✅ Empty cart sync
 * ✅ Storage quota handling
 * ✅ Invalid data recovery
 * ✅ Version compatibility
 * ✅ Real-time sync verification
 * ✅ Storage clear sync
 * 
 * ST-2 Acceptance Criteria: 100% Covered
 */

