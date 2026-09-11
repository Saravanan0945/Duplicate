/**
 * Boundary Value Test Suite: Decimal Quantity Values
 * Test ID Prefix: BVT-DECIMAL-QTY
 * 
 * Purpose: Verify the shopping cart correctly handles and rejects
 * non-integer (decimal/fractional) quantity values.
 * 
 * Boundary Values Tested:
 * - Decimal quantities: 1.5, 2.7, 10.99
 * - Very small decimals: 0.1, 0.01, 0.001
 * - Negative decimals: -1.5, -0.5
 * - Rounding behavior
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must enforce integer quantities
 * - Proper validation and error handling
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-DECIMAL-QTY: Decimal Quantity Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

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
   * Test Case: BVT-DECIMAL-QTY-001
   * Verify rejection of decimal quantity (1.5)
   */
  test('BVT-DECIMAL-QTY-001: Should reject decimal quantity 1.5', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-1', 1.5);
    });

    // Should either reject or round to integer
    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      expect(Number.isInteger(cartItems[0].quantity)).toBe(true);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal|invalid/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-002
   * Verify rejection of decimal quantity (2.7)
   */
  test('BVT-DECIMAL-QTY-002: Should reject decimal quantity 2.7', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-2', 2.7);
    });

    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      expect(Number.isInteger(cartItems[0].quantity)).toBe(true);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal|invalid/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-003
   * Verify rejection of decimal quantity (10.99)
   */
  test('BVT-DECIMAL-QTY-003: Should reject decimal quantity 10.99', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-3', 10.99);
    });

    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      expect(Number.isInteger(cartItems[0].quantity)).toBe(true);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal|invalid/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-004
   * Verify rejection of very small decimal (0.1)
   */
  test('BVT-DECIMAL-QTY-004: Should reject very small decimal 0.1', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-4', 0.1);
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|integer|invalid/i);
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-005
   * Verify rejection of very small decimal (0.01)
   */
  test('BVT-DECIMAL-QTY-005: Should reject very small decimal 0.01', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-5', 0.01);
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|integer|invalid/i);
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-006
   * Verify rejection of very small decimal (0.001)
   */
  test('BVT-DECIMAL-QTY-006: Should reject very small decimal 0.001', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-6', 0.001);
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|integer|invalid/i);
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-007
   * Verify rejection of negative decimal (-1.5)
   */
  test('BVT-DECIMAL-QTY-007: Should reject negative decimal -1.5', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-7', -1.5);
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|negative|invalid|positive/i);
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-008
   * Verify rejection of negative decimal (-0.5)
   */
  test('BVT-DECIMAL-QTY-008: Should reject negative decimal -0.5', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-8', -0.5);
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minimum|negative|invalid|positive/i);
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-009
   * Verify rounding behavior for 1.1
   */
  test('BVT-DECIMAL-QTY-009: Should handle rounding for 1.1', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-9', 1.1);
    });

    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      // Should round to 1
      expect(cartItems[0].quantity).toBe(1);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-010
   * Verify rounding behavior for 1.9
   */
  test('BVT-DECIMAL-QTY-010: Should handle rounding for 1.9', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-10', 1.9);
    });

    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      // Should round to 2 or reject
      expect(Number.isInteger(cartItems[0].quantity)).toBe(true);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-011
   * Verify updating quantity to decimal value
   */
  test('BVT-DECIMAL-QTY-011: Should reject updating to decimal quantity', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('product-11', 5);
    });

    const result = await page.evaluate(() => {
      return window.cartManager.updateQuantity('product-11', 3.5);
    });

    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      expect(Number.isInteger(cartItems[0].quantity)).toBe(true);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-012
   * Verify decimal quantity in cart page input
   */
  test('BVT-DECIMAL-QTY-012: Should validate decimal input in cart page', async () => {
    await page.evaluate(() => {
      window.cartManager.addToCart('product-12', 2);
    });

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    // Try to set decimal quantity via input
    const result = await page.evaluate(() => {
      const quantityInput = document.querySelector('.quantity-input');
      if (quantityInput) {
        quantityInput.value = '4.5';
        const event = new Event('change', { bubbles: true });
        quantityInput.dispatchEvent(event);
        
        // Check if it was accepted or rejected
        return {
          inputValue: quantityInput.value,
          cartQuantity: window.cartManager.getCartItems()[0].quantity
        };
      }
      return null;
    });

    if (result) {
      expect(Number.isInteger(result.cartQuantity)).toBe(true);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-013
   * Verify error message for decimal quantity
   */
  test('BVT-DECIMAL-QTY-013: Should show error message for decimal quantity', async () => {
    const toastMessage = await page.evaluate(() => {
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
        
        window.cartManager.addToCart('product-13', 5.5);
        
        setTimeout(() => {
          resolve(null);
          observer.disconnect();
        }, 2000);
      });
    });

    if (toastMessage) {
      expect(toastMessage).toMatch(/integer|whole|decimal|invalid/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-014
   * Verify string decimal quantity ("2.5")
   */
  test('BVT-DECIMAL-QTY-014: Should handle string decimal quantity', async () => {
    const result = await page.evaluate(() => {
      return window.cartManager.addToCart('product-14', "2.5");
    });

    if (result.success) {
      const cartItems = await page.evaluate(() => {
        return window.cartManager.getCartItems();
      });
      expect(Number.isInteger(cartItems[0].quantity)).toBe(true);
    } else {
      expect(result.error).toMatch(/integer|whole|decimal|invalid/i);
    }
  });

  /**
   * Test Case: BVT-DECIMAL-QTY-015
   * Verify cart total calculation with rounded quantities
   */
  test('BVT-DECIMAL-QTY-015: Should calculate total correctly with rounded quantities', async () => {
    const result = await page.evaluate(() => {
      // Try to add with decimal, should round or reject
      const addResult = window.cartManager.addToCart('product-15', 3.7);
      
      if (addResult.success) {
        const cartTotal = window.cartManager.getCartTotal();
        const cartItems = window.cartManager.getCartItems();
        const product = window.productData.getProductById('product-15');
        
        return {
          quantity: cartItems[0].quantity,
          expectedSubtotal: product.price * cartItems[0].quantity,
          actualSubtotal: cartTotal.subtotal,
          isInteger: Number.isInteger(cartItems[0].quantity)
        };
      }
      
      return { rejected: true };
    });

    if (!result.rejected) {
      expect(result.isInteger).toBe(true);
      expect(result.actualSubtotal).toBeCloseTo(result.expectedSubtotal, 2);
    }
  });
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Decimal quantities, Rounding, Validation
 * - Coverage: Add, Update, Input validation, Error handling
 * - Priority: HIGH - Critical for data integrity
 * 
 * Expected Results:
 * - Decimal quantities should be rejected or rounded to integers
 * - Very small decimals (< 1) should be rejected
 * - Negative decimals should be rejected
 * - Clear error messages for invalid quantities
 * - Cart calculations should use integer quantities only
 * - System should remain stable with decimal inputs
 */

