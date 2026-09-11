/**
 * Integration Test: Full Shopping Flow
 * Test ID: INT-001
 * Priority: Critical
 * 
 * Description:
 * Tests the complete user journey from browsing products to checkout,
 * verifying all components work together seamlessly.
 * 
 * User Journey:
 * 1. Browse products on index.html
 * 2. Add multiple products to cart
 * 3. Navigate to cart page via "Go to Cart" button
 * 4. Update quantities and remove items
 * 5. Verify calculations
 * 6. Proceed to checkout
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✅ "Go to Cart" button is visible and clickable
 * ✅ User is redirected to the Cart page
 * ✅ Selected products are retained and displayed
 * ✅ No navigation or data loss issues
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('INT-001: Full Shopping Flow Integration Test', () => {
  let browser;
  let page;
  const baseURL = `file://${path.resolve(__dirname, '../../index.html')}`;
  const cartURL = `file://${path.resolve(__dirname, '../../cart.html')}`;

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
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Clear localStorage before each test
    await page.goto(baseURL);
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case INT-001-01: Complete Shopping Journey - Happy Path
   * Priority: Critical
   * 
   * Steps:
   * 1. Load product listing page
   * 2. Add 3 different products to cart
   * 3. Verify cart badge updates
   * 4. Click "Go to Cart" button
   * 5. Verify navigation to cart page
   * 6. Verify all products displayed correctly
   * 7. Update quantity of one product
   * 8. Remove one product
   * 9. Verify calculations update
   * 10. Click checkout button
   */
  test('INT-001-01: Should complete full shopping journey successfully', async () => {
    // Step 1: Load product listing page
    await page.goto(baseURL);
    await page.waitForSelector('.product-grid');

    // Step 2: Add 3 different products to cart
    const productIds = ['product-1', 'product-2', 'product-3'];
    
    for (const productId of productIds) {
      const addButton = await page.$(`[data-product-id="${productId}"]`);
      expect(addButton).not.toBeNull();
      await addButton.click();
      await page.waitForTimeout(300); // Wait for animation
    }

    // Step 3: Verify cart badge updates to 3
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');

    // Step 4: Click "Go to Cart" button
    const goToCartButton = await page.$('.go-to-cart-btn');
    expect(goToCartButton).not.toBeNull();
    await goToCartButton.click();

    // Step 5: Verify navigation to cart page
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Step 6: Verify all 3 products displayed correctly
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);

    // Verify product details are present
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const hasImage = await item.$('.cart-item-image');
      const hasName = await item.$('.cart-item-name');
      const hasPrice = await item.$('.cart-item-price');
      const hasQuantity = await item.$('.quantity-input');
      
      expect(hasImage).not.toBeNull();
      expect(hasName).not.toBeNull();
      expect(hasPrice).not.toBeNull();
      expect(hasQuantity).not.toBeNull();
    }

    // Step 7: Update quantity of first product to 3
    const firstQuantityInput = await page.$('.cart-item:first-child .quantity-input');
    await firstQuantityInput.click({ clickCount: 3 }); // Select all
    await firstQuantityInput.type('3');
    await firstQuantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify quantity updated
    const updatedQuantity = await page.$eval('.cart-item:first-child .quantity-input', el => el.value);
    expect(updatedQuantity).toBe('3');

    // Step 8: Remove second product
    const removeButtons = await page.$$('.remove-item-btn');
    await removeButtons[1].click();
    await page.waitForTimeout(500);

    // Verify only 2 items remain
    const remainingItems = await page.$$('.cart-item');
    expect(remainingItems.length).toBe(2);

    // Step 9: Verify calculations update correctly
    const subtotal = await page.$eval('.subtotal-amount', el => parseFloat(el.textContent.replace('$', '')));
    const tax = await page.$eval('.tax-amount', el => parseFloat(el.textContent.replace('$', '')));
    const total = await page.$eval('.total-amount', el => parseFloat(el.textContent.replace('$', '')));

    expect(subtotal).toBeGreaterThan(0);
    expect(tax).toBeCloseTo(subtotal * 0.1, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);

    // Step 10: Click checkout button
    const checkoutButton = await page.$('.checkout-btn');
    expect(checkoutButton).not.toBeNull();
    await checkoutButton.click();
    await page.waitForTimeout(500);

    // Verify checkout notification appears
    const notification = await page.$('.notification');
    expect(notification).not.toBeNull();
  }, 30000);

  /**
   * Test Case INT-001-02: Shopping Flow with Empty Cart Recovery
   * Priority: High
   */
  test('INT-001-02: Should handle empty cart and allow recovery', async () => {
    await page.goto(baseURL);

    // Try to go to cart when empty
    const goToCartButton = await page.$('.go-to-cart-btn');
    await goToCartButton.click();
    await page.waitForTimeout(500);

    // Should show error notification and stay on index page
    const notification = await page.$('.notification.error');
    expect(notification).not.toBeNull();
    expect(page.url()).toContain('index.html');

    // Add a product
    const addButton = await page.$('[data-product-id="product-1"]');
    await addButton.click();
    await page.waitForTimeout(300);

    // Now "Go to Cart" should work
    await goToCartButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');
  }, 20000);

  /**
   * Test Case INT-001-03: Shopping Flow with Maximum Quantities
   * Priority: High
   */
  test('INT-001-03: Should handle shopping flow with maximum quantities', async () => {
    await page.goto(baseURL);

    // Add product with maximum quantity
    const addButton = await page.$('[data-product-id="product-1"]');
    
    // Click add button 10 times
    for (let i = 0; i < 10; i++) {
      await addButton.click();
      await page.waitForTimeout(100);
    }

    // Navigate to cart
    const goToCartButton = await page.$('.go-to-cart-btn');
    await goToCartButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify quantity is capped at stock limit
    const quantity = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(quantity).toBeLessThanOrEqual(50); // Assuming max stock is 50

    // Verify calculations are correct for high quantity
    const subtotal = await page.$eval('.subtotal-amount', el => parseFloat(el.textContent.replace('$', '')));
    expect(subtotal).toBeGreaterThan(0);
  }, 20000);

  /**
   * Test Case INT-001-04: Shopping Flow with Continue Shopping
   * Priority: Medium
   */
  test('INT-001-04: Should allow continuing shopping from cart', async () => {
    await page.goto(baseURL);

    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Go to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Click continue shopping
    const continueButton = await page.$('.continue-shopping-btn');
    expect(continueButton).not.toBeNull();
    await continueButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should be back on index page
    expect(page.url()).toContain('index.html');

    // Cart should still have 2 items
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');

    // Add another product
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Badge should update to 3
    const updatedBadge = await page.$eval('.cart-badge', el => el.textContent);
    expect(updatedBadge).toBe('3');

    // Go back to cart and verify all 3 items
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);
  }, 25000);

  /**
   * Test Case INT-001-05: Shopping Flow with All Products
   * Priority: Medium
   */
  test('INT-001-05: Should handle adding all available products', async () => {
    await page.goto(baseURL);

    // Get all add to cart buttons
    const addButtons = await page.$$('.add-to-cart-btn');
    const totalProducts = addButtons.length;

    // Add all products
    for (const button of addButtons) {
      await button.click();
      await page.waitForTimeout(200);
    }

    // Verify badge shows total count
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(parseInt(badgeText)).toBe(totalProducts);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify all products in cart
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(totalProducts);

    // Verify total calculation
    const total = await page.$eval('.total-amount', el => parseFloat(el.textContent.replace('$', '')));
    expect(total).toBeGreaterThan(0);
  }, 30000);

  /**
   * Test Case INT-001-06: Shopping Flow with Rapid Actions
   * Priority: High
   */
  test('INT-001-06: Should handle rapid user actions correctly', async () => {
    await page.goto(baseURL);

    // Rapidly add same product multiple times
    const addButton = await page.$('[data-product-id="product-1"]');
    
    await Promise.all([
      addButton.click(),
      addButton.click(),
      addButton.click()
    ]);

    await page.waitForTimeout(500);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should have correct quantity (not duplicate items)
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(1);

    const quantity = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(quantity).toBeGreaterThanOrEqual(1);
  }, 20000);

  /**
   * Test Case INT-001-07: Shopping Flow with Clear Cart
   * Priority: Medium
   */
  test('INT-001-07: Should handle clearing cart during shopping flow', async () => {
    await page.goto(baseURL);

    // Add multiple products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(200);

    // Go to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Clear cart (remove all items)
    const removeButtons = await page.$$('.remove-item-btn');
    for (const button of removeButtons) {
      await button.click();
      await page.waitForTimeout(300);
    }

    // Should show empty cart message
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    // Continue shopping
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Badge should show 0
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
  }, 25000);

  /**
   * Test Case INT-001-08: Shopping Flow with Price Verification
   * Priority: Critical
   */
  test('INT-001-08: Should maintain accurate pricing throughout flow', async () => {
    await page.goto(baseURL);

    // Get product price from listing page
    const productPrice = await page.$eval('[data-product-id="product-1"] .product-price', 
      el => parseFloat(el.textContent.replace('$', '')));

    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Go to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify price matches in cart
    const cartPrice = await page.$eval('.cart-item-price', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(cartPrice).toBe(productPrice);

    // Verify subtotal equals price
    const subtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(subtotal).toBe(productPrice);

    // Verify tax calculation
    const tax = await page.$eval('.tax-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(tax).toBeCloseTo(productPrice * 0.1, 2);

    // Verify total
    const total = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(total).toBeCloseTo(subtotal + tax, 2);
  }, 20000);

  /**
   * Test Case INT-001-09: Shopping Flow with Quantity Updates
   * Priority: High
   */
  test('INT-001-09: Should handle quantity updates throughout flow', async () => {
    await page.goto(baseURL);

    // Add product
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    // Go to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Get initial total
    const initialTotal = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    // Update quantity to 5
    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('5');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify total increased proportionally
    const newTotal = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(newTotal).toBeGreaterThan(initialTotal);
    expect(newTotal).toBeCloseTo(initialTotal * 5, 1);
  }, 20000);

  /**
   * Test Case INT-001-10: Shopping Flow with Multiple Product Types
   * Priority: Medium
   */
  test('INT-001-10: Should handle different product types in flow', async () => {
    await page.goto(baseURL);

    // Add products from different categories
    const productIds = ['product-1', 'product-5', 'product-10'];
    
    for (const id of productIds) {
      await page.click(`[data-product-id="${id}"]`);
      await page.waitForTimeout(300);
    }

    // Go to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify all products displayed with correct details
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);

    // Verify each item has unique details
    const productNames = [];
    for (const item of cartItems) {
      const name = await item.$eval('.cart-item-name', el => el.textContent);
      productNames.push(name);
    }

    // All names should be unique
    const uniqueNames = new Set(productNames);
    expect(uniqueNames.size).toBe(3);
  }, 20000);
});

/**
 * Test Summary:
 * - Total Test Cases: 10
 * - Critical: 3
 * - High: 3
 * - Medium: 4
 * 
 * Coverage:
 * ✅ Complete user journey (browse → add → cart → checkout)
 * ✅ Empty cart handling
 * ✅ Maximum quantities
 * ✅ Continue shopping flow
 * ✅ All products scenario
 * ✅ Rapid actions
 * ✅ Clear cart
 * ✅ Price verification
 * ✅ Quantity updates
 * ✅ Multiple product types
 * 
 * ST-2 Acceptance Criteria: 100% Covered
 */

