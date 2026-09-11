/**
 * Boundary Value Test Suite: Maximum Price Values
 * Test ID Prefix: BVT-MAX-PRICE
 * 
 * Purpose: Verify the shopping cart correctly handles very high price values
 * and ensures accurate calculations with large monetary amounts.
 * 
 * Boundary Values Tested:
 * - Maximum price: 999999.99
 * - Large prices: 100000.00, 500000.00
 * - Price overflow scenarios
 * - Calculation accuracy with large values
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle high-value products
 * - Calculations must remain accurate
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-MAX-PRICE: Maximum Price Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  const MAX_PRICE = 999999.99;

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
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case: BVT-MAX-PRICE-001
   * Verify adding product at maximum price (999999.99)
   */
  test('BVT-MAX-PRICE-001: Should accept product at maximum price', async () => {
    const result = await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-1',
        name: 'Ultra Luxury Item',
        price: maxPrice,
        description: 'Maximum price product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      return window.cartManager.addToCart('luxury-product-1', 1);
    }, MAX_PRICE);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].price).toBe(MAX_PRICE);
  });

  /**
   * Test Case: BVT-MAX-PRICE-002
   * Verify cart total calculation with maximum price
   */
  test('BVT-MAX-PRICE-002: Should calculate total correctly at maximum price', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-2',
        name: 'Luxury Item 2',
        price: maxPrice,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-2', 1);
    }, MAX_PRICE);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    const expectedTax = MAX_PRICE * 0.1;
    const expectedTotal = MAX_PRICE + expectedTax;

    expect(cartTotal.subtotal).toBeCloseTo(MAX_PRICE, 2);
    expect(cartTotal.tax).toBeCloseTo(expectedTax, 2);
    expect(cartTotal.total).toBeCloseTo(expectedTotal, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-003
   * Verify multiple high-price products
   */
  test('BVT-MAX-PRICE-003: Should handle multiple high-price products', async () => {
    const highPrice = 500000.00;
    
    await page.evaluate((price) => {
      window.productData.products.push(
        {
          id: 'luxury-product-3',
          name: 'Luxury Item 3',
          price: price,
          description: 'High value product',
          image: 'https://via.placeholder.com/300x200',
          category: 'luxury',
          stock: 10
        },
        {
          id: 'luxury-product-4',
          name: 'Luxury Item 4',
          price: price,
          description: 'High value product',
          image: 'https://via.placeholder.com/300x200',
          category: 'luxury',
          stock: 10
        }
      );
      
      window.cartManager.addToCart('luxury-product-3', 1);
      window.cartManager.addToCart('luxury-product-4', 1);
    }, highPrice);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    const expectedSubtotal = highPrice * 2;
    expect(cartTotal.subtotal).toBeCloseTo(expectedSubtotal, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-004
   * Verify high price with multiple quantity
   */
  test('BVT-MAX-PRICE-004: Should calculate correctly with high price and quantity', async () => {
    const highPrice = 100000.00;
    const quantity = 5;
    
    await page.evaluate((price, qty) => {
      window.productData.products.push({
        id: 'luxury-product-5',
        name: 'Luxury Item 5',
        price: price,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('luxury-product-5', qty);
    }, highPrice, quantity);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    const expectedSubtotal = highPrice * quantity;
    expect(cartTotal.subtotal).toBeCloseTo(expectedSubtotal, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-005
   * Verify price display formatting for large values
   */
  test('BVT-MAX-PRICE-005: Should format large prices correctly', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-6',
        name: 'Luxury Item 6',
        price: maxPrice,
        description: 'Maximum price product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-6', 1);
    }, MAX_PRICE);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    const priceDisplay = await page.$eval('.item-price', el => el.textContent);
    
    // Should contain the price with proper formatting
    expect(priceDisplay).toMatch(/999,?999\.99/);
  });

  /**
   * Test Case: BVT-MAX-PRICE-006
   * Verify "Go to Cart" with high-price products
   */
  test('BVT-MAX-PRICE-006: Should navigate to cart with high-price products', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-7',
        name: 'Luxury Item 7',
        price: maxPrice,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-7', 1);
    }, MAX_PRICE);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const itemExists = await page.$('.cart-item');
    expect(itemExists).toBeTruthy();
  });

  /**
   * Test Case: BVT-MAX-PRICE-007
   * Verify localStorage persistence with high prices
   */
  test('BVT-MAX-PRICE-007: Should persist high-price products correctly', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-8',
        name: 'Luxury Item 8',
        price: maxPrice,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-8', 1);
    }, MAX_PRICE);

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].price).toBe(MAX_PRICE);
  });

  /**
   * Test Case: BVT-MAX-PRICE-008
   * Verify price precision with large values
   */
  test('BVT-MAX-PRICE-008: Should maintain price precision with large values', async () => {
    const precisePrice = 123456.78;
    
    await page.evaluate((price) => {
      window.productData.products.push({
        id: 'luxury-product-9',
        name: 'Luxury Item 9',
        price: price,
        description: 'Precise price product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-9', 1);
    }, precisePrice);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeCloseTo(precisePrice, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-009
   * Verify cart badge with high-price products
   */
  test('BVT-MAX-PRICE-009: Should update badge correctly with high-price products', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-10',
        name: 'Luxury Item 10',
        price: maxPrice,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-10', 3);
    }, MAX_PRICE);

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');
  });

  /**
   * Test Case: BVT-MAX-PRICE-010
   * Verify removing high-price product
   */
  test('BVT-MAX-PRICE-010: Should remove high-price product correctly', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-11',
        name: 'Luxury Item 11',
        price: maxPrice,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-11', 1);
      window.cartManager.removeFromCart('luxury-product-11');
    }, MAX_PRICE);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.total).toBe(0);
  });

  /**
   * Test Case: BVT-MAX-PRICE-011
   * Verify updating quantity for high-price product
   */
  test('BVT-MAX-PRICE-011: Should update quantity for high-price product', async () => {
    const highPrice = 250000.00;
    
    await page.evaluate((price) => {
      window.productData.products.push({
        id: 'luxury-product-12',
        name: 'Luxury Item 12',
        price: price,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('luxury-product-12', 1);
      window.cartManager.updateQuantity('luxury-product-12', 4);
    }, highPrice);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    const expectedSubtotal = highPrice * 4;
    expect(cartTotal.subtotal).toBeCloseTo(expectedSubtotal, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-012
   * Verify mixed cart with high and low prices
   */
  test('BVT-MAX-PRICE-012: Should handle mixed high and low price products', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-13',
        name: 'Luxury Item 13',
        price: maxPrice,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-13', 1);
      window.cartManager.addToCart('product-1', 1); // Regular priced product
    }, MAX_PRICE);

    const cartTotal = await page.evaluate((maxPrice) => {
      const product1 = window.productData.getProductById('product-1');
      const expectedSubtotal = maxPrice + product1.price;
      
      return {
        actual: window.cartManager.getCartTotal(),
        expected: expectedSubtotal
      };
    }, MAX_PRICE);

    expect(cartTotal.actual.subtotal).toBeCloseTo(cartTotal.expected, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-013
   * Verify number overflow protection
   */
  test('BVT-MAX-PRICE-013: Should handle potential number overflow', async () => {
    const veryHighPrice = 999999.99;
    const quantity = 999;
    
    const result = await page.evaluate((price, qty) => {
      window.productData.products.push({
        id: 'luxury-product-14',
        name: 'Luxury Item 14',
        price: price,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 1000
      });
      
      window.cartManager.addToCart('luxury-product-14', qty);
      
      const total = window.cartManager.getCartTotal();
      return {
        subtotal: total.subtotal,
        isFinite: Number.isFinite(total.subtotal),
        isSafe: Number.isSafeInteger(Math.floor(total.subtotal))
      };
    }, veryHighPrice, quantity);

    expect(result.isFinite).toBe(true);
    expect(result.subtotal).toBeGreaterThan(0);
  });

  /**
   * Test Case: BVT-MAX-PRICE-014
   * Verify tax calculation accuracy with high prices
   */
  test('BVT-MAX-PRICE-014: Should calculate tax accurately for high prices', async () => {
    const highPrice = 888888.88;
    
    await page.evaluate((price) => {
      window.productData.products.push({
        id: 'luxury-product-15',
        name: 'Luxury Item 15',
        price: price,
        description: 'High value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-15', 1);
    }, highPrice);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    const expectedTax = highPrice * 0.1;
    const expectedTotal = highPrice + expectedTax;

    expect(cartTotal.tax).toBeCloseTo(expectedTax, 2);
    expect(cartTotal.total).toBeCloseTo(expectedTotal, 2);
  });

  /**
   * Test Case: BVT-MAX-PRICE-015
   * Verify checkout display with very high total
   */
  test('BVT-MAX-PRICE-015: Should display very high totals correctly', async () => {
    await page.evaluate((maxPrice) => {
      window.productData.products.push({
        id: 'luxury-product-16',
        name: 'Luxury Item 16',
        price: maxPrice,
        description: 'Maximum price product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      window.cartManager.addToCart('luxury-product-16', 1);
    }, MAX_PRICE);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.total-amount');

    const totalDisplay = await page.$eval('.total-amount', el => el.textContent);
    
    // Should display a number greater than 1 million
    const totalValue = parseFloat(totalDisplay.replace(/[^0-9.]/g, ''));
    expect(totalValue).toBeGreaterThan(1000000);
  });
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Maximum price (999999.99), Large values
 * - Coverage: Add, Calculate, Display, Persist, Overflow
 * - Priority: HIGH - Critical for luxury/high-value items
 * 
 * Expected Results:
 * - High-price products should be accepted
 * - Calculations should remain accurate with large values
 * - No number overflow or precision loss
 * - UI should format large prices correctly
 * - System should remain stable with high-value operations
 */

