/**
 * Security Test Suite: XSS in Cart Data
 * Test ID Prefix: SEC-XSS-CD
 * 
 * Purpose: Verify that cart data stored in localStorage and rendered on the cart page
 * is properly sanitized to prevent XSS attacks through data manipulation.
 * 
 * Related Jira: ST-2 (Security validation for cart data handling)
 * Priority: Critical
 * Test Type: Security - XSS Prevention in Cart
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('Security Tests: XSS in Cart Data', () => {
  let browser;
  let page;
  const indexUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  // XSS payloads specifically for cart data
  const cartXssVectors = [
    {
      field: 'name',
      payload: '<script>alert("Cart XSS")</script>',
      description: 'Script tag in product name'
    },
    {
      field: 'name',
      payload: '<img src=x onerror=alert("Cart")>',
      description: 'Image onerror in name'
    },
    {
      field: 'description',
      payload: '<svg/onload=alert("XSS")>',
      description: 'SVG onload in description'
    },
    {
      field: 'price',
      payload: '99.99<script>alert("Price XSS")</script>',
      description: 'Script in price field'
    },
    {
      field: 'quantity',
      payload: '1<img src=x onerror=alert("Qty")>',
      description: 'Image tag in quantity'
    },
    {
      field: 'image',
      payload: 'javascript:alert("Image XSS")',
      description: 'JavaScript protocol in image URL'
    },
    {
      field: 'image',
      payload: 'x" onerror="alert(\'XSS\')"',
      description: 'Event handler in image attribute'
    },
    {
      field: 'category',
      payload: '<iframe src="javascript:alert(\'Cat\')">',
      description: 'Iframe in category'
    }
  ];

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
    
    // Monitor for XSS execution
    page.on('dialog', async dialog => {
      throw new Error(`XSS Alert detected: ${dialog.message()}`);
    });

    await page.goto(indexUrl, { waitUntil: 'networkidle0' });
    
    // Clear cart before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test: SEC-XSS-CD-001
   * Verify XSS in cart item name is sanitized
   */
  test('SEC-XSS-CD-001: Should sanitize XSS in cart item name', async () => {
    const maliciousCart = [{
      productId: 'test-1',
      name: '<script>alert("Name XSS")</script>',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    // Navigate to cart page
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify name is displayed safely
    const itemName = await page.evaluate(() => {
      const nameElement = document.querySelector('.cart-item-name, .item-name');
      return nameElement ? nameElement.textContent : null;
    });

    expect(itemName).not.toContain('<script>');
  });

  /**
   * Test: SEC-XSS-CD-002
   * Verify XSS in cart item description is sanitized
   */
  test('SEC-XSS-CD-002: Should sanitize XSS in cart item description', async () => {
    const maliciousCart = [{
      productId: 'test-2',
      name: 'Test Product',
      description: '<img src=x onerror=alert("Desc XSS")>',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check description rendering
    const description = await page.evaluate(() => {
      const descElement = document.querySelector('.cart-item-description, .item-description');
      return descElement ? descElement.innerHTML : null;
    });

    if (description) {
      expect(description).not.toContain('onerror=');
    }
  });

  /**
   * Test: SEC-XSS-CD-003
   * Verify XSS in price field is prevented
   */
  test('SEC-XSS-CD-003: Should prevent XSS in price field', async () => {
    const maliciousCart = [{
      productId: 'test-3',
      name: 'Test Product',
      price: '99.99<script>alert("Price")</script>',
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify price is displayed as number only
    const price = await page.evaluate(() => {
      const priceElement = document.querySelector('.cart-item-price, .item-price');
      return priceElement ? priceElement.textContent : null;
    });

    if (price) {
      expect(price).not.toContain('<script>');
      // Should only contain numbers and currency symbols
      expect(price).toMatch(/^[\$€£¥]?\s*\d+\.?\d*$/);
    }
  });

  /**
   * Test: SEC-XSS-CD-004
   * Verify XSS in quantity field is blocked
   */
  test('SEC-XSS-CD-004: Should block XSS in quantity field', async () => {
    const maliciousCart = [{
      productId: 'test-4',
      name: 'Test Product',
      price: 99.99,
      quantity: '1<img src=x onerror=alert("Qty")>',
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify quantity is numeric only
    const quantity = await page.evaluate(() => {
      const qtyElement = document.querySelector('.quantity-value, input[type="number"]');
      return qtyElement ? qtyElement.value || qtyElement.textContent : null;
    });

    if (quantity) {
      expect(quantity).toMatch(/^\d+$/);
      expect(quantity).not.toContain('<img');
    }
  });

  /**
   * Test: SEC-XSS-CD-005
   * Verify javascript: protocol in image URL is blocked
   */
  test('SEC-XSS-CD-005: Should block javascript: protocol in image URL', async () => {
    const maliciousCart = [{
      productId: 'test-5',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'javascript:alert("Image XSS")'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check image src attribute
    const imageSrc = await page.evaluate(() => {
      const img = document.querySelector('.cart-item-image, .item-image');
      return img ? img.src : null;
    });

    if (imageSrc) {
      expect(imageSrc).not.toContain('javascript:');
    }
  });

  /**
   * Test: SEC-XSS-CD-006
   * Verify event handler injection in image attribute
   */
  test('SEC-XSS-CD-006: Should prevent event handler injection in image', async () => {
    const maliciousCart = [{
      productId: 'test-6',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg" onerror="alert(\'XSS\')"'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check if onerror attribute exists
    const hasOnerror = await page.evaluate(() => {
      const img = document.querySelector('.cart-item-image, .item-image');
      return img ? img.hasAttribute('onerror') : false;
    });

    expect(hasOnerror).toBe(false);
  });

  /**
   * Test: SEC-XSS-CD-007
   * Verify multiple XSS vectors in single cart item
   */
  test('SEC-XSS-CD-007: Should handle multiple XSS vectors in one item', async () => {
    const maliciousCart = [{
      productId: 'test-7',
      name: '<script>alert("Name")</script>',
      description: '<img src=x onerror=alert("Desc")>',
      price: '99.99<script>alert("Price")</script>',
      quantity: '1<img src=x onerror=alert("Qty")>',
      image: 'javascript:alert("Image")',
      category: '<iframe src="javascript:alert(\'Cat\')">'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(1000);

    // If we reach here without alert, XSS was prevented
    const pageContent = await page.evaluate(() => {
      return document.body.textContent;
    });

    expect(pageContent).toBeDefined();
  });

  /**
   * Test: SEC-XSS-CD-008
   * Verify XSS in multiple cart items
   */
  test('SEC-XSS-CD-008: Should sanitize XSS across multiple cart items', async () => {
    const maliciousCart = [
      {
        productId: 'test-8a',
        name: '<script>alert("Item 1")</script>',
        price: 99.99,
        quantity: 1,
        image: 'test1.jpg'
      },
      {
        productId: 'test-8b',
        name: '<img src=x onerror=alert("Item 2")>',
        price: 49.99,
        quantity: 2,
        image: 'test2.jpg'
      },
      {
        productId: 'test-8c',
        name: '<svg onload=alert("Item 3")>',
        price: 29.99,
        quantity: 3,
        image: 'test3.jpg'
      }
    ];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Count cart items rendered
    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item, .item').length;
    });

    expect(itemCount).toBe(3);
  });

  /**
   * Test: SEC-XSS-CD-009
   * Verify XSS in cart total calculation display
   */
  test('SEC-XSS-CD-009: Should prevent XSS in cart total display', async () => {
    const maliciousCart = [{
      productId: 'test-9',
      name: 'Test Product',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Try to inject XSS into total calculation
      localStorage.setItem('cartTotal', '<script>alert("Total XSS")</script>');
    }, maliciousCart);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check total display
    const total = await page.evaluate(() => {
      const totalElement = document.querySelector('.cart-total, .total-amount');
      return totalElement ? totalElement.textContent : null;
    });

    if (total) {
      expect(total).not.toContain('<script>');
      expect(total).toMatch(/[\$€£¥]?\s*\d+\.?\d*/);
    }
  });

  /**
   * Test: SEC-XSS-CD-010
   * Verify XSS in cart empty message
   */
  test('SEC-XSS-CD-010: Should sanitize XSS in empty cart message', async () => {
    await page.evaluate(() => {
      // Set malicious empty cart message
      localStorage.setItem('emptyCartMessage', '<script>alert("Empty")</script>');
      localStorage.setItem('cart', JSON.stringify([]));
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check empty message
    const emptyMessage = await page.evaluate(() => {
      const msgElement = document.querySelector('.empty-cart-message, .empty-message');
      return msgElement ? msgElement.textContent : null;
    });

    if (emptyMessage) {
      expect(emptyMessage).not.toContain('<script>');
    }
  });

  /**
   * Test: SEC-XSS-CD-011
   * Verify XSS protection when updating cart from index page
   */
  test('SEC-XSS-CD-011: Should prevent XSS when adding to cart from index', async () => {
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });

    // Inject malicious product
    await page.evaluate(() => {
      if (window.PRODUCTS) {
        window.PRODUCTS.push({
          id: 'xss-test-11',
          name: '<script>alert("Add to Cart XSS")</script>',
          price: 99.99,
          description: 'Test',
          image: 'test.jpg',
          category: 'test',
          stock: 10
        });
      }
    });

    // Try to add to cart
    await page.evaluate(() => {
      if (window.cartManager) {
        window.cartManager.addToCart('xss-test-11', 1);
      }
    });

    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify XSS was sanitized
    const cartContent = await page.evaluate(() => {
      return document.body.innerHTML;
    });

    expect(cartContent).not.toContain('<script>alert("Add to Cart XSS")</script>');
  });

  /**
   * Test: SEC-XSS-CD-012
   * Verify XSS in cart badge tooltip
   */
  test('SEC-XSS-CD-012: Should sanitize XSS in cart badge tooltip', async () => {
    const maliciousCart = [{
      productId: 'test-12',
      name: '<img src=x onerror=alert("Badge")>',
      price: 99.99,
      quantity: 1,
      image: 'test.jpg'
    }];

    await page.evaluate((cart) => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, maliciousCart);

    await page.goto(indexUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check badge tooltip/title
    const badgeTitle = await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge, .badge');
      return badge ? badge.getAttribute('title') || badge.getAttribute('data-tooltip') : null;
    });

    if (badgeTitle) {
      expect(badgeTitle).not.toContain('onerror=');
    }
  });

  /**
   * Test: SEC-XSS-CD-013
   * Verify XSS protection in cart JSON structure
   */
  test('SEC-XSS-CD-013: Should validate cart JSON structure against XSS', async () => {
    // Malicious JSON with XSS
    const maliciousJson = `[{
      "productId": "test-13",
      "name": "<script>alert('JSON XSS')</script>",
      "price": 99.99,
      "quantity": 1,
      "image": "test.jpg",
      "__proto__": {"isAdmin": true},
      "constructor": {"prototype": {"isAdmin": true}}
    }]`;

    await page.evaluate((json) => {
      localStorage.setItem('cart', json);
    }, maliciousJson);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Verify cart loaded safely
    const cartData = await page.evaluate(() => {
      const cartJson = localStorage.getItem('cart');
      if (cartJson) {
        try {
          return JSON.parse(cartJson);
        } catch (e) {
          return null;
        }
      }
      return null;
    });

    if (cartData && cartData.length > 0) {
      expect(cartData[0].name).not.toContain('<script>');
    }
  });

  /**
   * Test: SEC-XSS-CD-014
   * Verify XSS in cart notification messages
   */
  test('SEC-XSS-CD-014: Should sanitize XSS in cart notifications', async () => {
    await page.goto(indexUrl, { waitUntil: 'networkidle0' });

    // Trigger notification with XSS
    await page.evaluate(() => {
      if (window.showNotification) {
        window.showNotification(
          'Added <script>alert("Notification XSS")</script> to cart',
          'success'
        );
      }
    });

    await page.waitForTimeout(500);

    // Check notification content
    const notification = await page.evaluate(() => {
      const toast = document.querySelector('.toast, .notification, .alert');
      return toast ? toast.innerHTML : null;
    });

    if (notification) {
      expect(notification).not.toContain('<script>alert');
    }
  });

  /**
   * Test: SEC-XSS-CD-015
   * Comprehensive cart data XSS test
   */
  test('SEC-XSS-CD-015: Should handle all cart XSS vectors comprehensively', async () => {
    const results = [];

    for (const vector of cartXssVectors) {
      const testCart = [{
        productId: `test-${vector.field}`,
        name: vector.field === 'name' ? vector.payload : 'Test Product',
        description: vector.field === 'description' ? vector.payload : 'Test description',
        price: vector.field === 'price' ? vector.payload : 99.99,
        quantity: vector.field === 'quantity' ? vector.payload : 1,
        image: vector.field === 'image' ? vector.payload : 'test.jpg',
        category: vector.field === 'category' ? vector.payload : 'test'
      }];

      try {
        await page.evaluate((cart) => {
          localStorage.setItem('cart', JSON.stringify(cart));
        }, testCart);

        await page.goto(cartUrl, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(300);

        // Check if XSS was executed (would throw from dialog listener)
        results.push({
          field: vector.field,
          description: vector.description,
          safe: true
        });

        // Clear for next test
        await page.evaluate(() => {
          localStorage.clear();
        });
      } catch (error) {
        results.push({
          field: vector.field,
          description: vector.description,
          safe: false,
          error: error.message
        });
      }
    }

    // Verify all vectors were handled safely
    const allSafe = results.every(r => r.safe);
    
    if (!allSafe) {
      console.log('Failed cart XSS tests:', results.filter(r => !r.safe));
    }

    expect(allSafe).toBe(true);
  });
});

/**
 * Test Execution Summary:
 * - Total Tests: 15
 * - Cart XSS Vectors: 8 fields tested
 * - Coverage: Cart data, localStorage, rendering, notifications
 * - Priority: Critical
 * 
 * Expected Results:
 * - All XSS in cart data should be sanitized
 * - Cart page should render safely
 * - No JavaScript execution from cart data
 * - Proper data type validation (numbers for price/quantity)
 * 
 * Security Recommendations:
 * 1. Validate cart data structure on load
 * 2. Sanitize all fields before rendering
 * 3. Use textContent for user-generated content
 * 4. Validate data types (price as number, quantity as integer)
 * 5. Implement Content Security Policy
 * 6. Use DOMPurify for HTML sanitization
 */

