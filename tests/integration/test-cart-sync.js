/**
 * Integration Test: Cart Synchronization
 * Test ID: INT-003
 * Priority: Critical
 * 
 * Description:
 * Tests that cart updates synchronize correctly across all components:
 * - Badge updates when cart changes
 * - UI reflects localStorage changes
 * - Multiple components stay in sync
 * - Real-time updates across pages
 * 
 * Components Tested:
 * 1. Cart badge counter
 * 2. Product listing page
 * 3. Cart page display
 * 4. localStorage
 * 5. Toast notifications
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✅ Selected products are retained and displayed
 * ✅ No data loss issues
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('INT-003: Cart Synchronization Integration Test', () => {
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
   * Test Case INT-003-01: Badge Syncs with Cart Additions
   * Priority: Critical
   */
  test('INT-003-01: Should sync badge when adding items to cart', async () => {
    // Initial badge should show 0
    let badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');

    // Add first product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Badge should update to 1
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('1');

    // Add second product
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Badge should update to 2
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Add same product again
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Badge should still show 2 (unique items)
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');
  }, 20000);

  /**
   * Test Case INT-003-02: Cart Page Syncs with localStorage
   * Priority: Critical
   */
  test('INT-003-02: Should sync cart page with localStorage changes', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify 2 items displayed
    let cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    // Manually modify localStorage
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('shopping-cart') || '[]');
      cart.push({ productId: 'product-3', quantity: 1 });
      localStorage.setItem('shopping-cart', JSON.stringify(cart));
    });

    // Reload page to trigger sync
    await page.reload({ waitUntil: 'networkidle0' });

    // Should now show 3 items
    cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);
  }, 20000);

  /**
   * Test Case INT-003-03: Badge Syncs with Cart Removals
   * Priority: Critical
   */
  test('INT-003-03: Should sync badge when removing items from cart', async () => {
    // Add 3 products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Badge should show 3
    let badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Remove one item
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Badge should now show 2
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');
  }, 25000);

  /**
   * Test Case INT-003-04: Quantity Updates Sync Across Components
   * Priority: High
   */
  test('INT-003-04: Should sync quantity updates across all components', async () => {
    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Get initial subtotal
    const initialSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    // Update quantity to 3
    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('3');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Subtotal should update
    const newSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(newSubtotal).toBeCloseTo(initialSubtotal * 3, 2);

    // Tax should update
    const tax = await page.$eval('.tax-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(tax).toBeCloseTo(newSubtotal * 0.1, 2);

    // Total should update
    const total = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(total).toBeCloseTo(newSubtotal + tax, 2);

    // Verify localStorage updated
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData[0].quantity).toBe(3);
  }, 20000);

  /**
   * Test Case INT-003-05: Multiple Tabs Sync
   * Priority: High
   */
  test('INT-003-05: Should sync cart across multiple tabs', async () => {
    // Add product in first tab
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Open second tab
    const page2 = await browser.newPage();
    await page2.goto(baseURL);

    // Badge in second tab should show 1
    const badgeText = await page2.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('1');

    // Add product in second tab
    await page2.click('[data-product-id="product-2"]');
    await page2.waitForTimeout(300);

    // Reload first tab
    await page.reload({ waitUntil: 'networkidle0' });

    // Badge in first tab should show 2
    const updatedBadge = await page.$eval('.cart-badge', el => el.textContent);
    expect(updatedBadge).toBe('2');

    await page2.close();
  }, 25000);

  /**
   * Test Case INT-003-06: Real-time Badge Updates
   * Priority: High
   */
  test('INT-003-06: Should update badge in real-time', async () => {
    // Monitor badge changes
    const badgeUpdates = [];
    
    await page.exposeFunction('trackBadgeUpdate', (value) => {
      badgeUpdates.push(value);
    });

    // Add mutation observer to track badge changes
    await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge');
      const observer = new MutationObserver(() => {
        window.trackBadgeUpdate(badge.textContent);
      });
      observer.observe(badge, { childList: true, characterData: true, subtree: true });
    });

    // Add products rapidly
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(500);

    // Badge should have updated multiple times
    expect(badgeUpdates.length).toBeGreaterThan(0);
    expect(badgeUpdates[badgeUpdates.length - 1]).toBe('3');
  }, 20000);

  /**
   * Test Case INT-003-07: Cart Summary Syncs with Items
   * Priority: High
   */
  test('INT-003-07: Should sync cart summary with item changes', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Get initial totals
    const initialSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    const initialTotal = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    // Remove one item
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Totals should update
    const newSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    const newTotal = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    expect(newSubtotal).toBeLessThan(initialSubtotal);
    expect(newTotal).toBeLessThan(initialTotal);

    // Tax should recalculate
    const tax = await page.$eval('.tax-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(tax).toBeCloseTo(newSubtotal * 0.1, 2);
  }, 20000);

  /**
   * Test Case INT-003-08: Empty Cart Syncs Across Components
   * Priority: Medium
   */
  test('INT-003-08: Should sync empty cart state across components', async () => {
    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Remove the item
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Should show empty cart message
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Badge should show 0
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');

    // localStorage should be empty
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(0);
  }, 20000);

  /**
   * Test Case INT-003-09: Notification Syncs with Cart Actions
   * Priority: Medium
   */
  test('INT-003-09: Should show notifications for cart actions', async () => {
    // Add product and check for notification
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    let notification = await page.$('.notification.success');
    expect(notification).not.toBeNull();

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Remove item and check for notification
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    notification = await page.$('.notification');
    expect(notification).not.toBeNull();
  }, 20000);

  /**
   * Test Case INT-003-10: Sync After Page Reload
   * Priority: High
   */
  test('INT-003-10: Should maintain sync after page reload', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // Badge should still show 2
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should still show 2 items
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    // Reload cart page
    await page.reload({ waitUntil: 'networkidle0' });

    // Should still show 2 items
    const reloadedItems = await page.$$('.cart-item');
    expect(reloadedItems.length).toBe(2);
  }, 25000);

  /**
   * Test Case INT-003-11: Sync with Rapid Updates
   * Priority: Medium
   */
  test('INT-003-11: Should handle rapid cart updates and stay in sync', async () => {
    // Rapidly add multiple products
    await Promise.all([
      page.click('[data-product-id="product-1"]'),
      page.click('[data-product-id="product-2"]'),
      page.click('[data-product-id="product-3"]')
    ]);

    await page.waitForTimeout(1000);

    // Badge should eventually show correct count
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(parseInt(badgeText)).toBeGreaterThan(0);
    expect(parseInt(badgeText)).toBeLessThanOrEqual(3);

    // localStorage should match badge
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(parseInt(badgeText));
  }, 20000);

  /**
   * Test Case INT-003-12: Sync with localStorage Corruption Recovery
   * Priority: Medium
   */
  test('INT-003-12: Should recover from localStorage corruption and resync', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem('shopping-cart', 'invalid-json');
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // Should recover with empty cart
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');

    // Should be able to add products again
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Badge should update
    const updatedBadge = await page.$eval('.cart-badge', el => el.textContent);
    expect(updatedBadge).toBe('1');

    // localStorage should be valid again
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(Array.isArray(cartData)).toBe(true);
  }, 20000);
});

/**
 * Test Summary:
 * - Total Test Cases: 12
 * - Critical: 3
 * - High: 6
 * - Medium: 3
 * 
 * Coverage:
 * ✅ Badge synchronization with additions
 * ✅ Cart page sync with localStorage
 * ✅ Badge sync with removals
 * ✅ Quantity updates across components
 * ✅ Multiple tabs synchronization
 * ✅ Real-time badge updates
 * ✅ Cart summary sync
 * ✅ Empty cart state sync
 * ✅ Notification sync
 * ✅ Sync after page reload
 * ✅ Rapid updates handling
 * ✅ Corruption recovery
 * 
 * ST-2 Acceptance Criteria: 100% Covered
 */

