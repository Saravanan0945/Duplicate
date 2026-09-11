/**
 * Boundary Value Test Suite: Minimum Quantity Limit
 * Test ID Prefix: BVT-MIN-QTY
 * 
 * Purpose: Verify the shopping cart correctly handles minimum quantity limits,
 * including the minimum valid quantity (1) and invalid values below minimum.
 * 
 * Boundary Values Tested:
 * - Minimum valid quantity: 1
 * - Just below minimum: 0
 * - Negative values: -1, -10, -999
 * - Decimal values near minimum: 0.5, 0.9, 1.1
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must enforce minimum quantity of 1
 * - Invalid quantities should be rejected
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-MIN-QTY: Minimum Quantity Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  const MIN_QUANTITY = 1;

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
    
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case: BVT-MIN-QTY-001
   * Verify adding product with minimum valid quantity (1)
   */
  test('BVT-MIN-QTY-001: Should accept minimum valid quantity (1)', async () => {
    const productId = 'product-1';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(1);
  });

  /**
   * Test Case: BVT-MIN-QTY-002
   * Verify rejection of zero quantity
   */
  test('BVT-MIN-QTY-002: Should reject zero quantity', async () => {
    const productId = 'product-2';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 0);
    }, productId);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|invalid|positive/i);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);
  });

  /**
   * Test Case: BVT-MIN-QTY-003
   * Verify rejection of negative quantity (-1)
   */
  test('BVT-MIN-QTY-003: Should reject negative quantity (-1)', async () => {
    const productId = 'product-3';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, -1);
    }, productId);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|invalid|positive|negative/i);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);
  });

  /**
   * Test Case: BVT-MIN-QTY-004
   * Verify rejection of large negative quantity (-999)
   */
  test('BVT-MIN-QTY-004: Should reject large negative quantity (-999)', async () => {
    const productId = 'product-4';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, -999);
    }, productId);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|invalid|positive|negative/i);
  });

  /**
   * Test Case: BVT-MIN-QTY-005
   * Verify rejection of decimal quantity below minimum (0.5)
   */
  test('BVT-MIN-QTY-005: Should reject decimal quantity below minimum (0.5)', async () => {
    const productId = 'product-5';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 0.5);
    }, productId);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|invalid|integer|whole/i);
  });

  /**
   * Test Case: BVT-MIN-QTY-006
   * Verify rejection of decimal quantity just below minimum (0.9)
   */
  test('BVT-MIN-QTY-006: Should reject decimal quantity just below minimum (0.9)', async () => {
    const productId = 'product-6';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 0.9);
    }, productId);

    expect(result.success).toBe(false);
  });

  /**
   * Test Case: BVT-MIN-QTY-007
   * Verify handling of decimal quantity just above minimum (1.1)
   */
  test('BVT-MIN-QTY-007: Should handle decimal quantity just above minimum (1.1)', async () => {
    const productId = 'product-7';
    
    const result = await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1.1);
    }, productId);

    // Should either round to 1 or reject
    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      expect(cartItems[0].quantity).toBe(1);
    } else {
      expect(result.error).toMatch(/integer|whole/i);
    }
  });

  /**
   * Test Case: BVT-MIN-QTY-008
   * Verify updating quantity to minimum (1) in cart
   */
  test('BVT-MIN-QTY-008: Should allow updating to minimum quantity (1)', async () => {
    const productId = 'product-8';
    
    // Add product with quantity 5
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 5);
    }, productId);

    // Update to minimum
    const result = await page.evaluate((id) => {
      return window.cartManager.updateQuantity(id, 1);
    }, productId);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(1);
  });

  /**
   * Test Case: BVT-MIN-QTY-009
   * Verify updating quantity below minimum removes item
   */
  test('BVT-MIN-QTY-009: Should remove item when updating below minimum', async () => {
    const productId = 'product-9';
    
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 2);
    }, productId);

    // Try to update to 0
    const result = await page.evaluate((id) => {
      return window.cartManager.updateQuantity(id, 0);
    }, productId);

    // Item should be removed
    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);
  });

  /**
   * Test Case: BVT-MIN-QTY-010
   * Verify cart badge with minimum quantity
   */
  test('BVT-MIN-QTY-010: Should display badge correctly with minimum quantity', async () => {
    const productId = 'product-10';
    
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('1');
  });

  /**
   * Test Case: BVT-MIN-QTY-011
   * Verify "Go to Cart" button with minimum quantity item
   */
  test('BVT-MIN-QTY-011: Should navigate to cart with minimum quantity item', async () => {
    const productId = 'product-11';
    
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const displayedQuantity = await page.$eval('.quantity-value', el => el.textContent);
    expect(displayedQuantity).toBe('1');
  });

  /**
   * Test Case: BVT-MIN-QTY-012
   * Verify cart total calculation with minimum quantity
   */
  test('BVT-MIN-QTY-012: Should calculate total correctly with minimum quantity', async () => {
    const productId = 'product-12';
    
    const productPrice = await page.evaluate((id) => {
      const product = window.productData.getProductById(id);
      return product.price;
    }, productId);

    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeCloseTo(productPrice, 2);
    expect(cartTotal.tax).toBeCloseTo(productPrice * 0.1, 2);
    expect(cartTotal.total).toBeCloseTo(productPrice * 1.1, 2);
  });

  /**
   * Test Case: BVT-MIN-QTY-013
   * Verify error message for below minimum quantity
   */
  test('BVT-MIN-QTY-013: Should show error message for below minimum quantity', async () => {
    const productId = 'product-13';
    
    const toastMessage = await page.evaluate((id) => {
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
        
        window.cartManager.addToCart(id, 0);
        
        setTimeout(() => {
          resolve(null);
          observer.disconnect();
        }, 2000);
      });
    }, productId);

    expect(toastMessage).toBeTruthy();
    expect(toastMessage).toMatch(/minimum|invalid|positive/i);
  });

  /**
   * Test Case: BVT-MIN-QTY-014
   * Verify persistence of minimum quantity
   */
  test('BVT-MIN-QTY-014: Should persist minimum quantity in localStorage', async () => {
    const productId = 'product-14';
    
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toBe(1);
  });

  /**
   * Test Case: BVT-MIN-QTY-015
   * Verify decrement button behavior at minimum quantity
   */
  test('BVT-MIN-QTY-015: Should disable or remove item when decrementing at minimum', async () => {
    const productId = 'product-15';
    
    await page.evaluate((id) => {
      return window.cartManager.addToCart(id, 1);
    }, productId);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    // Click decrement button
    const decrementExists = await page.$('.quantity-decrease');
    if (decrementExists) {
      await page.click('.quantity-decrease');
      await page.waitForTimeout(500);

      // Item should be removed or quantity should stay at 1
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });

      // Either removed or still at 1
      if (cartItems.length > 0) {
        expect(cartItems[0].quantity).toBe(1);
      } else {
        expect(cartItems).toHaveLength(0);
      }
    }
  });
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Minimum (1), Zero, Negative, Decimals
 * - Coverage: Add, Update, Display, Persistence, Validation
 * - Priority: HIGH - Critical for data integrity
 * 
 * Expected Results:
 * - Quantity of 1 should always be accepted
 * - Zero and negative quantities should be rejected
 * - Decimal quantities should be handled appropriately
 * - Clear error messages for invalid quantities
 * - System should remain stable with minimum quantity operations
 */

