/**
 * Positive Test Case: Update Quantity in Cart
 * 
 * Test ID: POS-008
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that users can increase and decrease product quantities
 * in the cart using quantity controls.
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-008: Update Quantity in Cart', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';

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

  test('should increase quantity using plus button', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Click increase button
    await page.waitForSelector('.increase-qty, .qty-plus, [data-action="increase"]', { timeout: 5000 });
    await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
    await page.waitForTimeout(300);

    // Verify quantity is 2
    const quantity = await page.$eval('.quantity-value, .qty-input, input[type="number"]', 
      el => parseInt(el.value || el.textContent)
    );

    expect(quantity).toBe(2);

    console.log('✓ Test passed: Quantity increased');
  });

  test('should decrease quantity using minus button', async () => {
    // Add item twice
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(150);
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Click decrease button
    await page.waitForSelector('.decrease-qty, .qty-minus, [data-action="decrease"]', { timeout: 5000 });
    await page.click('.decrease-qty, .qty-minus, [data-action="decrease"]');
    await page.waitForTimeout(300);

    // Verify quantity is 1
    const quantity = await page.$eval('.quantity-value, .qty-input, input[type="number"]', 
      el => parseInt(el.value || el.textContent)
    );

    expect(quantity).toBe(1);

    console.log('✓ Test passed: Quantity decreased');
  });

  test('should update cart total when quantity changes', async () => {
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

    console.log('✓ Test passed: Total updated with quantity');
  });

  test('should update badge when quantity increases', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Increase quantity 3 times
    for (let i = 0; i < 3; i++) {
      await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
      await page.waitForTimeout(200);
    }

    // Check badge shows 4
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('4');

    console.log('✓ Test passed: Badge updated with quantity increase');
  });

  test('should update badge when quantity decreases', async () => {
    // Add item 5 times
    for (let i = 0; i < 5; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(100);
    }

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Decrease quantity 2 times
    await page.waitForSelector('.decrease-qty, .qty-minus, [data-action="decrease"]', { timeout: 5000 });
    for (let i = 0; i < 2; i++) {
      await page.click('.decrease-qty, .qty-minus, [data-action="decrease"]');
      await page.waitForTimeout(200);
    }

    // Check badge shows 3
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('3');

    console.log('✓ Test passed: Badge updated with quantity decrease');
  });

  test('should persist quantity changes after reload', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Increase quantity to 3
    await page.waitForSelector('.increase-qty, .qty-plus, [data-action="increase"]', { timeout: 5000 });
    await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
    await page.waitForTimeout(200);
    await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
    await page.waitForTimeout(300);

    // Reload page
    await page.reload();
    await page.waitForSelector('.quantity-value, .qty-input', { timeout: 5000 });

    // Verify quantity is still 3
    const quantity = await page.$eval('.quantity-value, .qty-input, input[type="number"]', 
      el => parseInt(el.value || el.textContent)
    );

    expect(quantity).toBe(3);

    console.log('✓ Test passed: Quantity persisted after reload');
  });

  test('should handle rapid quantity changes', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Rapidly increase quantity 5 times
    await page.waitForSelector('.increase-qty, .qty-plus, [data-action="increase"]', { timeout: 5000 });
    for (let i = 0; i < 5; i++) {
      await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);

    // Verify final quantity
    const quantity = await page.$eval('.quantity-value, .qty-input, input[type="number"]', 
      el => parseInt(el.value || el.textContent)
    );

    expect(quantity).toBe(6);

    console.log('✓ Test passed: Rapid changes handled correctly');
  });

  test('should update item subtotal when quantity changes', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get item price
    await page.waitForSelector('.item-price, .product-price', { timeout: 5000 });
    const itemPrice = await page.$eval('.item-price, .product-price', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    // Increase quantity to 3
    await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
    await page.waitForTimeout(200);
    await page.click('.increase-qty, .qty-plus, [data-action="increase"]');
    await page.waitForTimeout(300);

    // Get item subtotal
    const subtotal = await page.$eval('.item-subtotal, .item-total', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(subtotal).toBeCloseTo(itemPrice * 3, 2);

    console.log('✓ Test passed: Item subtotal updated correctly');
  });
});

/**
 * Test Execution Summary
 * Total Test Cases: 8
 * Coverage: Increase/decrease quantity, total updates, badge updates, persistence
 */

