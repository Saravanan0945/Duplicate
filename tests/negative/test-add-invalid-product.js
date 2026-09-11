/**
 * Negative Test: Add Invalid Product to Cart
 * 
 * Test ID: NEG-001
 * Category: Negative Testing
 * Priority: High
 * 
 * Description:
 * Verify that the application handles attempts to add non-existent products gracefully
 * and provides appropriate error feedback to the user.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-001: Add Invalid Product to Cart', () => {
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
    
    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case 1: Add product with non-existent ID
   * Expected: Error notification, cart remains unchanged
   */
  test('should show error when adding product with invalid ID', async () => {
    const initialCartCount = await page.$eval('.cart-badge', el => el.textContent);

    // Attempt to add invalid product via JavaScript
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('invalid-product-999', 1);
    });

    expect(result).toBe(false);

    // Verify error notification appears
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toContain('Product not found');

    // Verify cart count unchanged
    const finalCartCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(finalCartCount).toBe(initialCartCount);
  });

  /**
   * Test Case 2: Add product with null ID
   * Expected: Error handling, no crash
   */
  test('should handle null product ID gracefully', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart(null, 1);
    });

    expect(result).toBe(false);

    // Verify error notification
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toMatch(/invalid|not found/i);
  });

  /**
   * Test Case 3: Add product with undefined ID
   * Expected: Error handling, no crash
   */
  test('should handle undefined product ID gracefully', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart(undefined, 1);
    });

    expect(result).toBe(false);

    // Verify application still functional
    const cartBadge = await page.$('.cart-badge');
    expect(cartBadge).not.toBeNull();
  });

  /**
   * Test Case 4: Add product with empty string ID
   * Expected: Error handling, validation failure
   */
  test('should reject empty string product ID', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('', 1);
    });

    expect(result).toBe(false);

    // Verify error notification
    await page.waitForSelector('.toast.error', { timeout: 2000 });
  });

  /**
   * Test Case 5: Add product with special characters in ID
   * Expected: Proper validation and error handling
   */
  test('should handle special characters in product ID', async () => {
    const specialIds = ['<script>alert(1)</script>', '../../etc/passwd', 'product-${1+1}'];

    for (const id of specialIds) {
      const result = await page.evaluate((productId) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart(productId, 1);
      }, id);

      expect(result).toBe(false);
    }
  });

  /**
   * Test Case 6: Add product with numeric ID that doesn't exist
   * Expected: Validation failure, error message
   */
  test('should reject non-existent numeric product ID', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart(99999, 1);
    });

    expect(result).toBe(false);

    // Verify cart remains empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 7: Verify localStorage not corrupted by invalid add
   * Expected: localStorage remains valid after error
   */
  test('should not corrupt localStorage when adding invalid product', async () => {
    // Add valid product first
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Attempt to add invalid product
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('invalid-999', 1);
    });

    // Verify localStorage still valid
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData.items)).toBe(true);
    expect(cartData.items.length).toBe(1);
    expect(cartData.items[0].productId).toBe('1');
  });

  /**
   * Test Case 8: Verify UI remains functional after invalid add
   * Expected: All buttons and features still work
   */
  test('should maintain UI functionality after invalid product add', async () => {
    // Attempt invalid add
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('invalid-999', 1);
    });

    // Verify valid add still works
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);

    // Verify Go to Cart button works
    const goToCartBtn = await page.$('.go-to-cart-btn');
    expect(goToCartBtn).not.toBeNull();
  });

  /**
   * Test Case 9: Multiple consecutive invalid adds
   * Expected: System remains stable, no memory leaks
   */
  test('should handle multiple consecutive invalid adds', async () => {
    const invalidIds = ['inv1', 'inv2', 'inv3', 'inv4', 'inv5'];

    for (const id of invalidIds) {
      await page.evaluate((productId) => {
        const cartManager = window.cartManager;
        cartManager.addToCart(productId, 1);
      }, id);
    }

    // Verify cart still empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Verify page still responsive
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
  });

  /**
   * Test Case 10: Invalid product add with valid quantity
   * Expected: Product validation fails before quantity check
   */
  test('should validate product ID before quantity', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('invalid-999', 5);
    });

    expect(result).toBe(false);

    // Verify error message mentions product, not quantity
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toMatch(/product|not found/i);
    expect(errorMessage).not.toMatch(/quantity/i);
  });

  /**
   * Test Case 11: Add invalid product then navigate to cart
   * Expected: Cart page shows empty state
   */
  test('should show empty cart after invalid product add attempt', async () => {
    // Attempt invalid add
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('invalid-999', 1);
    });

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Verify empty cart message
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    const messageText = await page.$eval('.empty-cart-message', el => el.textContent);
    expect(messageText).toMatch(/empty|no items/i);
  });

  /**
   * Test Case 12: Verify error logging for invalid product
   * Expected: Error logged to console
   */
  test('should log error to console for invalid product', async () => {
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        consoleLogs.push(msg.text());
      }
    });

    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('invalid-999', 1);
    });

    await page.waitForTimeout(500);

    // Verify error was logged
    const hasError = consoleLogs.some(log => 
      log.includes('invalid') || log.includes('not found') || log.includes('error')
    );
    expect(hasError).toBe(true);
  });
});

