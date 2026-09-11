/**
 * Negative Test: Add Product with Negative Quantity
 * 
 * Test ID: NEG-003
 * Category: Negative Testing
 * Priority: High
 * 
 * Description:
 * Verify that the application properly validates and rejects attempts to add
 * products with negative quantities to the cart.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-003: Add Product with Negative Quantity', () => {
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
   * Test Case 1: Add product with quantity = -1
   * Expected: Validation error, cart unchanged
   */
  test('should reject negative quantity (-1)', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', -1);
    });

    expect(result).toBe(false);

    // Verify error notification
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toMatch(/quantity|invalid|positive|negative/i);

    // Verify cart empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 2: Add product with large negative quantity
   * Expected: Validation error
   */
  test('should reject large negative quantity (-999)', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', -999);
    });

    expect(result).toBe(false);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 3: Add product with negative decimal quantity
   * Expected: Validation error
   */
  test('should reject negative decimal quantity (-2.5)', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', -2.5);
    });

    expect(result).toBe(false);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 4: Add product with string negative quantity
   * Expected: Validation error or proper conversion and rejection
   */
  test('should handle string negative quantity "-5"', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', '-5');
    });

    expect(result).toBe(false);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 5: Update existing item to negative quantity
   * Expected: Validation error, quantity unchanged or item removed
   */
  test('should reject updating item to negative quantity', async () => {
    // Add item with valid quantity
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    let cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);

    // Try to update to negative
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.updateQuantity('1', -3);
    });

    expect(result).toBe(false);

    // Verify item still exists with original quantity
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items.length).toBeGreaterThan(0);
    expect(cartData.items[0].quantity).toBeGreaterThan(0);
  });

  /**
   * Test Case 6: Multiple products with negative quantities
   * Expected: All rejected
   */
  test('should reject multiple products with negative quantities', async () => {
    const testCases = [
      { id: '1', qty: -1 },
      { id: '2', qty: -5 },
      { id: '3', qty: -10 },
      { id: '4', qty: -100 }
    ];

    for (const testCase of testCases) {
      const result = await page.evaluate((id, qty) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart(id, qty);
      }, testCase.id, testCase.qty);

      expect(result).toBe(false);
    }

    // Verify cart empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 7: Negative quantity with valid product
   * Expected: Product validation passes, quantity validation fails
   */
  test('should validate quantity after product validation', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', -5);
    });

    expect(result).toBe(false);

    // Error should mention quantity
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toMatch(/quantity|negative|positive/i);
  });

  /**
   * Test Case 8: Verify localStorage integrity after negative quantity
   * Expected: localStorage not corrupted
   */
  test('should maintain localStorage integrity with negative quantity attempt', async () => {
    // Add valid item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Try negative quantity
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('2', -5);
    });

    // Verify localStorage valid
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData.items)).toBe(true);
    expect(cartData.items.length).toBe(1);
    expect(cartData.items[0].quantity).toBeGreaterThan(0);
  });

  /**
   * Test Case 9: Negative quantity on cart page input
   * Expected: Input validation prevents negative values
   */
  test('should prevent negative quantity input on cart page', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Try to set negative quantity
    await page.evaluate(() => {
      const quantityInput = document.querySelector('.quantity-input');
      if (quantityInput) {
        quantityInput.value = '-5';
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(500);

    // Verify quantity remains positive
    const quantity = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(quantity).toBeGreaterThan(0);
  });

  /**
   * Test Case 10: Extreme negative values
   * Expected: Proper handling of edge cases
   */
  test('should handle extreme negative values', async () => {
    const extremeValues = [-Number.MAX_SAFE_INTEGER, -Infinity, -999999999];

    for (const value of extremeValues) {
      const result = await page.evaluate((qty) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart('1', qty);
      }, value);

      expect(result).toBe(false);
    }

    // Verify cart empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 11: Negative quantity with special number formats
   * Expected: Proper validation
   */
  test('should handle special negative number formats', async () => {
    const specialFormats = ['-0', '-0.0', '-1e2', '-1.5e1'];

    for (const format of specialFormats) {
      const result = await page.evaluate((qty) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart('1', qty);
      }, format);

      expect(result).toBe(false);
    }
  });

  /**
   * Test Case 12: Rapid negative quantity attempts
   * Expected: System stability maintained
   */
  test('should handle rapid negative quantity attempts', async () => {
    for (let i = 0; i < 20; i++) {
      await page.evaluate((iteration) => {
        const cartManager = window.cartManager;
        cartManager.addToCart('1', -iteration);
      }, i);
    }

    // Verify system still functional
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Verify valid add still works
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(1);
  });

  /**
   * Test Case 13: Negative quantity error message clarity
   * Expected: Clear, actionable error message
   */
  test('should display clear error for negative quantity', async () => {
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('1', -5);
    });

    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);

    expect(errorMessage.length).toBeGreaterThan(10);
    expect(errorMessage).toMatch(/quantity|negative|positive|must be/i);
  });

  /**
   * Test Case 14: Negative quantity doesn't affect cart totals
   * Expected: Cart totals remain accurate
   */
  test('should not affect cart totals with negative quantity attempt', async () => {
    // Add valid items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Get initial total
    const initialTotal = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.getCartTotal();
    });

    // Try negative quantity
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('3', -10);
    });

    // Verify total unchanged
    const finalTotal = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.getCartTotal();
    });

    expect(finalTotal.subtotal).toBe(initialTotal.subtotal);
    expect(finalTotal.total).toBe(initialTotal.total);
  });
});

