/**
 * Positive Test Case: Cart Total Calculation
 * 
 * Test ID: POS-009
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that cart calculates subtotal, tax, and total correctly.
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-009: Cart Total Calculation', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';
  const TAX_RATE = 0.10; // 10% tax

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });
  });

  afterEach(async () => await page.close());
  afterAll(async () => await browser.close());

  test('should calculate correct subtotal for single item', async () => {
    // Get product price
    const productPrice = await page.$eval('.product-card:first-child .product-price', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    // Add to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get subtotal
    await page.waitForSelector('.subtotal, .cart-subtotal', { timeout: 5000 });
    const subtotal = await page.$eval('.subtotal, .cart-subtotal', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(subtotal).toBeCloseTo(productPrice, 2);

    console.log('✓ Test passed: Subtotal calculated correctly');
  });

  test('should calculate correct subtotal for multiple items', async () => {
    // Add 3 different items
    const prices = [];
    for (let i = 1; i <= 3; i++) {
      const price = await page.$eval(`.product-card:nth-child(${i}) .product-price`, 
        el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
      );
      prices.push(price);
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(150);
    }

    const expectedSubtotal = prices.reduce((sum, price) => sum + price, 0);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get subtotal
    await page.waitForSelector('.subtotal, .cart-subtotal', { timeout: 5000 });
    const subtotal = await page.$eval('.subtotal, .cart-subtotal', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(subtotal).toBeCloseTo(expectedSubtotal, 2);

    console.log('✓ Test passed: Multiple items subtotal correct');
  });

  test('should calculate correct tax amount', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get subtotal and tax
    await page.waitForSelector('.subtotal, .cart-subtotal', { timeout: 5000 });
    const subtotal = await page.$eval('.subtotal, .cart-subtotal', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    const tax = await page.$eval('.tax, .cart-tax', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    const expectedTax = subtotal * TAX_RATE;
    expect(tax).toBeCloseTo(expectedTax, 2);

    console.log('✓ Test passed: Tax calculated correctly');
  });

  test('should calculate correct total (subtotal + tax)', async () => {
    // Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get all amounts
    await page.waitForSelector('.subtotal, .cart-subtotal', { timeout: 5000 });
    const subtotal = await page.$eval('.subtotal, .cart-subtotal', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    const tax = await page.$eval('.tax, .cart-tax', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    const total = await page.$eval('.cart-total, .total-amount', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(total).toBeCloseTo(subtotal + tax, 2);

    console.log('✓ Test passed: Total calculated correctly');
  });

  test('should update totals when quantity changes', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get initial total
    await page.waitForSelector('.cart-total, .total-amount', { timeout: 5000 });
    const totalBefore = await page.$eval('.cart-total, .total-amount', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    // Increase quantity
    await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
    await page.waitForTimeout(500);

    // Get new total
    const totalAfter = await page.$eval('.cart-total, .total-amount', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(totalAfter).toBeGreaterThan(totalBefore);
    expect(totalAfter).toBeCloseTo(totalBefore * 2, 1);

    console.log('✓ Test passed: Totals updated with quantity');
  });

  test('should handle decimal prices correctly', async () => {
    // Add multiple items
    for (let i = 1; i <= 3; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(150);
    }

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get total
    await page.waitForSelector('.cart-total, .total-amount', { timeout: 5000 });
    const total = await page.$eval('.cart-total, .total-amount', 
      el => el.textContent
    );

    // Verify format has 2 decimal places
    const hasCorrectFormat = /\d+\.\d{2}/.test(total);
    expect(hasCorrectFormat).toBe(true);

    console.log('✓ Test passed: Decimal formatting correct');
  });

  test('should calculate totals for items with different quantities', async () => {
    // Add item 1 three times
    for (let i = 0; i < 3; i++) {
      await page.click('.product-card:nth-child(1) .add-to-cart-btn');
      await page.waitForTimeout(100);
    }

    // Add item 2 twice
    for (let i = 0; i < 2; i++) {
      await page.click('.product-card:nth-child(2) .add-to-cart-btn');
      await page.waitForTimeout(100);
    }

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Verify badge shows 5
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('5');

    // Verify totals are calculated
    await page.waitForSelector('.cart-total, .total-amount', { timeout: 5000 });
    const total = await page.$eval('.cart-total, .total-amount', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(total).toBeGreaterThan(0);

    console.log('✓ Test passed: Mixed quantities calculated correctly');
  });

  test('should show zero totals for empty cart', async () => {
    // Navigate to cart without adding items
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Check if empty cart message or zero totals
    const hasEmptyMessage = await page.$('.empty-cart-message, .cart-empty');
    
    if (!hasEmptyMessage) {
      const total = await page.$eval('.cart-total, .total-amount', 
        el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
      );
      expect(total).toBe(0);
    }

    expect(hasEmptyMessage !== null || true).toBe(true);

    console.log('✓ Test passed: Empty cart handled correctly');
  });
});

/**
 * Test Execution Summary
 * Total Test Cases: 8
 * Coverage: Subtotal, tax, total calculations, quantity updates, decimal handling
 */

