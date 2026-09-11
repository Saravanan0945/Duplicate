/**
 * E2E Test: User Scenario 3
 * Test ID: E2E-003
 * Priority: High
 * 
 * Description:
 * Real-world user scenario testing cart clearing and repopulation:
 * Fill cart → Clear all items → Add new items → Verify fresh start
 * 
 * User Story:
 * As a customer, I want to be able to clear my entire cart and start
 * fresh with new selections without any issues or leftover data.
 * 
 * Scenario Steps:
 * 1. Browse and add multiple products to cart
 * 2. Navigate to cart page
 * 3. Remove all items one by one
 * 4. Verify empty cart state
 * 5. Return to shopping
 * 6. Add new different products
 * 7. Verify new cart is independent
 * 8. Complete new purchase
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✅ "Go to Cart" button is visible and clickable
 * ✅ User is redirected to the Cart page
 * ✅ Selected products are retained and displayed
 * ✅ No data loss issues
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('E2E-003: User Scenario - Clear Cart and Add New Items', () => {
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
   * Test Case E2E-003-01: Complete Clear and Repopulate Workflow
   * Priority: Critical
   * 
   * Full scenario of clearing cart and starting fresh.
   */
  test('E2E-003-01: Should clear cart completely and add new items successfully', async () => {
    console.log('Phase 1: Filling cart with initial products');
    
    // Add 4 products to cart
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(250);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(250);
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(250);
    await page.click('[data-product-id="product-4"]');
    await page.waitForTimeout(300);

    // Verify badge shows 4 items
    let badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('4');
    console.log('✓ Added 4 products - Badge shows: 4');

    // Navigate to cart
    console.log('\nPhase 2: Navigating to cart page');
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify all 4 items displayed
    let cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(4);
    console.log('✓ All 4 products displayed in cart');

    // Get initial product IDs for verification
    const initialProductIds = await page.$$eval('.cart-item', items => 
      items.map(item => item.getAttribute('data-product-id') || 
                       item.querySelector('[data-product-id]')?.getAttribute('data-product-id'))
    );
    console.log(`✓ Initial products: ${initialProductIds.join(', ')}`);

    // Phase 3: Clear all items
    console.log('\nPhase 3: Clearing all items from cart');
    
    // Remove items one by one
    for (let i = 4; i > 0; i--) {
      const removeButtons = await page.$$('.remove-item-btn');
      if (removeButtons.length > 0) {
        await removeButtons[0].click();
        await page.waitForTimeout(400);
        
        const remainingItems = await page.$$('.cart-item');
        expect(remainingItems.length).toBe(i - 1);
        console.log(`✓ Removed item ${5 - i} - ${i - 1} items remaining`);
      }
    }

    // Verify empty cart state
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();
    console.log('✓ Empty cart message displayed');

    // Verify localStorage is empty
    let cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(0);
    console.log('✓ localStorage cleared');

    // Phase 4: Return to shopping
    console.log('\nPhase 4: Returning to shopping page');
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify badge shows 0
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
    console.log('✓ Badge shows: 0');

    // Phase 5: Add new different products
    console.log('\nPhase 5: Adding new products to cart');
    
    // Add different products (5, 6, 7)
    await page.click('[data-product-id="product-5"]');
    await page.waitForTimeout(250);
    await page.click('[data-product-id="product-6"]');
    await page.waitForTimeout(250);
    await page.click('[data-product-id="product-7"]');
    await page.waitForTimeout(300);

    // Verify badge shows 3 new items
    badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('3');
    console.log('✓ Added 3 new products - Badge shows: 3');

    // Phase 6: Verify new cart is independent
    console.log('\nPhase 6: Verifying new cart state');
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Should have exactly 3 items
    cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(3);
    console.log('✓ New cart has 3 items');

    // Verify these are different products from initial cart
    const newProductIds = await page.$$eval('.cart-item', items => 
      items.map(item => item.getAttribute('data-product-id') || 
                       item.querySelector('[data-product-id]')?.getAttribute('data-product-id'))
    );
    
    // New products should not include any initial products
    const hasOldProducts = newProductIds.some(id => 
      initialProductIds.includes(id)
    );
    expect(hasOldProducts).toBe(false);
    console.log(`✓ New products: ${newProductIds.join(', ')}`);
    console.log('✓ Confirmed: New cart is independent from old cart');

    // Verify calculations for new cart
    const subtotal = await page.$eval('.subtotal-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    const tax = await page.$eval('.tax-amount', 
      el => parseFloat(el.textContent.replace('$', '')));
    const total = await page.$eval('.total-amount', 
      el => parseFloat(el.textContent.replace('$', '')));

    expect(subtotal).toBeGreaterThan(0);
    expect(tax).toBeCloseTo(subtotal * 0.1, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);
    console.log(`✓ New cart totals: Subtotal $${subtotal.toFixed(2)}, Tax $${tax.toFixed(2)}, Total $${total.toFixed(2)}`);

    // Phase 7: Complete new purchase
    console.log('\nPhase 7: Completing purchase with new cart');
    const checkoutBtn = await page.$('.checkout-btn');
    expect(checkoutBtn).not.toBeNull();
    
    await checkoutBtn.click();
    await page.waitForTimeout(500);

    const notification = await page.$('.notification');
    expect(notification).not.toBeNull();
    console.log('✓ Checkout initiated successfully');

    console.log('\n✅ Complete clear and repopulate workflow successful!');
  }, 50000);

  /**
   * Test Case E2E-003-02: Rapid Clear and Refill
   * Priority: High
   */
  test('E2E-003-02: Should handle rapid clear and refill operations', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Rapidly remove all items
    const removeButtons = await page.$$('.remove-item-btn');
    await Promise.all(removeButtons.map(btn => btn.click()));
    await page.waitForTimeout(800);

    // Verify empty
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    // Immediately go back and add new items
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Rapidly add new products
    await Promise.all([
      page.click('[data-product-id="product-5"]'),
      page.click('[data-product-id="product-6"]')
    ]);
    await page.waitForTimeout(800);

    // Verify new cart
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(parseInt(badgeText)).toBeGreaterThan(0);
  }, 30000);

  /**
   * Test Case E2E-003-03: Clear Cart Multiple Times
   * Priority: Medium
   */
  test('E2E-003-03: Should handle multiple clear and refill cycles', async () => {
    // Cycle 1: Add and clear
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);
    
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Cycle 2: Add and clear
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);
    
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Cycle 3: Add final products
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-4"]');
    await page.waitForTimeout(300);

    // Verify final cart has only cycle 3 products
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);
  }, 35000);

  /**
   * Test Case E2E-003-04: Clear Cart with Quantity Updates
   * Priority: High
   */
  test('E2E-003-04: Should clear cart with updated quantities and refill', async () => {
    // Add product and update quantity
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('10');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Verify high quantity
    let quantity = await page.$eval('.quantity-input', el => el.value);
    expect(quantity).toBe('10');

    // Clear cart
    await page.click('.remove-item-btn');
    await page.waitForTimeout(500);

    // Add new product
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Verify new product has default quantity
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    quantity = await page.$eval('.quantity-input', el => el.value);
    expect(quantity).toBe('1');
  }, 30000);

  /**
   * Test Case E2E-003-05: Clear and Refill with Same Products
   * Priority: Medium
   */
  test('E2E-003-05: Should handle clearing and re-adding same products', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart and clear
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const removeButtons = await page.$$('.remove-item-btn');
    for (const btn of removeButtons) {
      await btn.click();
      await page.waitForTimeout(300);
    }

    // Go back and add same products again
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Verify cart works correctly with re-added products
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);

    // Verify quantities are reset to 1
    const quantities = await page.$$eval('.quantity-input', 
      inputs => inputs.map(input => input.value));
    expect(quantities.every(q => q === '1')).toBe(true);
  }, 30000);

  /**
   * Test Case E2E-003-06: Clear Cart and Verify Storage Clean
   * Priority: High
   */
  test('E2E-003-06: Should completely clean storage when clearing cart', async () => {
    // Add products with various quantities
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(300);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Update quantity
    const quantityInput = await page.$('.quantity-input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.type('5');
    await quantityInput.press('Enter');
    await page.waitForTimeout(500);

    // Go back and add more
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Verify complex storage state
    let cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(2);
    expect(cartData[0].quantity).toBe(5);

    // Clear all items
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const removeButtons = await page.$$('.remove-item-btn');
    for (const btn of removeButtons) {
      await btn.click();
      await page.waitForTimeout(300);
    }

    // Verify storage is completely clean
    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(0);
    expect(cartData).toEqual([]);

    // Add new product and verify clean start
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(300);

    cartData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('shopping-cart') || '[]');
    });
    expect(cartData.length).toBe(1);
    expect(cartData[0].quantity).toBe(1);
  }, 35000);

  /**
   * Test Case E2E-003-07: Clear Cart and Verify UI Reset
   * Priority: Medium
   */
  test('E2E-003-07: Should reset all UI elements when clearing cart', async () => {
    // Add products
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify totals exist
    let subtotal = await page.$('.subtotal-amount');
    expect(subtotal).not.toBeNull();

    // Clear cart
    const removeButtons = await page.$$('.remove-item-btn');
    for (const btn of removeButtons) {
      await btn.click();
      await page.waitForTimeout(300);
    }

    // Verify empty state UI
    const emptyMessage = await page.$('.empty-cart-message');
    expect(emptyMessage).not.toBeNull();

    // Verify totals are hidden or show $0.00
    const subtotalText = await page.$eval('.subtotal-amount', 
      el => el.textContent);
    expect(subtotalText).toContain('0.00');

    // Go back and verify badge is 0
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
  }, 30000);

  /**
   * Test Case E2E-003-08: Clear and Refill Performance
   * Priority: Low
   */
  test('E2E-003-08: Should perform clear and refill operations quickly', async () => {
    // Add products
    const startAdd = Date.now();
    await page.click('[data-product-id="product-1"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-2"]');
    await page.waitForTimeout(300);
    const addTime = Date.now() - startAdd;

    // Clear cart
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const startClear = Date.now();
    const removeButtons = await page.$$('.remove-item-btn');
    for (const btn of removeButtons) {
      await btn.click();
      await page.waitForTimeout(200);
    }
    const clearTime = Date.now() - startClear;

    // Refill cart
    await page.click('.continue-shopping-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const startRefill = Date.now();
    await page.click('[data-product-id="product-3"]');
    await page.waitForTimeout(200);
    await page.click('[data-product-id="product-4"]');
    await page.waitForTimeout(300);
    const refillTime = Date.now() - startRefill;

    // All operations should be reasonably fast
    expect(addTime).toBeLessThan(5000);
    expect(clearTime).toBeLessThan(5000);
    expect(refillTime).toBeLessThan(5000);

    console.log(`Performance: Add ${addTime}ms, Clear ${clearTime}ms, Refill ${refillTime}ms`);
  }, 35000);
});

/**
 * Test Summary:
 * - Total Test Cases: 8
 * - Critical: 1
 * - High: 3
 * - Medium: 3
 * - Low: 1
 * 
 * Coverage:
 * ✅ Complete clear and repopulate workflow
 * ✅ Rapid clear and refill operations
 * ✅ Multiple clear/refill cycles
 * ✅ Clear with quantity updates
 * ✅ Re-adding same products after clear
 * ✅ Storage cleanup verification
 * ✅ UI reset verification
 * ✅ Performance of clear/refill operations
 * 
 * ST-2 Acceptance Criteria: 100% Covered
 * 
 * Real-world Scenario:
 * This test suite simulates customers who change their mind about
 * their purchases, clear their cart, and start fresh with new
 * selections - ensuring the cart system handles state resets properly.
 */

