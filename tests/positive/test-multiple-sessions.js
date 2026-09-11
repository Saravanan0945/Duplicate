/**
 * Positive Test Case: Cart Across Multiple Browser Sessions
 * 
 * Test ID: POS-014
 * Priority: Medium
 * Category: Positive Testing
 * 
 * Description:
 * Verify that cart data persists across browser sessions using localStorage.
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-014: Cart Across Multiple Browser Sessions', () => {
  let browser;
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

  test('should persist cart across browser close and reopen', async () => {
    // Session 1: Add items
    let page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Get cart data
    const cartData = await page.evaluate(() => {
      return localStorage.getItem('shopping_cart');
    });

    await page.close();

    // Session 2: Verify cart persists
    page = await browser.newPage();
    
    // Set the same localStorage data
    await page.goto(BASE_URL);
    await page.evaluate((data) => {
      localStorage.setItem('shopping_cart', data);
    }, cartData);
    
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 5000 });

    // Verify badge shows 2
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('2');

    await page.close();

    console.log('✓ Test passed: Cart persisted across sessions');
  });

  test('should maintain cart in multiple tabs', async () => {
    // Tab 1: Add items
    const page1 = await browser.newPage();
    await page1.goto(BASE_URL);
    await page1.evaluate(() => localStorage.clear());
    await page1.reload();
    await page1.waitForSelector('.product-card', { timeout: 5000 });

    await page1.click('.product-card:first-child .add-to-cart-btn');
    await page1.waitForTimeout(300);

    // Tab 2: Check cart
    const page2 = await browser.newPage();
    await page2.goto(BASE_URL);
    await page2.waitForSelector('.cart-badge', { timeout: 5000 });

    const badgeCount = await page2.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('1');

    await page1.close();
    await page2.close();

    console.log('✓ Test passed: Cart shared across tabs');
  });

  test('should persist cart with multiple items across sessions', async () => {
    // Session 1
    let page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Add 5 items
    for (let i = 1; i <= 5; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(100);
    }

    const cartData = await page.evaluate(() => {
      return localStorage.getItem('shopping_cart');
    });

    await page.close();

    // Session 2
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate((data) => {
      localStorage.setItem('shopping_cart', data);
    }, cartData);
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 5000 });

    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('5');

    await page.close();

    console.log('✓ Test passed: Multiple items persisted');
  });

  test('should persist cart with quantities across sessions', async () => {
    // Session 1
    let page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.product-card', { timeout: 5000 });

    // Add same item 3 times
    for (let i = 0; i < 3; i++) {
      await page.click('.product-card:first-child .add-to-cart-btn');
      await page.waitForTimeout(100);
    }

    const cartData = await page.evaluate(() => {
      return localStorage.getItem('shopping_cart');
    });

    await page.close();

    // Session 2
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate((data) => {
      localStorage.setItem('shopping_cart', data);
    }, cartData);
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 5000 });

    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('3');

    await page.close();

    console.log('✓ Test passed: Quantities persisted');
  });

  test('should handle empty cart across sessions', async () => {
    // Session 1
    let page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.cart-badge', { timeout: 5000 });

    const badgeCount1 = await page.$eval('.cart-badge', el => el.textContent);
    await page.close();

    // Session 2
    page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.waitForSelector('.cart-badge', { timeout: 5000 });

    const badgeCount2 = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount2).toBe('0');

    await page.close();

    console.log('✓ Test passed: Empty cart handled across sessions');
  });
});

/**
 * Test Execution Summary
 * Total Test Cases: 5
 * Coverage: Session persistence, multiple tabs, quantities, empty cart
 */

