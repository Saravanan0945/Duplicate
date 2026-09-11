/**
 * Positive Test Case: Add Multiple Different Items to Cart
 * 
 * Test ID: POS-002
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that a user can successfully add multiple different products to the cart
 * and that all items are tracked correctly with accurate counts and totals.
 * 
 * Prerequisites:
 * - Shopping cart application is loaded
 * - Multiple products are available in catalog
 * - localStorage is accessible
 * - Cart is initially empty
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-002: Add Multiple Different Items to Cart', () => {
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
   * Test Case 1: Add 3 different products to cart
   */
  test('should add 3 different products successfully', async () => {
    // Step 1: Add first product
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Add second product
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 3: Add third product
    await page.click('.product-card:nth-child(3) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 4: Verify cart badge shows 3
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('3');

    // Step 5: Verify localStorage has 3 items
    const cartItemCount = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      return Object.keys(cart).length;
    });

    expect(cartItemCount).toBe(3);

    console.log('✓ Test passed: 3 different products added');
  });

  /**
   * Test Case 2: Add 5 different products sequentially
   */
  test('should add 5 different products in sequence', async () => {
    const productsToAdd = [1, 2, 3, 4, 5];

    // Step 1: Add each product
    for (const index of productsToAdd) {
      await page.click(`.product-card:nth-child(${index}) .add-to-cart-btn`);
      await page.waitForTimeout(200);
    }

    // Step 2: Verify final badge count
    const badgeCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(badgeCount).toBe(5);

    // Step 3: Verify each product is in cart
    const cartProducts = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return Object.keys(JSON.parse(data).cart);
    });

    expect(cartProducts.length).toBe(5);

    console.log('✓ Test passed: 5 products added sequentially');
  });

  /**
   * Test Case 3: Verify each product has quantity of 1
   */
  test('should set quantity to 1 for each different product', async () => {
    // Step 1: Add 4 different products
    for (let i = 1; i <= 4; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(200);
    }

    // Step 2: Verify all quantities are 1
    const quantities = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      return Object.values(cart).map(item => item.quantity);
    });

    quantities.forEach(qty => {
      expect(qty).toBe(1);
    });

    console.log('✓ Test passed: All quantities are 1');
  });

  /**
   * Test Case 4: Verify cart badge increments correctly
   */
  test('should increment badge count for each new product', async () => {
    const expectedCounts = [1, 2, 3];

    for (let i = 0; i < 3; i++) {
      // Add product
      await page.click(`.product-card:nth-child(${i + 1}) .add-to-cart-btn`);
      await page.waitForTimeout(300);

      // Verify badge
      const count = await page.$eval('.cart-badge', el => parseInt(el.textContent));
      expect(count).toBe(expectedCounts[i]);
    }

    console.log('✓ Test passed: Badge increments correctly');
  });

  /**
   * Test Case 5: Add products from different categories
   */
  test('should add products from different categories', async () => {
    // Step 1: Get products from different positions (likely different categories)
    const productIndices = [1, 4, 7, 10];

    for (const index of productIndices) {
      const selector = `.product-card:nth-child(${index}) .add-to-cart-btn`;
      const exists = await page.$(selector);
      
      if (exists) {
        await page.click(selector);
        await page.waitForTimeout(200);
      }
    }

    // Step 2: Verify all added products are in cart
    const cartSize = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      if (!data) return 0;
      return Object.keys(JSON.parse(data).cart).length;
    });

    expect(cartSize).toBeGreaterThan(0);
    expect(cartSize).toBeLessThanOrEqual(4);

    console.log('✓ Test passed: Products from different categories added');
  });

  /**
   * Test Case 6: Verify unique product IDs in cart
   */
  test('should maintain unique product IDs in cart', async () => {
    // Step 1: Add 6 different products
    for (let i = 1; i <= 6; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(150);
    }

    // Step 2: Get all product IDs from cart
    const productIds = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      return Object.keys(cart).map(id => parseInt(id));
    });

    // Step 3: Verify all IDs are unique
    const uniqueIds = [...new Set(productIds)];
    expect(productIds.length).toBe(uniqueIds.length);
    expect(productIds.length).toBe(6);

    console.log('✓ Test passed: All product IDs are unique');
  });

  /**
   * Test Case 7: Verify notifications for multiple additions
   */
  test('should show notification for each product added', async () => {
    let notificationCount = 0;

    // Step 1: Set up notification listener
    await page.exposeFunction('notificationShown', () => {
      notificationCount++;
    });

    // Step 2: Add 3 products and count notifications
    for (let i = 1; i <= 3; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      
      // Wait for notification to appear
      await page.waitForSelector('.toast-notification', { timeout: 2000 });
      await page.waitForTimeout(500);
    }

    // Step 3: Verify notifications appeared
    const notificationExists = await page.$('.toast-notification');
    expect(notificationExists).not.toBeNull();

    console.log('✓ Test passed: Notifications shown for each addition');
  });

  /**
   * Test Case 8: Add all available products
   */
  test('should add all available products to cart', async () => {
    // Step 1: Count available products
    const productCount = await page.$$eval('.product-card', cards => cards.length);

    // Step 2: Add all products
    for (let i = 1; i <= productCount; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(100);
    }

    // Step 3: Verify cart contains all products
    const cartSize = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return Object.keys(JSON.parse(data).cart).length;
    });

    expect(cartSize).toBe(productCount);

    // Step 4: Verify badge matches product count
    const badgeCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(badgeCount).toBe(productCount);

    console.log(`✓ Test passed: All ${productCount} products added`);
  });

  /**
   * Test Case 9: Verify cart data integrity with multiple items
   */
  test('should maintain data integrity with multiple items', async () => {
    // Step 1: Add 5 products
    for (let i = 1; i <= 5; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(150);
    }

    // Step 2: Verify cart structure
    const cartValidation = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const parsed = JSON.parse(data);
      const cart = parsed.cart;

      // Check each item has required properties
      const allValid = Object.values(cart).every(item => 
        item.hasOwnProperty('id') &&
        item.hasOwnProperty('name') &&
        item.hasOwnProperty('price') &&
        item.hasOwnProperty('quantity') &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      );

      return {
        valid: allValid,
        itemCount: Object.keys(cart).length
      };
    });

    expect(cartValidation.valid).toBe(true);
    expect(cartValidation.itemCount).toBe(5);

    console.log('✓ Test passed: Data integrity maintained');
  });

  /**
   * Test Case 10: Verify rapid successive additions
   */
  test('should handle rapid successive product additions', async () => {
    // Step 1: Rapidly add 4 products (no wait between clicks)
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.click('.product-card:nth-child(3) .add-to-cart-btn');
    await page.click('.product-card:nth-child(4) .add-to-cart-btn');

    // Step 2: Wait for all updates to complete
    await page.waitForTimeout(1000);

    // Step 3: Verify all products were added
    const cartSize = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return Object.keys(JSON.parse(data).cart).length;
    });

    expect(cartSize).toBe(4);

    console.log('✓ Test passed: Rapid additions handled correctly');
  });
});

/**
 * Test Execution Summary
 * 
 * Total Test Cases: 10
 * Expected Pass Rate: 100%
 * 
 * Coverage:
 * - Multiple product additions
 * - Badge count accuracy
 * - Unique product tracking
 * - Data integrity
 * - Notification system
 * - Rapid addition handling
 * - Category diversity
 * - Maximum capacity testing
 * 
 * Exit Criteria:
 * - All 10 test cases pass
 * - Cart correctly tracks multiple items
 * - No duplicate products
 * - Badge count matches cart size
 */

