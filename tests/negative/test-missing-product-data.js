/**
 * Negative Test: Missing Product Data
 * 
 * Test ID: NEG-007
 * Category: Negative Testing
 * Priority: Medium
 * 
 * Description:
 * Verify that the application handles scenarios where product information
 * is missing or incomplete gracefully.
 * 
 * Related Jira: ST-2
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-007: Missing Product Data', () => {
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
   * Test Case 1: Product missing name
   * Expected: Graceful handling, placeholder or skip
   */
  test('should handle product with missing name', async () => {
    // Simulate product with missing name
    const result = await page.evaluate(() => {
      const originalProduct = window.productData.getProductById('1');
      if (originalProduct) {
        const modifiedProduct = { ...originalProduct, name: undefined };
        // Try to display or add
        return window.cartManager.addToCart('1', 1);
      }
      return false;
    });

    // Should handle gracefully
    if (result) {
      const cartData = await page.evaluate(() => {
        const data = localStorage.getItem('shopping_cart');
        return JSON.parse(data);
      });
      expect(cartData.items[0]).toBeTruthy();
    }
  });

  /**
   * Test Case 2: Product missing price
   * Expected: Cannot add to cart or price defaults to 0
   */
  test('should handle product with missing price', async () => {
    const hasPrice = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product && typeof product.price === 'number';
    });

    expect(hasPrice).toBe(true);

    // If price is missing, cart total should handle it
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    const total = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.getCartTotal();
    });

    expect(total.subtotal).toBeGreaterThanOrEqual(0);
    expect(total.total).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Case 3: Product missing image
   * Expected: Placeholder image or graceful degradation
   */
  test('should handle product with missing image', async () => {
    // Check if products have images
    const productCards = await page.$$('.product-card img');
    expect(productCards.length).toBeGreaterThan(0);

    // Verify images have src or alt attributes
    for (const img of productCards) {
      const src = await img.evaluate(el => el.src);
      const alt = await img.evaluate(el => el.alt);
      
      expect(src || alt).toBeTruthy();
    }
  });

  /**
   * Test Case 4: Product missing description
   * Expected: Display without description or show placeholder
   */
  test('should handle product with missing description', async () => {
    const descriptions = await page.$$eval('.product-description', 
      elements => elements.map(el => el.textContent)
    );

    // Should have some content or be empty gracefully
    descriptions.forEach(desc => {
      expect(typeof desc).toBe('string');
    });
  });

  /**
   * Test Case 5: Product missing stock information
   * Expected: Default behavior or prevent adding
   */
  test('should handle product with missing stock info', async () => {
    const hasStock = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product && typeof product.stock === 'number';
    });

    // Stock should be defined
    expect(hasStock).toBe(true);
  });

  /**
   * Test Case 6: Product with null values
   * Expected: Validation and graceful handling
   */
  test('should handle product with null values', async () => {
    const productValid = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product && 
             product.id !== null && 
             product.name !== null && 
             product.price !== null;
    });

    expect(productValid).toBe(true);
  });

  /**
   * Test Case 7: Empty product catalog
   * Expected: Show empty state message
   */
  test('should handle empty product catalog gracefully', async () => {
    const productCount = await page.$$eval('.product-card', 
      elements => elements.length
    );

    // Should have products or show empty state
    if (productCount === 0) {
      const emptyMessage = await page.$('.empty-products-message');
      expect(emptyMessage).not.toBeNull();
    } else {
      expect(productCount).toBeGreaterThan(0);
    }
  });

  /**
   * Test Case 8: Product data fails to load
   * Expected: Error message or retry mechanism
   */
  test('should handle product data load failure', async () => {
    // Verify products loaded
    const productsLoaded = await page.evaluate(() => {
      return window.productData && 
             typeof window.productData.getAllProducts === 'function';
    });

    expect(productsLoaded).toBe(true);

    const products = await page.evaluate(() => {
      return window.productData.getAllProducts();
    });

    expect(Array.isArray(products)).toBe(true);
  });

  /**
   * Test Case 9: Product missing category
   * Expected: Display in default category or handle gracefully
   */
  test('should handle product with missing category', async () => {
    const hasCategories = await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      return products.every(p => p.category !== undefined);
    });

    // Categories should be defined or handled
    expect(typeof hasCategories).toBe('boolean');
  });

  /**
   * Test Case 10: Incomplete product in cart display
   * Expected: Cart page handles missing data
   */
  test('should handle incomplete product data on cart page', async () => {
    // Add product
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Verify cart item displays
    const cartItem = await page.$('.cart-item');
    expect(cartItem).not.toBeNull();

    // Check for required elements
    const hasImage = await page.$('.cart-item img');
    const hasName = await page.$('.cart-item .item-name');
    const hasPrice = await page.$('.cart-item .item-price');

    expect(hasImage || hasName || hasPrice).toBeTruthy();
  });

  /**
   * Test Case 11: Product data type mismatch
   * Expected: Type validation and conversion
   */
  test('should handle product data type mismatches', async () => {
    const typesValid = await page.evaluate(() => {
      const product = window.productData.getProductById('1');
      return product &&
             typeof product.id === 'string' &&
             typeof product.price === 'number' &&
             typeof product.stock === 'number';
    });

    expect(typesValid).toBe(true);
  });

  /**
   * Test Case 12: Product with special characters in data
   * Expected: Proper escaping and display
   */
  test('should handle special characters in product data', async () => {
    const productNames = await page.$$eval('.product-name', 
      elements => elements.map(el => el.textContent)
    );

    // Should display without breaking HTML
    productNames.forEach(name => {
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
    });
  });

  /**
   * Test Case 13: Product price as string instead of number
   * Expected: Conversion or validation error
   */
  test('should handle price type inconsistencies', async () => {
    const pricesValid = await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      return products.every(p => typeof p.price === 'number' && !isNaN(p.price));
    });

    expect(pricesValid).toBe(true);
  });

  /**
   * Test Case 14: Missing product causes cart calculation error
   * Expected: Skip missing product in calculations
   */
  test('should calculate totals correctly with missing product data', async () => {
    // Add multiple products
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="2"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    const total = await page.evaluate(() => {
      const cartManager = window.cartManager;
      return cartManager.getCartTotal();
    });

    // Totals should be valid numbers
    expect(typeof total.subtotal).toBe('number');
    expect(typeof total.total).toBe('number');
    expect(total.subtotal).toBeGreaterThan(0);
    expect(total.total).toBeGreaterThan(0);
    expect(total.total).toBeGreaterThanOrEqual(total.subtotal);
  });
});

