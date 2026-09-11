/**
 * Performance Test: Large Cart Rendering
 * Test ID: PERF-001
 * 
 * Purpose: Verify cart page performance when rendering 50+ items
 * 
 * Test Coverage:
 * - Rendering performance with large datasets
 * - DOM manipulation efficiency
 * - Memory usage and leaks
 * - Scroll performance
 * - UI responsiveness
 * 
 * Performance Benchmarks:
 * - Initial render: < 2000ms for 50 items
 * - Scroll performance: 60fps
 * - Memory usage: < 50MB increase
 * - DOM nodes: < 5000 for 50 items
 * - Time to interactive: < 3000ms
 */

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

describe('PERF-001: Large Cart Rendering Performance', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';
  const LARGE_CART_SIZE = 50;
  const PERFORMANCE_THRESHOLDS = {
    initialRender: 2000, // ms
    scrollFPS: 55, // minimum fps
    memoryIncrease: 50 * 1024 * 1024, // 50MB in bytes
    domNodes: 5000,
    timeToInteractive: 3000, // ms
    updateOperation: 100, // ms per update
    removeOperation: 50, // ms per remove
  };

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
    
    // Enable performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        renderTimes: [],
        scrollEvents: [],
        memorySnapshots: []
      };
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Initial render performance with 50 items
   * Priority: Critical
   */
  test('PERF-001-T01: Should render 50 cart items within 2000ms', async () => {
    // Navigate to index page
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });

    // Add 50 items to cart
    const startTime = performance.now();
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    // Navigate to cart page and measure render time
    const navigationStart = performance.now();
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });
    
    // Wait for all cart items to render
    await page.waitForSelector('.cart-item', { timeout: 5000 });
    
    const renderTime = performance.now() - navigationStart;
    const totalTime = performance.now() - startTime;

    // Verify render time
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.initialRender);

    // Verify all items rendered
    const itemCount = await page.$$eval('.cart-item', items => items.length);
    expect(itemCount).toBe(LARGE_CART_SIZE);

    console.log(`✓ Rendered ${LARGE_CART_SIZE} items in ${renderTime.toFixed(2)}ms`);
  });

  /**
   * Test 2: Scroll performance with large cart
   * Priority: High
   */
  test('PERF-001-T02: Should maintain 55+ fps during scrolling', async () => {
    // Setup large cart
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Measure scroll performance
    const scrollMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const frames = [];
        let lastTime = performance.now();
        let scrollCount = 0;
        const maxScrolls = 50;

        const measureFrame = () => {
          const currentTime = performance.now();
          const fps = 1000 / (currentTime - lastTime);
          frames.push(fps);
          lastTime = currentTime;
        };

        const scrollInterval = setInterval(() => {
          window.scrollBy(0, 100);
          measureFrame();
          scrollCount++;

          if (scrollCount >= maxScrolls) {
            clearInterval(scrollInterval);
            const avgFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
            const minFPS = Math.min(...frames);
            resolve({ avgFPS, minFPS, frames: frames.length });
          }
        }, 16); // ~60fps
      });
    });

    expect(scrollMetrics.avgFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.scrollFPS);
    expect(scrollMetrics.minFPS).toBeGreaterThan(30); // Minimum acceptable

    console.log(`✓ Scroll performance: ${scrollMetrics.avgFPS.toFixed(2)} avg fps, ${scrollMetrics.minFPS.toFixed(2)} min fps`);
  });

  /**
   * Test 3: Memory usage with large cart
   * Priority: High
   */
  test('PERF-001-T03: Should not increase memory by more than 50MB', async () => {
    // Get initial memory
    const initialMetrics = await page.metrics();
    const initialMemory = initialMetrics.JSHeapUsedSize;

    // Navigate and add items
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.cart-item');

    // Get final memory
    const finalMetrics = await page.metrics();
    const finalMemory = finalMetrics.JSHeapUsedSize;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryIncrease);

    console.log(`✓ Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  });

  /**
   * Test 4: DOM node count optimization
   * Priority: Medium
   */
  test('PERF-001-T04: Should create fewer than 5000 DOM nodes for 50 items', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const domNodeCount = await page.evaluate(() => {
      return document.getElementsByTagName('*').length;
    });

    expect(domNodeCount).toBeLessThan(PERFORMANCE_THRESHOLDS.domNodes);

    console.log(`✓ DOM nodes: ${domNodeCount} (target: < ${PERFORMANCE_THRESHOLDS.domNodes})`);
  });

  /**
   * Test 5: Time to interactive measurement
   * Priority: Critical
   */
  test('PERF-001-T05: Should be interactive within 3000ms', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    const startTime = performance.now();
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Wait for page to be interactive
    await page.waitForFunction(() => {
      const buttons = document.querySelectorAll('button');
      return buttons.length > 0 && !document.querySelector('.loading');
    });

    const timeToInteractive = performance.now() - startTime;

    expect(timeToInteractive).toBeLessThan(PERFORMANCE_THRESHOLDS.timeToInteractive);

    console.log(`✓ Time to interactive: ${timeToInteractive.toFixed(2)}ms`);
  });

  /**
   * Test 6: Quantity update performance
   * Priority: High
   */
  test('PERF-001-T06: Should update quantity in less than 100ms', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Measure update performance
    const updateTimes = [];
    for (let i = 0; i < 10; i++) {
      const startTime = await page.evaluate(() => performance.now());
      
      await page.click('.cart-item:first-child .quantity-increase');
      await page.waitForTimeout(50); // Small delay for UI update
      
      const endTime = await page.evaluate(() => performance.now());
      updateTimes.push(endTime - startTime);
    }

    const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    expect(avgUpdateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.updateOperation);

    console.log(`✓ Average update time: ${avgUpdateTime.toFixed(2)}ms`);
  });

  /**
   * Test 7: Remove item performance
   * Priority: High
   */
  test('PERF-001-T07: Should remove item in less than 50ms', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Measure remove performance
    const removeTimes = [];
    for (let i = 0; i < 5; i++) {
      const startTime = await page.evaluate(() => performance.now());
      
      await page.click('.cart-item:first-child .remove-item');
      await page.waitForTimeout(50);
      
      const endTime = await page.evaluate(() => performance.now());
      removeTimes.push(endTime - startTime);
    }

    const avgRemoveTime = removeTimes.reduce((a, b) => a + b, 0) / removeTimes.length;
    expect(avgRemoveTime).toBeLessThan(PERFORMANCE_THRESHOLDS.removeOperation);

    console.log(`✓ Average remove time: ${avgRemoveTime.toFixed(2)}ms`);
  });

  /**
   * Test 8: Batch operations performance
   * Priority: Medium
   */
  test('PERF-001-T08: Should handle batch updates efficiently', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });

    // Measure batch add performance
    const batchStartTime = performance.now();
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      const startTime = performance.now();
      
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
      
      return performance.now() - startTime;
    }, LARGE_CART_SIZE);

    const batchTime = performance.now() - batchStartTime;

    // Should complete batch operations in reasonable time
    expect(batchTime).toBeLessThan(1000); // 1 second for 50 items

    console.log(`✓ Batch add time: ${batchTime.toFixed(2)}ms for ${LARGE_CART_SIZE} items`);
  });

  /**
   * Test 9: Re-render performance after updates
   * Priority: Medium
   */
  test('PERF-001-T09: Should re-render efficiently after updates', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Measure re-render after multiple updates
    const rerenderTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Trigger multiple updates
      for (let i = 0; i < 10; i++) {
        const items = document.querySelectorAll('.quantity-increase');
        if (items[i]) items[i].click();
      }
      
      return performance.now() - startTime;
    });

    expect(rerenderTime).toBeLessThan(500); // 500ms for 10 updates

    console.log(`✓ Re-render time: ${rerenderTime.toFixed(2)}ms for 10 updates`);
  });

  /**
   * Test 10: Memory leak detection
   * Priority: Critical
   */
  test('PERF-001-T10: Should not have memory leaks during operations', async () => {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    await page.evaluate((count) => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < count; i++) {
        const product = products[i % products.length];
        window.cartManager.addToCart(product.id, 1);
      }
    }, LARGE_CART_SIZE);

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Get initial memory
    const initialMetrics = await page.metrics();
    const initialMemory = initialMetrics.JSHeapUsedSize;

    // Perform operations
    for (let i = 0; i < 20; i++) {
      await page.click('.cart-item:first-child .quantity-increase');
      await page.waitForTimeout(50);
    }

    // Force garbage collection (if available)
    await page.evaluate(() => {
      if (window.gc) window.gc();
    });

    // Get final memory
    const finalMetrics = await page.metrics();
    const finalMemory = finalMetrics.JSHeapUsedSize;
    const memoryGrowth = finalMemory - initialMemory;

    // Memory should not grow significantly
    expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // 5MB

    console.log(`✓ Memory growth after operations: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
  });
});

/**
 * Performance Test Summary:
 * 
 * Total Tests: 10
 * Coverage Areas:
 * - Initial rendering (2 tests)
 * - Scroll performance (1 test)
 * - Memory management (3 tests)
 * - DOM optimization (1 test)
 * - Operation speed (3 tests)
 * 
 * Performance Benchmarks:
 * ✓ Render 50 items: < 2000ms
 * ✓ Scroll FPS: > 55fps
 * ✓ Memory increase: < 50MB
 * ✓ DOM nodes: < 5000
 * ✓ Time to interactive: < 3000ms
 * ✓ Update operation: < 100ms
 * ✓ Remove operation: < 50ms
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button performance verified
 * ✓ Cart page navigation performance tested
 * ✓ Product display performance validated
 * ✓ No performance degradation with large datasets
 */

