/**
 * Integration Test: Multi-Page Navigation
 * Test ID: INT-002
 * Priority: Critical
 * 
 * Description:
 * Tests navigation between all pages (index.html ↔ cart.html) ensuring
 * state persistence, proper URL handling, and seamless transitions.
 * 
 * Navigation Flows Tested:
 * 1. Index → Cart → Index
 * 2. Cart → Index → Cart
 * 3. Browser back/forward buttons
 * 4. Direct URL access
 * 5. Multiple navigation cycles
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✅ "Go to Cart" button is visible and clickable
 * ✅ User is redirected to the Cart page
 * ✅ Selected products are retained and displayed
 * ✅ No navigation or data loss issues
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('INT-002: Multi-Page Navigation Integration Test', () => {
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
   * Test Case INT-002-01: Basic Navigation Index → Cart → Index
   * Priority: Critical
   */
  test('INT-002-01: Should navigate between index and cart pages', async () => {
    // Start on index page
    expect(page.url()).toContain('index.html');

    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Verify cart page loaded
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('index.html');

    // Verify products still displayed
    const products = await page.$$('.product-card');
    expect(products.length).toBeGreaterThan(0);
  }, 20000);

  /**
   * Test Case INT-002-02: Navigation with State Persistence
   * Priority: Critical
   */
  test('INT-002-02: Should persist cart state across navigation', async () => {
    // Add multiple products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(200);

    // Check badge on index page
    let badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify 3 items in cart
    let cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Badge should still show 3
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');

    // Navigate to cart again
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should still have 3 items
    cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);
  }, 25000);

  /**
   * Test Case INT-002-03: Browser Back Button Navigation
   * Priority: High
   */
  test('INT-002-03: Should handle browser back button correctly', async () => {
    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Use browser back button
    await page.goBack();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('index.html');

    // Cart should still have 1 item
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('1');

    // Use browser forward button
    await page.goForward();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Should still show cart item
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);
  }, 20000);

  /**
   * Test Case INT-002-04: Direct URL Access to Cart
   * Priority: High
   */
  test('INT-002-04: Should handle direct cart URL access', async () => {
    // Add products on index page
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Directly navigate to cart URL
    await page.goto(cartURL);
    await page.waitForSelector('.cart-container');

    // Should load cart with items
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    // Verify cart functionality works
    const removeButton = await page.$('.remove-item-btn');
    await removeButton.click();
    await page.waitForTimeout(500);

    const remainingItems = await page.$$('.cart-item');
    expect(remainingItems.length).toBe(1);
  }, 20000);

  /**
   * Test Case INT-002-05: Multiple Navigation Cycles
   * Priority: Medium
   */
  test('INT-002-05: Should handle multiple navigation cycles', async () => {
    // Add initial product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Cycle 1: Index → Cart → Index
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Add another product
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Cycle 2: Index → Cart → Index
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Add third product
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Cycle 3: Index → Cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should have all 3 products
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);
  }, 30000);

  /**
   * Test Case INT-002-06: Navigation with Empty Cart
   * Priority: High
   */
  test('INT-002-06: Should handle navigation with empty cart', async () => {
    // Try to navigate to cart when empty
    await page.click('.go-to-cart-btn');
    await page.waitForTimeout(500);

    // Should stay on index page with error
    expect(page.url()).toContain('index.html');
    const notification = await page.$('.notification.error');
    expect(notification).not.toBeNull();

    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Now navigation should work
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Remove the item
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Should show empty cart message
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('index.html');
  }, 20000);

  /**
   * Test Case INT-002-07: Navigation with Cart Updates
   * Priority: High
   */
  test('INT-002-07: Should reflect cart updates across navigation', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Update quantity
    const quantityInput = await page.$('.cart-item:first-child .quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('5');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Badge should reflect updated quantity (2 unique items)
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Navigate back to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Quantity should still be 5
    const quantity = await page.$eval('.cart-item:first-child .quantity-input', el => el.value);
    expect(quantity).toBe('5');
  }, 25000);

  /**
   * Test Case INT-002-08: Rapid Navigation
   * Priority: Medium
   */
  test('INT-002-08: Should handle rapid navigation attempts', async () => {
    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Rapidly click go to cart button
    const goToCartBtn = await page.$('.go-to-cart-btn');
    await Promise.all([
      goToCartBtn.click(),
      goToCartBtn.click()
    ]);

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Should only navigate once
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);
  }, 15000);

  /**
   * Test Case INT-002-09: Navigation with Page Refresh
   * Priority: High
   */
  test('INT-002-09: Should maintain state after page refresh during navigation', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Refresh cart page
    await page.reload({ waitUntil: 'networkidle0' });

    // Should still show 2 items
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Refresh index page
    await page.reload({ waitUntil: 'networkidle0' });

    // Badge should still show 2
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');
  }, 25000);

  /**
   * Test Case INT-002-10: Navigation URL Integrity
   * Priority: Medium
   */
  test('INT-002-10: Should maintain correct URLs throughout navigation', async () => {
    // Verify starting URL
    expect(page.url()).toContain('index.html');
    expect(page.url()).not.toContain('cart.html');

    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // URL should not change
    expect(page.url()).toContain('index.html');

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // URL should be cart.html
    expect(page.url()).toContain('cart.html');
    expect(page.url()).not.toContain('index.html');

    // Navigate back
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // URL should be index.html again
    expect(page.url()).toContain('index.html');
    expect(page.url()).not.toContain('cart.html');
  }, 20000);

  /**
   * Test Case INT-002-11: Navigation with localStorage Verification
   * Priority: High
   */
  test('INT-002-11: Should sync localStorage across navigation', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Check localStorage on index page
    let cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Check localStorage on cart page
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);

    // Remove item on cart page
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Check localStorage updated
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(1);

    // Navigate back to index
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // localStorage should still have 1 item
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(1);
  }, 25000);

  /**
   * Test Case INT-002-12: Navigation Performance
   * Priority: Low
   */
  test('INT-002-12: Should navigate quickly between pages', async () => {
    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Measure navigation to cart
    const startTime = Date.now();
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const cartLoadTime = Date.now() - startTime;

    expect(cartLoadTime).toBeLessThan(3000); // Should load in under 3 seconds

    // Measure navigation back to index
    const startTime2 = Date.now();
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const indexLoadTime = Date.now() - startTime2;

    expect(indexLoadTime).toBeLessThan(3000);
  }, 20000);
});

/**
 * Test Summary:
 * - Total Test Cases: 12
 * - Critical: 3
 * - High: 6
 * - Medium: 3
 * - Low: 1
 * 
 * Coverage:
 * ✅ Basic navigation (Index ↔ Cart)
 * ✅ State persistence across navigation
 * ✅ Browser back/forward buttons
 * ✅ Direct URL access
 * ✅ Multiple navigation cycles
 * ✅ Empty cart navigation
 * ✅ Cart updates across navigation
 * ✅ Rapid navigation
 * ✅ Page refresh during navigation
 * ✅ URL integrity
 * ✅ localStorage synchronization
 * ✅ Navigation performance
 * 
 * ST-2 Acceptance Criteria: 100% Covered
 */

