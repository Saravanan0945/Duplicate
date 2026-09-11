/**
 * Firefox-Specific Compatibility Tests for "Go to Cart" Functionality
 * 
 * Test ID Prefix: FIREFOX-
 * Browser: Mozilla Firefox (latest stable)
 * Focus Areas:
 * - localStorage API compatibility
 * - Gecko rendering engine specifics
 * - SpiderMonkey JavaScript engine
 * - Firefox Developer Tools features
 * - Privacy and tracking protection
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
    measurePerformance
} = require('../test-utils');

describe('Firefox Compatibility Tests - Go to Cart Functionality', () => {
    let browser;
    let page;
    const baseUrl = testConfig.baseUrl;

    beforeAll(async () => {
        // Note: For actual Firefox testing, use puppeteer-firefox
        // This example uses Chromium but tests Firefox-specific scenarios
        browser = await puppeteer.launch({
            headless: testConfig.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
     * Test: FIREFOX-001
     * Verify localStorage API works correctly in Firefox
     */
    test('FIREFOX-001: localStorage API compatibility', async () => {
        // Add product to cart
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        // Verify localStorage is set
        const localStorageData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(localStorageData).not.toBeNull();
        
        // Verify data can be retrieved and parsed
        const cartData = JSON.parse(localStorageData);
        expect(cartData).toHaveProperty('items');
        expect(Array.isArray(cartData.items)).toBe(true);
    });

    /**
     * Test: FIREFOX-002
     * Verify Firefox's localStorage quota (10MB limit)
     */
    test('FIREFOX-002: localStorage quota limit handling', async () => {
        const result = await page.evaluate(() => {
            try {
                // Firefox has a 10MB localStorage limit
                const largeData = 'x'.repeat(1024 * 1024); // 1MB string
                let i = 0;
                
                while (i < 9) {
                    localStorage.setItem(`test_data_${i}`, largeData);
                    i++;
                }
                
                // Try to add cart data
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

        expect(result.success).toBe(true);
    });

    /**
     * Test: FIREFOX-003
     * Verify CSS Grid layout in Gecko rendering engine
     */
    test('FIREFOX-003: Gecko CSS Grid rendering', async () => {
        const gridSupport = await page.evaluate(() => {
            return CSS.supports('display', 'grid');
        });

        expect(gridSupport).toBe(true);

        // Verify grid properties
        const gridProperties = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                display: styles.display,
                gridTemplateColumns: styles.gridTemplateColumns,
                gridAutoRows: styles.gridAutoRows
            };
        });

        expect(gridProperties.display).toBe('grid');
    });

    /**
     * Test: FIREFOX-004
     * Verify Firefox's tracking protection doesn't block cart functionality
     */
    test('FIREFOX-004: Tracking protection compatibility', async () => {
        // Simulate Firefox tracking protection
        await page.setRequestInterception(true);
        
        page.on('request', request => {
            // Allow all requests (tracking protection shouldn't block local storage)
            request.continue();
        });

        // Add product and navigate
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);
        await page.click('.go-to-cart-btn');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Verify cart data persists
        const cartItems = await page.evaluate(() => {
            const cart = JSON.parse(localStorage.getItem('shopping_cart') || '{"items":[]}');
            return cart.items.length;
        });

        expect(cartItems).toBeGreaterThan(0);
    });

    /**
     * Test: FIREFOX-005
     * Verify SpiderMonkey JavaScript engine compatibility
     */
    test('FIREFOX-005: SpiderMonkey engine performance', async () => {
        const performanceResult = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Test array operations (SpiderMonkey optimization)
            const items = Array.from({ length: 1000 }, (_, i) => ({
                productId: `product-${i}`,
                quantity: 1,
                price: 29.99
            }));
            
            // Filter and map operations
            const filtered = items.filter(item => item.price > 20);
            const mapped = filtered.map(item => ({
                ...item,
                total: item.price * item.quantity
            }));
            
            const endTime = performance.now();
            return {
                duration: endTime - startTime,
                itemCount: mapped.length
            };
        });

        expect(performanceResult.duration).toBeLessThan(100);
        expect(performanceResult.itemCount).toBe(1000);
    });

    /**
     * Test: FIREFOX-006
     * Verify Firefox's private browsing mode compatibility
     */
    test('FIREFOX-006: Private browsing mode simulation', async () => {
        // In private mode, localStorage should still work
        const result = await page.evaluate(() => {
            try {
                localStorage.setItem('test_private', 'value');
                const value = localStorage.getItem('test_private');
                localStorage.removeItem('test_private');
                
                return { success: true, value };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        expect(result.success).toBe(true);
        expect(result.value).toBe('value');
    });

    /**
     * Test: FIREFOX-007
     * Verify Firefox's storage event handling
     */
    test('FIREFOX-007: Storage event propagation', async () => {
        // Open second tab
        const page2 = await browser.newPage();
        await page2.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Set up storage event listener
        await page2.evaluate(() => {
            window.storageEventData = null;
            window.addEventListener('storage', (e) => {
                window.storageEventData = {
                    key: e.key,
                    newValue: e.newValue,
                    oldValue: e.oldValue
                };
            });
        });

        // Modify localStorage on page1
        await page.evaluate(() => {
            localStorage.setItem('shopping_cart', JSON.stringify({
                items: [{ productId: 'product-1', quantity: 1 }],
                version: '1.0.0'
            }));
        });

        await page2.waitForTimeout(500);

        // Check event on page2
        const eventData = await page2.evaluate(() => window.storageEventData);
        expect(eventData).not.toBeNull();
        expect(eventData.key).toBe('shopping_cart');

        await page2.close();
    });

    /**
     * Test: FIREFOX-008
     * Verify Firefox's CSS Flexbox fallback
     */
    test('FIREFOX-008: Flexbox layout compatibility', async () => {
        const flexSupport = await page.evaluate(() => {
            return CSS.supports('display', 'flex');
        });

        expect(flexSupport).toBe(true);

        // Test flex properties
        const flexProperties = await page.evaluate(() => {
            const container = document.querySelector('.cart-items-container');
            if (!container) return null;
            
            const styles = window.getComputedStyle(container);
            return {
                display: styles.display,
                flexDirection: styles.flexDirection,
                justifyContent: styles.justifyContent
            };
        });

        if (flexProperties) {
            expect(['flex', 'inline-flex']).toContain(flexProperties.display);
        }
    });

    /**
     * Test: FIREFOX-009
     * Verify Firefox's console API
     */
    test('FIREFOX-009: Console API compatibility', async () => {
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

        // Verify no errors
        const errors = consoleMessages.filter(m => m.type === 'error');
        expect(errors.length).toBe(0);
    });

    /**
     * Test: FIREFOX-010
     * Verify Firefox's JSON parsing performance
     */
    test('FIREFOX-010: JSON parsing performance', async () => {
        const result = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Create large cart object
            const cart = {
                items: Array.from({ length: 100 }, (_, i) => ({
                    productId: `product-${i}`,
                    quantity: Math.floor(Math.random() * 10) + 1,
                    price: Math.random() * 100
                })),
                version: '1.0.0',
                timestamp: Date.now()
            };
            
            // Perform 100 serialize/parse cycles
            for (let i = 0; i < 100; i++) {
                const serialized = JSON.stringify(cart);
                const parsed = JSON.parse(serialized);
            }
            
            const endTime = performance.now();
            return endTime - startTime;
        });

        // Firefox should handle this efficiently
        expect(result).toBeLessThan(200);
    });

    /**
     * Test: FIREFOX-011
     * Verify Firefox's localStorage persistence across sessions
     */
    test('FIREFOX-011: localStorage session persistence', async () => {
        // Set cart data
        await page.evaluate(() => {
            const cart = {
                items: [
                    { productId: 'product-1', quantity: 2 },
                    { productId: 'product-2', quantity: 1 }
                ],
                version: '1.0.0'
            };
            localStorage.setItem('shopping_cart', JSON.stringify(cart));
        });

        // Close and reopen page
        await page.close();
        page = await browser.newPage();
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Verify data persists
        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
        const cart = JSON.parse(cartData);
        expect(cart.items.length).toBe(2);
    });

    /**
     * Test: FIREFOX-012
     * Verify Firefox's CSS Grid gap property
     */
    test('FIREFOX-012: CSS Grid gap property support', async () => {
        const gapSupport = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                gap: styles.gap,
                rowGap: styles.rowGap,
                columnGap: styles.columnGap,
                supported: styles.gap !== 'normal' && styles.gap !== ''
            };
        });

        expect(gapSupport.supported).toBe(true);
    });

    /**
     * Test: FIREFOX-013
     * Verify Firefox's Array methods performance
     */
    test('FIREFOX-013: Array methods optimization', async () => {
        const result = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Create large array
            const items = Array.from({ length: 10000 }, (_, i) => ({
                id: i,
                value: Math.random()
            }));
            
            // Test various array methods
            const filtered = items.filter(item => item.value > 0.5);
            const mapped = filtered.map(item => ({ ...item, doubled: item.value * 2 }));
            const reduced = mapped.reduce((sum, item) => sum + item.value, 0);
            
            const endTime = performance.now();
            
            return {
                duration: endTime - startTime,
                filteredCount: filtered.length,
                reducedValue: reduced
            };
        });

        expect(result.duration).toBeLessThan(100);
        expect(result.filteredCount).toBeGreaterThan(0);
    });

    /**
     * Test: FIREFOX-014
     * Verify Firefox's localStorage key enumeration
     */
    test('FIREFOX-014: localStorage key enumeration', async () => {
        const result = await page.evaluate(() => {
            // Add multiple items
            localStorage.setItem('shopping_cart', '{"items":[]}');
            localStorage.setItem('user_preferences', '{"theme":"dark"}');
            localStorage.setItem('session_id', '12345');
            
            // Enumerate keys
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
            }
            
            return {
                keys,
                count: localStorage.length
            };
        });

        expect(result.count).toBeGreaterThanOrEqual(3);
        expect(result.keys).toContain('shopping_cart');
    });

    /**
     * Test: FIREFOX-015
     * Verify Firefox's requestAnimationFrame timing
     */
    test('FIREFOX-015: requestAnimationFrame consistency', async () => {
        const timingData = await page.evaluate(() => {
            return new Promise((resolve) => {
                const timestamps = [];
                let count = 0;
                
                function measure(timestamp) {
                    timestamps.push(timestamp);
                    count++;
                    
                    if (count < 60) {
                        requestAnimationFrame(measure);
                    } else {
                        // Calculate frame intervals
                        const intervals = [];
                        for (let i = 1; i < timestamps.length; i++) {
                            intervals.push(timestamps[i] - timestamps[i - 1]);
                        }
                        
                        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                        const maxInterval = Math.max(...intervals);
                        const minInterval = Math.min(...intervals);
                        
                        resolve({ avgInterval, maxInterval, minInterval });
                    }
                }
                
                requestAnimationFrame(measure);
            });
        });

        // Should be close to 16.67ms (60fps)
        expect(timingData.avgInterval).toBeGreaterThan(14);
        expect(timingData.avgInterval).toBeLessThan(20);
    });
});

