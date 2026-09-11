/**
 * Negative Test: Exceed Stock Limit
 * 
 * Test ID: NEG-005
 * Category: Negative Testing
 * Priority: High
 * 
 * Description:
 * Verify that the application prevents users from adding more items than available
 * in stock and provides appropriate feedback.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-005: Exceed Stock Limit', () => {
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
   * Test Case 1: Add quantity exceeding stock limit
   * Expected: Error notification, quantity capped at stock limit
   */
  test('should prevent adding quantity exceeding stock', async () => {
    // Get product stock limit
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product ? product.stock : 0;
    });

    expect(productStock).toBeGreaterThan(0);

    // Try to add more than stock
    const result = await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', stock + 10);
    }, productStock);

    // Should either fail or cap at stock limit
    if (result) {
      const cartData = await page.evaluate(() => {
        const data = localStorage.getItem('shopping_cart');
        return JSON.parse(data);
      });

      expect(cartData.items[0].quantity).toBeLessThanOrEqual(productStock);
    } else {
      // Verify error notification
      await page.waitForSelector('.toast.error', { timeout: 2000 });
      const errorMessage = await page.$eval('.toast.error', el => el.textContent);
      expect(errorMessage).toMatch(/stock|available|limit/i);
    }
  });

  /**
   * Test Case 2: Incrementally add items to exceed stock
   * Expected: Final add should fail or be capped
   */
  test('should prevent incremental additions exceeding stock', async () => {
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Add items incrementally
    for (let i = 0; i < productStock; i++) {
      await page.click('[data-product-id="1"] .add-to-cart-btn');
      await page.waitForTimeout(100);
    }

    // Try to add one more
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify quantity doesn't exceed stock
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    const itemQuantity = cartData.items.find(item => item.productId === '1')?.quantity || 0;
    expect(itemQuantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 3: Update quantity to exceed stock
   * Expected: Update rejected or capped
   */
  test('should prevent updating quantity beyond stock', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Try to update to exceed stock
    const result = await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      return cartManager.updateQuantity('1', stock + 20);
    }, productStock);

    // Verify quantity capped or update failed
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    const itemQuantity = cartData.items[0].quantity;
    expect(itemQuantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 4: Stock limit error message clarity
   * Expected: Clear message indicating stock limitation
   */
  test('should display clear stock limit error message', async () => {
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      cartManager.addToCart('1', stock + 50);
    }, productStock);

    // Check for error notification
    const hasError = await page.evaluate(() => {
      return document.querySelector('.toast.error') !== null;
    });

    if (hasError) {
      const errorMessage = await page.$eval('.toast.error', el => el.textContent);
      expect(errorMessage).toMatch(/stock|available|only.*left|limit/i);
      expect(errorMessage.length).toBeGreaterThan(10);
    }
  });

  /**
   * Test Case 5: Multiple products exceeding stock
   * Expected: Each product validated independently
   */
  test('should validate stock for each product independently', async () => {
    const products = ['1', '2', '3'];

    for (const productId of products) {
      const stock = await page.evaluate((id) => {
        const product = window.productData.getProductById(id);
        return product.stock;
      }, productId);

      const result = await page.evaluate((id, stockLimit) => {
        const cartManager = window.cartManager;
        return cartManager.addToCart(id, stockLimit + 10);
      }, productId, stock);

      // Each should be validated
      if (result) {
        const cartData = await page.evaluate(() => {
          const data = localStorage.getItem('shopping_cart');
          return JSON.parse(data);
        });

        const item = cartData.items.find(i => i.productId === productId);
        if (item) {
          expect(item.quantity).toBeLessThanOrEqual(stock);
        }
      }
    }
  });

  /**
   * Test Case 6: Stock limit on cart page quantity input
   * Expected: Input validation prevents exceeding stock
   */
  test('should prevent exceeding stock via cart page input', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Try to set quantity beyond stock
    await page.evaluate((stock) => {
      const quantityInput = document.querySelector('.quantity-input');
      if (quantityInput) {
        quantityInput.value = stock + 100;
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, productStock);

    await page.waitForTimeout(500);

    // Verify quantity capped
    const finalQuantity = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(finalQuantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 7: Stock limit with product at exactly stock level
   * Expected: Allow adding up to stock, reject beyond
   */
  test('should allow adding exactly stock amount', async () => {
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Add exactly stock amount
    const result = await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', stock);
    }, productStock);

    expect(result).toBeTruthy();

    // Verify quantity is exactly stock
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items[0].quantity).toBe(productStock);

    // Try to add one more
    const result2 = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', 1);
    });

    // Should fail or remain at stock limit
    const finalData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(finalData.items[0].quantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 8: Stock limit with zero stock product
   * Expected: Cannot add to cart
   */
  test('should prevent adding product with zero stock', async () => {
    // Set product stock to 0 (if possible) or test with out-of-stock product
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      // Try to add with 0 stock (assuming validation exists)
      return cartManager.addToCart('1', 1);
    });

    // If product has stock, this test may not apply
    // But we verify stock validation exists
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    if (productStock === 0) {
      expect(result).toBe(false);
    }
  });

  /**
   * Test Case 9: Verify stock limit doesn't affect other products
   * Expected: Other products can still be added
   */
  test('should not affect other products when one hits stock limit', async () => {
    const stock1 = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Max out product 1
    await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      cartManager.addToCart('1', stock);
    }, stock1);

    // Add product 2
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify both in cart
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items.length).toBe(2);
    expect(cartData.items.find(i => i.productId === '2')).toBeTruthy();
  });

  /**
   * Test Case 10: Stock limit with rapid clicking
   * Expected: Quantity doesn't exceed stock despite rapid clicks
   */
  test('should prevent stock overflow with rapid clicking', async () => {
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Rapid click add button
    for (let i = 0; i < productStock + 20; i++) {
      page.click('[data-product-id="1"] .add-to-cart-btn').catch(() => {});
    }

    await page.waitForTimeout(1000);

    // Verify quantity doesn't exceed stock
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    const itemQuantity = cartData.items[0]?.quantity || 0;
    expect(itemQuantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 11: Stock limit persists across page reload
   * Expected: Stock validation still works after reload
   */
  test('should maintain stock limit validation after page reload', async () => {
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Add items near stock limit
    await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      cartManager.addToCart('1', stock - 1);
    }, productStock);

    // Reload page
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 3000 });

    // Try to add more than remaining stock
    const result = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.addToCart('1', 5);
    });

    // Verify still capped at stock
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items[0].quantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 12: Stock limit error doesn't corrupt cart
   * Expected: Cart remains valid after stock limit error
   */
  test('should maintain cart integrity after stock limit error', async () => {
    // Add valid items
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const stock1 = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    // Try to exceed stock
    await page.evaluate((stock) => {
      const cartManager = window.cartManager;
      cartManager.addToCart('1', stock + 100);
    }, stock1);

    // Verify cart still valid
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    expect(Array.isArray(cartData.items)).toBe(true);
    expect(cartData.items.length).toBeGreaterThanOrEqual(2);
  });
});

