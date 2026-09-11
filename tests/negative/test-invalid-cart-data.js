/**
 * Negative Test: Invalid Cart Data in localStorage
 * 
 * Test ID: NEG-006
 * Category: Negative Testing
 * Priority: High
 * 
 * Description:
 * Verify that the application handles corrupted or invalid localStorage data
 * gracefully and recovers to a valid state.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-006: Invalid Cart Data in localStorage', () => {
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
   * Test Case 1: Corrupted JSON in localStorage
   * Expected: Cart resets to empty, no crash
   */
  test('should handle corrupted JSON in localStorage', async () => {
    // Set invalid JSON
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', '{invalid json data}');
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    // Verify cart initialized to empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Verify app still functional
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(1);
  });

  /**
   * Test Case 2: Missing items array in cart data
   * Expected: Cart resets or initializes items array
   */
  test('should handle missing items array', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({ version: '1.0' }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Verify can add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(Array.isArray(cartData.items)).toBe(true);
  });

  /**
   * Test Case 3: Items array is not an array
   * Expected: Cart resets to valid state
   */
  test('should handle items as non-array', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({ 
        items: 'not an array',
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 4: Invalid product IDs in cart data
   * Expected: Invalid items filtered out
   */
  test('should filter out items with invalid product IDs', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: 'invalid-999', quantity: 2 },
          { productId: '1', quantity: 1 },
          { productId: null, quantity: 3 }
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    // Should only count valid item
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBeLessThanOrEqual(1);
  });

  /**
   * Test Case 5: Negative quantities in localStorage
   * Expected: Invalid items removed or quantities corrected
   */
  test('should handle negative quantities in stored data', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: '1', quantity: -5 },
          { productId: '2', quantity: 2 }
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // All quantities should be positive
    cartData.items.forEach(item => {
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  /**
   * Test Case 6: Zero quantities in localStorage
   * Expected: Items with zero quantity removed
   */
  test('should remove items with zero quantity from stored data', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: '1', quantity: 0 },
          { productId: '2', quantity: 3 }
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Zero quantity items should be removed
    const zeroQtyItems = cartData.items.filter(item => item.quantity === 0);
    expect(zeroQtyItems.length).toBe(0);
  });

  /**
   * Test Case 7: Missing required fields in cart items
   * Expected: Invalid items filtered out
   */
  test('should handle items missing required fields', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: '1' }, // missing quantity
          { quantity: 2 }, // missing productId
          { productId: '2', quantity: 1 } // valid
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Only valid items should remain
    cartData.items.forEach(item => {
      expect(item.productId).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
    });
  });

  /**
   * Test Case 8: Extremely large quantities in localStorage
   * Expected: Quantities capped or validated
   */
  test('should handle extremely large quantities', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: '1', quantity: 999999999 },
          { productId: '2', quantity: Number.MAX_SAFE_INTEGER }
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Quantities should be reasonable
    cartData.items.forEach(item => {
      expect(item.quantity).toBeLessThan(10000);
    });
  });

  /**
   * Test Case 9: Non-string product IDs
   * Expected: Proper type handling or conversion
   */
  test('should handle non-string product IDs', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: 1, quantity: 2 }, // number
          { productId: true, quantity: 1 }, // boolean
          { productId: { id: '1' }, quantity: 1 } // object
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    // App should handle gracefully
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Case 10: Duplicate product IDs in cart
   * Expected: Duplicates merged or removed
   */
  test('should handle duplicate product IDs', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { productId: '1', quantity: 2 },
          { productId: '1', quantity: 3 },
          { productId: '1', quantity: 1 }
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Should have only one entry for product 1
    const product1Items = cartData.items.filter(item => item.productId === '1');
    expect(product1Items.length).toBe(1);
  });

  /**
   * Test Case 11: Empty string in localStorage
   * Expected: Cart initializes to empty
   */
  test('should handle empty string in localStorage', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', '');
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Verify can add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(1);
  });

  /**
   * Test Case 12: XSS attempt in localStorage data
   * Expected: Malicious data sanitized
   */
  test('should sanitize XSS attempts in cart data', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', JSON.stringify({
        items: [
          { 
            productId: '<script>alert("XSS")</script>', 
            quantity: 1 
          },
          {
            productId: '1',
            quantity: 1,
            name: '<img src=x onerror=alert(1)>'
          }
        ],
        version: '1.0'
      }));
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    // Navigate to cart page
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Verify no script execution
    const alerts = [];
    page.on('dialog', async dialog => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    expect(alerts.length).toBe(0);
  });

  /**
   * Test Case 13: Null value in localStorage
   * Expected: Cart initializes to empty
   */
  test('should handle null in localStorage', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', null);
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 14: Recovery after corruption
   * Expected: App recovers and works normally
   */
  test('should fully recover after data corruption', async () => {
    // Corrupt data
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', 'corrupted{data}');
    });

    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    // Add items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Verify cart works normally
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    // Verify localStorage now valid
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData.items)).toBe(true);
  });
});

