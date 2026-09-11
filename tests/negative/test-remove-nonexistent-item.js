/**
 * Negative Test: Remove Non-existent Item from Cart
 * 
 * Test ID: NEG-004
 * Category: Negative Testing
 * Priority: Medium
 * 
 * Description:
 * Verify that the application handles attempts to remove items that don't exist
 * in the cart gracefully without errors or data corruption.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-004: Remove Non-existent Item from Cart', () => {
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
   * Test Case 1: Remove item from empty cart
   * Expected: No error, cart remains empty
   */
  test('should handle removing item from empty cart', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart('1');
    });

    // Should return false or handle gracefully
    expect(result).toBeFalsy();

    // Verify cart still empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 2: Remove item with invalid ID
   * Expected: No error, cart unchanged
   */
  test('should handle removing item with invalid ID', async () => {
    // Add valid item first
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const initialCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    // Try to remove invalid item
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart('invalid-999');
    });

    expect(result).toBeFalsy();

    // Verify cart unchanged
    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(initialCount);
  });

  /**
   * Test Case 3: Remove item with null ID
   * Expected: Proper error handling
   */
  test('should handle null product ID in remove operation', async () => {
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart(null);
    });

    expect(result).toBeFalsy();

    // Verify original item still in cart
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 4: Remove item with undefined ID
   * Expected: Proper error handling
   */
  test('should handle undefined product ID in remove operation', async () => {
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart(undefined);
    });

    expect(result).toBeFalsy();

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 5: Remove already removed item
   * Expected: No error, cart unchanged
   */
  test('should handle removing already removed item', async () => {
    // Add and remove item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.removeFromCart('1');
    });

    await page.waitForTimeout(300);

    // Try to remove again
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart('1');
    });

    expect(result).toBeFalsy();

    // Verify cart empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 6: Remove item that was never added
   * Expected: No error, existing items unchanged
   */
  test('should handle removing item that was never added', async () => {
    // Add items 1 and 2
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const initialCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));

    // Try to remove item 3 (never added)
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart('3');
    });

    expect(result).toBeFalsy();

    // Verify cart unchanged
    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(initialCount);
  });

  /**
   * Test Case 7: Multiple remove attempts on non-existent item
   * Expected: System remains stable
   */
  test('should handle multiple remove attempts on non-existent item', async () => {
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Multiple remove attempts
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        const cartManager = window.cartManager;
        cartManager.removeFromCart('invalid-999');
      });
    }

    // Verify original item still in cart
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 8: Remove with special characters in ID
   * Expected: Proper validation and error handling
   */
  test('should handle special characters in remove ID', async () => {
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const specialIds = ['<script>alert(1)</script>', '../../etc/passwd', 'product-${1+1}'];

    for (const id of specialIds) {
      const result = await page.evaluate((productId) => {
        const cartManager = window.cartManager;
        return cartManager.removeFromCart(productId);
      }, id);

      expect(result).toBeFalsy();
    }

    // Verify original item still in cart
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 9: Verify localStorage integrity after failed remove
   * Expected: localStorage not corrupted
   */
  test('should maintain localStorage integrity after failed remove', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Try to remove non-existent item
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.removeFromCart('invalid-999');
    });

    // Verify localStorage valid
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData.items)).toBe(true);
    expect(cartData.items.length).toBe(2);
    expect(cartData.items[0].productId).toBe('1');
    expect(cartData.items[1].productId).toBe('2');
  });

  /**
   * Test Case 10: Remove on cart page with invalid item
   * Expected: No UI errors, cart display correct
   */
  test('should handle remove button click for non-existent item on cart page', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Try to remove via JavaScript (simulating corrupted state)
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart('999');
    });

    expect(result).toBeFalsy();

    // Verify original item still displayed
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);
  });

  /**
   * Test Case 11: Remove with empty string ID
   * Expected: Proper validation
   */
  test('should handle empty string in remove operation', async () => {
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart('');
    });

    expect(result).toBeFalsy();

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 12: Remove doesn't affect cart totals incorrectly
   * Expected: Totals remain accurate
   */
  test('should maintain accurate totals after failed remove', async () => {
    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const initialTotal = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.getCartTotal();
    });

    // Try to remove non-existent item
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.removeFromCart('999');
    });

    const finalTotal = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.getCartTotal();
    });

    expect(finalTotal.subtotal).toBe(initialTotal.subtotal);
    expect(finalTotal.total).toBe(initialTotal.total);
  });

  /**
   * Test Case 13: Remove with numeric ID that doesn't exist
   * Expected: Proper handling
   */
  test('should handle numeric non-existent ID', async () => {
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.removeFromCart(99999);
    });

    expect(result).toBeFalsy();

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 14: Verify no console errors on failed remove
   * Expected: Graceful handling without errors
   */
  test('should not log errors for non-existent item remove', async () => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.removeFromCart('invalid-999');
    });

    await page.waitForTimeout(500);

    // Should handle gracefully without console errors
    expect(consoleErrors.length).toBe(0);
  });
});

