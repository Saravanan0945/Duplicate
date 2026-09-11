/**
 * Negative Test: Navigation to Cart Without Items
 * 
 * Test ID: NEG-008
 * Category: Negative Testing
 * Priority: Medium
 * 
 * Description:
 * Verify that the application handles navigation to the cart page when
 * the cart is empty, providing appropriate feedback to the user.
 * 
 * Related Jira: ST-2 (Acceptance Criteria: No navigation or data loss issues)
 * Test Type: Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-008: Navigation to Cart Without Items', () => {
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
    await page.goto(BASE_URL);
    
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case 1: Click "Go to Cart" with empty cart
   * Expected: Warning message or navigate to empty cart page
   */
  test('should handle Go to Cart click with empty cart', async () => {
    // Verify cart is empty
    const cartCount = await page.$eval('.cart-badge', el => parseInt(el.textContent));
    expect(cartCount).toBe(0);

    // Click Go to Cart button
    const goToCartBtn = await page.$('.go-to-cart-btn');
    
    if (goToCartBtn) {
      await goToCartBtn.click();
      await page.waitForTimeout(1000);

      // Should either show warning or navigate to empty cart
      const currentUrl = page.url();
      
      if (currentUrl.includes('cart.html')) {
        // Navigated to cart - should show empty message
        const emptyMessage = await page.$('.empty-cart-message');
        expect(emptyMessage).not.toBeNull();
      } else {
        // Stayed on page - should show notification
        const notification = await page.$('.toast');
        expect(notification).not.toBeNull();
      }
    }
  });

  /**
   * Test Case 2: Direct navigation to cart.html with empty cart
   * Expected: Empty cart message displayed
   */
  test('should display empty cart message on direct navigation', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Should show empty cart message
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    const messageText = await page.$eval('.empty-cart-message', 
      el => el.textContent
    );
    expect(messageText).toMatch(/empty|no items|nothing/i);
  });

  /**
   * Test Case 3: Empty cart shows "Continue Shopping" button
   * Expected: Button present and functional
   */
  test('should show Continue Shopping button on empty cart', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const continueBtn = await page.$('.continue-shopping-btn, .back-to-shop-btn');
    expect(continueBtn).not.toBeNull();

    // Click and verify navigation
    if (continueBtn) {
      await continueBtn.click();
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      expect(currentUrl).toContain('index.html');
    }
  });

  /**
   * Test Case 4: Empty cart hides checkout button
   * Expected: Checkout button disabled or hidden
   */
  test('should disable or hide checkout button on empty cart', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const checkoutBtn = await page.$('.checkout-btn');
    
    if (checkoutBtn) {
      const isDisabled = await checkoutBtn.evaluate(el => 
        el.disabled || el.classList.contains('disabled')
      );
      expect(isDisabled).toBe(true);
    }
  });

  /**
   * Test Case 5: Empty cart shows zero totals
   * Expected: Subtotal, tax, and total all show $0.00
   */
  test('should display zero totals on empty cart', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const subtotal = await page.$('.subtotal-amount');
    const total = await page.$('.total-amount');

    if (subtotal && total) {
      const subtotalText = await subtotal.evaluate(el => el.textContent);
      const totalText = await total.evaluate(el => el.textContent);

      expect(subtotalText).toMatch(/0\.00|0/);
      expect(totalText).toMatch(/0\.00|0/);
    }
  });

  /**
   * Test Case 6: Navigate to cart after removing all items
   * Expected: Empty cart message appears
   */
  test('should show empty message after removing all items', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-item', { timeout: 3000 });

    // Remove item
    const removeBtn = await page.$('.remove-item-btn');
    if (removeBtn) {
      await removeBtn.click();
      await page.waitForTimeout(500);

      // Should show empty message
      const emptyMessage = await page.$('.empty-cart-message');
      expect(emptyMessage).not.toBeNull();
    }
  });

  /**
   * Test Case 7: Empty cart badge shows 0
   * Expected: Badge displays 0 or is hidden
   */
  test('should show 0 or hide badge when cart empty', async () => {
    const cartBadge = await page.$('.cart-badge');
    expect(cartBadge).not.toBeNull();

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
  });

  /**
   * Test Case 8: Empty cart page layout is proper
   * Expected: No broken layout or missing elements
   */
  test('should maintain proper layout on empty cart page', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    // Check for essential elements
    const header = await page.$('header, .header');
    const container = await page.$('.cart-container');
    const emptyMessage = await page.$('.empty-cart-message');

    expect(header).not.toBeNull();
    expect(container).not.toBeNull();
    expect(emptyMessage).not.toBeNull();
  });

  /**
   * Test Case 9: Multiple empty cart navigations
   * Expected: Consistent behavior each time
   */
  test('should handle multiple empty cart navigations', async () => {
    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE_URL}/cart.html`);
      await page.waitForSelector('.cart-container', { timeout: 3000 });

      const emptyMessage = await page.$('.empty-cart-message');
      expect(emptyMessage).not.toBeNull();

      await page.goto(BASE_URL);
      await page.waitForSelector('.product-grid', { timeout: 3000 });
    }
  });

  /**
   * Test Case 10: Empty cart with corrupted localStorage
   * Expected: Still shows empty state properly
   */
  test('should handle empty cart with corrupted storage', async () => {
    await page.evaluate(() => {
      localStorage.setItem('shopping_cart', 'corrupted');
    });

    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();
  });

  /**
   * Test Case 11: Go to Cart button state when empty
   * Expected: Button shows appropriate state
   */
  test('should show appropriate Go to Cart button state when empty', async () => {
    const goToCartBtn = await page.$('.go-to-cart-btn');
    expect(goToCartBtn).not.toBeNull();

    // Button should be visible but may show warning on click
    const isVisible = await goToCartBtn.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    expect(isVisible).toBe(true);
  });

  /**
   * Test Case 12: Empty cart accessibility
   * Expected: Screen readers can understand empty state
   */
  test('should have accessible empty cart message', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const emptyMessage = await page.$('.empty-cart-message');
    
    if (emptyMessage) {
      const ariaLabel = await emptyMessage.evaluate(el => 
        el.getAttribute('aria-label') || el.textContent
      );
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.length).toBeGreaterThan(5);
    }
  });

  /**
   * Test Case 13: Empty cart after session timeout
   * Expected: Proper empty state display
   */
  test('should handle empty cart after clearing storage', async () => {
    // Add item
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Clear storage (simulate session timeout)
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();
  });

  /**
   * Test Case 14: Empty cart prevents checkout
   * Expected: Cannot proceed to checkout
   */
  test('should prevent checkout with empty cart', async () => {
    await page.goto(`${BASE_URL}/cart.html`);
    await page.waitForSelector('.cart-container', { timeout: 3000 });

    const checkoutBtn = await page.$('.checkout-btn');
    
    if (checkoutBtn) {
      const clickable = await checkoutBtn.evaluate(el => {
        return !el.disabled && 
               !el.classList.contains('disabled') &&
               window.getComputedStyle(el).pointerEvents !== 'none';
      });

      // Should not be clickable or should show error
      if (clickable) {
        await checkoutBtn.click();
        await page.waitForTimeout(500);

        // Should show error notification
        const errorToast = await page.$('.toast.error');
        expect(errorToast).not.toBeNull();
      }
    }
  });
});

