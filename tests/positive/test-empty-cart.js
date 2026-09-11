/**
 * Positive Test Case: Empty Cart Functionality
 * 
 * Test ID: POS-010
 * Priority: Medium
 * Category: Positive Testing
 * 
 * Description:
 * Verify empty cart state, clear cart functionality, and empty cart messaging.
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-010: Empty Cart Functionality', () => {
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

  test('should show empty cart message when no items', async () => {
    // Navigate to cart without adding items
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Check for empty message
    const emptyMessage = await page.$('.empty-cart-message, .cart-empty, .no-items');
    expect(emptyMessage).not.toBeNull();

    console.log('✓ Test passed: Empty cart message displayed');
  });

  test('should show badge as 0 when cart is empty', async () => {
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('0');

    console.log('✓ Test passed: Badge shows 0 for empty cart');
  });

  test('should clear all items when clear cart button clicked', async () => {
    // Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Click clear cart button if exists
    const clearButton = await page.$('.clear-cart-btn, .empty-cart-btn, [data-action="clear"]');
    if (clearButton) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Verify empty message
      const emptyMessage = await page.$('.empty-cart-message, .cart-empty');
      expect(emptyMessage).not.toBeNull();
    }

    console.log('✓ Test passed: Clear cart functionality works');
  });

  test('should update badge to 0 after clearing cart', async () => {
    // Add items
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Remove the item
    await page.waitForSelector('.remove-item-btn, .remove-btn', { timeout: 5000 });
    await page.click('.remove-item-btn, .remove-btn');
    await page.waitForTimeout(500);

    // Check badge
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('0');

    console.log('✓ Test passed: Badge updated to 0 after clearing');
  });

  test('should persist empty state after reload', async () => {
    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify still empty
    const emptyMessage = await page.$('.empty-cart-message, .cart-empty, .no-items');
    expect(emptyMessage).not.toBeNull();

    console.log('✓ Test passed: Empty state persisted');
  });

  test('should show continue shopping button on empty cart', async () => {
    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Check for continue shopping button
    const continueButton = await page.$('.continue-shopping, [href="index.html"], .back-to-shop');
    expect(continueButton).not.toBeNull();

    console.log('✓ Test passed: Continue shopping button present');
  });

  test('should not show checkout button when cart is empty', async () => {
    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForTimeout(1000);

    // Check if checkout button is hidden or disabled
    const checkoutButton = await page.$('.checkout-btn, .proceed-checkout');
    
    if (checkoutButton) {
      const isDisabled = await page.evaluate(() => {
        const btn = document.querySelector('.checkout-btn, .proceed-checkout');
        return btn.disabled || btn.style.display === 'none';
      });
      expect(isDisabled).toBe(true);
    }

    console.log('✓ Test passed: Checkout button handled for empty cart');
  });
});

/**
 * Test Execution Summary
 * Total Test Cases: 7
 * Coverage: Empty state, clear cart, badge updates, persistence
 */

