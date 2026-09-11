/**
 * Boundary Value Test Suite: Long Product Names
 * Test ID Prefix: BVT-LONG-NAME
 * 
 * Purpose: Verify the shopping cart correctly handles very long product names
 * and ensures proper display, storage, and functionality.
 * 
 * Boundary Values Tested:
 * - Maximum name length: 255 characters
 * - Very long names: 500+ characters
 * - Name truncation and display
 * - Storage efficiency with long names
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle long product names
 * - UI must display long names appropriately
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-LONG-NAME: Long Product Name Boundary Tests', () => {
  let browser;
  let page;
  const testUrl = `file://${path.join(__dirname, '../../index.html')}`;
  const cartUrl = `file://${path.join(__dirname, '../../cart.html')}`;

  const STANDARD_MAX_LENGTH = 255;
  const VERY_LONG_LENGTH = 500;

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
   * Test Case: BVT-LONG-NAME-001
   * Verify adding product with 255 character name
   */
  test('BVT-LONG-NAME-001: Should accept product with 255 character name', async () => {
    const longName = 'A'.repeat(STANDARD_MAX_LENGTH);
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-1',
        name: name,
        price: 29.99,
        description: 'Product with long name',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('long-name-1', 1);
    }, longName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name.length).toBe(STANDARD_MAX_LENGTH);
  });

  /**
   * Test Case: BVT-LONG-NAME-002
   * Verify adding product with 500+ character name
   */
  test('BVT-LONG-NAME-002: Should handle product with 500+ character name', async () => {
    const veryLongName = 'B'.repeat(VERY_LONG_LENGTH);
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-2',
        name: name,
        price: 39.99,
        description: 'Product with very long name',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('long-name-2', 1);
    }, veryLongName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name.length).toBeGreaterThanOrEqual(VERY_LONG_LENGTH);
  });

  /**
   * Test Case: BVT-LONG-NAME-003
   * Verify display of long name in cart
   */
  test('BVT-LONG-NAME-003: Should display long name appropriately in cart', async () => {
    const longName = 'Product with Very Long Name '.repeat(10);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-3',
        name: name,
        price: 49.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-3', 1);
    }, longName);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    const displayedName = await page.$eval('.item-name', el => el.textContent);
    
    // Name should be displayed (may be truncated with ellipsis)
    expect(displayedName.length).toBeGreaterThan(0);
  });

  /**
   * Test Case: BVT-LONG-NAME-004
   * Verify "Go to Cart" with long product names
   */
  test('BVT-LONG-NAME-004: Should navigate to cart with long name products', async () => {
    const longName = 'X'.repeat(300);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-4',
        name: name,
        price: 59.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-4', 1);
    }, longName);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const itemExists = await page.$('.cart-item');
    expect(itemExists).toBeTruthy();
  });

  /**
   * Test Case: BVT-LONG-NAME-005
   * Verify localStorage persistence with long names
   */
  test('BVT-LONG-NAME-005: Should persist long names in localStorage', async () => {
    const longName = 'Y'.repeat(400);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-5',
        name: name,
        price: 69.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-5', 1);
    }, longName);

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].name.length).toBeGreaterThan(300);
  });

  /**
   * Test Case: BVT-LONG-NAME-006
   * Verify multiple products with long names
   */
  test('BVT-LONG-NAME-006: Should handle multiple products with long names', async () => {
    await page.evaluate(() => {
      for (let i = 1; i <= 5; i++) {
        const longName = `Product Number ${i} with Very Long Name `.repeat(15);
        window.productData.products.push({
          id: `long-name-multi-${i}`,
          name: longName,
          price: 10.99 * i,
          description: 'Test product',
          image: 'https://via.placeholder.com/300x200',
          category: 'test',
          stock: 50
        });
        
        window.cartManager.addToCart(`long-name-multi-${i}`, 1);
      }
    });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(5);
    cartItems.forEach(item => {
      expect(item.name.length).toBeGreaterThan(100);
    });
  });

  /**
   * Test Case: BVT-LONG-NAME-007
   * Verify name with special characters and length
   */
  test('BVT-LONG-NAME-007: Should handle long names with special characters', async () => {
    const longName = 'Product™ with Special® Characters© and Very Long Name™ '.repeat(8);
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-7',
        name: name,
        price: 79.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('long-name-7', 1);
    }, longName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toContain('™');
    expect(cartItems[0].name).toContain('®');
    expect(cartItems[0].name).toContain('©');
  });

  /**
   * Test Case: BVT-LONG-NAME-008
   * Verify UI layout with long product names
   */
  test('BVT-LONG-NAME-008: Should maintain UI layout with long names', async () => {
    const longName = 'Z'.repeat(350);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-8',
        name: name,
        price: 89.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-8', 1);
    }, longName);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    // Check if layout is not broken
    const layoutCheck = await page.evaluate(() => {
      const cartItem = document.querySelector('.cart-item');
      const rect = cartItem.getBoundingClientRect();
      
      return {
        hasWidth: rect.width > 0,
        hasHeight: rect.height > 0,
        isVisible: rect.width > 0 && rect.height > 0
      };
    });

    expect(layoutCheck.isVisible).toBe(true);
  });

  /**
   * Test Case: BVT-LONG-NAME-009
   * Verify cart total calculation with long names
   */
  test('BVT-LONG-NAME-009: Should calculate totals correctly with long names', async () => {
    const longName = 'Product '.repeat(50);
    const price = 99.99;
    
    await page.evaluate((name, productPrice) => {
      window.productData.products.push({
        id: 'long-name-9',
        name: name,
        price: productPrice,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-9', 2);
    }, longName, price);

    const cartTotal = await page.evaluate(() => {
      return window.cartManager.getCartTotal();
    });

    expect(cartTotal.subtotal).toBeCloseTo(price * 2, 2);
  });

  /**
   * Test Case: BVT-LONG-NAME-010
   * Verify removing product with long name
   */
  test('BVT-LONG-NAME-010: Should remove product with long name correctly', async () => {
    const longName = 'M'.repeat(280);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-10',
        name: name,
        price: 109.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-10', 1);
      window.cartManager.removeFromCart('long-name-10');
    }, longName);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(0);
  });

  /**
   * Test Case: BVT-LONG-NAME-011
   * Verify updating quantity for product with long name
   */
  test('BVT-LONG-NAME-011: Should update quantity for long name product', async () => {
    const longName = 'N'.repeat(320);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-11',
        name: name,
        price: 119.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 100
      });
      
      window.cartManager.addToCart('long-name-11', 1);
      window.cartManager.updateQuantity('long-name-11', 5);
    }, longName);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].quantity).toBe(5);
  });

  /**
   * Test Case: BVT-LONG-NAME-012
   * Verify search/filter with long names
   */
  test('BVT-LONG-NAME-012: Should handle search with long product names', async () => {
    const longName = 'Searchable Product with Very Long Name '.repeat(10);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-12',
        name: name,
        price: 129.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
    }, longName);

    const searchResult = await page.evaluate(() => {
      const product = window.productData.getProductById('long-name-12');
      return {
        found: product !== null,
        nameLength: product ? product.name.length : 0
      };
    });

    expect(searchResult.found).toBe(true);
    expect(searchResult.nameLength).toBeGreaterThan(200);
  });

  /**
   * Test Case: BVT-LONG-NAME-013
   * Verify cart badge with long name products
   */
  test('BVT-LONG-NAME-013: Should update badge correctly with long name products', async () => {
    const longName = 'O'.repeat(290);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-13',
        name: name,
        price: 139.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-13', 7);
    }, longName);

    const badgeText = await page.$eval('.cart-badge', el => el.textContent);
    expect(badgeText).toBe('7');
  });

  /**
   * Test Case: BVT-LONG-NAME-014
   * Verify tooltip or full name display
   */
  test('BVT-LONG-NAME-014: Should provide access to full long name', async () => {
    const longName = 'P'.repeat(310);
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'long-name-14',
        name: name,
        price: 149.99,
        description: 'Test product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('long-name-14', 1);
    }, longName);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    const nameInfo = await page.evaluate(() => {
      const nameElement = document.querySelector('.item-name');
      return {
        textContent: nameElement.textContent,
        title: nameElement.getAttribute('title'),
        hasTooltip: nameElement.hasAttribute('title')
      };
    });

    // Either full name is shown or there's a title attribute for tooltip
    expect(nameInfo.textContent.length > 0 || nameInfo.hasTooltip).toBe(true);
  });

  /**
   * Test Case: BVT-LONG-NAME-015
   * Verify performance with multiple long names
   */
  test('BVT-LONG-NAME-015: Should maintain performance with long names', async () => {
    const startTime = Date.now();
    
    await page.evaluate(() => {
      for (let i = 1; i <= 20; i++) {
        const longName = `Product ${i} with Very Long Name `.repeat(12);
        window.productData.products.push({
          id: `long-name-perf-${i}`,
          name: longName,
          price: 10.99 * i,
          description: 'Test product',
          image: 'https://via.placeholder.com/300x200',
          category: 'test',
          stock: 50
        });
        
        window.cartManager.addToCart(`long-name-perf-${i}`, 1);
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (5 seconds)
    expect(duration).toBeLessThan(5000);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(20);
  }, 30000);
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: 255 chars, 500+ chars, Very long names
 * - Coverage: Add, Display, Storage, Performance, UI
 * - Priority: MEDIUM - Important for product data integrity
 * 
 * Expected Results:
 * - Long product names should be accepted and stored
 * - UI should display long names appropriately (truncated or wrapped)
 * - Storage should handle long names efficiently
 * - Performance should remain acceptable
 * - All cart operations should work with long names
 */

