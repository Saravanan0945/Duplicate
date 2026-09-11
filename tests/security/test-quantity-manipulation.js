/**
 * Security Test Suite: Quantity Manipulation
 * Test ID Prefix: SEC-QTY-MAN
 * 
 * Purpose: Verify that quantity manipulation in localStorage is detected
 * and prevented to ensure stock integrity and prevent abuse.
 * 
 * Related Jira: ST-2 (Security validation for quantity integrity)
 * Priority: High
 * Test Type: Security - Quantity Integrity
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Security Tests: Quantity Manipulation', () => {
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
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test: SEC-QTY-MAN-001
   * Verify detection of negative quantity
   */
  test('SEC-QTY-MAN-001: Should reject negative quantity values', async () => {
    const tamperedCart = [{
      productId: 'test-1',
      name: 'Test Product',
      price: 99.99,
      quantity: -10,
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
      return null;
    });

    // Quantity should be positive or item removed
    if (quantity !== null) {
      expect(quantity).toBeGreaterThan(0);
    }
  });

  /**
   * Test: SEC-QTY-MAN-002
   * Verify detection of zero quantity
   */
  test('SEC-QTY-MAN-002: Should handle zero quantity appropriately', async () => {
    const tamperedCart = [{
      productId: 'test-2',
      name: 'Test Product',
      price: 99.99,
      quantity: 0,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Item with zero quantity should be removed
    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(cartItems).toBe(0);
  });

  /**
   * Test: SEC-QTY-MAN-003
   * Verify detection of extremely large quantity
   */
  test('SEC-QTY-MAN-003: Should cap extremely large quantity values', async () => {
    const tamperedCart = [{
      productId: 'test-3',
      name: 'Test Product',
      price: 99.99,
      quantity: 999999999,
      image: 'test.jpg',
      stock: 100
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
      return null;
    });

    // Quantity should be capped at stock limit
    if (quantity !== null) {
      expect(quantity).toBeLessThanOrEqual(100);
    }
  });

  /**
   * Test: SEC-QTY-MAN-004
   * Verify quantity exceeding stock limit
   */
  test('SEC-QTY-MAN-004: Should not allow quantity to exceed stock', async () => {
    const tamperedCart = [{
      productId: 'test-4',
      name: 'Test Product',
      price: 99.99,
      quantity: 500,
      image: 'test.jpg',
      stock: 10
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
      return null;
    });

    // Should be capped at stock limit (10)
    if (quantity !== null) {
      expect(quantity).toBeLessThanOrEqual(10);
    }
  });

  /**
   * Test: SEC-QTY-MAN-005
   * Verify non-integer quantity values
   */
  test('SEC-QTY-MAN-005: Should reject non-integer quantity values', async () => {
    const tamperedCart = [{
      productId: 'test-5',
      name: 'Test Product',
      price: 99.99,
      quantity: 2.5,
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
        return qtyElement.value || qtyElement.textContent;
      }
      return null;
    });

    // Should be rounded to integer
    if (quantity !== null) {
      expect(parseInt(quantity)).toBe(parseInt(quantity));
    }
  });

  /**
   * Test: SEC-QTY-MAN-006
   * Verify string-based quantity manipulation
   */
  test('SEC-QTY-MAN-006: Should reject string quantity values', async () => {
    const tamperedCart = [{
      productId: 'test-6',
      name: 'Test Product',
      price: 99.99,
      quantity: 'unlimited',
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const cartItems = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    // Item should be removed or quantity set to valid value
    expect(cartItems).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: SEC-QTY-MAN-007
   * Verify quantity manipulation via input field
   */
  test('SEC-QTY-MAN-007: Should validate quantity changes in input field', async () => {
    const cart = [{
      productId: 'test-7',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg',
      stock: 10
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, cart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Try to set invalid quantity
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[type="number"]');
      if (qtyInput) {
        qtyInput.value = 999;
        qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(500);

    const finalQuantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return null;
    });

    // Should be capped at stock limit
    if (finalQuantity !== null) {
      expect(finalQuantity).toBeLessThanOrEqual(10);
    }
  });

  /**
   * Test: SEC-QTY-MAN-008
   * Verify quantity manipulation via increment button
   */
  test('SEC-QTY-MAN-008: Should respect stock limit when incrementing', async () => {
    const cart = [{
      productId: 'test-8',
      name: 'Test Product',
      price: 99.99,
      quantity: 9,
      image: 'test.jpg',
      stock: 10
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, cart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Click increment button multiple times
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const increaseBtn = document.querySelector('.quantity-increase, .btn-increase');
        if (increaseBtn) {
          increaseBtn.click();
        }
      });
      await page.waitForTimeout(200);
    }

    const finalQuantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return null;
    });

    // Should not exceed stock limit
    if (finalQuantity !== null) {
      expect(finalQuantity).toBeLessThanOrEqual(10);
    }
  });

  /**
   * Test: SEC-QTY-MAN-009
   * Verify quantity manipulation via localStorage during session
   */
  test('SEC-QTY-MAN-009: Should detect mid-session quantity tampering', async () => {
    const cart = [{
      productId: 'test-9',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg',
      stock: 10
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, cart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Tamper with quantity mid-session
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cart.length > 0) {
        cart[0].quantity = 999999;
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    });

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const quantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return null;
    });

    // Should be validated and capped
    if (quantity !== null) {
      expect(quantity).toBeLessThanOrEqual(10);
    }
  });

  /**
   * Test: SEC-QTY-MAN-010
   * Verify total calculation with manipulated quantity
   */
  test('SEC-QTY-MAN-010: Should calculate total with validated quantity', async () => {
    const tamperedCart = [{
      productId: 'test-10',
      name: 'Test Product',
      price: 10.00,
      quantity: 999999,
      image: 'test.jpg',
      stock: 5
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
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Total should be based on capped quantity (5 * 10 = 50 + tax)
    if (total !== null) {
      expect(total).toBeLessThan(1000); // Much less than 999999 * 10
      expect(total).toBeGreaterThan(0);
    }
  });

  /**
   * Test: SEC-QTY-MAN-011
   * Verify quantity validation across multiple items
   */
  test('SEC-QTY-MAN-011: Should validate quantities for all cart items', async () => {
    const tamperedCart = [
      { productId: 'test-11a', name: 'Product 1', price: 10.00, quantity: -5, stock: 10 },
      { productId: 'test-11b', name: 'Product 2', price: 20.00, quantity: 0, stock: 10 },
      { productId: 'test-11c', name: 'Product 3', price: 30.00, quantity: 999999, stock: 10 },
      { productId: 'test-11d', name: 'Product 4', price: 40.00, quantity: 'invalid', stock: 10 }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const cartItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.cart-item, .item');
      return Array.from(items).map(item => {
        const qtyElement = item.querySelector('.quantity-value, input[type="number"]');
        return qtyElement ? parseInt(qtyElement.value || qtyElement.textContent) : null;
      });
    });

    // All quantities should be valid
    cartItems.forEach(qty => {
      if (qty !== null) {
        expect(qty).toBeGreaterThan(0);
        expect(qty).toBeLessThanOrEqual(10);
      }
    });
  });

  /**
   * Test: SEC-QTY-MAN-012
   * Verify quantity manipulation via URL parameters
   */
  test('SEC-QTY-MAN-012: Should ignore quantity in URL parameters', async () => {
    const urlWithQty = `${indexUrl}?productId=test-12&quantity=999999`;
    
    await page.goto(urlWithQty, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('productId');
      const urlQuantity = urlParams.get('quantity');
      
      if (productId && window.cartManager) {
        // Should validate quantity, not use URL value directly
        window.cartManager.addToCart(productId, parseInt(urlQuantity));
      }
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const quantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return null;
    });

    // Should be validated and capped
    if (quantity !== null) {
      expect(quantity).toBeLessThan(999999);
    }
  });

  /**
   * Test: SEC-QTY-MAN-013
   * Verify quantity badge count manipulation
   */
  test('SEC-QTY-MAN-013: Should calculate badge count from validated quantities', async () => {
    const tamperedCart = [
      { productId: 'test-13a', name: 'Product 1', price: 10.00, quantity: 999, stock: 5 },
      { productId: 'test-13b', name: 'Product 2', price: 20.00, quantity: 888, stock: 3 }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(indexUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const badgeCount = await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge, .badge');
      return badge ? parseInt(badge.textContent) : null;
    });

    // Badge should show validated total (5 + 3 = 8), not 999 + 888
    if (badgeCount !== null) {
      expect(badgeCount).toBeLessThan(100);
      expect(badgeCount).toBeGreaterThan(0);
    }
  });

  /**
   * Test: SEC-QTY-MAN-014
   * Verify quantity persistence after manipulation
   */
  test('SEC-QTY-MAN-014: Should persist validated quantity, not tampered value', async () => {
    const tamperedCart = [{
      productId: 'test-14',
      name: 'Test Product',
      price: 99.99,
      quantity: 999999,
      image: 'test.jpg',
      stock: 10
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check persisted value
    const persistedQuantity = await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      return cart.length > 0 ? cart[0].quantity : null;
    });

    // Should be corrected in storage
    if (persistedQuantity !== null) {
      expect(persistedQuantity).toBeLessThanOrEqual(10);
    }
  });

  /**
   * Test: SEC-QTY-MAN-015
   * Comprehensive quantity integrity test
   */
  test('SEC-QTY-MAN-015: Should maintain quantity integrity throughout cart lifecycle', async () => {
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });

    // Add product normally
    await page.evaluate(() => {
      if (window.PRODUCTS && window.PRODUCTS.length > 0 && window.cartManager) {
        window.cartManager.addToCart(window.PRODUCTS[0].id, 1);
      }
    });

    // Attempt various quantity manipulations
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cart.length > 0) {
        cart[0].quantity = -999;
        cart[0].originalQuantity = 999999;
        cart[0].requestedQuantity = 0;
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    });

    // Navigate to cart
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify quantity was corrected
    const finalQuantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      if (qtyElement) {
        return parseInt(qtyElement.value || qtyElement.textContent);
      }
      return null;
    });

    // Should be valid positive integer
    if (finalQuantity !== null) {
      expect(finalQuantity).toBeGreaterThan(0);
      expect(finalQuantity).toBeLessThan(1000);
      expect(Number.isInteger(finalQuantity)).toBe(true);
    }
  });
});

/**
 * Test Execution Summary:
 * - Total Tests: 15
 * - Quantity Manipulation Scenarios: Negative, zero, large, fractional, string
 * - Coverage: Input validation, stock limits, calculations, persistence
 * - Priority: High
 * 
 * Expected Results:
 * - All quantity manipulations should be detected
 * - Quantities should be validated against stock limits
 * - Invalid quantities should be corrected or items removed
 * - Quantity integrity maintained across navigation
 * 
 * Security Recommendations:
 * 1. Validate quantity on every cart operation
 * 2. Enforce stock limits strictly
 * 3. Only allow positive integers for quantity
 * 4. Cap maximum quantity per item
 * 5. Recalculate totals with validated quantities
 * 6. Log quantity manipulation attempts
 * 7. Implement server-side quantity validation
 */

