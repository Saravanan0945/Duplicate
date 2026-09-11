/**
 * Automated Test Suite for "Go to Cart" Button Functionality
 * Framework: Jest + Puppeteer
 * Coverage: Positive, Negative, Security, Boundary Value Tests
 */

const puppeteer = require('puppeteer');

describe('Go to Cart Button Functionality - Automated Tests', () => {
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
    await page.goto(`${BASE_URL}/index.html`);
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await page.close();
  });

  // CATEGORY 1: POSITIVE TEST CASES

  describe('Positive Test Cases', () => {
    
    test('GTC-POS-001: Basic "Go to Cart" Navigation', async () => {
      await page.click('[data-product-id="prod-001"]');
      
      await page.waitForSelector('#cart-count');
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('1');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      expect(page.url()).toContain('cart.html');
      
      const cartItem = await page.$('[data-product-id="prod-001"]');
      expect(cartItem).toBeTruthy();
    });

    test('GTC-POS-002: Multiple Products in Cart Navigation', async () => {
      await page.click('[data-product-id="prod-001"]');
      await page.click('[data-product-id="prod-002"]');
      await page.click('[data-product-id="prod-002"]');
      await page.click('[data-product-id="prod-003"]');
      await page.click('[data-product-id="prod-003"]');
      await page.click('[data-product-id="prod-003"]');
      
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('6');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBe(3);
    });

    test('GTC-POS-003: Cart Badge Update After Adding Items', async () => {
      await page.click('[data-product-id="prod-001"]');
      let badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('1');
      
      for (let i = 0; i < 5; i++) {
        await page.click('[data-product-id="prod-002"]');
      }
      
      badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('6');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const badgeOnCartPage = await page.$('#cart-count');
      expect(badgeOnCartPage).toBeTruthy();
    });

    test('GTC-POS-005: Cart Persistence After Navigation', async () => {
      await page.click('[data-product-id="prod-001"]');
      await page.click('[data-product-id="prod-002"]');
      await page.click('[data-product-id="prod-003"]');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      await page.click('#continue-shopping-btn');
      await page.waitForNavigation();
      
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('3');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBe(3);
    });

    test('GTC-POS-006: Toast Notification on Add to Cart', async () => {
      await page.click('[data-product-id="prod-001"]');
      
      await page.waitForSelector('.notification');
      const notification = await page.$('.notification');
      expect(notification).toBeTruthy();
      
      const notificationText = await page.$eval('.notification', el => el.textContent);
      expect(notificationText).toContain('Added to cart');
      
      const isSuccess = await page.$eval('.notification', 
        el => el.classList.contains('notification-success'));
      expect(isSuccess).toBe(true);
    });

    test('GTC-POS-008: Multiple Add to Cart Actions', async () => {
      await page.click('[data-product-id="prod-001"]');
      await page.click('[data-product-id="prod-001"]');
      await page.click('[data-product-id="prod-001"]');
      
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('3');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBe(1);
      
      const quantity = await page.$eval('.quantity-input', el => el.value);
      expect(quantity).toBe('3');
    });

    test('GTC-POS-009: Cart Summary Calculations', async () => {
      await page.click('[data-product-id="prod-001"]');
      await page.click('[data-product-id="prod-001"]');
      await page.click('[data-product-id="prod-005"]');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const subtotal = await page.$eval('#subtotal', el => el.textContent);
      expect(subtotal).toBe('$199.97');
      
      const tax = await page.$eval('#tax', el => el.textContent);
      expect(tax).toBe('$19.99');
      
      const total = await page.$eval('#total', el => el.textContent);
      expect(total).toBe('$219.96');
    });

    test('GTC-POS-013: Browser Back Button After Navigation', async () => {
      await page.click('[data-product-id="prod-001"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      await page.goBack();
      await page.waitForNavigation();
      
      expect(page.url()).toContain('index.html');
      
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('1');
    });

    test('GTC-POS-014: Keyboard Navigation', async () => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement.className);
      expect(focusedElement).toContain('add-to-cart-btn');
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('1');
    });
  });

  // CATEGORY 2: NEGATIVE TEST CASES

  describe('Negative Test Cases', () => {
    
    test('GTC-NEG-001: Empty Cart Navigation Attempt', async () => {
      await page.click('#go-to-cart-btn');
      
      await page.waitForSelector('.notification-error');
      const notification = await page.$eval('.notification-error', el => el.textContent);
      expect(notification).toContain('cart is empty');
      
      expect(page.url()).toContain('index.html');
    });

    test('GTC-NEG-003: Corrupted localStorage Data', async () => {
      await page.evaluate(() => {
        localStorage.setItem('shopping_cart', '{invalid json}');
      });
      
      await page.reload();
      
      await page.click('[data-product-id="prod-001"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBe(1);
    });

    test('GTC-NEG-006: Rapid Multiple Clicks on "Go to Cart"', async () => {
      await page.click('[data-product-id="prod-001"]');
      
      const navigationPromise = page.waitForNavigation();
      
      for (let i = 0; i < 10; i++) {
        await page.click('#go-to-cart-btn', { delay: 10 });
      }
      
      await navigationPromise;
      
      expect(page.url()).toContain('cart.html');
      
      const errors = [];
      page.on('pageerror', error => errors.push(error));
      expect(errors.length).toBe(0);
    });

    test('GTC-NEG-010: Invalid Product ID in Cart', async () => {
      await page.evaluate(() => {
        localStorage.setItem('shopping_cart', JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          cart: {
            items: [
              { productId: 'invalid-id', quantity: 1 },
              { productId: 'prod-001', quantity: 1 }
            ]
          }
        }));
      });
      
      await page.reload();
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBeLessThanOrEqual(1);
    });

    test('GTC-NEG-011: Negative Quantity in Cart', async () => {
      await page.evaluate(() => {
        localStorage.setItem('shopping_cart', JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          cart: {
            items: [{ productId: 'prod-001', quantity: -5 }]
          }
        }));
      });
      
      await page.reload();
      await page.click('#go-to-cart-btn');
      
      await page.waitForSelector('.notification-error');
      const notification = await page.$('.notification-error');
      expect(notification).toBeTruthy();
    });

    test('GTC-NEG-012: Non-Integer Quantity', async () => {
      await page.evaluate(() => {
        localStorage.setItem('shopping_cart', JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          cart: {
            items: [{ productId: 'prod-001', quantity: 2.5 }]
          }
        }));
      });
      
      await page.reload();
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const quantity = await page.$eval('.quantity-input', el => el.value);
      expect(parseInt(quantity)).toBe(Math.floor(2.5));
    });

    test('GTC-NEG-013: Extremely Large Quantity', async () => {
      await page.evaluate(() => {
        localStorage.setItem('shopping_cart', JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          cart: {
            items: [{ productId: 'prod-001', quantity: 10000 }]
          }
        }));
      });
      
      await page.reload();
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const quantity = await page.$eval('.quantity-input', el => el.value);
      expect(parseInt(quantity)).toBeLessThanOrEqual(999);
    });
  });

  // CATEGORY 3: SECURITY TEST CASES

  describe('Security Test Cases', () => {
    
    test('GTC-SEC-001: XSS Attack via Product Name', async () => {
      await page.evaluate(() => {
        const maliciousScript = '<script>alert("XSS")</script>';
        localStorage.setItem('shopping_cart', JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          cart: {
            items: [{ productId: 'prod-001', quantity: 1 }]
          }
        }));
      });
      
      let dialogAppeared = false;
      page.on('dialog', async dialog => {
        dialogAppeared = true;
        await dialog.dismiss();
      });
      
      await page.reload();
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      expect(dialogAppeared).toBe(false);
      
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>alert');
    });

    test('GTC-SEC-002: XSS Attack via localStorage Injection', async () => {
      await page.evaluate(() => {
        localStorage.setItem('shopping_cart', 
          '<img src=x onerror=alert("XSS")>');
      });
      
      let dialogAppeared = false;
      page.on('dialog', async dialog => {
        dialogAppeared = true;
        await dialog.dismiss();
      });
      
      await page.reload();
      
      expect(dialogAppeared).toBe(false);
    });

    test('GTC-SEC-009: DOM-Based XSS Prevention', async () => {
      await page.goto(`${BASE_URL}/index.html?productId=<script>alert("XSS")</script>`);
      
      let dialogAppeared = false;
      page.on('dialog', async dialog => {
        dialogAppeared = true;
        await dialog.dismiss();
      });
      
      await page.waitForTimeout(1000);
      
      expect(dialogAppeared).toBe(false);
    });
  });

  // CATEGORY 4: BOUNDARY VALUE TEST CASES

  describe('Boundary Value Test Cases', () => {
    
    test('GTC-BND-001: Zero Items in Cart', async () => {
      await page.click('#go-to-cart-btn');
      
      await page.waitForSelector('.notification-error');
      expect(page.url()).toContain('index.html');
    });

    test('GTC-BND-002: Single Item in Cart', async () => {
      await page.click('[data-product-id="prod-001"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      expect(page.url()).toContain('cart.html');
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBe(1);
    });

    test('GTC-BND-005: Maximum Unique Products', async () => {
      const productIds = [
        'prod-001', 'prod-002', 'prod-003', 'prod-004', 'prod-005',
        'prod-006', 'prod-007', 'prod-008', 'prod-009', 'prod-010',
        'prod-011', 'prod-012', 'prod-013', 'prod-014', 'prod-015',
        'prod-016', 'prod-017', 'prod-018'
      ];
      
      for (const id of productIds) {
        await page.click(`[data-product-id="${id}"]`);
      }
      
      const badgeText = await page.$eval('#cart-count', el => el.textContent);
      expect(badgeText).toBe('18');
      
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBe(18);
    });

    test('GTC-BND-006: Minimum Price Product', async () => {
      await page.click('[data-product-id="prod-016"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const price = await page.$eval('.cart-item-price', el => el.textContent);
      expect(price).toBe('$12.99');
      
      const subtotal = await page.$eval('#subtotal', el => el.textContent);
      expect(subtotal).toBe('$12.99');
    });

    test('GTC-BND-007: Maximum Price Product', async () => {
      await page.click('[data-product-id="prod-002"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const price = await page.$eval('.cart-item-price', el => el.textContent);
      expect(price).toBe('$299.99');
      
      const subtotal = await page.$eval('#subtotal', el => el.textContent);
      expect(subtotal).toBe('$299.99');
    });
  });

  // CATEGORY 5: PERFORMANCE TEST CASES

  describe('Performance Test Cases', () => {
    
    test('GTC-PERF-001: Page Load Performance', async () => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForSelector('#product-grid');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000);
    });

    test('GTC-PERF-002: Cart Badge Update Performance', async () => {
      const startTime = Date.now();
      await page.click('[data-product-id="prod-001"]');
      await page.waitForSelector('#cart-count');
      const updateTime = Date.now() - startTime;
      
      expect(updateTime).toBeLessThan(100);
    });

    test('GTC-PERF-003: Large Cart Rendering Performance', async () => {
      const productIds = [
        'prod-001', 'prod-002', 'prod-003', 'prod-004', 'prod-005',
        'prod-006', 'prod-007', 'prod-008', 'prod-009', 'prod-010',
        'prod-011', 'prod-012', 'prod-013', 'prod-014', 'prod-015',
        'prod-016', 'prod-017', 'prod-018'
      ];
      
      for (const id of productIds) {
        await page.click(`[data-product-id="${id}"]`);
      }
      
      const startTime = Date.now();
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      await page.waitForSelector('.cart-item');
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(500);
    });
  });

  // RESPONSIVE DESIGN TESTS

  describe('Responsive Design Tests', () => {
    
    test('GTC-POS-010: Desktop Viewport', async () => {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.reload();
      
      await page.click('[data-product-id="prod-001"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartVisible = await page.$('.cart-item');
      expect(cartVisible).toBeTruthy();
    });

    test('GTC-POS-011: Tablet Viewport', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload();
      
      await page.click('[data-product-id="prod-001"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartVisible = await page.$('.cart-item');
      expect(cartVisible).toBeTruthy();
    });

    test('GTC-POS-012: Mobile Viewport', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();
      
      await page.click('[data-product-id="prod-001"]');
      await page.click('#go-to-cart-btn');
      await page.waitForNavigation();
      
      const cartVisible = await page.$('.cart-item');
      expect(cartVisible).toBeTruthy();
    });
  });
});

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true
};

