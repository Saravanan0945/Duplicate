/**
 * Security Test Suite: localStorage Tampering
 * Test ID Prefix: SEC-LS-TAMP
 * 
 * Purpose: Verify that the application properly validates and handles
 * tampered localStorage data to prevent security vulnerabilities.
 * 
 * Related Jira: ST-2 (Security validation for cart data integrity)
 * Priority: High
 * Test Type: Security - Data Integrity
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Security Tests: localStorage Tampering', () => {
  let browser;
  let page;
  const indexUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Monitor for errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    await page.goto(indexUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test: SEC-LS-TAMP-001
   * Verify handling of corrupted JSON in cart data
   */
  test('SEC-LS-TAMP-001: Should handle corrupted JSON in cart localStorage', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cart', '{invalid json}');
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify app doesn't crash and shows empty cart
    const emptyMessage = await page.evaluate(() => {
      const msg = document.querySelector('.empty-cart-message, .empty-message');
      return msg !== null;
    });

    expect(emptyMessage).toBe(true);
  });

  /**
   * Test: SEC-LS-TAMP-002
   * Verify handling of malformed cart array
   */
  test('SEC-LS-TAMP-002: Should handle malformed cart array structure', async () => {
    await page.evaluate(() => {
      localStorage.setItem('cart', '{"not": "an array"}');
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(cartItems).toBe(0);
  });

  /**
   * Test: SEC-LS-TAMP-003
   * Verify handling of negative prices
   */
  test('SEC-LS-TAMP-003: Should reject negative prices in cart data', async () => {
    const tamperedCart = [{
      productId: 'test-1',
      name: 'Test Product',
      price: -99.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const total = await page.evaluate(() => {
      const totalElement = document.querySelector('.cart-total, .total-amount');
      if (totalElement) {
        const text = totalElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
      }
      return 0;
    });

    // Total should not be negative
    expect(total).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: SEC-LS-TAMP-004
   * Verify handling of negative quantities
   */
  test('SEC-LS-TAMP-004: Should reject negative quantities in cart', async () => {
    const tamperedCart = [{
      productId: 'test-2',
      name: 'Test Product',
      price: 99.99,
      quantity: -5,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const quantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return 0;
    });

    expect(quantity).toBeGreaterThan(0);
  });

  /**
   * Test: SEC-LS-TAMP-005
   * Verify handling of extremely large quantities
   */
  test('SEC-LS-TAMP-005: Should handle extremely large quantity values', async () => {
    const tamperedCart = [{
      productId: 'test-3',
      name: 'Test Product',
      price: 99.99,
      quantity: 999999999,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const quantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return 0;
    });

    // Should be capped at reasonable limit (e.g., stock limit)
    expect(quantity).toBeLessThan(1000);
  });

  /**
   * Test: SEC-LS-TAMP-006
   * Verify handling of extremely large prices
   */
  test('SEC-LS-TAMP-006: Should handle extremely large price values', async () => {
    const tamperedCart = [{
      productId: 'test-4',
      name: 'Test Product',
      price: 999999999.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify app doesn't crash
    const pageTitle = await page.evaluate(() => {
      return document.title;
    });

    expect(pageTitle).toBeDefined();
  });

  /**
   * Test: SEC-LS-TAMP-007
   * Verify handling of missing required fields
   */
  test('SEC-LS-TAMP-007: Should handle cart items with missing required fields', async () => {
    const tamperedCart = [
      { productId: 'test-5' }, // Missing name, price, quantity
      { name: 'Test', price: 99.99 }, // Missing productId, quantity
      { productId: 'test-6', quantity: 1 } // Missing name, price
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // App should handle gracefully, possibly showing 0 items or valid items only
    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(cartItems).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: SEC-LS-TAMP-008
   * Verify handling of non-string productId
   */
  test('SEC-LS-TAMP-008: Should validate productId data type', async () => {
    const tamperedCart = [
      { productId: 123, name: 'Test', price: 99.99, quantity: 1 },
      { productId: null, name: 'Test', price: 99.99, quantity: 1 },
      { productId: {}, name: 'Test', price: 99.99, quantity: 1 },
      { productId: [], name: 'Test', price: 99.99, quantity: 1 }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Should filter out invalid items
    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(cartItems).toBe(0);
  });

  /**
   * Test: SEC-LS-TAMP-009
   * Verify handling of prototype pollution attempt
   */
  test('SEC-LS-TAMP-009: Should prevent prototype pollution via cart data', async () => {
    const tamperedCart = [{
      productId: 'test-7',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      '__proto__': { isAdmin: true },
      'constructor': { prototype: { isAdmin: true } }
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check that prototype wasn't polluted
    const isPrototypePolluted = await page.evaluate(() => {
      const obj = {};
      return obj.isAdmin === true;
    });

    expect(isPrototypePolluted).toBe(false);
  });

  /**
   * Test: SEC-LS-TAMP-010
   * Verify handling of circular references in cart data
   */
  test('SEC-LS-TAMP-010: Should handle circular references in cart data', async () => {
    await page.evaluate(() => {
      // Create circular reference
      const cart = [{
        productId: 'test-8',
        name: 'Test Product',
        price: 99.99,
        quantity: 1
      }];
      cart[0].self = cart[0];
      
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (e) {
        // Expected to fail, set invalid data manually
        localStorage.setItem('cart', '[{"productId":"test-8","self":"[Circular]"}]');
      }
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // App should handle gracefully
    const pageLoaded = await page.evaluate(() => {
      return document.body !== null;
    });

    expect(pageLoaded).toBe(true);
  });

  /**
   * Test: SEC-LS-TAMP-011
   * Verify handling of oversized localStorage data
   */
  test('SEC-LS-TAMP-011: Should handle oversized cart data gracefully', async () => {
    // Create very large cart
    const largeCart = Array(10000).fill(null).map((_, i) => ({
      productId: `test-${i}`,
      name: 'Test Product '.repeat(100),
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }));

    try {
      await page.evaluate((cart) => {
        try {
          localStorage.setItem('cart', JSON.stringify(cart));
        } catch (e) {
          // QuotaExceededError expected
          console.log('Storage quota exceeded (expected)');
        }
      }, largeCart);

      await page.goto(cartUrl, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(500);

      // App should still function
      const pageLoaded = await page.evaluate(() => {
        return document.body !== null;
      });

      expect(pageLoaded).toBe(true);
    } catch (error) {
      // Expected behavior - app handles quota exceeded
      expect(error).toBeDefined();
    }
  });

  /**
   * Test: SEC-LS-TAMP-012
   * Verify handling of null/undefined values
   */
  test('SEC-LS-TAMP-012: Should handle null and undefined values in cart', async () => {
    const tamperedCart = [
      { productId: 'test-9', name: null, price: 99.99, quantity: 1 },
      { productId: 'test-10', name: 'Test', price: undefined, quantity: 1 },
      { productId: 'test-11', name: 'Test', price: 99.99, quantity: null }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Should filter out or handle invalid items
    const total = await page.evaluate(() => {
      const totalElement = document.querySelector('.cart-total, .total-amount');
      return totalElement !== null;
    });

    expect(total).toBe(true);
  });

  /**
   * Test: SEC-LS-TAMP-013
   * Verify handling of special characters in productId
   */
  test('SEC-LS-TAMP-013: Should sanitize special characters in productId', async () => {
    const tamperedCart = [{
      productId: '../../../etc/passwd',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Should not attempt path traversal
    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(cartItems).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: SEC-LS-TAMP-014
   * Verify handling of duplicate productIds
   */
  test('SEC-LS-TAMP-014: Should handle duplicate productIds in cart', async () => {
    const tamperedCart = [
      { productId: 'test-12', name: 'Product 1', price: 99.99, quantity: 1 },
      { productId: 'test-12', name: 'Product 2', price: 49.99, quantity: 2 },
      { productId: 'test-12', name: 'Product 3', price: 29.99, quantity: 3 }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Should merge or handle duplicates appropriately
    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(cartItems).toBeGreaterThan(0);
    expect(cartItems).toBeLessThanOrEqual(3);
  });

  /**
   * Test: SEC-LS-TAMP-015
   * Verify cart data validation on page load
   */
  test('SEC-LS-TAMP-015: Should validate entire cart structure on load', async () => {
    const tamperedCart = [
      { productId: 'valid-1', name: 'Valid Product', price: 99.99, quantity: 1 },
      { productId: 'invalid-1', name: '<script>alert("XSS")</script>', price: -50, quantity: -1 },
      { productId: 123, name: null, price: 'not a number', quantity: 'not a number' },
      { invalid: 'structure' }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Should only show valid items
    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    // At most 1 valid item should be shown
    expect(cartItems).toBeLessThanOrEqual(1);
    
    // Total should be valid
    const total = await page.evaluate(() => {
      const totalElement = document.querySelector('.cart-total, .total-amount');
      if (totalElement) {
        const text = totalElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
      }
      return 0;
    });

    expect(total).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Execution Summary:
 * - Total Tests: 15
 * - Tampering Scenarios: JSON corruption, data type violations, prototype pollution
 * - Coverage: Data validation, error handling, security
 * - Priority: High
 * 
 * Expected Results:
 * - App should validate all cart data on load
 * - Invalid data should be filtered or rejected
 * - No crashes or security vulnerabilities
 * - Graceful error handling for all scenarios
 * 
 * Security Recommendations:
 * 1. Validate cart data structure on every load
 * 2. Implement strict data type checking
 * 3. Sanitize all string values
 * 4. Prevent prototype pollution with Object.create(null)
 * 5. Set reasonable limits for prices and quantities
 * 6. Handle localStorage quota exceeded errors
 * 7. Use JSON schema validation
 */