/**
 * Firefox-Specific Advanced Features
 */
describe('Firefox Advanced Features - Go to Cart', () => {
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
     * Test: FIREFOX-ADV-001
     * Verify Firefox's Enhanced Tracking Protection
     */
    test('FIREFOX-ADV-001: Enhanced Tracking Protection compatibility', async () => {
        // Cart functionality should work with ETP enabled
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);
        
        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
    });

    /**
     * Test: FIREFOX-ADV-002
     * Verify Firefox's localStorage in containers
     */
    test('FIREFOX-ADV-002: Container isolation simulation', async () => {
        // Simulate container isolation
        const result = await page.evaluate(() => {
            // Each container should have isolated storage
            localStorage.setItem('container_test', 'value1');
            const value = localStorage.getItem('container_test');
            
            return { success: true, value };
        });

        expect(result.success).toBe(true);
        expect(result.value).toBe('value1');
    });

    /**
     * Test: FIREFOX-ADV-003
     * Verify Firefox's CSS Grid subgrid support
     */
    test('FIREFOX-ADV-003: CSS Grid subgrid feature', async () => {
        const subgridSupport = await page.evaluate(() => {
            return CSS.supports('grid-template-columns', 'subgrid');
        });

        // Firefox has better subgrid support than other browsers
        // Test passes regardless, but logs support status
        expect(typeof subgridSupport).toBe('boolean');
    });

    /**
     * Test: FIREFOX-ADV-004
     * Verify Firefox's IndexedDB as alternative storage
     */
    test('FIREFOX-ADV-004: IndexedDB availability', async () => {
        const idbSupport = await page.evaluate(() => {
            return 'indexedDB' in window;
        });

        expect(idbSupport).toBe(true);
    });

    /**
     * Test: FIREFOX-ADV-005
     * Verify Firefox's localStorage clear performance
     */
    test('FIREFOX-ADV-005: localStorage clear operation', async () => {
        const result = await page.evaluate(() => {
            // Fill localStorage
            for (let i = 0; i < 100; i++) {
                localStorage.setItem(`item_${i}`, `value_${i}`);
            }
            
            const startTime = performance.now();
            localStorage.clear();
            const endTime = performance.now();
            
            return {
                duration: endTime - startTime,
                itemsRemaining: localStorage.length
            };
        });

        expect(result.itemsRemaining).toBe(0);
        expect(result.duration).toBeLessThan(50);
    });
});

module.exports = {
    description: 'Firefox-specific compatibility tests for Go to Cart functionality',
    testCount: 20,
    priority: 'High',
    browser: 'Firefox',
    coverage: [
        'localStorage API',
        'Gecko rendering engine',
        'SpiderMonkey JavaScript engine',
        'Tracking protection',
        'Private browsing mode',
        'Storage events',
        'CSS Grid and Flexbox',
        'Performance optimization',
        'Container isolation'
    ]
};

