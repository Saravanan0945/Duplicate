/**
 * Positive Test Case: Add Single Item to Cart
 * 
 * Test ID: POS-001
 * Priority: High
 * Category: Positive Testing
 * 
 * Description:
 * Verify that a user can successfully add a single product to the shopping cart
 * and that the cart state is updated correctly.
 * 
 * Prerequisites:
 * - Shopping cart application is loaded
 * - Product catalog is available
 * - localStorage is accessible
 * - Cart is initially empty
 */

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

describe('POS-001: Add Single Item to Cart', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';

  /**
   * Test Setup
   * Initialize browser and navigate to application
   */
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    
    // Clear localStorage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Reload page to ensure clean state
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
   * Test Case 1: Add first product to empty cart
   */
  test('should add first product to empty cart successfully', async () => {
    // Step 1: Verify cart is initially empty
    const initialBadgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(initialBadgeCount).toBe('0');

    // Step 2: Get first product details
    const productName = await page.$eval('.product-card:first-child .product-name', el => el.textContent);
    const productPrice = await page.$eval('.product-card:first-child .product-price', el => el.textContent);

    // Step 3: Click "Add to Cart" button for first product
    await page.click('.product-card:first-child .add-to-cart-btn');

    // Step 4: Wait for cart update animation
    await page.waitForTimeout(500);

    // Step 5: Verify cart badge is updated
    const updatedBadgeCount = await page.$eval('.cart-badge', el => el.textContent);
    expect(updatedBadgeCount).toBe('1');

    // Step 6: Verify success notification appears
    const notification = await page.$eval('.toast-notification', el => el.textContent);
    expect(notification).toContain('added to cart');

    // Step 7: Verify localStorage contains cart data
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data ? JSON.parse(data) : null;
    });

    expect(cartData).not.toBeNull();
    expect(cartData.cart).toBeDefined();
    expect(Object.keys(cartData.cart).length).toBe(1);

    console.log('✓ Test passed: Single item added successfully');
  });

  /**
   * Test Case 2: Add specific product by ID
   */
  test('should add product with ID 1 to cart', async () => {
    // Step 1: Click add to cart for product ID 1
    await page.click('[data-product-id="1"] .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Verify cart contains product ID 1
    const cartData = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return data ? JSON.parse(data) : null;
    });

    expect(cartData.cart['1']).toBeDefined();
    expect(cartData.cart['1'].quantity).toBe(1);
    expect(cartData.cart['1'].id).toBe(1);

    console.log('✓ Test passed: Product ID 1 added correctly');
  });

  /**
   * Test Case 3: Verify product quantity is set to 1
   */
  test('should set initial quantity to 1 when adding product', async () => {
    // Step 1: Add product to cart
    await page.click('.product-card:nth-child(3) .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Check quantity in localStorage
    const quantity = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId].quantity;
    });

    expect(quantity).toBe(1);

    console.log('✓ Test passed: Initial quantity is 1');
  });

  /**
   * Test Case 4: Verify cart badge updates immediately
   */
  test('should update cart badge immediately after adding item', async () => {
    // Step 1: Record initial badge value
    const initialBadge = await page.$eval('.cart-badge', el => el.textContent);

    // Step 2: Add item to cart
    await page.click('.product-card:first-child .add-to-cart-btn');

    // Step 3: Check badge updates within 100ms
    await page.waitForFunction(
      (initial) => {
        const badge = document.querySelector('.cart-badge');
        return badge && badge.textContent !== initial;
      },
      { timeout: 100 },
      initialBadge
    );

    const updatedBadge = await page.$eval('.cart-badge', el => el.textContent);
    expect(parseInt(updatedBadge)).toBeGreaterThan(parseInt(initialBadge));

    console.log('✓ Test passed: Badge updates immediately');
  });

  /**
   * Test Case 5: Verify toast notification displays correct message
   */
  test('should display success notification with product name', async () => {
    // Step 1: Get product name
    const productName = await page.$eval('.product-card:first-child .product-name', el => el.textContent.trim());

    // Step 2: Add product to cart
    await page.click('.product-card:first-child .add-to-cart-btn');

    // Step 3: Wait for notification
    await page.waitForSelector('.toast-notification', { timeout: 2000 });

    // Step 4: Verify notification message
    const notificationText = await page.$eval('.toast-notification', el => el.textContent);
    expect(notificationText.toLowerCase()).toContain(productName.toLowerCase());
    expect(notificationText.toLowerCase()).toContain('added');

    console.log('✓ Test passed: Notification displays correct message');
  });

  /**
   * Test Case 6: Verify cart data structure is valid
   */
  test('should create valid cart data structure in localStorage', async () => {
    // Step 1: Add product to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 2: Retrieve and validate cart structure
    const cartStructure = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      return JSON.parse(data);
    });

    // Assertions
    expect(cartStructure).toHaveProperty('version');
    expect(cartStructure).toHaveProperty('timestamp');
    expect(cartStructure).toHaveProperty('cart');
    expect(typeof cartStructure.cart).toBe('object');
    expect(cartStructure.timestamp).toBeGreaterThan(0);

    console.log('✓ Test passed: Cart data structure is valid');
  });

  /**
   * Test Case 7: Verify add to cart button remains functional after click
   */
  test('should keep add to cart button functional after first click', async () => {
    // Step 1: Click add to cart button
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(500);

    // Step 2: Verify button is still clickable
    const isButtonEnabled = await page.$eval('.product-card:first-child .add-to-cart-btn', 
      btn => !btn.disabled && btn.offsetParent !== null
    );

    expect(isButtonEnabled).toBe(true);

    console.log('✓ Test passed: Button remains functional');
  });

  /**
   * Test Case 8: Verify product details are stored correctly
   */
  test('should store complete product details in cart', async () => {
    // Step 1: Get product details from UI
    const productDetails = await page.evaluate(() => {
      const card = document.querySelector('.product-card:first-child');
      return {
        id: parseInt(card.dataset.productId),
        name: card.querySelector('.product-name').textContent.trim(),
        price: parseFloat(card.querySelector('.product-price').textContent.replace(/[^0-9.]/g, ''))
      };
    });

    // Step 2: Add product to cart
    await page.click('.product-card:first-child .add-to-cart-btn');
    await page.waitForTimeout(300);

    // Step 3: Verify stored details match
    const storedDetails = await page.evaluate(() => {
      const data = localStorage.getItem('shopping_cart');
      const cart = JSON.parse(data).cart;
      const productId = Object.keys(cart)[0];
      return cart[productId];
    });

    expect(storedDetails.id).toBe(productDetails.id);
    expect(storedDetails.name).toBe(productDetails.name);
    expect(storedDetails.price).toBe(productDetails.price);

    console.log('✓ Test passed: Product details stored correctly');
  });
});

/**
 * Test Execution Summary
 * 
 * Total Test Cases: 8
 * Expected Pass Rate: 100%
 * 
 * Coverage:
 * - Basic add to cart functionality
 * - Cart badge updates
 * - localStorage persistence
 * - Data structure validation
 * - UI feedback (notifications)
 * - Button state management
 * - Product detail accuracy
 * 
 * Exit Criteria:
 * - All 8 test cases pass
 * - No console errors
 * - Cart badge updates correctly
 * - localStorage contains valid data
 */

