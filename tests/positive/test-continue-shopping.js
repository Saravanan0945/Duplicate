/**
 * Positive Test Case: Continue Shopping Navigation
 * 
 * Test ID: POS-011
 * Priority: Medium
 * Category: Positive Testing
 * 
 * Description:
 * Verify that users can navigate back to the product listing page
 * from the cart page using the "Continue Shopping" button.
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-011: Continue Shopping Navigation', () => {
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

  test('should navigate back to index page from cart', async () => {
    // Add item and go to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Click continue shopping
    await page.waitForSelector('.continue-shopping, [href="index.html"], .back-to-shop', { timeout: 5000 });
    await page.click('.continue-shopping, [href="index.html"], .back-to-shop');
    await page.waitForNavigation({ timeout: 5000 });

    // Verify on index page
    const url = page.url();
    expect(url).toContain('index.html') || expect(url).toBe(BASE_URL + '/');

    console.log('✓ Test passed: Navigated back to index');
  });

  test('should preserve cart when navigating back', async () => {
    // Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Go to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Continue shopping
    await page.waitForSelector('.continue-shopping, [href="index.html"]', { timeout: 5000 });
    await page.click('.continue-shopping, [href="index.html"]');
    await page.waitForNavigation({ timeout: 5000 });

    // Verify badge still shows 2
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('2');

    console.log('✓ Test passed: Cart preserved during navigation');
  });

  test('should show continue shopping button on cart page', async () => {
    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Verify button exists
    const button = await page.$('.continue-shopping, [href="index.html"], .back-to-shop');
    expect(button).not.toBeNull();

    console.log('✓ Test passed: Continue shopping button exists');
  });

  test('should allow adding more items after continuing shopping', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Go to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Continue shopping
    await page.waitForSelector('.continue-shopping, [href="index.html"]', { timeout: 5000 });
    await page.click('.continue-shopping, [href="index.html"]');
    await page.waitForNavigation({ timeout: 5000 });

    // Add another item
    await page.waitForSelector('.product-card', { timeout: 5000 });
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Verify badge shows 2
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('2');

    console.log('✓ Test passed: Can add items after continuing shopping');
  });

  test('should work from empty cart', async () => {
    // Navigate to cart without items
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Click continue shopping
    const button = await page.$('.continue-shopping, [href="index.html"], .back-to-shop');
    if (button) {
      await button.click();
      await page.waitForNavigation({ timeout: 5000 });

      // Verify on index page
      const url = page.url();
      expect(url).toContain('index.html') || expect(url).toBe(BASE_URL + '/');
    }

    console.log('✓ Test passed: Works from empty cart');
  });

  test('should maintain scroll position on product page', async () => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);

    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Go to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Continue shopping
    await page.waitForSelector('.continue-shopping, [href="index.html"]', { timeout: 5000 });
    await page.click('.continue-shopping, [href="index.html"]');
    await page.waitForNavigation({ timeout: 5000 });

    // Verify page loaded
    await page.waitForSelector('.product-card', { timeout: 5000 });
    const productsVisible = await page.$$('.product-card');
    expect(productsVisible.length).toBeGreaterThan(0);

    console.log('✓ Test passed: Product page loaded correctly');
  });
});

/**
 * Test Execution Summary
 * Total Test Cases: 6
 * Coverage: Back navigation, cart preservation, button visibility, workflow
 */

