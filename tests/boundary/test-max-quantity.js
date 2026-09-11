/**
 * Boundary Value Test Suite: Maximum Quantity Limit
 * Test ID Prefix: BVT-MAX-QTY
 * 
 * Purpose: Verify the shopping cart correctly handles maximum quantity limits
 * for products, including stock limits and system-defined maximum values.
 * 
 * Boundary Values Tested:
 * - Maximum quantity: 999 (system limit)
 * - Stock limit boundary (e.g., 50, 100)
 * - Just below maximum (998, stock-1)
 * - Just above maximum (1000, stock+1)
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle quantity limits gracefully
 * - No data loss or corruption at boundaries
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-MAX-QTY: Maximum Quantity Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  // Test configuration
  const SYSTEM_MAX_QUANTITY = 999;
  const STOCK_LIMIT = 50; // Typical stock limit for test products

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
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    
    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case: BVT-MAX-QTY-001
   * Verify adding product at exact system maximum quantity (999)
   */
  test('BVT-MAX-QTY-001: Should accept quantity at system maximum (999)', async () => {
    const productId = 'product-1';
    
    // Add product with maximum quantity
    const result = await page.evaluate((id, maxQty) => {
      const cartManager = window.cartManager;
      return cartManager.addToCart(id, maxQty);
    }, productId, SYSTEM_MAX_QUANTITY);

    expect(result.success).toBe(true);

    // Verify cart contains correct quantity
    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(SYSTEM_MAX_QUANTITY);

    // Verify badge shows correct count
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe(SYSTEM_MAX_QUANTITY.toString());
  });

  /**
   * Test Case: BVT-MAX-QTY-002
   * Verify adding quantity just below system maximum (998)
   */
  test('BVT-MAX-QTY-002: Should accept quantity just below maximum (998)', async () => {
    const productId = 'product-2';
    const quantity = SYSTEM_MAX_QUANTITY - 1;
    
    const result = await page.evaluate((id, qty) => {
      return window.cartManager.addToCart(id, qty);
    }, productId, quantity);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(quantity);
  });

  /**
   * Test Case: BVT-MAX-QTY-003
   * Verify rejection of quantity above system maximum (1000)
   */
  test('BVT-MAX-QTY-003: Should reject quantity above system maximum (1000)', async () => {
    const productId = 'product-3';
    const quantity = SYSTEM_MAX_QUANTITY + 1;
    
    const result = await page.evaluate((id, qty) => {
      return window.cartManager.addToCart(id, qty);
    }, productId, quantity);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/maximum|limit|exceed/i);

    // Verify cart remains empty
    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);
  });

  /**
   * Test Case: BVT-MAX-QTY-004
   * Verify adding product at exact stock limit
   */
  test('BVT-MAX-QTY-004: Should accept quantity at stock limit', async () => {
    const productId = 'product-1';
    
    // Get product stock limit
    const stockLimit = await page.evaluate((id) => {
      const product = window.productData.getProductById(id);
      return product.stock;
    }, productId);

    const result = await page.evaluate((id, qty) => {
      return window.cartManager.addToCart(id, qty);
    }, productId, stockLimit);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(stockLimit);
  });

  /**
   * Test Case: BVT-MAX-QTY-005
   * Verify rejection of quantity exceeding stock limit
   */
  test('BVT-MAX-QTY-005: Should reject quantity exceeding stock limit', async () => {
    const productId = 'product-1';
    
    const stockLimit = await page.evaluate((id) => {
      const product = window.productData.getProductById(id);
      return product.stock;
    }, productId);

    const excessQuantity = stockLimit + 1;

    const result = await page.evaluate((id, qty) => {
      return window.cartManager.addToCart(id, qty);
    }, productId, excessQuantity);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/stock|available|inventory/i);
  });

  /**
   * Test Case: BVT-MAX-QTY-006
   * Verify incrementing to maximum quantity via multiple additions
   */
  test('BVT-MAX-QTY-006: Should handle incremental additions to maximum', async () => {
    const productId = 'product-4';
    const incrementSize = 100;
    const targetQuantity = 500;

    // Add product multiple times
    for (let i = 0; i < targetQuantity / incrementSize; i++) {
      await page.evaluate((id, qty) => {
        return window.cartManager.addToCart(id, qty);
      }, productId, incrementSize);
    }

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(targetQuantity);
  });

  /**
   * Test Case: BVT-MAX-QTY-007
   * Verify updating quantity to maximum via cart page
   */
  test('BVT-MAX-QTY-007: Should allow updating to maximum quantity in cart', async () => {
    const productId = 'product-5';
    
    // Add product with small quantity
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    // Navigate to cart page
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });

    // Update quantity to maximum
    const updateResult = await page.evaluate((id, maxQty) => {
      return window.cartManager.updateQuantity(id, maxQty);
    }, productId, SYSTEM_MAX_QUANTITY);

    expect(updateResult.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(SYSTEM_MAX_QUANTITY);
  });

  /**
   * Test Case: BVT-MAX-QTY-008
   * Verify UI displays maximum quantity correctly
   */
  test('BVT-MAX-QTY-008: Should display maximum quantity correctly in UI', async () => {
    const productId = 'product-6';
    
    await page.evaluate((id, maxQty) => {
      return window.cartManager.addToCart(id, maxQty);
    }, productId, SYSTEM_MAX_QUANTITY);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });

    // Wait for cart items to render
    await page.waitForSelector('.cart-item');

    // Verify quantity display
    const displayedQuantity = await page.$eval('.quantity-value', el => el.textContent);
    expect(displayedQuantity).toBe(SYSTEM_MAX_QUANTITY.toString());
  });

  /**
   * Test Case: BVT-MAX-QTY-009
   * Verify cart total calculation with maximum quantity
   */
  test('BVT-MAX-QTY-009: Should calculate total correctly at maximum quantity', async () => {
    const productId = 'product-7';
    
    const productPrice = await page.evaluate((id) => {
      const product = window.productData.getProductById(id);
      return product.price;
    }, productId);

    await page.evaluate((id, maxQty) => {
      return window.cartManager.addToCart(id, maxQty);
    }, productId, SYSTEM_MAX_QUANTITY);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    const expectedSubtotal = productPrice * SYSTEM_MAX_QUANTITY;
    const expectedTax = expectedSubtotal * 0.1;
    const expectedTotal = expectedSubtotal + expectedTax;

    expect(cartTotal.subtotal).toBeCloseTo(expectedSubtotal, 2);
    expect(cartTotal.tax).toBeCloseTo(expectedTax, 2);
    expect(cartTotal.total).toBeCloseTo(expectedTotal, 2);
  });

  /**
   * Test Case: BVT-MAX-QTY-010
   * Verify localStorage persistence with maximum quantity
   */
  test('BVT-MAX-QTY-010: Should persist maximum quantity in localStorage', async () => {
    const productId = 'product-8';
    
    await page.evaluate((id, maxQty) => {
      return window.cartManager.addToCart(id, maxQty);
    }, productId, SYSTEM_MAX_QUANTITY);

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // Verify cart persisted
    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(SYSTEM_MAX_QUANTITY);
  });

  /**
   * Test Case: BVT-MAX-QTY-011
   * Verify error message for exceeding maximum
   */
  test('BVT-MAX-QTY-011: Should show clear error message when exceeding maximum', async () => {
    const productId = 'product-9';
    const excessQuantity = SYSTEM_MAX_QUANTITY + 100;
    
    // Listen for toast notifications
    const toastMessage = await page.evaluate((id, qty) => {
      return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.classList && node.classList.contains('toast')) {
                resolve(node.textContent);
                observer.disconnect();
              }
            });
          });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        window.cartManager.addToCart(id, qty);
        
        setTimeout(() => {
          resolve(null);
          observer.disconnect();
        }, 2000);
      });
    }, productId, excessQuantity);

    expect(toastMessage).toBeTruthy();
    expect(toastMessage).toMatch(/maximum|limit|exceed/i);
  });

  /**
   * Test Case: BVT-MAX-QTY-012
   * Verify "Go to Cart" button works with maximum quantity
   */
  test('BVT-MAX-QTY-012: Should navigate to cart with maximum quantity items', async () => {
    const productId = 'product-10';
    
    await page.evaluate((id, maxQty) => {
      return window.cartManager.addToCart(id, maxQty);
    }, productId, SYSTEM_MAX_QUANTITY);

    // Click "Go to Cart" button
    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Verify we're on cart page
    expect(page.url()).toContain('cart.html');

    // Verify item is displayed
    await page.waitForSelector('.cart-item');
    const itemCount = await page.$$eval('.cart-item', items => items.length);
    expect(itemCount).toBe(1);

    // Verify quantity is displayed correctly
    const displayedQuantity = await page.$eval('.quantity-value', el => el.textContent);
    expect(displayedQuantity).toBe(SYSTEM_MAX_QUANTITY.toString());
  });

  /**
   * Test Case: BVT-MAX-QTY-013
   * Verify multiple products each at maximum quantity
   */
  test('BVT-MAX-QTY-013: Should handle multiple products at maximum quantity', async () => {
    const products = ['product-1', 'product-2', 'product-3'];
    
    // Add multiple products at max quantity
    for (const productId of products) {
      await page.evaluate((id, maxQty) => {
        return window.cartManager.addToCart(id, maxQty);
      }, productId, SYSTEM_MAX_QUANTITY);
    }

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(3);
    cartItems.forEach(item => {
      expect(item.quantity).toBe(SYSTEM_MAX_QUANTITY);
    });

    // Verify total badge count
    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe((SYSTEM_MAX_QUANTITY * 3).toString());
  });

  /**
   * Test Case: BVT-MAX-QTY-014
   * Verify quantity input field validation at maximum
   */
  test('BVT-MAX-QTY-014: Should validate quantity input field at maximum', async () => {
    const productId = 'product-11';
    
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });

    // Try to manually set quantity above maximum
    const validationResult = await page.evaluate((maxQty) => {
      const quantityInput = document.querySelector('.quantity-input');
      if (quantityInput) {
        quantityInput.value = maxQty + 1;
        const event = new Event('change', { bubbles: true });
        quantityInput.dispatchEvent(event);
        return quantityInput.value;
      }
      return null;
    }, SYSTEM_MAX_QUANTITY);

    // Verify quantity was capped at maximum
    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBeLessThanOrEqual(SYSTEM_MAX_QUANTITY);
  });

  /**
   * Test Case: BVT-MAX-QTY-015
   * Verify system stability with maximum quantity operations
   */
  test('BVT-MAX-QTY-015: Should maintain stability with maximum quantity operations', async () => {
    const productId = 'product-12';
    
    // Perform multiple operations at maximum quantity
    await page.evaluate((id, maxQty) => {
      window.cartManager.addToCart(id, maxQty);
      window.cartManager.updateQuantity(id, maxQty - 1);
      window.cartManager.updateQuantity(id, maxQty);
      return window.cartManager.getCartItems();
    }, productId, SYSTEM_MAX_QUANTITY);

    // Navigate to cart and back
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });

    // Verify cart integrity
    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(SYSTEM_MAX_QUANTITY);
    expect(cartItems[0].productId).toBe(productId);
  });
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: System max (999), Stock limits, Edge cases
 * - Coverage: Add, Update, Display, Persistence, Navigation
 * - Priority: HIGH - Critical for data integrity
 * 
 * Expected Results:
 * - All quantities at or below maximum should be accepted
 * - Quantities above maximum should be rejected with clear errors
 * - UI should display maximum quantities correctly
 * - Cart calculations should be accurate at maximum values
 * - System should remain stable under maximum quantity operations
 */

