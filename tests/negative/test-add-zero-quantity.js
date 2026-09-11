/**
 * Negative Test: Add Product with Zero Quantity
 * 
 * Test ID: NEG-002
 * Category: Negative Testing
 * Priority: High
 * 
 * Description:
 * Verify that the application properly validates and rejects attempts to add
 * products with zero quantity to the cart.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-002: Add Product with Zero Quantity', () => {
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
   * Test Case 1: Add product with quantity = 0
   * Expected: Validation error, cart unchanged
   */
  test('should reject adding product with zero quantity', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', 0);
    });

    expect(result).toBe(false);

    // Verify error notification
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toMatch(/quantity|invalid|must be greater/i);

    // Verify cart remains empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 2: Update existing item quantity to 0
   * Expected: Item should be removed from cart
   */
  test('should remove item when quantity updated to 0', async () => {
    // Add item with valid quantity
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify item added
    let cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);

    // Update quantity to 0
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.updateQuantity('1', 0);
    });

    // Item should be removed
    cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 3: Add product with string "0" quantity
   * Expected: Validation error or conversion to 0 and rejection
   */
  test('should handle string "0" quantity', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', '0');
    });

    expect(result).toBe(false);

    // Verify cart empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 4: Add product with 0.0 (float zero)
   * Expected: Validation error
   */
  test('should reject float zero quantity', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', 0.0);
    });

    expect(result).toBe(false);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 5: Multiple products with zero quantity
   * Expected: All rejected, cart remains empty
   */
  test('should reject multiple products with zero quantity', async () => {
    const productIds = ['1', '2', '3', '4'];

    for (const id of productIds) {
      const result = await page.evaluate((productId) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart(productId, 0);
      }, id);

      expect(result).toBe(false);
    }

    // Verify cart still empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);
  });

  /**
   * Test Case 6: Add valid item, then try to add zero quantity of another
   * Expected: First item remains, second rejected
   */
  test('should maintain existing cart when zero quantity add fails', async () => {
    // Add valid item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    let cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);

    // Try to add another with zero quantity
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('2', 0);
    });

    expect(result).toBe(false);

    // Verify first item still in cart
    cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(1);
  });

  /**
   * Test Case 7: Verify error message clarity
   * Expected: Clear, user-friendly error message
   */
  test('should display clear error message for zero quantity', async () => {
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('1', 0);
    });

    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);

    // Error should be clear and actionable
    expect(errorMessage.length).toBeGreaterThan(10);
    expect(errorMessage).toMatch(/quantity|0|zero|greater|positive/i);
  });

  /**
   * Test Case 8: Zero quantity on cart page
   * Expected: Proper handling in cart UI
   */
  test('should handle zero quantity input on cart page', async () => {
    // Add item first
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Try to set quantity to 0 via input
    await page.evaluate(() => {
      const quantityInput = document.querySelector('.quantity-input');
      if (quantityInput) {
        quantityInput.value = '0';
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(500);

    // Item should be removed or quantity reset to 1
    const cartItems = await page.$$('.cart-item');
    if (cartItems.length > 0) {
      const quantity = await page.$eval('.quantity-input', el => parseInt(el.value));
      expect(quantity).toBeGreaterThan(0);
    }
  });

  /**
   * Test Case 9: Verify localStorage not corrupted by zero quantity
   * Expected: localStorage remains valid
   */
  test('should not corrupt localStorage with zero quantity attempt', async () => {
    // Add valid item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Try zero quantity
    await page.evaluate(() => {
      const cartManager = window.cartManager;
      cartManager.addToCart('2', 0);
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
   * Test Case 10: Zero quantity with valid product ID
   * Expected: Product validation passes, quantity validation fails
   */
  test('should validate quantity after product validation', async () => {
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', 0);
    });

    expect(result).toBe(false);

    // Error should mention quantity, not product
    await page.waitForSelector('.toast.error', { timeout: 2000 });
    const errorMessage = await page.$eval('.toast.error', el => el.textContent);
    expect(errorMessage).toMatch(/quantity/i);
  });

  /**
   * Test Case 11: Rapid zero quantity attempts
   * Expected: System remains stable
   */
  test('should handle rapid zero quantity add attempts', async () => {
    const attempts = 10;

    for (let i = 0; i < attempts; i++) {
      await page.evaluate(() => {
        const cartManager = window.cartManager;
        cartManager.addToCart('1', 0);
      });
    }

    // Verify cart still empty and functional
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Verify valid add still works
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const finalCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(finalCount).toBe(1);
  });

  /**
   * Test Case 12: Zero quantity boundary with decimals
   * Expected: Proper validation of 0.1, 0.5, 0.9
   */
  test('should handle decimal quantities near zero', async () => {
    const quantities = [0.1, 0.5, 0.9];

    for (const qty of quantities) {
      const result = await page.evaluate((quantity) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart('1', quantity);
      }, qty);

      // Should either reject or round to 1
      if (result) {
        const cartData = await page.evaluate(() => {
          const data = localStorage.getItem('shopping_cart');
          return JSON.parse(data);
        });
        expect(cartData.items[0].quantity).toBe(1);
      }
    }
  });
});

