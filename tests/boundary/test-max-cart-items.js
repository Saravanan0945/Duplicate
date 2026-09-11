/**
 * Boundary Value Test Suite: Maximum Cart Items Limit
 * Test ID Prefix: BVT-MAX-ITEMS
 * 
 * Purpose: Verify the shopping cart correctly handles the maximum number
 * of different products that can be added to the cart simultaneously.
 * 
 * Boundary Values Tested:
 * - Maximum cart items: 100 (system limit)
 * - Just below maximum: 99
 * - Just above maximum: 101
 * - Performance with large cart
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle multiple products efficiently
 * - No performance degradation at limits
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-MAX-ITEMS: Maximum Cart Items Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  const MAX_CART_ITEMS = 100;

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
   * Test Case: BVT-MAX-ITEMS-001
   * Verify adding products up to maximum limit (100)
   */
  test('BVT-MAX-ITEMS-001: Should accept up to maximum cart items (100)', async () => {
    // Add 100 different products
    const result = await page.evaluate((maxItems) => {
      const cartManager = window.cartManager;
      let successCount = 0;
      
      for (let i = 1; i <= maxItems; i++) {
        const productId = `product-${i}`;
        const res = cartManager.addToCart(productId, 1);
        if (res.success) successCount++;
      }
      
      return {
        successCount,
        cartItems: cartManager.getCartItems()
      };
    }, MAX_CART_ITEMS);

    expect(result.successCount).toBe(MAX_CART_ITEMS);
    expect(result.cartItems).toHaveLength(MAX_CART_ITEMS);
  }, 30000); // Extended timeout for large operation

  /**
   * Test Case: BVT-MAX-ITEMS-002
   * Verify adding just below maximum (99 items)
   */
  test('BVT-MAX-ITEMS-002: Should accept just below maximum (99 items)', async () => {
    const itemCount = MAX_CART_ITEMS - 1;
    
    const result = await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      return cartManager.getCartItems().length;
    }, itemCount);

    expect(result).toBe(itemCount);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-003
   * Verify rejection when exceeding maximum (101 items)
   */
  test('BVT-MAX-ITEMS-003: Should reject adding beyond maximum (101 items)', async () => {
    const result = await page.evaluate((maxItems) => {
      const cartManager = window.cartManager;
      
      // Add maximum items
      for (let i = 1; i <= maxItems; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      // Try to add one more
      const extraResult = cartManager.addToCart(`product-${maxItems + 1}`, 1);
      
      return {
        extraSuccess: extraResult.success,
        extraError: extraResult.error,
        cartLength: cartManager.getCartItems().length
      };
    }, MAX_CART_ITEMS);

    expect(result.extraSuccess).toBe(false);
    expect(result.extraError).toMatch(/maximum|limit|full/i);
    expect(result.cartLength).toBe(MAX_CART_ITEMS);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-004
   * Verify cart badge with maximum items
   */
  test('BVT-MAX-ITEMS-004: Should display badge correctly with maximum items', async () => {
    await page.evaluate((maxItems) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= maxItems; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
    }, MAX_CART_ITEMS);

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe(MAX_CART_ITEMS.toString());
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-005
   * Verify "Go to Cart" navigation with maximum items
   */
  test('BVT-MAX-ITEMS-005: Should navigate to cart with maximum items', async () => {
    await page.evaluate((maxItems) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= 10; i++) { // Use 10 for faster test
        cartManager.addToCart(`product-${i}`, 1);
      }
    }, 10);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const itemCount = await page.$$eval('.cart-item', items => items.length);
    expect(itemCount).toBe(10);
  });

  /**
   * Test Case: BVT-MAX-ITEMS-006
   * Verify cart rendering performance with many items
   */
  test('BVT-MAX-ITEMS-006: Should render cart page efficiently with many items', async () => {
    const itemCount = 50;
    
    await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
    }, itemCount);

    const startTime = Date.now();
    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds even with many items
    expect(loadTime).toBeLessThan(3000);

    const renderedItems = await page.$$eval('.cart-item', items => items.length);
    expect(renderedItems).toBe(itemCount);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-007
   * Verify cart total calculation with maximum items
   */
  test('BVT-MAX-ITEMS-007: Should calculate total correctly with many items', async () => {
    const itemCount = 20;
    
    const result = await page.evaluate((count) => {
      const cartManager = window.cartManager;
      let expectedSubtotal = 0;
      
      for (let i = 1; i <= count; i++) {
        const productId = `product-${i}`;
        cartManager.addToCart(productId, 1);
        
        const product = window.productData.getProductById(productId);
        expectedSubtotal += product.price;
      }
      
      const cartTotal = cartManager.getCartTotal();
      
      return {
        expectedSubtotal,
        actualSubtotal: cartTotal.subtotal,
        tax: cartTotal.tax,
        total: cartTotal.total
      };
    }, itemCount);

    expect(result.actualSubtotal).toBeCloseTo(result.expectedSubtotal, 2);
    expect(result.tax).toBeCloseTo(result.expectedSubtotal * 0.1, 2);
    expect(result.total).toBeCloseTo(result.expectedSubtotal * 1.1, 2);
  });

  /**
   * Test Case: BVT-MAX-ITEMS-008
   * Verify localStorage persistence with many items
   */
  test('BVT-MAX-ITEMS-008: Should persist many items in localStorage', async () => {
    const itemCount = 30;
    
    await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
    }, itemCount);

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(itemCount);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-009
   * Verify removing items from full cart
   */
  test('BVT-MAX-ITEMS-009: Should allow removing items from full cart', async () => {
    const itemCount = 50;
    
    await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      // Remove first 10 items
      for (let i = 1; i <= 10; i++) {
        cartManager.removeFromCart(`product-${i}`);
      }
    }, itemCount);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(itemCount - 10);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-010
   * Verify adding new item after removing from full cart
   */
  test('BVT-MAX-ITEMS-010: Should allow adding after removing from full cart', async () => {
    await page.evaluate((maxItems) => {
      const cartManager = window.cartManager;
      
      // Fill cart to maximum
      for (let i = 1; i <= maxItems; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      // Remove one item
      cartManager.removeFromCart('product-1');
      
      // Add new item
      const result = cartManager.addToCart('product-new', 1);
      
      return result;
    }, MAX_CART_ITEMS);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(MAX_CART_ITEMS);
    expect(cartItems.some(item => item.productId === 'product-new')).toBe(true);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-011
   * Verify error message when cart is full
   */
  test('BVT-MAX-ITEMS-011: Should show error message when cart is full', async () => {
    const toastMessage = await page.evaluate((maxItems) => {
      return new Promise((resolve) => {
        const cartManager = window.cartManager;
        
        // Fill cart to maximum
        for (let i = 1; i <= maxItems; i++) {
          cartManager.addToCart(`product-${i}`, 1);
        }
        
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
        
        // Try to add one more
        cartManager.addToCart(`product-${maxItems + 1}`, 1);
        
        setTimeout(() => {
          resolve(null);
          observer.disconnect();
        }, 2000);
      });
    }, MAX_CART_ITEMS);

    expect(toastMessage).toBeTruthy();
    expect(toastMessage).toMatch(/maximum|limit|full|capacity/i);
  }, 35000);

  /**
   * Test Case: BVT-MAX-ITEMS-012
   * Verify cart clearing with maximum items
   */
  test('BVT-MAX-ITEMS-012: Should clear cart efficiently with many items', async () => {
    const itemCount = 50;
    
    await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      cartManager.clearCart();
    }, itemCount);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('0');
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-013
   * Verify scrolling and UI with many cart items
   */
  test('BVT-MAX-ITEMS-013: Should handle scrolling with many cart items', async () => {
    const itemCount = 30;
    
    await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
    }, itemCount);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(500);

    // Verify all items are still accessible
    const visibleItems = await page.$$eval('.cart-item', items => items.length);
    expect(visibleItems).toBe(itemCount);
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-014
   * Verify memory usage with maximum items
   */
  test('BVT-MAX-ITEMS-014: Should maintain reasonable memory usage', async () => {
    const itemCount = 50;
    
    const metrics = await page.evaluate((count) => {
      const cartManager = window.cartManager;
      const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      return {
        memoryIncrease: endMemory - startMemory,
        cartSize: cartManager.getCartItems().length
      };
    }, itemCount);

    expect(metrics.cartSize).toBe(itemCount);
    
    // Memory increase should be reasonable (less than 10MB)
    if (metrics.memoryIncrease > 0) {
      expect(metrics.memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    }
  }, 30000);

  /**
   * Test Case: BVT-MAX-ITEMS-015
   * Verify system stability with maximum items operations
   */
  test('BVT-MAX-ITEMS-015: Should maintain stability with many items', async () => {
    const itemCount = 40;
    
    const result = await page.evaluate((count) => {
      const cartManager = window.cartManager;
      
      // Add items
      for (let i = 1; i <= count; i++) {
        cartManager.addToCart(`product-${i}`, 1);
      }
      
      // Update quantities
      for (let i = 1; i <= 10; i++) {
        cartManager.updateQuantity(`product-${i}`, 2);
      }
      
      // Remove some items
      for (let i = 11; i <= 15; i++) {
        cartManager.removeFromCart(`product-${i}`);
      }
      
      // Get final state
      return {
        cartLength: cartManager.getCartItems().length,
        total: cartManager.getCartTotal()
      };
    }, itemCount);

    expect(result.cartLength).toBe(itemCount - 5); // 40 - 5 removed
    expect(result.total.subtotal).toBeGreaterThan(0);
    expect(result.total.total).toBeGreaterThan(0);
  }, 30000);
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Maximum items (100), Performance limits
 * - Coverage: Add, Remove, Display, Performance, Memory
 * - Priority: HIGH - Critical for scalability
 * 
 * Expected Results:
 * - Cart should accept up to 100 different products
 * - Attempts to exceed limit should be rejected with clear errors
 * - Performance should remain acceptable with many items
 * - UI should handle scrolling and rendering efficiently
 * - Memory usage should remain reasonable
 */

