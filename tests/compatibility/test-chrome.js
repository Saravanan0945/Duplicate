/**
 * Chrome-Specific Compatibility Tests for "Go to Cart" Functionality
 * 
 * Test ID Prefix: CHROME-
 * Browser: Google Chrome (latest stable)
 * Focus Areas:
 * - localStorage API compatibility
 * - CSS Grid layout rendering
 * - Chrome DevTools Protocol features
 * - V8 JavaScript engine optimizations
 * - Blink rendering engine specifics
 * 
 * Related Jira: ST-2
 * Priority: High
 * Test Type: Compatibility Testing
 */

const puppeteer = require('puppeteer');
const { testConfig } = require('../test-config');
const { 
    setupTestEnvironment, 
    cleanupTestEnvironment,
    waitForElement,
    measurePerformance,
    captureScreenshot
} = require('../test-utils');

describe('Chrome Compatibility Tests - Go to Cart Functionality', () => {
    let browser;
    let page;
    const baseUrl = testConfig.baseUrl;

    beforeAll(async () => {
        // Launch Chrome with specific flags
        browser = await puppeteer.launch({
            headless: testConfig.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--enable-features=NetworkService',
                '--disable-features=VizDisplayCompositor'
            ],
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await setupTestEnvironment(page);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    });

    afterEach(async () => {
        await cleanupTestEnvironment(page);
        if (page) {
            await page.close();
        }
    });

    /**
     * Test: CHROME-001
     * Verify localStorage API works correctly in Chrome
     */
    test('CHROME-001: localStorage API compatibility', async () => {
        // Add product to cart
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        // Verify localStorage is set
        const localStorageData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(localStorageData).not.toBeNull();
        expect(localStorageData).toContain('product-');

        // Verify data structure
        const cartData = JSON.parse(localStorageData);
        expect(cartData).toHaveProperty('items');
        expect(cartData).toHaveProperty('version');
        expect(Array.isArray(cartData.items)).toBe(true);
    });

    /**
     * Test: CHROME-002
     * Verify localStorage quota handling in Chrome (10MB limit)
     */
    test('CHROME-002: localStorage quota limit handling', async () => {
        const result = await page.evaluate(() => {
            try {
                // Attempt to fill localStorage to near capacity
                const largeData = 'x'.repeat(1024 * 1024); // 1MB string
                let i = 0;
                
                while (i < 9) { // Try to store 9MB
                    localStorage.setItem(`test_data_${i}`, largeData);
                    i++;
                }
                
                // Now try to add cart data
                const cartData = {
                    items: [{ productId: 'product-1', quantity: 1 }],
                    version: '1.0.0'
                };
                localStorage.setItem('shopping_cart', JSON.stringify(cartData));
                
                return { success: true, error: null };
            } catch (error) {
                return { success: false, error: error.message };
            } finally {
                // Cleanup
                for (let j = 0; j < 9; j++) {
                    localStorage.removeItem(`test_data_${j}`);
                }
            }
        });

        // Chrome should handle quota gracefully
        expect(result.success).toBe(true);
    });

    /**
     * Test: CHROME-003
     * Verify CSS Grid layout renders correctly
     */
    test('CHROME-003: CSS Grid layout rendering', async () => {
        // Check if CSS Grid is supported
        const gridSupport = await page.evaluate(() => {
            return CSS.supports('display', 'grid');
        });

        expect(gridSupport).toBe(true);

        // Verify product grid uses CSS Grid
        const gridProperties = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                display: styles.display,
                gridTemplateColumns: styles.gridTemplateColumns,
                gap: styles.gap
            };
        });

        expect(gridProperties.display).toBe('grid');
        expect(gridProperties.gridTemplateColumns).not.toBe('none');
    });

    /**
     * Test: CHROME-004
     * Verify Chrome DevTools Protocol features work
     */
    test('CHROME-004: Chrome DevTools Protocol compatibility', async () => {
        // Enable performance monitoring
        await page.evaluateOnNewDocument(() => {
            window.performance.mark('test-start');
        });

        // Add product and navigate to cart
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);
        await page.click('.go-to-cart-btn');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Measure performance
        const metrics = await page.evaluate(() => {
            window.performance.mark('test-end');
            window.performance.measure('test-duration', 'test-start', 'test-end');
            
            const measure = window.performance.getEntriesByName('test-duration')[0];
            return {
                duration: measure.duration,
                navigationTiming: performance.timing.loadEventEnd - performance.timing.navigationStart
            };
        });

        expect(metrics.duration).toBeLessThan(5000);
        expect(metrics.navigationTiming).toBeLessThan(3000);
    });

    /**
     * Test: CHROME-005
     * Verify V8 JavaScript engine optimizations
     */
    test('CHROME-005: V8 engine performance optimizations', async () => {
        // Test rapid cart operations (V8 should optimize)
        const performanceResult = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Simulate 1000 cart operations
            for (let i = 0; i < 1000; i++) {
                const cart = {
                    items: [
                        { productId: `product-${i}`, quantity: 1, price: 29.99 }
                    ],
                    version: '1.0.0'
                };
                
                // Serialize and parse (common operation)
                const serialized = JSON.stringify(cart);
                const parsed = JSON.parse(serialized);
            }
            
            const endTime = performance.now();
            return endTime - startTime;
        });

        // V8 should handle this efficiently
        expect(performanceResult).toBeLessThan(100); // Should complete in < 100ms
    });

    /**
     * Test: CHROME-006
     * Verify Chrome's Blink rendering engine handles animations
     */
    test('CHROME-006: Blink rendering engine animation performance', async () => {
        // Add product with animation
        await page.click('.product-card:first-child .add-to-cart-btn');
        
        // Measure animation frame rate
        const fps = await page.evaluate(() => {
            return new Promise((resolve) => {
                let frames = 0;
                const startTime = performance.now();
                
                function countFrames() {
                    frames++;
                    const elapsed = performance.now() - startTime;
                    
                    if (elapsed < 1000) {
                        requestAnimationFrame(countFrames);
                    } else {
                        resolve(frames);
                    }
                }
                
                requestAnimationFrame(countFrames);
            });
        });

        // Chrome should maintain 60fps
        expect(fps).toBeGreaterThanOrEqual(55); // Allow small variance
    });

    /**
     * Test: CHROME-007
     * Verify Chrome's localStorage event handling
     */
    test('CHROME-007: localStorage storage event handling', async () => {
        // Open second tab
        const page2 = await browser.newPage();
        await page2.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Set up storage event listener on page2
        await page2.evaluate(() => {
            window.storageEventFired = false;
            window.addEventListener('storage', (e) => {
                if (e.key === 'shopping_cart') {
                    window.storageEventFired = true;
                }
            });
        });

        // Modify localStorage on page1
        await page.evaluate(() => {
            const cart = {
                items: [{ productId: 'product-1', quantity: 1 }],
                version: '1.0.0'
            };
            localStorage.setItem('shopping_cart', JSON.stringify(cart));
        });

        await page2.waitForTimeout(500);

        // Check if event fired on page2
        const eventFired = await page2.evaluate(() => window.storageEventFired);
        expect(eventFired).toBe(true);

        await page2.close();
    });

    /**
     * Test: CHROME-008
     * Verify Chrome's CSS Grid auto-placement algorithm
     */
    test('CHROME-008: CSS Grid auto-placement algorithm', async () => {
        const gridLayout = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const items = grid.querySelectorAll('.product-card');
            
            const positions = Array.from(items).map(item => {
                const rect = item.getBoundingClientRect();
                return {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                };
            });
            
            return positions;
        });

        // Verify items are properly positioned
        expect(gridLayout.length).toBeGreaterThan(0);
        
        // Check that items don't overlap
        for (let i = 0; i < gridLayout.length - 1; i++) {
            for (let j = i + 1; j < gridLayout.length; j++) {
                const item1 = gridLayout[i];
                const item2 = gridLayout[j];
                
                const overlap = !(
                    item1.left + item1.width <= item2.left ||
                    item2.left + item2.width <= item1.left ||
                    item1.top + item1.height <= item2.top ||
                    item2.top + item2.height <= item1.top
                );
                
                expect(overlap).toBe(false);
            }
        }
    });

    /**
     * Test: CHROME-009
     * Verify Chrome's fetch API and network handling
     */
    test('CHROME-009: Fetch API and network request handling', async () => {
        // Monitor network requests
        const requests = [];
        page.on('request', request => {
            requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });

        // Navigate to cart page
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);
        await page.click('.go-to-cart-btn');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Verify requests were made
        expect(requests.length).toBeGreaterThan(0);
        
        // Check for HTML document request
        const htmlRequest = requests.find(r => r.resourceType === 'document');
        expect(htmlRequest).toBeDefined();
        expect(htmlRequest.url).toContain('cart.html');
    });

    /**
     * Test: CHROME-010
     * Verify Chrome's console API and error logging
     */
    test('CHROME-010: Console API and error logging', async () => {
        const consoleMessages = [];
        
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text()
            });
        });

        // Trigger cart operations
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        // Verify no errors were logged
        const errors = consoleMessages.filter(m => m.type === 'error');
        expect(errors.length).toBe(0);
    });

    /**
     * Test: CHROME-011
     * Verify Chrome's Web Storage API size limits
     */
    test('CHROME-011: Web Storage API size calculation', async () => {
        const storageInfo = await page.evaluate(() => {
            // Calculate current storage usage
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }
            
            return {
                totalSize: totalSize,
                itemCount: localStorage.length,
                available: true
            };
        });

        expect(storageInfo.available).toBe(true);
        expect(storageInfo.totalSize).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    /**
     * Test: CHROME-012
     * Verify Chrome's CSS Grid gap property
     */
    test('CHROME-012: CSS Grid gap property rendering', async () => {
        const gapInfo = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                gap: styles.gap,
                rowGap: styles.rowGap,
                columnGap: styles.columnGap,
                gridGap: styles.gridGap
            };
        });

        // Chrome should support gap property
        expect(gapInfo.gap).not.toBe('normal');
        expect(gapInfo.gap).toBeTruthy();
    });

    /**
     * Test: CHROME-013
     * Verify Chrome's requestAnimationFrame timing
     */
    test('CHROME-013: requestAnimationFrame timing accuracy', async () => {
        const timingAccuracy = await page.evaluate(() => {
            return new Promise((resolve) => {
                const timestamps = [];
                let count = 0;
                
                function measure(timestamp) {
                    timestamps.push(timestamp);
                    count++;
                    
                    if (count < 60) { // Measure 60 frames
                        requestAnimationFrame(measure);
                    } else {
                        // Calculate average frame time
                        const frameTimes = [];
                        for (let i = 1; i < timestamps.length; i++) {
                            frameTimes.push(timestamps[i] - timestamps[i - 1]);
                        }
                        
                        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
                        resolve(avgFrameTime);
                    }
                }
                
                requestAnimationFrame(measure);
            });
        });

        // Should be close to 16.67ms (60fps)
        expect(timingAccuracy).toBeGreaterThan(14);
        expect(timingAccuracy).toBeLessThan(20);
    });

    /**
     * Test: CHROME-014
     * Verify Chrome's localStorage synchronous behavior
     */
    test('CHROME-014: localStorage synchronous operations', async () => {
        const result = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Perform 100 synchronous localStorage operations
            for (let i = 0; i < 100; i++) {
                localStorage.setItem(`test_${i}`, `value_${i}`);
                const value = localStorage.getItem(`test_${i}`);
                localStorage.removeItem(`test_${i}`);
            }
            
            const endTime = performance.now();
            
            return {
                duration: endTime - startTime,
                completed: true
            };
        });

        expect(result.completed).toBe(true);
        expect(result.duration).toBeLessThan(50); // Should be very fast
    });

    /**
     * Test: CHROME-015
     * Verify Chrome's CSS Grid minmax() function
     */
    test('CHROME-015: CSS Grid minmax() function support', async () => {
        const minmaxSupport = await page.evaluate(() => {
            // Create test element
            const testDiv = document.createElement('div');
            testDiv.style.display = 'grid';
            testDiv.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
            document.body.appendChild(testDiv);
            
            const styles = window.getComputedStyle(testDiv);
            const result = styles.gridTemplateColumns !== 'none';
            
            document.body.removeChild(testDiv);
            return result;
        });

        expect(minmaxSupport).toBe(true);
    });
});

