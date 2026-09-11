/**
 * Boundary Value Test Suite: Special Characters in Product Names
 * Test ID Prefix: BVT-SPECIAL-CHARS
 * 
 * Purpose: Verify the shopping cart correctly handles special characters,
 * unicode, emojis, and various character encodings in product names.
 * 
 * Boundary Values Tested:
 * - Unicode characters (Chinese, Arabic, Cyrillic, etc.)
 * - Emojis and symbols
 * - HTML special characters
 * - Control characters
 * - Mixed character sets
 * 
 * Related Requirements:
 * - ST-2: Go to Cart button functionality
 * - Cart must handle international characters
 * - XSS prevention with special characters
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('BVT-SPECIAL-CHARS: Special Characters Boundary Tests', () => {
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
   * Test Case: BVT-SPECIAL-CHARS-001
   * Verify product name with emojis
   */
  test('BVT-SPECIAL-CHARS-001: Should handle product names with emojis', async () => {
    const emojiName = '🎁 Gift Box 🎉 Special Offer 🛍️ Shopping Deal 💝';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'emoji-product-1',
        name: name,
        price: 29.99,
        description: 'Product with emojis',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('emoji-product-1', 1);
    }, emojiName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toContain('🎁');
    expect(cartItems[0].name).toContain('🎉');
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-002
   * Verify product name with Chinese characters
   */
  test('BVT-SPECIAL-CHARS-002: Should handle Chinese characters', async () => {
    const chineseName = '产品名称 - 特别优惠 中文测试';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'chinese-product-1',
        name: name,
        price: 39.99,
        description: 'Chinese product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('chinese-product-1', 1);
    }, chineseName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toBe(chineseName);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-003
   * Verify product name with Arabic characters
   */
  test('BVT-SPECIAL-CHARS-003: Should handle Arabic characters', async () => {
    const arabicName = 'منتج خاص - عرض مميز';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'arabic-product-1',
        name: name,
        price: 49.99,
        description: 'Arabic product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('arabic-product-1', 1);
    }, arabicName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toBe(arabicName);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-004
   * Verify product name with Cyrillic characters
   */
  test('BVT-SPECIAL-CHARS-004: Should handle Cyrillic characters', async () => {
    const cyrillicName = 'Продукт - Специальное Предложение';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'cyrillic-product-1',
        name: name,
        price: 59.99,
        description: 'Cyrillic product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('cyrillic-product-1', 1);
    }, cyrillicName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toBe(cyrillicName);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-005
   * Verify product name with Japanese characters
   */
  test('BVT-SPECIAL-CHARS-005: Should handle Japanese characters', async () => {
    const japaneseName = '製品名 - 特別オファー テスト商品';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'japanese-product-1',
        name: name,
        price: 69.99,
        description: 'Japanese product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('japanese-product-1', 1);
    }, japaneseName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toBe(japaneseName);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-006
   * Verify product name with HTML special characters
   */
  test('BVT-SPECIAL-CHARS-006: Should sanitize HTML special characters', async () => {
    const htmlName = 'Product <>&"\' Special';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'html-chars-1',
        name: name,
        price: 79.99,
        description: 'HTML chars product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('html-chars-1', 1);
    }, htmlName);

    expect(result.success).toBe(true);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    // Verify HTML is escaped in display
    const displayedName = await page.$eval('.item-name', el => el.textContent);
    expect(displayedName).toContain('<');
    expect(displayedName).toContain('>');
    
    // Verify no actual HTML elements were created
    const hasInjectedHTML = await page.evaluate(() => {
      const itemName = document.querySelector('.item-name');
      return itemName.children.length > 0;
    });
    
    expect(hasInjectedHTML).toBe(false);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-007
   * Verify product name with mathematical symbols
   */
  test('BVT-SPECIAL-CHARS-007: Should handle mathematical symbols', async () => {
    const mathName = 'Product ∑∏∫√∞≈≠±×÷ Math Symbols';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'math-product-1',
        name: name,
        price: 89.99,
        description: 'Math symbols product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('math-product-1', 1);
    }, mathName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toContain('∑');
    expect(cartItems[0].name).toContain('∞');
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-008
   * Verify product name with currency symbols
   */
  test('BVT-SPECIAL-CHARS-008: Should handle currency symbols', async () => {
    const currencyName = 'Product $€£¥₹₽¢ Currency Test';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'currency-product-1',
        name: name,
        price: 99.99,
        description: 'Currency symbols product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('currency-product-1', 1);
    }, currencyName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toContain('$');
    expect(cartItems[0].name).toContain('€');
    expect(cartItems[0].name).toContain('¥');
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-009
   * Verify product name with trademark symbols
   */
  test('BVT-SPECIAL-CHARS-009: Should handle trademark symbols', async () => {
    const trademarkName = 'Product™ Brand® Copyright© Test';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'trademark-product-1',
        name: name,
        price: 109.99,
        description: 'Trademark symbols product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('trademark-product-1', 1);
    }, trademarkName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toContain('™');
    expect(cartItems[0].name).toContain('®');
    expect(cartItems[0].name).toContain('©');
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-010
   * Verify product name with mixed character sets
   */
  test('BVT-SPECIAL-CHARS-010: Should handle mixed character sets', async () => {
    const mixedName = 'Product 产品 المنتج Товар 製品 🎁 Test™';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'mixed-product-1',
        name: name,
        price: 119.99,
        description: 'Mixed characters product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('mixed-product-1', 1);
    }, mixedName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toBe(mixedName);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-011
   * Verify "Go to Cart" with special character products
   */
  test('BVT-SPECIAL-CHARS-011: Should navigate to cart with special chars', async () => {
    const specialName = '🌟 Special Product™ 特別 المميز 🌟';
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'special-nav-1',
        name: name,
        price: 129.99,
        description: 'Special chars product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('special-nav-1', 1);
    }, specialName);

    await page.click('.go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    expect(page.url()).toContain('cart.html');

    await page.waitForSelector('.cart-item');
    const displayedName = await page.$eval('.item-name', el => el.textContent);
    expect(displayedName).toContain('🌟');
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-012
   * Verify localStorage persistence with special characters
   */
  test('BVT-SPECIAL-CHARS-012: Should persist special characters correctly', async () => {
    const specialName = '🎨 Art Product™ 艺术 الفن Искусство 🖼️';
    
    await page.evaluate((name) => {
      window.productData.products.push({
        id: 'special-persist-1',
        name: name,
        price: 139.99,
        description: 'Special chars product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      window.cartManager.addToCart('special-persist-1', 1);
    }, specialName);

    await page.reload({ waitUntil: 'networkidle0' });

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].name).toBe(specialName);
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-013
   * Verify newline and tab characters
   */
  test('BVT-SPECIAL-CHARS-013: Should handle newline and tab characters', async () => {
    const whitespaceNam = 'Product\nWith\tWhitespace\r\nCharacters';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'whitespace-product-1',
        name: name,
        price: 149.99,
        description: 'Whitespace product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('whitespace-product-1', 1);
    }, whitespaceNam);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    // Should preserve or normalize whitespace
    expect(cartItems[0].name).toBeTruthy();
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-014
   * Verify zero-width characters
   */
  test('BVT-SPECIAL-CHARS-014: Should handle zero-width characters', async () => {
    const zeroWidthName = 'Product\u200B\u200C\u200DWith\uFEFFZero\u2060Width';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'zerowidth-product-1',
        name: name,
        price: 159.99,
        description: 'Zero-width product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('zerowidth-product-1', 1);
    }, zeroWidthName);

    expect(result.success).toBe(true);

    const cartItems = await page.evaluate(() => {
      return window.cartManager.getCartItems();
    });

    expect(cartItems[0].name).toBeTruthy();
  });

  /**
   * Test Case: BVT-SPECIAL-CHARS-015
   * Verify right-to-left (RTL) text
   */
  test('BVT-SPECIAL-CHARS-015: Should handle RTL text correctly', async () => {
    const rtlName = '\u202Eمنتج خاص - Special Product\u202C';
    
    const result = await page.evaluate((name) => {
      window.productData.products.push({
        id: 'rtl-product-1',
        name: name,
        price: 169.99,
        description: 'RTL product',
        image: 'https://via.placeholder.com/300x200',
        category: 'test',
        stock: 50
      });
      
      return window.cartManager.addToCart('rtl-product-1', 1);
    }, rtlName);

    expect(result.success).toBe(true);

    await page.goto(cartUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    const displayedName = await page.$eval('.item-name', el => el.textContent);
    expect(displayedName).toBeTruthy();
    expect(displayedName.length).toBeGreaterThan(0);
  });
});

/**
 * Test Execution Summary:
 * - Total Test Cases: 15
 * - Boundary Values: Unicode, Emojis, Special chars, RTL
 * - Coverage: International chars, Symbols, HTML chars, Encoding
 * - Priority: HIGH - Critical for international support
 * 
 * Expected Results:
 * - All unicode characters should be supported
 * - Emojis should display correctly
 * - HTML special characters should be escaped
 * - Mixed character sets should work together
 * - RTL text should be handled appropriately
 * - No XSS vulnerabilities with special characters
 */

