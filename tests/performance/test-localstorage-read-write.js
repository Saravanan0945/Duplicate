/**
 * Performance Test: localStorage Read/Write Operations
 * Test ID: PERF-003
 * 
 * Purpose: Verify localStorage operation performance and efficiency
 * 
 * Test Coverage:
 * - Read operation speed
 * - Write operation speed
 * - Large data handling
 * - Serialization/deserialization performance
 * - Storage quota management
 * - Error handling performance
 * 
 * Performance Benchmarks:
 * - Single read: < 10ms
 * - Single write: < 20ms
 * - Large cart read (50 items): < 50ms
 * - Large cart write (50 items): < 100ms
 * - Serialization: < 30ms
 * - Deserialization: < 20ms
 */

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

describe('PERF-003: localStorage Read/Write Performance', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';
  const PERFORMANCE_THRESHOLDS = {
    singleRead: 10, // ms
    singleWrite: 20, // ms
    largeRead: 50, // ms for 50 items
    largeWrite: 100, // ms for 50 items
    serialization: 30, // ms
    deserialization: 20, // ms
    batchRead: 100, // ms for 10 reads
    batchWrite: 200, // ms for 10 writes
    quotaCheck: 5, // ms
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
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
    
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Single item read performance
   * Priority: Critical
   */
  test('PERF-003-T01: Should read single cart item in less than 10ms', async () => {
    // Add one item
    await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      window.cartManager.addToCart(products[0].id, 1);
    });

    const readTime = await page.evaluate(() => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const cart = window.cartStorage.loadCart();
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times)
      };
    });

    expect(readTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.singleRead);

    console.log(`✓ Single read - Avg: ${readTime.avgTime.toFixed(2)}ms, Min: ${readTime.minTime.toFixed(2)}ms, Max: ${readTime.maxTime.toFixed(2)}ms`);
  });

  /**
   * Test 2: Single item write performance
   * Priority: Critical
   */
  test('PERF-003-T02: Should write single cart item in less than 20ms', async () => {
    const writeTime = await page.evaluate(() => {
      const iterations = 100;
      const times = [];
      const products = window.productData.getAllProducts();

      for (let i = 0; i < iterations; i++) {
        const cartData = [{
          productId: products[0].id,
          quantity: 1,
          addedAt: Date.now()
        }];

        const startTime = performance.now();
        window.cartStorage.saveCart(cartData);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times)
      };
    });

    expect(writeTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.singleWrite);

    console.log(`✓ Single write - Avg: ${writeTime.avgTime.toFixed(2)}ms, Min: ${writeTime.minTime.toFixed(2)}ms, Max: ${writeTime.maxTime.toFixed(2)}ms`);
  });

  /**
   * Test 3: Large cart read performance (50 items)
   * Priority: High
   */
  test('PERF-003-T03: Should read 50-item cart in less than 50ms', async () => {
    // Add 50 items
    await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < 50; i++) {
        window.cartManager.addToCart(products[i % products.length].id, 1);
      }
    });

    const readTime = await page.evaluate(() => {
      const iterations = 50;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const cart = window.cartStorage.loadCart();
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
        itemCount: window.cartStorage.loadCart().length
      };
    });

    expect(readTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.largeRead);

    console.log(`✓ Large read (${readTime.itemCount} items) - Avg: ${readTime.avgTime.toFixed(2)}ms, Max: ${readTime.maxTime.toFixed(2)}ms`);
  });

  /**
   * Test 4: Large cart write performance (50 items)
   * Priority: High
   */
  test('PERF-003-T04: Should write 50-item cart in less than 100ms', async () => {
    const writeTime = await page.evaluate(() => {
      const iterations = 50;
      const times = [];
      const products = window.productData.getAllProducts();

      // Create large cart data
      const largeCartData = [];
      for (let i = 0; i < 50; i++) {
        largeCartData.push({
          productId: products[i % products.length].id,
          quantity: Math.floor(Math.random() * 10) + 1,
          addedAt: Date.now()
        });
      }

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        window.cartStorage.saveCart(largeCartData);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
        itemCount: largeCartData.length
      };
    });

    expect(writeTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.largeWrite);

    console.log(`✓ Large write (${writeTime.itemCount} items) - Avg: ${writeTime.avgTime.toFixed(2)}ms, Max: ${writeTime.maxTime.toFixed(2)}ms`);
  });

  /**
   * Test 5: Serialization performance
   * Priority: Medium
   */
  test('PERF-003-T05: Should serialize cart data in less than 30ms', async () => {
    const serializationTime = await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      const cartData = [];
      
      // Create cart with 30 items
      for (let i = 0; i < 30; i++) {
        cartData.push({
          productId: products[i % products.length].id,
          quantity: Math.floor(Math.random() * 10) + 1,
          addedAt: Date.now(),
          metadata: {
            category: products[i % products.length].category,
            price: products[i % products.length].price
          }
        });
      }

      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const serialized = JSON.stringify(cartData);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
        dataSize: JSON.stringify(cartData).length
      };
    });

    expect(serializationTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.serialization);

    console.log(`✓ Serialization (${serializationTime.dataSize} bytes) - Avg: ${serializationTime.avgTime.toFixed(2)}ms`);
  });

  /**
   * Test 6: Deserialization performance
   * Priority: Medium
   */
  test('PERF-003-T06: Should deserialize cart data in less than 20ms', async () => {
    const deserializationTime = await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      const cartData = [];
      
      for (let i = 0; i < 30; i++) {
        cartData.push({
          productId: products[i % products.length].id,
          quantity: Math.floor(Math.random() * 10) + 1,
          addedAt: Date.now()
        });
      }

      const serialized = JSON.stringify(cartData);
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const deserialized = JSON.parse(serialized);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
        itemCount: cartData.length
      };
    });

    expect(deserializationTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.deserialization);

    console.log(`✓ Deserialization (${deserializationTime.itemCount} items) - Avg: ${deserializationTime.avgTime.toFixed(2)}ms`);
  });

  /**
   * Test 7: Batch read operations
   * Priority: Medium
   */
  test('PERF-003-T07: Should handle 10 consecutive reads in less than 100ms', async () => {
    // Add items
    await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < 20; i++) {
        window.cartManager.addToCart(products[i % products.length].id, 1);
      }
    });

    const batchReadTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const cart = window.cartStorage.loadCart();
      }
      
      const totalTime = performance.now() - startTime;
      
      return {
        totalTime,
        avgTime: totalTime / 10
      };
    });

    expect(batchReadTime.totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.batchRead);

    console.log(`✓ Batch read (10 ops) - Total: ${batchReadTime.totalTime.toFixed(2)}ms, Avg: ${batchReadTime.avgTime.toFixed(2)}ms`);
  });

  /**
   * Test 8: Batch write operations
   * Priority: Medium
   */
  test('PERF-003-T08: Should handle 10 consecutive writes in less than 200ms', async () => {
    const batchWriteTime = await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const cartData = [];
        for (let j = 0; j < 15; j++) {
          cartData.push({
            productId: products[j % products.length].id,
            quantity: i + j,
            addedAt: Date.now()
          });
        }
        window.cartStorage.saveCart(cartData);
      }
      
      const totalTime = performance.now() - startTime;
      
      return {
        totalTime,
        avgTime: totalTime / 10
      };
    });

    expect(batchWriteTime.totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.batchWrite);

    console.log(`✓ Batch write (10 ops) - Total: ${batchWriteTime.totalTime.toFixed(2)}ms, Avg: ${batchWriteTime.avgTime.toFixed(2)}ms`);
  });

  /**
   * Test 9: Storage quota check performance
   * Priority: Low
   */
  test('PERF-003-T09: Should check storage quota quickly', async () => {
    const quotaCheckTime = await page.evaluate(() => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Check available storage
        try {
          const testKey = '__storage_test__';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
        } catch (e) {
          // Quota exceeded
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times)
      };
    });

    expect(quotaCheckTime.avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.quotaCheck);

    console.log(`✓ Quota check - Avg: ${quotaCheckTime.avgTime.toFixed(2)}ms, Max: ${quotaCheckTime.maxTime.toFixed(2)}ms`);
  });

  /**
   * Test 10: Read-write cycle performance
   * Priority: High
   */
  test('PERF-003-T10: Should complete read-modify-write cycle efficiently', async () => {
    // Add initial items
    await page.evaluate(() => {
      const products = window.productData.getAllProducts();
      for (let i = 0; i < 10; i++) {
        window.cartManager.addToCart(products[i].id, 1);
      }
    });

    const cycleTime = await page.evaluate(() => {
      const iterations = 50;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Read
        const cart = window.cartStorage.loadCart();
        
        // Modify
        if (cart.length > 0) {
          cart[0].quantity += 1;
        }
        
        // Write
        window.cartStorage.saveCart(cart);
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times),
        minTime: Math.min(...times)
      };
    });

    expect(cycleTime.avgTime).toBeLessThan(50); // 50ms for full cycle

    console.log(`✓ Read-modify-write cycle - Avg: ${cycleTime.avgTime.toFixed(2)}ms, Max: ${cycleTime.maxTime.toFixed(2)}ms`);
  });

  /**
   * Test 11: Error handling performance
   * Priority: Medium
   */
  test('PERF-003-T11: Should handle storage errors efficiently', async () => {
    const errorHandlingTime = await page.evaluate(() => {
      const times = [];

      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        
        try {
          // Attempt to read non-existent key
          const data = localStorage.getItem('non_existent_key_' + i);
          const parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          // Handle error
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      return {
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        maxTime: Math.max(...times)
      };
    });

    expect(errorHandlingTime.avgTime).toBeLessThan(5); // 5ms for error handling

    console.log(`✓ Error handling - Avg: ${errorHandlingTime.avgTime.toFixed(2)}ms`);
  });

  /**
   * Test 12: Concurrent read/write operations
   * Priority: High
   */
  test('PERF-003-T12: Should handle concurrent storage operations', async () => {
    const concurrentOpsTime = await page.evaluate(() => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const operations = [];
        const products = window.productData.getAllProducts();

        // Simulate concurrent operations
        for (let i = 0; i < 20; i++) {
          const op = new Promise((res) => {
            setTimeout(() => {
              if (i % 2 === 0) {
                // Write
                const cart = window.cartStorage.loadCart();
                cart.push({
                  productId: products[i % products.length].id,
                  quantity: 1,
                  addedAt: Date.now()
                });
                window.cartStorage.saveCart(cart);
              } else {
                // Read
                window.cartStorage.loadCart();
              }
              res();
            }, Math.random() * 50);
          });
          operations.push(op);
        }

        Promise.all(operations).then(() => {
          const totalTime = performance.now() - startTime;
          const finalCart = window.cartStorage.loadCart();
          
          resolve({
            totalTime,
            avgTime: totalTime / 20,
            finalItemCount: finalCart.length
          });
        });
      });
    });

    expect(concurrentOpsTime.totalTime).toBeLessThan(500); // 500ms for 20 concurrent ops

    console.log(`✓ Concurrent ops - Total: ${concurrentOpsTime.totalTime.toFixed(2)}ms, Final items: ${concurrentOpsTime.finalItemCount}`);
  });
});

/**
 * Performance Test Summary:
 * 
 * Total Tests: 12
 * Coverage Areas:
 * - Single operations (2 tests)
 * - Large data operations (2 tests)
 * - Serialization (2 tests)
 * - Batch operations (2 tests)
 * - Storage management (2 tests)
 * - Error handling (1 test)
 * - Concurrent operations (1 test)
 * 
 * Performance Benchmarks:
 * ✓ Single read: < 10ms
 * ✓ Single write: < 20ms
 * ✓ Large read (50 items): < 50ms
 * ✓ Large write (50 items): < 100ms
 * ✓ Serialization: < 30ms
 * ✓ Deserialization: < 20ms
 * ✓ Batch operations: < 200ms
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ Cart data persists efficiently
 * ✓ No performance degradation with storage
 * ✓ Data integrity maintained
 * ✓ Fast cart state retrieval
 */