/**
 * Chrome-Specific Feature Tests
 */
describe('Chrome Advanced Features - Go to Cart', () => {
    let browser;
    let page;
    const baseUrl = testConfig.baseUrl;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: testConfig.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    /**
     * Test: CHROME-ADV-001
     * Verify Chrome's memory management for cart data
     */
    test('CHROME-ADV-001: Memory management for large cart', async () => {
        const memoryUsage = await page.evaluate(() => {
            if (performance.memory) {
                const before = performance.memory.usedJSHeapSize;
                
                // Create large cart
                const cart = {
                    items: Array.from({ length: 100 }, (_, i) => ({
                        productId: `product-${i}`,
                        quantity: 1,
                        price: 29.99
                    })),
                    version: '1.0.0'
                };
                
                localStorage.setItem('shopping_cart', JSON.stringify(cart));
                
                const after = performance.memory.usedJSHeapSize;
                
                return {
                    before,
                    after,
                    increase: after - before,
                    available: true
                };
            }
            
            return { available: false };
        });

        if (memoryUsage.available) {
            expect(memoryUsage.increase).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
        }
    });

    /**
     * Test: CHROME-ADV-002
     * Verify Chrome's Service Worker compatibility (if applicable)
     */
    test('CHROME-ADV-002: Service Worker API availability', async () => {
        const swSupport = await page.evaluate(() => {
            return 'serviceWorker' in navigator;
        });

        expect(swSupport).toBe(true);
    });

    /**
     * Test: CHROME-ADV-003
     * Verify Chrome's IndexedDB as fallback storage
     */
    test('CHROME-ADV-003: IndexedDB API availability', async () => {
        const idbSupport = await page.evaluate(() => {
            return 'indexedDB' in window;
        });

        expect(idbSupport).toBe(true);
    });
});

module.exports = {
    description: 'Chrome-specific compatibility tests for Go to Cart functionality',
    testCount: 18,
    priority: 'High',
    browser: 'Chrome',
    coverage: [
        'localStorage API',
        'CSS Grid rendering',
        'V8 engine optimizations',
        'Blink rendering engine',
        'Chrome DevTools Protocol',
        'Web Storage API',
        'Performance monitoring',
        'Memory management'
    ]
};

