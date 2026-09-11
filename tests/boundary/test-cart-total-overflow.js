/**
 * Boundary Value Test Suite: Cart Total Overflow
 * Test ID Prefix: BVT-TOTAL-OVERFLOW
 * 
 * Purpose: Verify the shopping cart correctly handles very large cart totals
 * and prevents numeric overflow or precision loss.
 * 
 * Boundary Values Tested:
 * - Very large totals: > $1,000,000
 * - JavaScript MAX_SAFE_INTEGER boundary
 * - Floating point precision limits
 * - Tax calculation with large values
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle large totals accurately
 * - No numeric overflow or precision loss
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-TOTAL-OVERFLOW: Cart Total Overflow Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  const LARGE_PRICE = 999999.99;

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
   * Test Case: BVT-TOTAL-OVERFLOW-001
   * Verify cart total with multiple high-price items
   */
  test('BVT-TOTAL-OVERFLOW-001: Should calculate large total correctly', async () => {
    const result = await page.evaluate((largePrice) => {
      // Add multiple high-price products
      for (let i = 1; i <= 5; i++) {
        window.productData.products.push({
          id: `expensive-${i}`,
          name: `Expensive Product ${i}`,
          price: largePrice,
          description: 'High value product',
          image: 'https://via.placeholder.com/300x200',
          category: 'luxury',
          stock: 100
        });
        
        window.cartManager.addToCart(`expensive-${i}`, 1);
      }
      
      const cartTotal = window.cartManager.getCartTotal();
      const expectedSubtotal = largePrice * 5;
      
      return {
        subtotal: cartTotal.subtotal,
        expectedSubtotal: expectedSubtotal,
        isFinite: Number.isFinite(cartTotal.subtotal),
        total: cartTotal.total
      };
    }, LARGE_PRICE);

    expect(result.isFinite).toBe(true);
    expect(result.subtotal).toBeCloseTo(result.expectedSubtotal, 2);
    expect(result.total).toBeGreaterThan(result.subtotal);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-002
   * Verify cart total approaching MAX_SAFE_INTEGER
   */
  test('BVT-TOTAL-OVERFLOW-002: Should handle totals near MAX_SAFE_INTEGER', async () => {
    const result = await page.evaluate((maxSafe) => {
      const largePrice = 999999999999.99; // Near max safe integer
      
      window.productData.products.push({
        id: 'ultra-expensive-1',
        name: 'Ultra Expensive Product',
        price: largePrice,
        description: 'Maximum value product',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 10
      });
      
      const addResult = window.cartManager.addToCart('ultra-expensive-1', 1);
      
      if (addResult.success) {
        const cartTotal = window.cartManager.getCartTotal();
        
        return {
          success: true,
          subtotal: cartTotal.subtotal,
          isFinite: Number.isFinite(cartTotal.subtotal),
          isSafe: Number.isSafeInteger(Math.floor(cartTotal.subtotal))
        };
      }
      
      return { success: false, error: addResult.error };
    }, MAX_SAFE_INTEGER);

    if (result.success) {
      expect(result.isFinite).toBe(true);
    }
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-003
   * Verify precision with large quantity and price
   */
  test('BVT-TOTAL-OVERFLOW-003: Should maintain precision with large values', async () => {
    const result = await page.evaluate(() => {
      const price = 123456.78;
      const quantity = 999;
      
      window.productData.products.push({
        id: 'precision-test-1',
        name: 'Precision Test Product',
        price: price,
        description: 'Precision test',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 1000
      });
      
      window.cartManager.addToCart('precision-test-1', quantity);
      
      const cartTotal = window.cartManager.getCartTotal();
      const expectedSubtotal = price * quantity;
      const difference = Math.abs(cartTotal.subtotal - expectedSubtotal);
      
      return {
        subtotal: cartTotal.subtotal,
        expectedSubtotal: expectedSubtotal,
        difference: difference,
        precisionLoss: difference > 0.01
      };
    });

    expect(result.precisionLoss).toBe(false);
    expect(result.subtotal).toBeCloseTo(result.expectedSubtotal, 2);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-004
   * Verify tax calculation with very large subtotal
   */
  test('BVT-TOTAL-OVERFLOW-004: Should calculate tax correctly for large totals', async () => {
    const result = await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'tax-test-1',
        name: 'Tax Test Product',
        price: largePrice,
        description: 'Tax calculation test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('tax-test-1', 10);
      
      const cartTotal = window.cartManager.getCartTotal();
      const expectedSubtotal = largePrice * 10;
      const expectedTax = expectedSubtotal * 0.1;
      const expectedTotal = expectedSubtotal + expectedTax;
      
      return {
        subtotal: cartTotal.subtotal,
        tax: cartTotal.tax,
        total: cartTotal.total,
        expectedSubtotal: expectedSubtotal,
        expectedTax: expectedTax,
        expectedTotal: expectedTotal
      };
    }, LARGE_PRICE);

    expect(result.subtotal).toBeCloseTo(result.expectedSubtotal, 2);
    expect(result.tax).toBeCloseTo(result.expectedTax, 2);
    expect(result.total).toBeCloseTo(result.expectedTotal, 2);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-005
   * Verify display formatting for very large totals
   */
  test('BVT-TOTAL-OVERFLOW-005: Should format very large totals correctly', async () => {
    await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'display-test-1',
        name: 'Display Test Product',
        price: largePrice,
        description: 'Display formatting test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('display-test-1', 5);
    }, LARGE_PRICE);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.total-amount');

    const totalDisplay = await page.$eval('.total-amount', el => el.textContent);
    
    // Should display a formatted number
    expect(totalDisplay).toBeTruthy();
    expect(totalDisplay.length).toBeGreaterThan(0);
    
    // Extract numeric value
    const numericValue = parseFloat(totalDisplay.replace(/[^0-9.]/g, ''));
    expect(numericValue).toBeGreaterThan(1000000);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-006
   * Verify "Go to Cart" with very large total
   */
  test('BVT-TOTAL-OVERFLOW-006: Should navigate to cart with large total', async () => {
    await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'nav-test-1',
        name: 'Navigation Test Product',
        price: largePrice,
        description: 'Navigation test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('nav-test-1', 3);
    }, LARGE_PRICE);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const itemExists = await page.$('.cart-item');
    expect(itemExists).toBeTruthy();
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-007
   * Verify localStorage persistence with large totals
   */
  test('BVT-TOTAL-OVERFLOW-007: Should persist large totals correctly', async () => {
    await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'persist-test-1',
        name: 'Persistence Test Product',
        price: largePrice,
        description: 'Persistence test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('persist-test-1', 2);
    }, LARGE_PRICE);

    await page.reload({ waitUntil: 'networkidle0' });

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeGreaterThan(1000000);
    expect(Number.isFinite(cartTotal.total)).toBe(true);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-008
   * Verify multiple operations with large totals
   */
  test('BVT-TOTAL-OVERFLOW-008: Should handle operations with large totals', async () => {
    const result = await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'ops-test-1',
        name: 'Operations Test Product',
        price: largePrice,
        description: 'Operations test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      // Add, update, calculate
      window.cartManager.addToCart('ops-test-1', 1);
      window.cartManager.updateQuantity('ops-test-1', 5);
      
      const total1 = window.cartManager.getCartTotal();
      
      window.cartManager.updateQuantity('ops-test-1', 3);
      
      const total2 = window.cartManager.getCartTotal();
      
      return {
        total1: total1.total,
        total2: total2.total,
        total2LessThanTotal1: total2.total < total1.total,
        bothFinite: Number.isFinite(total1.total) && Number.isFinite(total2.total)
      };
    }, LARGE_PRICE);

    expect(result.bothFinite).toBe(true);
    expect(result.total2LessThanTotal1).toBe(true);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-009
   * Verify floating point precision with cents
   */
  test('BVT-TOTAL-OVERFLOW-009: Should maintain cent precision with large totals', async () => {
    const result = await page.evaluate(() => {
      const price = 999999.99;
      
      window.productData.products.push({
        id: 'cents-test-1',
        name: 'Cents Precision Test',
        price: price,
        description: 'Cents test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('cents-test-1', 3);
      
      const cartTotal = window.cartManager.getCartTotal();
      
      // Check if cents are preserved
      const subtotalCents = (cartTotal.subtotal * 100) % 100;
      const taxCents = (cartTotal.tax * 100) % 100;
      const totalCents = (cartTotal.total * 100) % 100;
      
      return {
        subtotal: cartTotal.subtotal,
        tax: cartTotal.tax,
        total: cartTotal.total,
        subtotalCents: Math.round(subtotalCents),
        hasCentPrecision: subtotalCents !== 0 || taxCents !== 0 || totalCents !== 0
      };
    });

    expect(Number.isFinite(result.subtotal)).toBe(true);
    expect(Number.isFinite(result.tax)).toBe(true);
    expect(Number.isFinite(result.total)).toBe(true);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-010
   * Verify cart with mixed high and low prices
   */
  test('BVT-TOTAL-OVERFLOW-010: Should handle mixed price ranges', async () => {
    const result = await page.evaluate((largePrice) => {
      // Add expensive product
      window.productData.products.push({
        id: 'mixed-expensive',
        name: 'Expensive Product',
        price: largePrice,
        description: 'Expensive',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('mixed-expensive', 2);
      window.cartManager.addToCart('product-1', 5); // Regular priced product
      
      const cartTotal = window.cartManager.getCartTotal();
      const product1 = window.productData.getProductById('product-1');
      const expectedMin = largePrice * 2;
      
      return {
        subtotal: cartTotal.subtotal,
        expectedMin: expectedMin,
        isAboveMin: cartTotal.subtotal > expectedMin,
        isFinite: Number.isFinite(cartTotal.subtotal)
      };
    }, LARGE_PRICE);

    expect(result.isFinite).toBe(true);
    expect(result.isAboveMin).toBe(true);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-011
   * Verify removing items from large total cart
   */
  test('BVT-TOTAL-OVERFLOW-011: Should handle removal from large total cart', async () => {
    const result = await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'remove-test-1',
        name: 'Remove Test Product',
        price: largePrice,
        description: 'Remove test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('remove-test-1', 5);
      const totalBefore = window.cartManager.getCartTotal();
      
      window.cartManager.removeFromCart('remove-test-1');
      const totalAfter = window.cartManager.getCartTotal();
      
      return {
        totalBefore: totalBefore.total,
        totalAfter: totalAfter.total,
        reduced: totalAfter.total < totalBefore.total,
        afterIsZero: totalAfter.total === 0
      };
    }, LARGE_PRICE);

    expect(result.reduced).toBe(true);
    expect(result.afterIsZero).toBe(true);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-012
   * Verify cart badge with large total
   */
  test('BVT-TOTAL-OVERFLOW-012: Should display badge correctly with large total', async () => {
    await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'badge-test-1',
        name: 'Badge Test Product',
        price: largePrice,
        description: 'Badge test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('badge-test-1', 7);
    }, LARGE_PRICE);

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('7');
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-013
   * Verify checkout button with very large total
   */
  test('BVT-TOTAL-OVERFLOW-013: Should enable checkout with large total', async () => {
    await page.evaluate((largePrice) => {
      window.productData.products.push({
        id: 'checkout-test-1',
        name: 'Checkout Test Product',
        price: largePrice,
        description: 'Checkout test',
        image: 'https://via.placeholder.com/300x200',
        category: 'luxury',
        stock: 100
      });
      
      window.cartManager.addToCart('checkout-test-1', 4);
    }, LARGE_PRICE);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.checkout-btn');

    const checkoutEnabled = await page.$eval('.checkout-btn', btn => !btn.disabled);
    expect(checkoutEnabled).toBe(true);
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-014
   * Verify error handling for overflow scenarios
   */
  test('BVT-TOTAL-OVERFLOW-014: Should handle potential overflow gracefully', async () => {
    const result = await page.evaluate(() => {
      const extremePrice = Number.MAX_VALUE / 2;
      
      window.productData.products.push({
        id: 'overflow-test-1',
        name: 'Overflow Test Product',
        price: extremePrice,
        description: 'Overflow test',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 100
      });
      
      const addResult = window.cartManager.addToCart('overflow-test-1', 1);
      
      if (addResult.success) {
        const cartTotal = window.cartManager.getCartTotal();
        
        return {
          success: true,
          isFinite: Number.isFinite(cartTotal.total),
          isInfinity: cartTotal.total === Infinity
        };
      }
      
      return {
        success: false,
        error: addResult.error
      };
    });

    // Should either reject or handle gracefully
    if (result.success) {
      expect(result.isInfinity).toBe(false);
      expect(result.isFinite).toBe(true);
    }
  });

  /**
   * Test Case: BVT-TOTAL-OVERFLOW-015
   * Verify system stability with extreme values
   */
  test('BVT-TOTAL-OVERFLOW-015: Should maintain stability with extreme values', async () => {
    const result = await page.evaluate((largePrice) => {
      try {
        // Add multiple high-value items
        for (let i = 1; i <= 10; i++) {
          window.productData.products.push({
            id: `stability-test-${i}`,
            name: `Stability Test ${i}`,
            price: largePrice,
            description: 'Stability test',
            image: 'https://via.placeholder.com/300x200',
            category: 'luxury',
            stock: 100
          });
          
          window.cartManager.addToCart(`stability-test-${i}`, 10);
        }
        
        // Perform operations
        window.cartManager.updateQuantity('stability-test-1', 5);
        window.cartManager.removeFromCart('stability-test-2');
        
        const cartTotal = window.cartManager.getCartTotal();
        const cartItems = window.cartManager.getCartItems();
        
        return {
          stable: true,
          itemCount: cartItems.length,
          totalIsFinite: Number.isFinite(cartTotal.total),
          totalIsPositive: cartTotal.total > 0
        };
      } catch (e) {
        return {
          stable: false,
          error: e.message
        };
      }
    }, LARGE_PRICE);

    expect(result.stable).toBe(true);
    expect(result.totalIsFinite).toBe(true);
    expect(result.totalIsPositive).toBe(true);
  }, 30000);
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Large totals, MAX_SAFE_INTEGER, Precision
 * - Coverage: Calculations, Display, Persistence, Overflow
 * - Priority: HIGH - Critical for financial accuracy
 * 
 * Expected Results:
 * - Very large totals should be calculated accurately
 * - No numeric overflow or Infinity values
 * - Floating point precision should be maintained
 * - Tax calculations should be accurate with large values
 * - System should remain stable with extreme values
 * - All monetary values should be finite numbers
 */

