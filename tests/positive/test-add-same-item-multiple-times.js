/**
 * Positive Test Case: Add Same Item Multiple Times
 * 
 * Test ID: POS-003
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that adding the same product multiple times correctly increments
 * the quantity rather than creating duplicate entries.
 * 
 * Prerequisites:
 * - Shopping cart application is loaded
 * - Products are available
 * - localStorage is accessible
 * - Cart is initially empty
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-003: Add Same Item Multiple Times', () => {
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
   * Test Case 1: Add same product twice
   */
  test('should increment quantity when adding same product twice', async () => {
    // Step 1: Add product first time
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Add same product second time
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 3: Verify quantity is 2
    const quantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId].quantity;
    });

    expect(quantity).toBe(2);

    // Step 4: Verify only one product entry exists
    const productCount = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return Object.keys(JSON.parse(data).cart).length;
    });

    expect(productCount).toBe(1);

    console.log('✓ Test passed: Quantity incremented to 2');
  });

  /**
   * Test Case 2: Add same product 5 times
   */
  test('should increment quantity to 5 for same product', async () => {
    // Step 1: Add product 5 times
    for (let i = 0; i < 5; i++) {
      await page.click('.product-card:nth-child(2) .add-to-cart-btn');
      await page.waitForTimeout(200);
    }

    // Step 2: Verify quantity is 5
    const quantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId].quantity;
    });

    expect(quantity).toBe(5);

    console.log('✓ Test passed: Quantity incremented to 5');
  });

  /**
   * Test Case 3: Verify cart badge shows correct count
   */
  test('should update badge to show total quantity', async () => {
    // Step 1: Add same product 3 times
    for (let i = 0; i < 3; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(200);
    }

    // Step 2: Verify badge shows 3
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('3');

    console.log('✓ Test passed: Badge shows correct count');
  });

  /**
   * Test Case 4: Add same product 10 times rapidly
   */
  test('should handle rapid additions of same product', async () => {
    // Step 1: Rapidly click 10 times
    const selector = '.product-card:nth-child(3) .add-to-cart-btn';
    
    for (let i = 0; i < 10; i++) {
      await page.click(selector);
      await page.waitForTimeout(50);
    }

    // Step 2: Wait for all updates
    await page.waitForTimeout(1000);

    // Step 3: Verify quantity is 10
    const quantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId].quantity;
    });

    expect(quantity).toBe(10);

    console.log('✓ Test passed: Rapid additions handled correctly');
  });

  /**
   * Test Case 5: Verify no duplicate entries created
   */
  test('should not create duplicate product entries', async () => {
    // Step 1: Add same product 4 times
    for (let i = 0; i < 4; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(150);
    }

    // Step 2: Verify only 1 unique product in cart
    const uniqueProducts = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      return Object.keys(cart).length;
    });

    expect(uniqueProducts).toBe(1);

    console.log('✓ Test passed: No duplicate entries');
  });

  /**
   * Test Case 6: Verify product ID remains consistent
   */
  test('should maintain same product ID across additions', async () => {
    // Step 1: Get product ID from first addition
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(200);

    const firstProductId = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      return Object.keys(cart)[0];
    });

    // Step 2: Add same product again
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(200);

    // Step 3: Verify product ID is still the same
    const secondProductId = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      return Object.keys(cart)[0];
    });

    expect(firstProductId).toBe(secondProductId);

    console.log('✓ Test passed: Product ID remains consistent');
  });

  /**
   * Test Case 7: Verify quantity increments sequentially
   */
  test('should increment quantity sequentially (1, 2, 3, 4)', async () => {
    const expectedQuantities = [1, 2, 3, 4];

    for (let i = 0; i < 4; i++) {
      // Add product
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(200);

      // Check quantity
      const currentQuantity = await page.evaluate(() => {
        const data = localStorage.getItem('shopping_cart');
        const cart = JSON.parse(data).cart;
        const productId = Object.keys(cart)[0];
        return cart[productId].quantity;
      });

      expect(currentQuantity).toBe(expectedQuantities[i]);
    }

    console.log('✓ Test passed: Quantity increments sequentially');
  });

  /**
   * Test Case 8: Add same product with different products in cart
   */
  test('should increment quantity with other products in cart', async () => {
    // Step 1: Add product A once
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(200);

    // Step 2: Add product B once
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(200);

    // Step 3: Add product A again (should increment)
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(200);

    // Step 4: Verify product A has quantity 2
    const productAQuantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productAId = Object.keys(cart)[0];
      return cart[productAId].quantity;
    });

    expect(productAQuantity).toBe(2);

    // Step 5: Verify 2 unique products in cart
    const uniqueProducts = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return Object.keys(JSON.parse(data).cart).length;
    });

    expect(uniqueProducts).toBe(2);

    console.log('✓ Test passed: Quantity incremented with other products present');
  });

  /**
   * Test Case 9: Verify notification shows updated quantity
   */
  test('should show notification with updated quantity', async () => {
    // Step 1: Add product first time
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Add same product again
    await page.click('.product-card:first-child .add-to-cart-btn');
    
    // Step 3: Wait for notification
    await page.waitForSelector('.toast-notification', { timeout: 2000 });

    // Step 4: Verify notification appears
    const notificationExists = await page.$('.toast-notification');
    expect(notificationExists).not.toBeNull();

    console.log('✓ Test passed: Notification shown for quantity update');
  });

  /**
   * Test Case 10: Verify localStorage updates after each addition
   */
  test('should update localStorage after each quantity increment', async () => {
    const quantities = [];

    // Step 1: Add same product 3 times and record quantities
    for (let i = 0; i < 3; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(200);

      const qty = await page.evaluate(() => {
        const data = localStorage.getItem('shopping_cart');
        const cart = JSON.parse(data).cart;
        const productId = Object.keys(cart)[0];
        return cart[productId].quantity;
      });

      quantities.push(qty);
    }

    // Step 2: Verify quantities increased each time
    expect(quantities).toEqual([1, 2, 3]);

    console.log('✓ Test passed: localStorage updated after each addition');
  });

  /**
   * Test Case 11: Verify timestamp updates on quantity change
   */
  test('should update timestamp when quantity changes', async () => {
    // Step 1: Add product first time
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    const firstTimestamp = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).timestamp;
    });

    // Step 2: Wait a moment
    await page.waitForTimeout(100);

    // Step 3: Add same product again
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    const secondTimestamp = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).timestamp;
    });

    // Step 4: Verify timestamp was updated
    expect(secondTimestamp).toBeGreaterThan(firstTimestamp);

    console.log('✓ Test passed: Timestamp updated on quantity change');
  });
});

/**
 * Test Execution Summary
 * 
 * Total Test Cases: 11
 * Expected Pass Rate: 100%
 * 
 * Coverage:
 * - Quantity increment logic
 * - No duplicate entries
 * - Badge count accuracy
 * - Rapid addition handling
 * - Product ID consistency
 * - Sequential increments
 * - Mixed cart scenarios
 * - Notification updates
 * - localStorage persistence
 * - Timestamp updates
 * 
 * Exit Criteria:
 * - All 11 test cases pass
 * - Quantity increments correctly
 * - No duplicate products created
 * - Badge reflects total quantity
 */

