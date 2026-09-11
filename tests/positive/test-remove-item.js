/**
 * Positive Test Case: Remove Item from Cart
 * 
 * Test ID: POS-007
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that users can successfully remove items from the cart
 * and that the cart state updates correctly.
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-007: Remove Item from Cart', () => {
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

  test('should remove single item from cart', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Remove item
    await page.waitForSelector('.remove-item-btn, .remove-btn, [data-action="remove"]', { timeout: 5000 });
    await page.click('.remove-item-btn, .remove-btn, [data-action="remove"]');
    await page.waitForTimeout(500);

    // Verify cart is empty
    const emptyMessage = await page.$('.empty-cart-message, .cart-empty');
    expect(emptyMessage).not.toBeNull();

    console.log('✓ Test passed: Item removed successfully');
  });

  test('should update badge after removing item', async () => {
    // Add 2 items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Remove one item
    await page.waitForSelector('.remove-item-btn, .remove-btn', { timeout: 5000 });
    await page.click('.remove-item-btn, .remove-btn');
    await page.waitForTimeout(500);

    // Check badge
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('1');

    console.log('✓ Test passed: Badge updated after removal');
  });

  test('should remove correct item when multiple items in cart', async () => {
    // Add 3 items
    for (let i = 1; i <= 3; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(150);
    }

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Count items before removal
    await page.waitForSelector('.cart-item, .cart-product', { timeout: 5000 });
    const itemsBefore = await page.$$eval('.cart-item, .cart-product', items => items.length);

    // Remove first item
    await page.click('.cart-item:first-child .remove-item-btn, .cart-product:first-child .remove-btn');
    await page.waitForTimeout(500);

    // Count items after removal
    const itemsAfter = await page.$$eval('.cart-item, .cart-product', items => items.length);

    expect(itemsAfter).toBe(itemsBefore - 1);

    console.log('✓ Test passed: Correct item removed');
  });

  test('should update total after removing item', async () => {
    // Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Get total before removal
    await page.waitForSelector('.cart-total, .total-amount', { timeout: 5000 });
    const totalBefore = await page.$eval('.cart-total, .total-amount', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    // Remove item
    await page.click('.remove-item-btn, .remove-btn');
    await page.waitForTimeout(500);

    // Get total after removal
    const totalAfter = await page.$eval('.cart-total, .total-amount', 
      el => parseFloat(el.textContent.replace(/[^0-9.]/g, ''))
    );

    expect(totalAfter).toBeLessThan(totalBefore);

    console.log('✓ Test passed: Total updated after removal');
  });

  test('should persist removal after page reload', async () => {
    // Add 2 items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Remove one item
    await page.waitForSelector('.remove-item-btn, .remove-btn', { timeout: 5000 });
    await page.click('.remove-item-btn, .remove-btn');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForSelector('.cart-item, .cart-product, .empty-cart-message', { timeout: 5000 });

    // Verify only 1 item remains
    const items = await page.$$('.cart-item, .cart-product');
    expect(items.length).toBe(1);

    console.log('✓ Test passed: Removal persisted after reload');
  });

  test('should show empty cart message when all items removed', async () => {
    // Add one item
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

    // Check for empty message
    const emptyMessage = await page.$('.empty-cart-message, .cart-empty, .no-items');
    expect(emptyMessage).not.toBeNull();

    console.log('✓ Test passed: Empty cart message displayed');
  });

  test('should show notification after removing item', async () => {
    // Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Remove item
    await page.waitForSelector('.remove-item-btn, .remove-btn', { timeout: 5000 });
    await page.click('.remove-item-btn, .remove-btn');

    // Check for notification
    await page.waitForSelector('.toast-notification, .notification', { timeout: 2000 });
    const notification = await page.$('.toast-notification, .notification');
    expect(notification).not.toBeNull();

    console.log('✓ Test passed: Notification shown after removal');
  });

  test('should remove item with high quantity', async () => {
    // Add same item 10 times
    for (let i = 0; i < 10; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(50);
    }

    // Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Remove item
    await page.waitForSelector('.remove-item-btn, .remove-btn', { timeout: 5000 });
    await page.click('.remove-item-btn, .remove-btn');
    await page.waitForTimeout(500);

    // Verify cart is empty
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('0');

    console.log('✓ Test passed: High quantity item removed');
  });
});

/**
 * Test Execution Summary
 * Total Test Cases: 8
 * Coverage: Item removal, badge updates, total recalculation, persistence
 */

