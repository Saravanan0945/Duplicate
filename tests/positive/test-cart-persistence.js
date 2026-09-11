/**
 * Positive Test Case: Cart Persistence Across Page Reloads
 * 
 * Test ID: POS-005
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that cart data persists across page reloads, browser refreshes,
 * and survives navigation between pages using localStorage.
 * 
 * Prerequisites:
 * - Shopping cart application is loaded
 * - localStorage is accessible and enabled
 * - Products are available
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-005: Cart Persistence Across Page Reloads', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  /**
   * Test Case 1: Cart survives simple page reload
   */
  test('should persist cart data after page reload', async () => {
    // Step 1: Add products to cart
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Step 2: Get cart data before reload
    const cartBefore = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Step 3: Reload page
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Step 4: Get cart data after reload
    const cartAfter = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Step 5: Verify data persisted
    expect(cartAfter).not.toBeNull();
    expect(Object.keys(cartAfter.cart).length).toBe(Object.keys(cartBefore.cart).length);

    console.log('✓ Test passed: Cart persisted after reload');
  });

  /**
   * Test Case 2: Cart badge updates after reload
   */
  test('should restore cart badge count after reload', async () => {
    // Step 1: Add 3 items
    for (let i = 1; i <= 3; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(150);
    }

    // Step 2: Reload page
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 5000 });

    // Step 3: Verify badge shows 3
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('3');

    console.log('✓ Test passed: Badge count restored after reload');
  });

  /**
   * Test Case 3: Cart persists with quantities
   */
  test('should persist product quantities after reload', async () => {
    // Step 1: Add same product 5 times
    for (let i = 0; i < 5; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(100);
    }

    // Step 2: Reload page
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Step 3: Verify quantity is still 5
    const quantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId].quantity;
    });

    expect(quantity).toBe(5);

    console.log('✓ Test passed: Quantities persisted after reload');
  });

  /**
   * Test Case 4: Cart persists across multiple reloads
   */
  test('should persist cart through multiple reloads', async () => {
    // Step 1: Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Reload 3 times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForSelector('.product-card', { timeout: 5000 });
      await page.waitForTimeout(200);
    }

    // Step 3: Verify cart still has 2 items
    const itemCount = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return Object.keys(JSON.parse(data).cart).length;
    });

    expect(itemCount).toBe(2);

    console.log('✓ Test passed: Cart survived multiple reloads');
  });

  /**
   * Test Case 5: Cart persists when navigating away and back
   */
  test('should persist cart when navigating to cart page and back', async () => {
    // Step 1: Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Navigate to cart page
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 3: Navigate back
    await page.goBack();
    await page.waitForNavigation({ timeout: 5000 });

    // Step 4: Verify cart still exists
    const cartExists = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data !== null;
    });

    expect(cartExists).toBe(true);

    console.log('✓ Test passed: Cart persisted through navigation');
  });

  /**
   * Test Case 6: Verify localStorage key remains consistent
   */
  test('should use consistent localStorage key', async () => {
    // Step 1: Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Check localStorage key
    const hasCorrectKey = await page.evaluate(() => {
      return localStorage.getItem('shopping_cart') !== null;
    });

    expect(hasCorrectKey).toBe(true);

    // Step 3: Reload and verify key still exists
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    const keyStillExists = await page.evaluate(() => {
      return localStorage.getItem('shopping_cart') !== null;
    });

    expect(keyStillExists).toBe(true);

    console.log('✓ Test passed: localStorage key consistent');
  });

  /**
   * Test Case 7: Cart data structure remains valid after reload
   */
  test('should maintain valid data structure after reload', async () => {
    // Step 1: Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Reload
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Step 3: Validate structure
    const isValid = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const parsed = JSON.parse(data);
      
      return parsed.hasOwnProperty('version') &&
             parsed.hasOwnProperty('timestamp') &&
             parsed.hasOwnProperty('cart') &&
             typeof parsed.cart === 'object';
    });

    expect(isValid).toBe(true);

    console.log('✓ Test passed: Data structure valid after reload');
  });

  /**
   * Test Case 8: Timestamp persists but can be updated
   */
  test('should preserve timestamp across reload', async () => {
    // Step 1: Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Get timestamp
    const timestamp1 = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).timestamp;
    });

    // Step 3: Reload
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Step 4: Get timestamp after reload
    const timestamp2 = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).timestamp;
    });

    // Timestamp should be preserved
    expect(timestamp2).toBe(timestamp1);

    console.log('✓ Test passed: Timestamp preserved');
  });

  /**
   * Test Case 9: Cart persists with empty state
   */
  test('should handle empty cart persistence', async () => {
    // Step 1: Verify empty cart
    const isEmpty = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data === null || Object.keys(JSON.parse(data).cart || {}).length === 0;
    });

    // Step 2: Reload
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Step 3: Verify still empty or null
    const stillEmpty = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data === null || Object.keys(JSON.parse(data).cart || {}).length === 0;
    });

    expect(stillEmpty).toBe(true);

    console.log('✓ Test passed: Empty cart handled correctly');
  });

  /**
   * Test Case 10: Product details persist accurately
   */
  test('should persist all product details accurately', async () => {
    // Step 1: Get product details
    const productDetails = await page.evaluate(() => {
      const card = document.querySelector('.product-card:first-child');
      return {
        id: parseInt(card.dataset.productId),
        name: card.querySelector('.product-name').textContent.trim(),
        price: parseFloat(card.querySelector('.product-price').textContent.replace(/[^0-9.]/g, ''))
      };
    });

    // Step 2: Add to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 3: Reload
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Step 4: Verify details match
    const storedDetails = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId];
    });

    expect(storedDetails.id).toBe(productDetails.id);
    expect(storedDetails.name).toBe(productDetails.name);
    expect(storedDetails.price).toBe(productDetails.price);

    console.log('✓ Test passed: Product details persisted accurately');
  });
});

/**
 * Test Execution Summary
 * 
 * Total Test Cases: 10
 * Expected Pass Rate: 100%
 * 
 * Coverage:
 * - Simple page reload
 * - Multiple reloads
 * - Navigation persistence
 * - Badge restoration
 * - Quantity persistence
 * - Data structure integrity
 * - localStorage key consistency
 * - Timestamp handling
 * - Empty cart handling
 * - Product detail accuracy
 * 
 * Exit Criteria:
 * - All 10 test cases pass
 * - Cart data survives reloads
 * - No data corruption
 * - Badge updates correctly
 */

