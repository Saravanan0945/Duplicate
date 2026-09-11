/**
 * Positive Test Case: Go to Cart Button Navigation
 * 
 * Test ID: POS-004
 * Priority: Critical
 * Category: Positive Testing
 * 
 * Description:
 * Verify that the "Go to Cart" button successfully navigates the user
 * to the cart page (cart.html) and that cart data is preserved during navigation.
 * This is the PRIMARY test case for Jira ticket ST-2.
 * 
 * Prerequisites:
 * - Shopping cart application is loaded
 * - Products are available
 * - Cart page (cart.html) exists
 * - localStorage is accessible
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-004: Go to Cart Button Navigation [ST-2 PRIMARY]', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';
  const CART_URL = `${BASE_URL}/cart.html`;

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

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  /**
   * Test Case 1: Verify "Go to Cart" button exists and is visible
   * ST-2 Acceptance Criteria: "Go to Cart" button is visible and clickable
   */
  test('should display "Go to Cart" button on main page', async () => {
    // Step 1: Check if button exists
    const buttonExists = await page.$('.go-to-cart-btn, #goToCartBtn, [href="cart.html"]');
    expect(buttonExists).not.toBeNull();

    // Step 2: Verify button is visible
    const isVisible = await page.evaluate(() => {
      const btn = document.querySelector('.go-to-cart-btn') || 
                   document.querySelector('#goToCartBtn') ||
                   document.querySelector('[href="cart.html"]');
      if (!btn) return false;
      const rect = btn.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && 
             window.getComputedStyle(btn).display !== 'none';
    });

    expect(isVisible).toBe(true);

    console.log('✓ Test passed: "Go to Cart" button is visible');
  });

  /**
   * Test Case 2: Navigate to cart page with items in cart
   * ST-2 Acceptance Criteria: User is redirected to the Cart page
   */
  test('should navigate to cart.html when "Go to Cart" button is clicked', async () => {
    // Step 1: Add product to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Step 2: Click "Go to Cart" button
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);

    // Step 3: Wait for navigation
    await page.waitForNavigation({ timeout: 5000 });

    // Step 4: Verify URL is cart.html
    const currentURL = page.url();
    expect(currentURL).toContain('cart.html');

    console.log('✓ Test passed: Navigated to cart.html');
  });

  /**
   * Test Case 3: Verify cart data persists after navigation
   * ST-2 Acceptance Criteria: Selected products are retained and displayed
   */
  test('should preserve cart data when navigating to cart page', async () => {
    // Step 1: Add 2 products to cart
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(300);
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Get cart data before navigation
    const cartDataBefore = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data ? JSON.parse(data) : null;
    });

    // Step 3: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 4: Get cart data after navigation
    const cartDataAfter = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data ? JSON.parse(data) : null;
    });

    // Step 5: Verify data is preserved
    expect(cartDataAfter).not.toBeNull();
    expect(Object.keys(cartDataAfter.cart).length).toBe(Object.keys(cartDataBefore.cart).length);

    console.log('✓ Test passed: Cart data preserved during navigation');
  });

  /**
   * Test Case 4: Verify products display on cart page
   * ST-2 Acceptance Criteria: Selected products are displayed correctly in the Cart
   */
  test('should display selected products on cart page', async () => {
    // Step 1: Add 3 products
    for (let i = 1; i <= 3; i++) {
      await page.click(`.product-card:nth-child(${i}) .add-to-cart-btn`);
      await page.waitForTimeout(200);
    }

    // Step 2: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 3: Wait for cart items to render
    await page.waitForSelector('.cart-item, .cart-product', { timeout: 5000 });

    // Step 4: Count displayed items
    const displayedItems = await page.$$eval('.cart-item, .cart-product', items => items.length);

    expect(displayedItems).toBe(3);

    console.log('✓ Test passed: Products displayed on cart page');
  });

  /**
   * Test Case 5: Verify "Go to Cart" button is clickable
   * ST-2 Acceptance Criteria: "Go to Cart" button is clickable
   */
  test('should allow clicking "Go to Cart" button', async () => {
    // Step 1: Add item to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Verify button is enabled
    const isClickable = await page.evaluate(() => {
      const btn = document.querySelector('.go-to-cart-btn') || 
                   document.querySelector('#goToCartBtn') ||
                   document.querySelector('[href="cart.html"]');
      return btn && !btn.disabled && btn.style.pointerEvents !== 'none';
    });

    expect(isClickable).toBe(true);

    // Step 3: Click button (should not throw error)
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await expect(page.click(goToCartSelector)).resolves.not.toThrow();

    console.log('✓ Test passed: Button is clickable');
  });

  /**
   * Test Case 6: Verify no data loss during navigation
   * ST-2 Acceptance Criteria: No navigation or data loss issues occur
   */
  test('should not lose any cart data during navigation', async () => {
    // Step 1: Add multiple products with quantities
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(200);
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.waitForTimeout(200);
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(200);

    // Step 2: Capture complete cart state
    const originalCart = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Step 3: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 4: Verify cart state is identical
    const cartAfterNav = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    expect(JSON.stringify(cartAfterNav.cart)).toBe(JSON.stringify(originalCart.cart));

    console.log('✓ Test passed: No data loss during navigation');
  });

  /**
   * Test Case 7: Navigate with single item in cart
   */
  test('should navigate successfully with single item', async () => {
    // Step 1: Add one item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Navigate
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 3: Verify on cart page
    expect(page.url()).toContain('cart.html');

    // Step 4: Verify item is displayed
    const itemCount = await page.$$eval('.cart-item, .cart-product', items => items.length);
    expect(itemCount).toBe(1);

    console.log('✓ Test passed: Navigation with single item successful');
  });

  /**
   * Test Case 8: Navigate with maximum items in cart
   */
  test('should navigate successfully with many items', async () => {
    // Step 1: Add 10 different products
    for (let i = 1; i <= 10; i++) {
      const selector = `.product-card:nth-child(${i}) .add-to-cart-btn`;
      const exists = await page.$(selector);
      if (exists) {
        await page.click(selector);
        await page.waitForTimeout(100);
      }
    }

    // Step 2: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 3: Verify all items displayed
    const itemCount = await page.$$eval('.cart-item, .cart-product', items => items.length);
    expect(itemCount).toBeGreaterThanOrEqual(10);

    console.log('✓ Test passed: Navigation with many items successful');
  });

  /**
   * Test Case 9: Verify cart badge visible on cart page
   */
  test('should show cart badge on cart page', async () => {
    // Step 1: Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 3: Check if badge exists on cart page
    const badgeExists = await page.$('.cart-badge');
    expect(badgeExists).not.toBeNull();

    console.log('✓ Test passed: Cart badge visible on cart page');
  });

  /**
   * Test Case 10: Verify navigation completes within acceptable time
   */
  test('should navigate to cart page within 2 seconds', async () => {
    // Step 1: Add item
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Measure navigation time
    const startTime = Date.now();
    
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });
    
    const endTime = Date.now();
    const navigationTime = endTime - startTime;

    // Step 3: Verify navigation time
    expect(navigationTime).toBeLessThan(2000);

    console.log(`✓ Test passed: Navigation completed in ${navigationTime}ms`);
  });

  /**
   * Test Case 11: Verify product details match on cart page
   */
  test('should display correct product details on cart page', async () => {
    // Step 1: Get product details from main page
    const productDetails = await page.evaluate(() => {
      const card = document.querySelector('.product-card:first-child');
      return {
        name: card.querySelector('.product-name').textContent.trim(),
        price: card.querySelector('.product-price').textContent.trim()
      };
    });

    // Step 2: Add product to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 3: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 4: Get product details from cart page
    await page.waitForSelector('.cart-item, .cart-product', { timeout: 5000 });
    
    const cartProductName = await page.$eval('.cart-item .product-name, .cart-product .product-name', 
      el => el.textContent.trim()
    );

    // Step 5: Verify details match
    expect(cartProductName).toBe(productDetails.name);

    console.log('✓ Test passed: Product details match on cart page');
  });

  /**
   * Test Case 12: Verify back navigation preserves cart
   */
  test('should preserve cart when navigating back from cart page', async () => {
    // Step 1: Add items
    await page.click('.product-card:nth-child(1) .add-to-cart-btn');
    await page.click('.product-card:nth-child(2) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Navigate to cart
    const goToCartSelector = '.go-to-cart-btn, #goToCartBtn, [href="cart.html"]';
    await page.click(goToCartSelector);
    await page.waitForNavigation({ timeout: 5000 });

    // Step 3: Navigate back
    await page.goBack();
    await page.waitForNavigation({ timeout: 5000 });

    // Step 4: Verify cart badge still shows 2
    const badgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeCount).toBe('2');

    console.log('✓ Test passed: Cart preserved after back navigation');
  });
});

/**
 * Test Execution Summary
 * 
 * Total Test Cases: 12
 * Expected Pass Rate: 100%
 * Priority: CRITICAL (ST-2 Primary Test)
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button is visible and clickable (Tests 1, 5)
 * ✓ User is redirected to the Cart page (Tests 2, 7, 8)
 * ✓ Selected products are retained and displayed (Tests 3, 4, 11)
 * ✓ No navigation or data loss issues (Tests 6, 12)
 * 
 * Additional Coverage:
 * - Navigation performance
 * - Multiple item scenarios
 * - Data integrity
 * - UI consistency
 * - Back navigation
 * 
 * Exit Criteria:
 * - All 12 test cases pass
 * - Navigation works reliably
 * - No data loss occurs
 * - Products display correctly
 */

