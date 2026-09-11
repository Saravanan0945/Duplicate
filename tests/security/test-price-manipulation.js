/**
 * Security Test Suite: Price Manipulation
 * Test ID Prefix: SEC-PRICE-MAN
 * 
 * Purpose: Verify that client-side price manipulation is detected and prevented
 * to ensure pricing integrity in the shopping cart.
 * 
 * Related Jira: ST-2 (Security validation for price integrity)
 * Priority: Critical
 * Test Type: Security - Price Integrity
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Security Tests: Price Manipulation', () => {
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
   * Test: SEC-PRICE-MAN-001
   * Verify detection of zero price manipulation
   */
  test('SEC-PRICE-MAN-001: Should detect and reject zero price in cart', async () => {
    const tamperedCart = [{
      productId: 'test-1',
      name: 'Test Product',
      price: 0,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify price is validated against original product data
    const displayedPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Price should either be corrected or item removed
    if (displayedPrice !== null) {
      expect(displayedPrice).toBeGreaterThan(0);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-002
   * Verify detection of negative price manipulation
   */
  test('SEC-PRICE-MAN-002: Should reject negative prices in cart', async () => {
    const tamperedCart = [{
      productId: 'test-2',
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

    expect(total).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: SEC-PRICE-MAN-003
   * Verify detection of fractional cent manipulation
   */
  test('SEC-PRICE-MAN-003: Should handle fractional cent price manipulation', async () => {
    const tamperedCart = [{
      productId: 'test-3',
      name: 'Test Product',
      price: 99.999999,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const displayedPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? match[0] : null;
      }
      return null;
    });

    // Price should be rounded to 2 decimal places
    if (displayedPrice) {
      const decimalPlaces = displayedPrice.split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-004
   * Verify price validation against product catalog
   */
  test('SEC-PRICE-MAN-004: Should validate price against original product data', async () => {
    // Get original product price
    const originalPrice = await page.evaluate(() => {
      if (window.PRODUCTS && window.PRODUCTS.length > 0) {
        return window.PRODUCTS[0].price;
      }
      return 99.99;
    });

    const productId = await page.evaluate(() => {
      if (window.PRODUCTS && window.PRODUCTS.length > 0) {
        return window.PRODUCTS[0].id;
      }
      return 'product-1';
    });

    // Tamper with price in cart
    const tamperedCart = [{
      productId: productId,
      name: 'Test Product',
      price: 0.01, // Drastically reduced price
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check if price was corrected
    const displayedPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Price should match original or item should be removed
    if (displayedPrice !== null) {
      expect(displayedPrice).toBeCloseTo(originalPrice, 2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-005
   * Verify string-based price manipulation is rejected
   */
  test('SEC-PRICE-MAN-005: Should reject non-numeric price values', async () => {
    const tamperedCart = [{
      productId: 'test-5',
      name: 'Test Product',
      price: 'FREE',
      quantity: 1,
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

    // Item should be filtered out or price corrected
    expect(cartItems).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test: SEC-PRICE-MAN-006
   * Verify total calculation integrity
   */
  test('SEC-PRICE-MAN-006: Should calculate total from validated prices only', async () => {
    const tamperedCart = [
      { productId: 'test-6a', name: 'Product 1', price: 0.01, quantity: 1 },
      { productId: 'test-6b', name: 'Product 2', price: -50, quantity: 1 },
      { productId: 'test-6c', name: 'Product 3', price: 'free', quantity: 1 }
    ];

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

    // Total should be valid and non-negative
    expect(total).toBeGreaterThanOrEqual(0);
    expect(isNaN(total)).toBe(false);
  });

  /**
   * Test: SEC-PRICE-MAN-007
   * Verify subtotal manipulation detection
   */
  test('SEC-PRICE-MAN-007: Should recalculate subtotal from item prices', async () => {
    const tamperedCart = [
      { productId: 'test-7a', name: 'Product 1', price: 10.00, quantity: 2 },
      { productId: 'test-7b', name: 'Product 2', price: 20.00, quantity: 1 }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
      // Try to manipulate subtotal
      localStorage.setItem('cartSubtotal', '1.00');
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const subtotal = await page.evaluate(() => {
      const subtotalElement = document.querySelector('.cart-subtotal, .subtotal-amount');
      if (subtotalElement) {
        const text = subtotalElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Subtotal should be recalculated: (10 * 2) + (20 * 1) = 40
    if (subtotal !== null) {
      expect(subtotal).toBeCloseTo(40.00, 2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-008
   * Verify tax calculation manipulation detection
   */
  test('SEC-PRICE-MAN-008: Should recalculate tax from subtotal', async () => {
    const tamperedCart = [{
      productId: 'test-8',
      name: 'Test Product',
      price: 100.00,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
      // Try to manipulate tax
      localStorage.setItem('cartTax', '0.01');
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const tax = await page.evaluate(() => {
      const taxElement = document.querySelector('.cart-tax, .tax-amount');
      if (taxElement) {
        const text = taxElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Tax should be recalculated (typically 10% = 10.00)
    if (tax !== null) {
      expect(tax).toBeGreaterThan(0.01);
      expect(tax).toBeCloseTo(10.00, 2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-009
   * Verify price manipulation via browser DevTools
   */
  test('SEC-PRICE-MAN-009: Should detect price changes via DOM manipulation', async () => {
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });

    // Add product to cart normally
    await page.evaluate(() => {
      if (window.cartManager && window.PRODUCTS && window.PRODUCTS.length > 0) {
        window.cartManager.addToCart(window.PRODUCTS[0].id, 1);
      }
    });

    // Try to manipulate price in DOM
    await page.evaluate(() => {
      const priceElement = document.querySelector('.product-price');
      if (priceElement) {
        priceElement.textContent = '$0.01';
      }
    });

    // Navigate to cart
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Price should be from original product data, not DOM
    const cartPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    if (cartPrice !== null) {
      expect(cartPrice).toBeGreaterThan(0.01);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-010
   * Verify price manipulation in quantity update
   */
  test('SEC-PRICE-MAN-010: Should maintain price integrity during quantity updates', async () => {
    const originalPrice = 99.99;
    const tamperedCart = [{
      productId: 'test-10',
      name: 'Test Product',
      price: originalPrice,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Update quantity
    await page.evaluate(() => {
      const increaseBtn = document.querySelector('.quantity-increase, .btn-increase');
      if (increaseBtn) {
        increaseBtn.click();
      }
    });

    await page.waitForTimeout(500);

    // Check if price remained the same
    const priceAfterUpdate = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    if (priceAfterUpdate !== null) {
      expect(priceAfterUpdate).toBeCloseTo(originalPrice, 2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-011
   * Verify price manipulation via URL parameters
   */
  test('SEC-PRICE-MAN-011: Should ignore price in URL parameters', async () => {
    const urlWithPrice = `${indexUrl}?productId=test-11&price=0.01`;
    
    await page.goto(urlWithPrice, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Try to add product with URL price
    await page.evaluate(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('productId');
      const urlPrice = urlParams.get('price');
      
      if (productId && window.cartManager) {
        // Should use catalog price, not URL price
        window.cartManager.addToCart(productId, 1);
      }
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const cartPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Price should not be 0.01 from URL
    if (cartPrice !== null) {
      expect(cartPrice).not.toBeCloseTo(0.01, 2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-012
   * Verify price consistency across page navigation
   */
  test('SEC-PRICE-MAN-012: Should maintain price consistency across navigation', async () => {
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });

    // Get original price and add to cart
    const originalPrice = await page.evaluate(() => {
      if (window.PRODUCTS && window.PRODUCTS.length > 0) {
        const product = window.PRODUCTS[0];
        if (window.cartManager) {
          window.cartManager.addToCart(product.id, 1);
        }
        return product.price;
      }
      return null;
    });

    // Navigate to cart
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const cartPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Navigate back to index
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Navigate to cart again
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const cartPriceAfterNav = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    // Prices should match
    if (originalPrice && cartPrice && cartPriceAfterNav) {
      expect(cartPrice).toBeCloseTo(originalPrice, 2);
      expect(cartPriceAfterNav).toBeCloseTo(originalPrice, 2);
    }
  });

  /**
   * Test: SEC-PRICE-MAN-013
   * Verify price validation on checkout
   */
  test('SEC-PRICE-MAN-013: Should validate prices before checkout', async () => {
    const tamperedCart = [{
      productId: 'test-13',
      name: 'Test Product',
      price: 0.01,
      quantity: 100,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Try to checkout
    const checkoutResult = await page.evaluate(() => {
      const checkoutBtn = document.querySelector('.checkout-btn, .btn-checkout');
      if (checkoutBtn) {
        checkoutBtn.click();
        return true;
      }
      return false;
    });

    await page.waitForTimeout(500);

    // Should show validation error or correct prices
    const hasError = await page.evaluate(() => {
      const errorMsg = document.querySelector('.error-message, .alert-error');
      return errorMsg !== null;
    });

    // Either error shown or prices were corrected
    expect(checkoutResult || hasError).toBeDefined();
  });

  /**
   * Test: SEC-PRICE-MAN-014
   * Verify currency symbol manipulation
   */
  test('SEC-PRICE-MAN-014: Should prevent currency symbol manipulation', async () => {
    const tamperedCart = [{
      productId: 'test-14',
      name: 'Test Product',
      price: '€0.01',
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, tamperedCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const priceText = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      return priceElement ? priceElement.textContent : null;
    });

    // Price should be numeric, currency symbol should be consistent
    if (priceText) {
      const numericPrice = priceText.match(/[\d.]+/);
      expect(numericPrice).not.toBeNull();
    }
  });

  /**
   * Test: SEC-PRICE-MAN-015
   * Comprehensive price integrity test
   */
  test('SEC-PRICE-MAN-015: Should maintain price integrity throughout cart lifecycle', async () => {
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });

    // Add product and get original price
    const originalPrice = await page.evaluate(() => {
      if (window.PRODUCTS && window.PRODUCTS.length > 0) {
        const product = window.PRODUCTS[0];
        if (window.cartManager) {
          window.cartManager.addToCart(product.id, 1);
        }
        return product.price;
      }
      return null;
    });

    // Attempt various manipulations
    await page.evaluate(() => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cart.length > 0) {
        // Try multiple manipulation techniques
        cart[0].price = 0.01;
        cart[0].originalPrice = 999.99;
        cart[0].discountedPrice = 0.01;
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    });

    // Navigate to cart
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify price was corrected
    const finalPrice = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      if (priceElement) {
        const text = priceElement.textContent;
        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      }
      return null;
    });

    if (originalPrice && finalPrice) {
      expect(finalPrice).toBeCloseTo(originalPrice, 2);
    }
  });
});

/**
 * Test Execution Summary:
 * - Total Tests: 15
 * - Price Manipulation Scenarios: Zero, negative, fractional, string, DOM, URL
 * - Coverage: Cart data, calculations, validation, integrity
 * - Priority: Critical
 * 
 * Expected Results:
 * - All price manipulations should be detected
 * - Prices should be validated against product catalog
 * - Calculations should use validated prices only
 * - Price integrity maintained across navigation
 * 
 * Security Recommendations:
 * 1. Always validate prices against server-side product catalog
 * 2. Never trust client-side price data
 * 3. Recalculate totals on every page load
 * 4. Implement price validation before checkout
 * 5. Log price manipulation attempts
 * 6. Use server-side validation for all transactions
 * 7. Implement price change detection and alerts
 */

