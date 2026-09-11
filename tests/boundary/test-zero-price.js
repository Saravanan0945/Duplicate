/**
 * Boundary Value Test Suite: Zero Price Products
 * Test ID Prefix: BVT-ZERO-PRICE
 * 
 * Purpose: Verify the shopping cart correctly handles free products
 * (price = 0) and edge cases around zero pricing.
 * 
 * Boundary Values Tested:
 * - Zero price: 0.00
 * - Near-zero prices: 0.01, 0.001
 * - Negative prices: -0.01 (should be invalid)
 * - Free product calculations
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle free products correctly
 * - Calculations must be accurate with zero prices
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-ZERO-PRICE: Zero Price Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

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
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      localStorage.clear();
      
      // Add a free product to the catalog
      if (window.productData && window.productData.products) {
        window.productData.products.push({
          id: 'free-product-1',
          name: 'Free Sample Product',
          price: 0.00,
          description: 'Complimentary sample',
          image: 'https://via.placeholder.com/300x200',
          category: 'samples',
          stock: 100
        });
      }
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case: BVT-ZERO-PRICE-001
   * Verify adding free product (price = 0.00)
   */
  test('BVT-ZERO-PRICE-001: Should accept free product with zero price', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('free-product-1', 1);
    });

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].price).toBe(0);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-002
   * Verify cart total with only free products
   */
  test('BVT-ZERO-PRICE-002: Should calculate zero total for free products', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 5);
    });

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBe(0);
    expect(cartTotal.tax).toBe(0);
    expect(cartTotal.total).toBe(0);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-003
   * Verify mixed cart with free and paid products
   */
  test('BVT-ZERO-PRICE-003: Should calculate correctly with mixed free and paid products', async () => {
    const paidProductPrice = await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 2);
      window.cartManager.addToCart('product-1', 1);
      
      const product = window.productData.getProductById('product-1');
      return product.price;
    });

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeCloseTo(paidProductPrice, 2);
    expect(cartTotal.tax).toBeCloseTo(paidProductPrice * 0.1, 2);
    expect(cartTotal.total).toBeCloseTo(paidProductPrice * 1.1, 2);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-004
   * Verify "Go to Cart" with free products
   */
  test('BVT-ZERO-PRICE-004: Should navigate to cart with free products', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 1);
    });

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const priceDisplay = await page.$eval('.item-price', el => el.textContent);
    expect(priceDisplay).toMatch(/0\.00|free/i);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-005
   * Verify free product display in cart
   */
  test('BVT-ZERO-PRICE-005: Should display free product correctly in cart', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 3);
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    const itemDetails = await page.evaluate(() => {
      const item = document.querySelector('.cart-item');
      return {
        name: item.querySelector('.item-name')?.textContent,
        price: item.querySelector('.item-price')?.textContent,
        quantity: item.querySelector('.quantity-value')?.textContent
      };
    });

    expect(itemDetails.name).toContain('Free');
    expect(itemDetails.price).toMatch(/0\.00|free/i);
    expect(itemDetails.quantity).toBe('3');
  });

  /**
   * Test Case: BVT-ZERO-PRICE-006
   * Verify near-zero price (0.01)
   */
  test('BVT-ZERO-PRICE-006: Should handle near-zero price correctly (0.01)', async () => {
    await page.evaluate(() => {
      window.productData.products.push({
        id: 'penny-product',
        name: 'Penny Product',
        price: 0.01,
        description: 'One cent product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 100
      });
      
      window.cartManager.addToCart('penny-product', 1);
    });

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeCloseTo(0.01, 2);
    expect(cartTotal.tax).toBeCloseTo(0.001, 3);
    expect(cartTotal.total).toBeCloseTo(0.011, 3);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-007
   * Verify very small price (0.001)
   */
  test('BVT-ZERO-PRICE-007: Should handle very small price (0.001)', async () => {
    await page.evaluate(() => {
      window.productData.products.push({
        id: 'micro-product',
        name: 'Micro Price Product',
        price: 0.001,
        description: 'Fractional cent product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 100
      });
      
      window.cartManager.addToCart('micro-product', 1);
    });

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeCloseTo(0.001, 3);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-008
   * Verify rejection of negative price
   */
  test('BVT-ZERO-PRICE-008: Should reject negative price products', async () => {
    const result = await page.evaluate(() => {
      window.productData.products.push({
        id: 'negative-product',
        name: 'Negative Price Product',
        price: -0.01,
        description: 'Invalid negative price',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 100
      });
      
      return window.cartManager.addToCart('negative-product', 1);
    });

    // Should either reject or treat as zero
    if (!result.success) {
      expect(result.error).toMatch(/invalid|price|negative/i);
    } else {
      const cartTotal = await page.evaluate(() => {
        return window.cartManager.getCartTotal();
      });
      expect(cartTotal.subtotal).toBeGreaterThanOrEqual(0);
    }
  });

  /**
   * Test Case: BVT-ZERO-PRICE-009
   * Verify multiple free products with different quantities
   */
  test('BVT-ZERO-PRICE-009: Should handle multiple free products correctly', async () => {
    await page.evaluate(() => {
      window.productData.products.push({
        id: 'free-product-2',
        name: 'Free Sample 2',
        price: 0.00,
        description: 'Another free sample',
        image: 'https://via.placeholder.com/300x200',
        category: 'samples',
        stock: 100
      });
      
      window.cartManager.addToCart('free-product-1', 5);
      window.cartManager.addToCart('free-product-2', 10);
    });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(2);
    expect(cartItems[0].price).toBe(0);
    expect(cartItems[1].price).toBe(0);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.total).toBe(0);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-010
   * Verify cart badge with free products
   */
  test('BVT-ZERO-PRICE-010: Should update badge correctly with free products', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 7);
    });

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('7');
  });

  /**
   * Test Case: BVT-ZERO-PRICE-011
   * Verify removing free product from cart
   */
  test('BVT-ZERO-PRICE-011: Should remove free product correctly', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 1);
      window.cartManager.removeFromCart('free-product-1');
    });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-012
   * Verify updating free product quantity
   */
  test('BVT-ZERO-PRICE-012: Should update free product quantity correctly', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 1);
      window.cartManager.updateQuantity('free-product-1', 20);
    });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(20);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.total).toBe(0);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-013
   * Verify localStorage persistence with free products
   */
  test('BVT-ZERO-PRICE-013: Should persist free products in localStorage', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 3);
    });

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].price).toBe(0);
    expect(cartItems[0].quantity).toBe(3);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-014
   * Verify checkout button with only free products
   */
  test('BVT-ZERO-PRICE-014: Should handle checkout with only free products', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 5);
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.checkout-btn');

    const checkoutEnabled = await page.$eval('.checkout-btn', btn => !btn.disabled);
    expect(checkoutEnabled).toBe(true);

    const totalDisplay = await page.$eval('.total-amount', el => el.textContent);
    expect(totalDisplay).toMatch(/0\.00/);
  });

  /**
   * Test Case: BVT-ZERO-PRICE-015
   * Verify price display formatting for zero
   */
  test('BVT-ZERO-PRICE-015: Should format zero price consistently', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('free-product-1', 1);
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });

    const priceElements = await page.evaluate(() => {
      return {
        itemPrice: document.querySelector('.item-price')?.textContent,
        subtotal: document.querySelector('.subtotal-amount')?.textContent,
        tax: document.querySelector('.tax-amount')?.textContent,
        total: document.querySelector('.total-amount')?.textContent
      };
    });

    // All should show 0.00 or FREE
    expect(priceElements.itemPrice).toMatch(/0\.00|free/i);
    expect(priceElements.subtotal).toMatch(/0\.00/);
    expect(priceElements.tax).toMatch(/0\.00/);
    expect(priceElements.total).toMatch(/0\.00/);
  });
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Zero price, Near-zero, Negative
 * - Coverage: Add, Display, Calculate, Persist, Navigate
 * - Priority: MEDIUM - Important for promotional items
 * 
 * Expected Results:
 * - Free products (price = 0) should be accepted
 * - Calculations should be accurate with zero prices
 * - Mixed carts (free + paid) should calculate correctly
 * - Negative prices should be rejected or handled safely
 * - UI should display zero prices clearly
 */

