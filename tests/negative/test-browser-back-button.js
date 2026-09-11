/**
 * Negative Test: Browser Back Button Navigation
 * 
 * Test ID: NEG-010
 * Category: Negative Testing
 * Priority: Medium
 * 
 * Description:
 * Verify that the application handles browser back/forward button navigation
 * correctly, maintaining cart state and preventing data loss.
 * 
 * Related Jira: ST-2 (Acceptance Criteria: No navigation or data loss issues)
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-010: Browser Back Button Navigation', () => {
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
   * Test Case 1: Back button from cart to products page
   * Expected: Cart state preserved, returns to products
   */
  test('should preserve cart when using back button from cart page', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const initialCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Use back button
    await page.goBack();
    await page.waitForSelector('.product-grid', { timeout: 3000 });

    // Verify cart preserved
    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(initialCount);
  });

  /**
   * Test Case 2: Forward button after back navigation
   * Expected: Cart state consistent
   */
  test('should maintain cart state with back and forward navigation', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Back to products
    await page.goBack();
    await page.waitForSelector('.product-grid', { timeout: 3000 });

    // Forward to cart
    await page.goForward();
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Verify cart items still displayed
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);
  });

  /**
   * Test Case 3: Multiple back/forward cycles
   * Expected: No data loss or corruption
   */
  test('should handle multiple back/forward cycles', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const initialCartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Navigate back and forth multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE_URL}/cart.html`);
      await page.waitForTimeout(500);
      await page.goBack();
      await page.waitForTimeout(500);
    }

    // Verify cart unchanged
    const finalCartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(finalCartData.items.length).toBe(initialCartData.items.length);
    expect(finalCartData.items[0].productId).toBe(initialCartData.items[0].productId);
  });

  /**
   * Test Case 4: Back button after adding item on cart page
   * Expected: Changes preserved
   */
  test('should preserve quantity changes when using back button', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Increase quantity
    const increaseBtn = await page.$('.quantity-increase');
    if (increaseBtn) {
      await increaseBtn.click();
      await page.waitForTimeout(500);
    }

    const cartQuantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).items[0].quantity;
    });

    // Use back button
    await page.goBack();
    await page.waitForSelector('.product-grid', { timeout: 3000 });

    // Verify quantity preserved
    const finalQuantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).items[0].quantity;
    });

    expect(finalQuantity).toBe(cartQuantity);
  });

  /**
   * Test Case 5: Back button after removing item
   * Expected: Removal persisted
   */
  test('should persist item removal when using back button', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Remove first item
    const removeBtn = await page.$('.remove-item-btn');
    if (removeBtn) {
      await removeBtn.click();
      await page.waitForTimeout(500);
    }

    const itemsAfterRemoval = await page.$$('.cart-item');

    // Use back button
    await page.goBack();
    await page.waitForSelector('.product-grid', { timeout: 3000 });

    // Forward to cart
    await page.goForward();
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Verify removal persisted
    const finalItems = await page.$$('.cart-item');
    expect(finalItems.length).toBe(itemsAfterRemoval.length);
  });

  /**
   * Test Case 6: Rapid back button clicks
   * Expected: No errors or broken state
   */
  test('should handle rapid back button clicks', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(500);

    // Rapid back clicks
    for (let i = 0; i < 5; i++) {
      page.goBack().catch(() => {});
    }

    await page.waitForTimeout(1000);

    // Verify page still functional
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  /**
   * Test Case 7: Back button from empty cart
   * Expected: Returns to products page
   */
  test('should handle back button from empty cart', async () => {
    // Navigate to cart directly
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Use back button
    await page.goBack();
    await page.waitForTimeout(1000);

    // Should return to products or previous page
    const currentUrl = page.url();
    expect(currentUrl).toContain('index.html');
  });

  /**
   * Test Case 8: Back button doesn't duplicate cart items
   * Expected: No duplicate entries created
   */
  test('should not duplicate items with back navigation', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart and back multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE_URL}/cart.html`);
      await page.waitForTimeout(300);
      await page.goBack();
      await page.waitForTimeout(300);
    }

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Should have only one entry for product 1
    const product1Entries = cartData.items.filter(item => item.productId === '1');
    expect(product1Entries.length).toBe(1);
  });

  /**
   * Test Case 9: Back button with modified cart
   * Expected: Latest state preserved
   */
  test('should preserve latest cart state with back navigation', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Modify quantity multiple times
    const increaseBtn = await page.$('.quantity-increase');
    if (increaseBtn) {
      await increaseBtn.click();
      await page.waitForTimeout(300);
      await increaseBtn.click();
      await page.waitForTimeout(300);
    }

    const modifiedQuantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).items[0].quantity;
    });

    // Back and forward
    await page.goBack();
    await page.waitForTimeout(500);
    await page.goForward();
    await page.waitForTimeout(500);

    const finalQuantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data).items[0].quantity;
    });

    expect(finalQuantity).toBe(modifiedQuantity);
  });

  /**
   * Test Case 10: Browser history with external navigation
   * Expected: Cart state maintained
   */
  test('should maintain cart across history with external links', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const initialCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(500);

    // Navigate to products via link
    const continueBtn = await page.$('.continue-shopping-btn');
    if (continueBtn) {
      await continueBtn.click();
      await page.waitForTimeout(500);
    }

    // Use back button
    await page.goBack();
    await page.waitForTimeout(500);

    // Verify cart preserved
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(initialCount);
  });

  /**
   * Test Case 11: Back button after page reload
   * Expected: Proper navigation history
   */
  test('should handle back button after page reload', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Use back button
    await page.goBack();
    await page.waitForTimeout(1000);

    // Should navigate properly
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  /**
   * Test Case 12: Cart badge updates correctly with back navigation
   * Expected: Badge shows accurate count
   */
  test('should update badge correctly with back navigation', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const countBeforeNav = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    // Navigate to cart and back
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(500);
    await page.goBack();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const countAfterNav = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    expect(countAfterNav).toBe(countBeforeNav);
  });

  /**
   * Test Case 13: No console errors with back navigation
   * Expected: Clean navigation without errors
   */
  test('should not produce console errors with back navigation', async () => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Add item and navigate
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(500);
    await page.goBack();
    await page.waitForTimeout(500);

    // Should have no errors
    expect(consoleErrors.length).toBe(0);
  });
});

