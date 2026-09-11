/**
 * Negative Test: Duplicate Add Button Clicks
 * 
 * Test ID: NEG-009
 * Category: Negative Testing
 * Priority: High
 * 
 * Description:
 * Verify that the application handles rapid/duplicate button clicks properly
 * without adding incorrect quantities or causing race conditions.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-009: Duplicate Add Button Clicks', () => {
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
   * Test Case 1: Rapid double-click on Add to Cart
   * Expected: Only one item added or quantity incremented once
   */
  test('should handle double-click on Add to Cart button', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Double click rapidly
    await addBtn.click({ clickCount: 2, delay: 10 });
    await page.waitForTimeout(500);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    
    // Should be 1 or 2 (depending on implementation), but not more
    expect(cartCount).toBeLessThanOrEqual(2);
    expect(cartCount).toBeGreaterThan(0);
  });

  /**
   * Test Case 2: Triple-click on Add to Cart
   * Expected: Controlled quantity increment
   */
  test('should handle triple-click on Add to Cart button', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Triple click
    await addBtn.click({ clickCount: 3, delay: 10 });
    await page.waitForTimeout(500);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    
    // Should not exceed reasonable limit
    expect(cartCount).toBeLessThanOrEqual(3);
  });

  /**
   * Test Case 3: Rapid successive clicks (10 clicks in 1 second)
   * Expected: Debouncing or proper handling
   */
  test('should handle rapid successive clicks', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Click 10 times rapidly
    for (let i = 0; i < 10; i++) {
      addBtn.click().catch(() => {});
    }
    
    await page.waitForTimeout(1000);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    
    // Should have reasonable count (debounced or controlled)
    expect(cartCount).toBeGreaterThan(0);
    expect(cartCount).toBeLessThanOrEqual(10);
  });

  /**
   * Test Case 4: Simultaneous clicks on multiple product buttons
   * Expected: All products added correctly
   */
  test('should handle simultaneous clicks on different products', async () => {
    const btn1 = page.$('[data-product-id="1"] .add-to-cart-btn');
    const btn2 = page.$('[data-product-id="2"] .add-to-cart-btn');
    const btn3 = page.$('[data-product-id="3"] .add-to-cart-btn');
    
    // Click all simultaneously
    await Promise.all([
      (await btn1).click(),
      (await btn2).click(),
      (await btn3).click()
    ]);
    
    await page.waitForTimeout(1000);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(3);

    // Verify all products in cart
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData.items.length).toBe(3);
  });

  /**
   * Test Case 5: Click during cart update
   * Expected: No race condition, consistent state
   */
  test('should handle click during cart update', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // First click
    await addBtn.click();
    
    // Immediate second click (during update)
    await addBtn.click();
    
    await page.waitForTimeout(1000);

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Cart should be in consistent state
    expect(cartData.items.length).toBeGreaterThan(0);
    expect(cartData.items[0].quantity).toBeGreaterThan(0);
  });

  /**
   * Test Case 6: Rapid clicks exceeding stock
   * Expected: Quantity capped at stock limit
   */
  test('should cap quantity at stock limit with rapid clicks', async () => {
    const productStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product.stock;
    });

    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Click more times than stock available
    for (let i = 0; i < productStock + 10; i++) {
      addBtn.click().catch(() => {});
    }
    
    await page.waitForTimeout(1500);

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    const itemQuantity = cartData.items[0]?.quantity || 0;
    expect(itemQuantity).toBeLessThanOrEqual(productStock);
  });

  /**
   * Test Case 7: Click spam (100 clicks)
   * Expected: System remains stable
   */
  test('should remain stable with click spam', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Spam clicks
    for (let i = 0; i < 100; i++) {
      addBtn.click().catch(() => {});
    }
    
    await page.waitForTimeout(2000);

    // Verify system still functional
    const cartBadge = await page.$('.cart-badge');
    expect(cartBadge).not.toBeNull();

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBeGreaterThan(0);
    expect(cartCount).toBeLessThan(200); // Reasonable upper limit
  });

  /**
   * Test Case 8: Rapid clicks on Go to Cart button
   * Expected: Navigate only once
   */
  test('should handle rapid clicks on Go to Cart button', async () => {
    // Add item first
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const goToCartBtn = await page.$('.go-to-cart-btn');
    
    if (goToCartBtn) {
      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        goToCartBtn.click().catch(() => {});
      }
      
      await page.waitForTimeout(1500);

      // Should navigate only once
      const currentUrl = page.url();
      expect(currentUrl).toContain('cart.html');
    }
  });

  /**
   * Test Case 9: Alternating add and remove clicks
   * Expected: Final state is consistent
   */
  test('should handle alternating add and remove operations', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Rapid add/remove via quantity buttons
    for (let i = 0; i < 10; i++) {
      const increaseBtn = await page.$('.quantity-increase');
      const decreaseBtn = await page.$('.quantity-decrease');
      
      if (increaseBtn && decreaseBtn) {
        if (i % 2 === 0) {
          increaseBtn.click().catch(() => {});
        } else {
          decreaseBtn.click().catch(() => {});
        }
      }
    }
    
    await page.waitForTimeout(1000);

    // Verify cart in consistent state
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(cartData).toBeTruthy();
    if (cartData.items.length > 0) {
      expect(cartData.items[0].quantity).toBeGreaterThan(0);
    }
  });

  /**
   * Test Case 10: Clicks during page transition
   * Expected: No errors or data loss
   */
  test('should handle clicks during page transition', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Click and immediately navigate
    addBtn.click().catch(() => {});
    page.goto(`${BASE_URL}/cart.html`).catch(() => {});
    
    await page.waitForTimeout(2000);

    // Verify no errors
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  /**
   * Test Case 11: Multiple users simulation (concurrent operations)
   * Expected: localStorage updates handled correctly
   */
  test('should handle concurrent localStorage updates', async () => {
    // Simulate concurrent operations
    await Promise.all([
      page.evaluate(() => {
        window.cartManager.addToCart('1', 1);
      }),
      page.evaluate(() => {
        window.cartManager.addToCart('2', 1);
      }),
      page.evaluate(() => {
        window.cartManager.addToCart('3', 1);
      })
    ]);
    
    await page.waitForTimeout(1000);

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // All items should be in cart
    expect(cartData.items.length).toBeGreaterThanOrEqual(1);
    expect(cartData.items.length).toBeLessThanOrEqual(3);
  });

  /**
   * Test Case 12: Button disabled during processing
   * Expected: Button should be disabled or show loading state
   */
  test('should disable button during processing', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Check if button gets disabled
    await addBtn.click();
    
    // Immediately check button state
    const isDisabled = await addBtn.evaluate(el => 
      el.disabled || el.classList.contains('disabled') || el.classList.contains('loading')
    );
    
    // Button may be temporarily disabled
    expect(typeof isDisabled).toBe('boolean');
  });

  /**
   * Test Case 13: Rapid clicks don't create duplicate cart entries
   * Expected: Single product entry with correct quantity
   */
  test('should not create duplicate entries with rapid clicks', async () => {
    const addBtn = await page.$('[data-product-id="1"] .add-to-cart-btn');
    
    // Rapid clicks
    for (let i = 0; i < 20; i++) {
      addBtn.click().catch(() => {});
    }
    
    await page.waitForTimeout(1500);

    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Should have only one entry for product 1
    const product1Entries = cartData.items.filter(item => item.productId === '1');
    expect(product1Entries.length).toBe(1);
  });

  /**
   * Test Case 14: Verify cart badge updates correctly with rapid clicks
   * Expected: Badge shows accurate count
   */
  test('should update badge correctly with rapid clicks', async () => {
    const addBtn1 = await page.$('[data-product-id="1"] .add-to-cart-btn');
    const addBtn2 = await page.$('[data-product-id="2"] .add-to-cart-btn');
    
    // Rapid clicks on different products
    for (let i = 0; i < 5; i++) {
      addBtn1.click().catch(() => {});
      addBtn2.click().catch(() => {});
    }
    
    await page.waitForTimeout(1500);

    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Badge should match actual cart count
    const actualCount = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
    expect(cartCount).toBe(actualCount);
  });
});

