/**
 * Test Utilities
 * Shared utilities for all test suites
 * 
 * @module test-utils
 * @description Provides common setup, teardown, assertions, and helper functions
 *              for test execution across all test suites
 */

const TestUtils = {
  // ============================================================================
  // SETUP AND TEARDOWN
  // ============================================================================

  /**
   * Setup test environment before each test
   * @param {Object} page - Puppeteer page instance
   * @param {Object} options - Setup options
   * @returns {Promise<void>}
   */
  async setupTest(page, options = {}) {
    const {
      clearStorage = true,
      clearCookies = true,
      clearCache = false,
      viewport = { width: 1280, height: 720 },
      userAgent = null
    } = options;

    // Set viewport
    await page.setViewport(viewport);

    // Set user agent if provided
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }

    // Clear localStorage
    if (clearStorage) {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }

    // Clear cookies
    if (clearCookies) {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
    }

    // Clear cache
    if (clearCache) {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCache');
    }

    // Disable animations for faster tests
    await page.evaluateOnNewDocument(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  },

  /**
   * Teardown test environment after each test
   * @param {Object} page - Puppeteer page instance
   * @param {Object} options - Teardown options
   * @returns {Promise<void>}
   */
  async teardownTest(page, options = {}) {
    const {
      clearStorage = true,
      takeScreenshot = false,
      screenshotPath = null
    } = options;

    // Take screenshot if requested
    if (takeScreenshot && screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    // Clear storage
    if (clearStorage) {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }
  },

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================

  /**
   * Navigate to index page
   * @param {Object} page - Puppeteer page instance
   * @param {string} baseUrl - Base URL
   * @returns {Promise<void>}
   */
  async navigateToIndex(page, baseUrl = 'http://localhost:3000') {
    await page.goto(`${baseUrl}/index.html`, {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
  },

  /**
   * Navigate to cart page
   * @param {Object} page - Puppeteer page instance
   * @param {string} baseUrl - Base URL
   * @returns {Promise<void>}
   */
  async navigateToCart(page, baseUrl = 'http://localhost:3000') {
    await page.goto(`${baseUrl}/cart.html`, {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
  },

  /**
   * Click "Go to Cart" button
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async clickGoToCart(page) {
    await page.waitForSelector('#go-to-cart-btn', { visible: true });
    await page.click('#go-to-cart-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  },

  // ============================================================================
  // CART OPERATIONS
  // ============================================================================

  /**
   * Add product to cart
   * @param {Object} page - Puppeteer page instance
   * @param {string} productId - Product ID
   * @returns {Promise<void>}
   */
  async addToCart(page, productId) {
    await page.waitForSelector(`[data-product-id="${productId}"] .add-to-cart-btn`, {
      visible: true
    });
    await page.click(`[data-product-id="${productId}"] .add-to-cart-btn`);
    await this.waitForToast(page);
  },

  /**
   * Remove product from cart
   * @param {Object} page - Puppeteer page instance
   * @param {string} productId - Product ID
   * @returns {Promise<void>}
   */
  async removeFromCart(page, productId) {
    await page.waitForSelector(`[data-product-id="${productId}"] .remove-btn`, {
      visible: true
    });
    await page.click(`[data-product-id="${productId}"] .remove-btn`);
    await this.waitForToast(page);
  },

  /**
   * Update product quantity
   * @param {Object} page - Puppeteer page instance
   * @param {string} productId - Product ID
   * @param {number} quantity - New quantity
   * @returns {Promise<void>}
   */
  async updateQuantity(page, productId, quantity) {
    const currentQty = await page.$eval(
      `[data-product-id="${productId}"] .quantity-input`,
      el => parseInt(el.value)
    );

    const diff = quantity - currentQty;
    const button = diff > 0 ? '.increase-btn' : '.decrease-btn';
    const clicks = Math.abs(diff);

    for (let i = 0; i < clicks; i++) {
      await page.click(`[data-product-id="${productId}"] ${button}`);
      await page.waitForTimeout(100);
    }
  },

  /**
   * Get cart badge count
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<number>} Cart item count
   */
  async getCartBadgeCount(page) {
    await page.waitForSelector('#cart-badge', { visible: true });
    const count = await page.$eval('#cart-badge', el => el.textContent.trim());
    return parseInt(count) || 0;
  },

  /**
   * Get cart items from localStorage
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<Array>} Cart items
   */
  async getCartFromStorage(page) {
    return await page.evaluate(() => {
      const cartData = localStorage.getItem('shopping_cart');
      return cartData ? JSON.parse(cartData) : [];
    });
  },

  /**
   * Set cart items in localStorage
   * @param {Object} page - Puppeteer page instance
   * @param {Array} items - Cart items
   * @returns {Promise<void>}
   */
  async setCartInStorage(page, items) {
    await page.evaluate((cartItems) => {
      localStorage.setItem('shopping_cart', JSON.stringify(cartItems));
    }, items);
  },

  /**
   * Clear cart
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<void>}
   */
  async clearCart(page) {
    await page.evaluate(() => {
      localStorage.removeItem('shopping_cart');
    });
  },

  // ============================================================================
  // WAIT HELPERS
  // ============================================================================

  /**
   * Wait for toast notification
   * @param {Object} page - Puppeteer page instance
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string>} Toast message
   */
  async waitForToast(page, timeout = 5000) {
    await page.waitForSelector('.toast', { visible: true, timeout });
    const message = await page.$eval('.toast', el => el.textContent.trim());
    await page.waitForSelector('.toast', { hidden: true, timeout });
    return message;
  },

  /**
   * Wait for element to be visible
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForVisible(page, selector, timeout = 5000) {
    await page.waitForSelector(selector, { visible: true, timeout });
  },

  /**
   * Wait for element to be hidden
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForHidden(page, selector, timeout = 5000) {
    await page.waitForSelector(selector, { hidden: true, timeout });
  },

  /**
   * Wait for page load
   * @param {Object} page - Puppeteer page instance
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForPageLoad(page, timeout = 10000) {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
  },

  // ============================================================================
  // ASSERTION HELPERS
  // ============================================================================

  /**
   * Assert element exists
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  async assertElementExists(page, selector, message = '') {
    const element = await page.$(selector);
    if (!element) {
      throw new Error(message || `Element not found: ${selector}`);
    }
  },

  /**
   * Assert element visible
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  async assertElementVisible(page, selector, message = '') {
    const isVisible = await page.$eval(selector, el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }).catch(() => false);

    if (!isVisible) {
      throw new Error(message || `Element not visible: ${selector}`);
    }
  },

  /**
   * Assert text content
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {string} expectedText - Expected text
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  async assertTextContent(page, selector, expectedText, message = '') {
    const actualText = await page.$eval(selector, el => el.textContent.trim());
    if (actualText !== expectedText) {
      throw new Error(
        message || `Text mismatch. Expected: "${expectedText}", Got: "${actualText}"`
      );
    }
  },

  /**
   * Assert cart badge count
   * @param {Object} page - Puppeteer page instance
   * @param {number} expectedCount - Expected count
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  async assertCartBadgeCount(page, expectedCount, message = '') {
    const actualCount = await this.getCartBadgeCount(page);
    if (actualCount !== expectedCount) {
      throw new Error(
        message || `Cart badge count mismatch. Expected: ${expectedCount}, Got: ${actualCount}`
      );
    }
  },

  /**
   * Assert URL
   * @param {Object} page - Puppeteer page instance
   * @param {string} expectedUrl - Expected URL (can be partial)
   * @param {string} message - Error message
   * @returns {Promise<void>}
   */
  async assertUrl(page, expectedUrl, message = '') {
    const actualUrl = page.url();
    if (!actualUrl.includes(expectedUrl)) {
      throw new Error(
        message || `URL mismatch. Expected to include: "${expectedUrl}", Got: "${actualUrl}"`
      );
    }
  },

  // ============================================================================
  // DATA HELPERS
  // ============================================================================

  /**
   * Generate random product ID
   * @returns {string} Random product ID
   */
  generateRandomProductId() {
    return `product-${Math.floor(Math.random() * 1000)}`;
  },

  /**
   * Generate random quantity
   * @param {number} min - Minimum quantity
   * @param {number} max - Maximum quantity
   * @returns {number} Random quantity
   */
  generateRandomQuantity(min = 1, max = 10) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate XSS payload
   * @returns {string} XSS payload
   */
  generateXSSPayload() {
    const payloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>'
    ];
    return payloads[Math.floor(Math.random() * payloads.length)];
  },

  /**
   * Generate SQL injection payload
   * @returns {string} SQL injection payload
   */
  generateSQLPayload() {
    const payloads = [
      "' OR '1'='1",
      "1' OR '1'='1' --",
      "admin'--",
      "' UNION SELECT NULL--"
    ];
    return payloads[Math.floor(Math.random() * payloads.length)];
  },

  // ============================================================================
  // PERFORMANCE HELPERS
  // ============================================================================

  /**
   * Measure page load time
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<number>} Load time in milliseconds
   */
  async measurePageLoadTime(page) {
    const startTime = Date.now();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    return Date.now() - startTime;
  },

  /**
   * Measure operation time
   * @param {Function} operation - Operation to measure
   * @returns {Promise<Object>} Result with duration and return value
   */
  async measureOperationTime(operation) {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    return { duration, result };
  },

  /**
   * Get memory usage
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<Object>} Memory usage metrics
   */
  async getMemoryUsage(page) {
    return await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
  },

  // ============================================================================
  // SCREENSHOT HELPERS
  // ============================================================================

  /**
   * Take screenshot
   * @param {Object} page - Puppeteer page instance
   * @param {string} filename - Screenshot filename
   * @param {Object} options - Screenshot options
   * @returns {Promise<void>}
   */
  async takeScreenshot(page, filename, options = {}) {
    const {
      fullPage = true,
      path = `tests/reports/screenshots/${filename}`
    } = options;

    await page.screenshot({ path, fullPage });
  },

  /**
   * Take screenshot on failure
   * @param {Object} page - Puppeteer page instance
   * @param {string} testName - Test name
   * @returns {Promise<void>}
   */
  async takeScreenshotOnFailure(page, testName) {
    const timestamp = Date.now();
    const filename = `${testName}-${timestamp}.png`;
    await this.takeScreenshot(page, filename);
  },

  // ============================================================================
  // LOGGING HELPERS
  // ============================================================================

  /**
   * Log test start
   * @param {string} testName - Test name
   * @returns {void}
   */
  logTestStart(testName) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Starting test: ${testName}`);
    console.log(`${'='.repeat(80)}\n`);
  },

  /**
   * Log test end
   * @param {string} testName - Test name
   * @param {boolean} passed - Test passed
   * @param {number} duration - Test duration in milliseconds
   * @returns {void}
   */
  logTestEnd(testName, passed, duration) {
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`Test: ${testName}`);
    console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`${'-'.repeat(80)}\n`);
  },

  /**
   * Log test step
   * @param {string} step - Step description
   * @returns {void}
   */
  logTestStep(step) {
    console.log(`  ➤ ${step}`);
  },

  // ============================================================================
  // RETRY HELPERS
  // ============================================================================

  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Operation result
   */
  async retryOperation(operation, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      backoffMultiplier = 2,
      onRetry = null
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          if (onRetry) {
            onRetry(attempt + 1, maxRetries, error);
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= backoffMultiplier;
        }
      }
    }

    throw lastError;
  }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestUtils;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.TestUtils = TestUtils;
}

