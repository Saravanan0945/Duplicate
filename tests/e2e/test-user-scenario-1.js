/**
 * E2E Test: User Scenario 1
 * Test ID: E2E-001
 * Priority: Critical
 * 
 * Description:
 * Real-world user scenario testing complete shopping workflow:
 * Add 3 items → Remove 1 item → Update quantity → Proceed to checkout
 * 
 * User Story:
 * As a customer, I want to add multiple products to my cart, make changes
 * to my selections, and proceed to checkout seamlessly.
 * 
 * Scenario Steps:
 * 1. Browse products on homepage
 * 2. Add 3 different products to cart
 * 3. Navigate to cart page
 * 4. Remove 1 product
 * 5. Update quantity of another product
 * 6. Verify calculations
 * 7. Proceed to checkout
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✅ "Go to Cart" button is visible and clickable
 * ✅ User is redirected to the Cart page
 * ✅ Selected products are retained and displayed
 * ✅ No navigation or data loss issues
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('E2E-001: User Scenario - Add, Remove, Update, Checkout', () => {
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
    await page.goto(baseURL);
    await page.evaluate(() => localStorage.clear());
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case E2E-001-01: Complete Shopping Workflow
   * Priority: Critical
   * 
   * This test simulates a real user completing a purchase from start to finish.
   */
  test('E2E-001-01: Should complete full shopping workflow successfully', async () => {
    console.log('Step 1: User lands on homepage');
    expect(page.url()).toContain('index.html');
    
    // Verify products are displayed
    const products = await page.$$('.product-card');
    expect(products.length).toBeGreaterThan(0);
    console.log(`✓ Found ${products.length} products on homepage`);

    // Step 2: Add 3 different products to cart
    console.log('\nStep 2: Adding 3 products to cart');
    
    // Add Product 1
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(400);
    let badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('1');
    console.log('✓ Added Product 1 - Badge shows: 1');

    // Add Product 2
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(400);
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('2');
    console.log('✓ Added Product 2 - Badge shows: 2');

    // Add Product 3
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(400);
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');
    console.log('✓ Added Product 3 - Badge shows: 3');

    // Verify success notifications appeared
    const notification = await page.$('.notification.success');
    expect(notification).not.toBeNull();
    console.log('✓ Success notifications displayed');

    // Step 3: Navigate to cart page
    console.log('\nStep 3: Navigating to cart page');
    const goToCartBtn = await page.$('.go-to-cart-btn');
    expect(goToCartBtn).not.toBeNull();
    console.log('✓ "Go to Cart" button is visible');

    await goToCartBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');
    console.log('✓ Successfully navigated to cart page');

    // Verify all 3 products are displayed
    let cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);
    console.log('✓ All 3 products displayed in cart');

    // Verify product details are present
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const name = await item.$eval('.cart-item-name', el => el.textContent);
      const price = await item.$eval('.cart-item-price', el => el.textContent);
      const quantity = await item.$eval('.quantity-input', el => el.value);
      
      expect(name).toBeTruthy();
      expect(price).toContain('$');
      expect(parseInt(quantity)).toBeGreaterThan(0);
      console.log(`✓ Product ${i + 1}: ${name} - ${price} - Qty: ${quantity}`);
    }

    // Step 4: Remove 1 product (remove the second item)
    console.log('\nStep 4: Removing second product');
    const initialSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    console.log(`Initial subtotal: $${initialSubtotal.toFixed(2)}`);

    const removeButtons = await page.$$('.remove-item-btn');
    await removeButtons[1].click();
    await page.waitForTimeout(600);

    // Verify item removed
    cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);
    console.log('✓ Product removed - 2 items remaining');

    // Verify subtotal decreased
    const newSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    expect(newSubtotal).toBeLessThan(initialSubtotal);
    console.log(`✓ New subtotal: $${newSubtotal.toFixed(2)}`);

    // Step 5: Update quantity of first product to 3
    console.log('\nStep 5: Updating quantity of first product to 3');
    const quantityInput = await page.$('.cart-item:first-child .quantity-input');
    const originalQuantity = await quantityInput.evaluate(el => el.value);
    console.log(`Original quantity: ${originalQuantity}`);

    await quantityInput.click({ clickCount: 3 }); // Select all
    await quantityInput.type('3');
    await quantityInput.press('Enter');
    await page.waitForTimeout(600);

    // Verify quantity updated
    const updatedQuantity = await page.$eval('.cart-item:first-child .quantity-input', 
      el => el.value);
    expect(updatedQuantity).toBe('3');
    console.log(`✓ Quantity updated to: ${updatedQuantity}`);

    // Step 6: Verify all calculations are correct
    console.log('\nStep 6: Verifying calculations');
    
    const finalSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    const tax = await page.$eval('.tax-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    const total = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    // Verify tax is 10% of subtotal
    expect(tax).toBeCloseTo(finalSubtotal * 0.1, 2);
    console.log(`✓ Subtotal: $${finalSubtotal.toFixed(2)}`);
    console.log(`✓ Tax (10%): $${tax.toFixed(2)}`);

    // Verify total is subtotal + tax
    expect(total).toBeCloseTo(finalSubtotal + tax, 2);
    console.log(`✓ Total: $${total.toFixed(2)}`);

    // Verify subtotal increased after quantity update
    expect(finalSubtotal).toBeGreaterThan(newSubtotal);
    console.log('✓ Subtotal correctly increased after quantity update');

    // Step 7: Proceed to checkout
    console.log('\nStep 7: Proceeding to checkout');
    const checkoutBtn = await page.$('.checkout-btn');
    expect(checkoutBtn).not.toBeNull();
    console.log('✓ Checkout button is visible');

    // Verify checkout button is enabled
    const isDisabled = await checkoutBtn.evaluate(el => el.disabled);
    expect(isDisabled).toBeFalsy();
    console.log('✓ Checkout button is enabled');

    await checkoutBtn.click();
    await page.waitForTimeout(500);

    // Verify checkout notification appears
    const checkoutNotification = await page.$('.notification');
    expect(checkoutNotification).not.toBeNull();
    console.log('✓ Checkout notification displayed');

    // Verify final cart state in localStorage
    const cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);
    console.log(`✓ Final cart state: ${cartData.length} items in localStorage`);

    console.log('\n✅ E2E Scenario 1 completed successfully!');
  }, 45000);

  /**
   * Test Case E2E-001-02: Workflow with Price Verification
   * Priority: High
   */
  test('E2E-001-02: Should maintain accurate pricing throughout workflow', async () => {
    // Get product prices from listing page
    const product1Price = await page.$eval('[data-product-id="product-1"] .product-price', 
      el => parseFloat(el.textContent.replace('$', '')));
    const product2Price = await page.$eval('[data-product-id="product-2"] .product-price', 
      el => parseFloat(el.textContent.replace('$', '')));
    const product3Price = await page.$eval('[data-product-id="product-3"] .product-price', 
      el => parseFloat(el.textContent.replace('$', '')));

    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify prices match
    const cartPrices = await page.$$eval('.cart-item-price', 
      elements => elements.map(el => parseFloat(el.textContent.replace('$', ''))));

    expect(cartPrices).toContain(product1Price);
    expect(cartPrices).toContain(product2Price);
    expect(cartPrices).toContain(product3Price);

    // Remove middle product
    const removeButtons = await page.$$('.remove-item-btn');
    await removeButtons[1].click();
    await page.waitForTimeout(500);

    // Calculate expected subtotal
    const expectedSubtotal = product1Price + product3Price;
    const actualSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);

    // Update quantity and verify price multiplication
    await page.evaluate(() => {
      document.querySelector('.quantity-input').value = '3';
      document.querySelector('.quantity-input').dispatchEvent(new Event('change'));
    });
    await page.waitForTimeout(500);

    const newSubtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    
    // Should be (product1Price * 3) + product3Price
    const expectedNewSubtotal = (product1Price * 3) + product3Price;
    expect(newSubtotal).toBeCloseTo(expectedNewSubtotal, 2);
  }, 30000);

  /**
   * Test Case E2E-001-03: Workflow with Validation Checks
   * Priority: High
   */
  test('E2E-001-03: Should validate user actions throughout workflow', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Try to set invalid quantity (0)
    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('0');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Quantity should not be 0 (should revert or show error)
    const quantity = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(quantity).toBeGreaterThan(0);

    // Try to set negative quantity
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('-5');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Quantity should still be positive
    const quantity2 = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(quantity2).toBeGreaterThan(0);

    // Set valid quantity
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('3');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    const validQuantity = await page.$eval('.quantity-input', el => parseInt(el.value));
    expect(validQuantity).toBe(3);
  }, 25000);

  /**
   * Test Case E2E-001-04: Workflow with Navigation Verification
   * Priority: Medium
   */
  test('E2E-001-04: Should handle navigation correctly during workflow', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('cart.html');

    // Continue shopping
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    expect(page.url()).toContain('index.html');

    // Add another product
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Go back to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should have all 3 products
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);

    // Remove one and verify
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    const remainingItems = await page.$$('.cart-item');
    expect(remainingItems.length).toBe(2);
  }, 30000);

  /**
   * Test Case E2E-001-05: Workflow with State Persistence
   * Priority: High
   */
  test('E2E-001-05: Should persist state throughout workflow', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    // Verify localStorage
    let cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(3);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Remove one item
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Verify localStorage updated
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);

    // Update quantity
    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('5');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify localStorage has updated quantity
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData[0].quantity).toBe(5);

    // Reload page and verify state persists
    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    const quantity = await page.$eval('.quantity-input', el => el.value);
    expect(quantity).toBe('5');
  }, 30000);
});

/**
 * Test Summary:
 * - Total Test Cases: 5
 * - Critical: 1
 * - High: 3
 * - Medium: 1
 * 
 * Coverage:
 * ✅ Complete shopping workflow (add, remove, update, checkout)
 * ✅ Price verification throughout workflow
 * ✅ Validation checks for user inputs
 * ✅ Navigation handling during workflow
 * ✅ State persistence across actions
 * 
 * ST-2 Acceptance Criteria: 100% Covered
 * 
 * Real-world Scenario:
 * This test suite simulates an actual customer journey from browsing
 * products to completing a purchase, ensuring all features work together
 * seamlessly in a realistic use case.
 */

