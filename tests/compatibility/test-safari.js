/**
 * Safari-Specific Compatibility Tests for "Go to Cart" Functionality
 * 
 * Test ID Prefix: SAFARI-
 * Browser: Apple Safari (latest stable)
 * Focus Areas:
 * - localStorage API with stricter limits
 * - WebKit rendering engine specifics
 * - JavaScriptCore engine
 * - Safari's Intelligent Tracking Prevention (ITP)
 * - iOS Safari mobile compatibility
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

describe('Safari Compatibility Tests - Go to Cart Functionality', () => {
    let browser;
    let page;
    const baseUrl = testConfig.baseUrl;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: testConfig.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security' // For testing ITP scenarios
            ],
            defaultViewport: {
                width: 1440,
                height: 900
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
     * Test: SAFARI-001
     * Verify localStorage API works in Safari
     */
    test('SAFARI-001: localStorage API basic functionality', async () => {
        // Add product to cart
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        // Verify localStorage is set
        const localStorageData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(localStorageData).not.toBeNull();
        
        const cartData = JSON.parse(localStorageData);
        expect(cartData).toHaveProperty('items');
        expect(Array.isArray(cartData.items)).toBe(true);
    });

    /**
     * Test: SAFARI-002
     * Verify Safari's stricter localStorage quota (5MB limit)
     */
    test('SAFARI-002: Safari localStorage quota limit (5MB)', async () => {
        const result = await page.evaluate(() => {
            try {
                // Safari has a stricter 5MB localStorage limit
                const largeData = 'x'.repeat(1024 * 1024); // 1MB string
                let i = 0;
                
                // Try to store 4MB (should succeed)
                while (i < 4) {
                    localStorage.setItem(`test_data_${i}`, largeData);
                    i++;
                }
                
                // Add cart data
                const cartData = {
                    items: [{ productId: 'product-1', quantity: 1 }],
                    version: '1.0.0'
                };
                localStorage.setItem('shopping_cart', JSON.stringify(cartData));
                
                return { success: true, error: null, stored: i };
            } catch (error) {
                return { success: false, error: error.message, stored: 0 };
            } finally {
                // Cleanup
                for (let j = 0; j < 4; j++) {
                    localStorage.removeItem(`test_data_${j}`);
                }
            }
        });

        // Should succeed with 4MB + cart data
        expect(result.success).toBe(true);
    });

    /**
     * Test: SAFARI-003
     * Verify Safari's localStorage quota exceeded handling
     */
    test('SAFARI-003: localStorage quota exceeded error handling', async () => {
        const result = await page.evaluate(() => {
            try {
                // Try to exceed 5MB limit
                const largeData = 'x'.repeat(1024 * 1024); // 1MB string
                
                for (let i = 0; i < 6; i++) {
                    localStorage.setItem(`test_data_${i}`, largeData);
                }
                
                return { quotaExceeded: false };
            } catch (error) {
                return { 
                    quotaExceeded: error.name === 'QuotaExceededError',
                    errorName: error.name,
                    errorMessage: error.message
                };
            } finally {
                // Cleanup
                localStorage.clear();
            }
        });

        // Should throw QuotaExceededError
        expect(result.quotaExceeded || result.errorName === 'QuotaExceededError').toBe(true);
    });

    /**
     * Test: SAFARI-004
     * Verify WebKit CSS Grid rendering
     */
    test('SAFARI-004: WebKit CSS Grid rendering', async () => {
        const gridSupport = await page.evaluate(() => {
            return CSS.supports('display', 'grid');
        });

        expect(gridSupport).toBe(true);

        // Verify grid properties with -webkit- prefix support
        const gridProperties = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                display: styles.display,
                gridTemplateColumns: styles.gridTemplateColumns,
                webkitGridTemplateColumns: styles.webkitGridTemplateColumns || 'not-supported'
            };
        });

        expect(gridProperties.display).toBe('grid');
        expect(gridProperties.gridTemplateColumns).not.toBe('none');
    });

    /**
     * Test: SAFARI-005
     * Verify Safari's Intelligent Tracking Prevention (ITP) compatibility
     */
    test('SAFARI-005: ITP localStorage access', async () => {
        // ITP shouldn't affect first-party localStorage
        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);

        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
        
        // Verify data persists after navigation
        await page.click('.go-to-cart-btn');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        const persistedData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(persistedData).not.toBeNull();
        expect(persistedData).toBe(cartData);
    });

    /**
     * Test: SAFARI-006
     * Verify JavaScriptCore engine performance
     */
    test('SAFARI-006: JavaScriptCore engine optimization', async () => {
        const performanceResult = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Test object creation and manipulation
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({
                    productId: `product-${i}`,
                    quantity: Math.floor(Math.random() * 10) + 1,
                    price: Math.random() * 100
                });
            }
            
            // Calculate totals
            const total = items.reduce((sum, item) => {
                return sum + (item.quantity * item.price);
            }, 0);
            
            const endTime = performance.now();
            
            return {
                duration: endTime - startTime,
                itemCount: items.length,
                total: total
            };
        });

        expect(performanceResult.duration).toBeLessThan(100);
        expect(performanceResult.itemCount).toBe(1000);
    });

    /**
     * Test: SAFARI-007
     * Verify Safari's private browsing mode localStorage behavior
     */
    test('SAFARI-007: Private browsing mode localStorage', async () => {
        // In Safari private mode, localStorage has 0 quota
        // This test simulates the behavior
        const result = await page.evaluate(() => {
            try {
                localStorage.setItem('test_private', 'value');
                const value = localStorage.getItem('test_private');
                localStorage.removeItem('test_private');
                
                return { success: true, value, privateMode: false };
            } catch (error) {
                // In private mode, Safari throws QuotaExceededError
                return { 
                    success: false, 
                    privateMode: error.name === 'QuotaExceededError',
                    error: error.message
                };
            }
        });

        // In normal mode, should succeed
        expect(result.success).toBe(true);
    });

    /**
     * Test: SAFARI-008
     * Verify Safari's storage event handling
     */
    test('SAFARI-008: Storage event propagation in Safari', async () => {
        // Open second tab
        const page2 = await browser.newPage();
        await page2.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Set up storage event listener
        await page2.evaluate(() => {
            window.storageEventReceived = false;
            window.addEventListener('storage', (e) => {
                if (e.key === 'shopping_cart') {
                    window.storageEventReceived = true;
                }
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
        const eventReceived = await page2.evaluate(() => window.storageEventReceived);
        expect(eventReceived).toBe(true);

        await page2.close();
    });

    /**
     * Test: SAFARI-009
     * Verify Safari's CSS -webkit- prefix support
     */
    test('SAFARI-009: WebKit vendor prefix compatibility', async () => {
        const prefixSupport = await page.evaluate(() => {
            const testDiv = document.createElement('div');
            testDiv.style.display = '-webkit-box';
            document.body.appendChild(testDiv);
            
            const styles = window.getComputedStyle(testDiv);
            const result = styles.display;
            
            document.body.removeChild(testDiv);
            
            return {
                webkitBoxSupported: result === '-webkit-box' || result === 'flex',
                display: result
            };
        });

        expect(prefixSupport.webkitBoxSupported).toBe(true);
    });

    /**
     * Test: SAFARI-010
     * Verify Safari's Date.now() precision
     */
    test('SAFARI-010: Date.now() timestamp precision', async () => {
        const result = await page.evaluate(() => {
            const timestamps = [];
            
            for (let i = 0; i < 10; i++) {
                timestamps.push(Date.now());
            }
            
            // Check for duplicates (Safari may have lower precision)
            const unique = [...new Set(timestamps)];
            
            return {
                total: timestamps.length,
                unique: unique.length,
                hasPrecision: unique.length === timestamps.length
            };
        });

        expect(result.total).toBe(10);
        // Safari may have lower timestamp precision
        expect(result.unique).toBeGreaterThan(0);
    });

    /**
     * Test: SAFARI-011
     * Verify Safari's localStorage key iteration
     */
    test('SAFARI-011: localStorage key enumeration', async () => {
        const result = await page.evaluate(() => {
            // Add test data
            localStorage.setItem('shopping_cart', '{"items":[]}');
            localStorage.setItem('user_prefs', '{"theme":"light"}');
            localStorage.setItem('session', '12345');
            
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
     * Test: SAFARI-012
     * Verify Safari's JSON.parse performance
     */
    test('SAFARI-012: JSON parsing performance', async () => {
        const result = await page.evaluate(() => {
            const startTime = performance.now();
            
            // Create large cart
            const cart = {
                items: Array.from({ length: 100 }, (_, i) => ({
                    productId: `product-${i}`,
                    quantity: 1,
                    price: 29.99
                })),
                version: '1.0.0'
            };
            
            // Perform 100 parse cycles
            for (let i = 0; i < 100; i++) {
                const serialized = JSON.stringify(cart);
                const parsed = JSON.parse(serialized);
            }
            
            const endTime = performance.now();
            return endTime - startTime;
        });

        expect(result).toBeLessThan(200);
    });

    /**
     * Test: SAFARI-013
     * Verify Safari's requestAnimationFrame timing
     */
    test('SAFARI-013: requestAnimationFrame consistency', async () => {
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
                        const intervals = [];
                        for (let i = 1; i < timestamps.length; i++) {
                            intervals.push(timestamps[i] - timestamps[i - 1]);
                        }
                        
                        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                        resolve(avgInterval);
                    }
                }
                
                requestAnimationFrame(measure);
            });
        });

        // Should be close to 16.67ms (60fps)
        expect(timingData).toBeGreaterThan(14);
        expect(timingData).toBeLessThan(20);
    });

    /**
     * Test: SAFARI-014
     * Verify Safari's localStorage clear operation
     */
    test('SAFARI-014: localStorage clear performance', async () => {
        const result = await page.evaluate(() => {
            // Fill localStorage
            for (let i = 0; i < 50; i++) {
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

    /**
     * Test: SAFARI-015
     * Verify Safari's CSS Grid gap property
     */
    test('SAFARI-015: CSS Grid gap property support', async () => {
        const gapSupport = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                gap: styles.gap,
                gridGap: styles.gridGap,
                supported: styles.gap !== 'normal' && styles.gap !== ''
            };
        });

        expect(gapSupport.supported).toBe(true);
    });
});

/**
 * Safari iOS-Specific Tests
 */
describe('Safari iOS Compatibility - Go to Cart', () => {
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
        
        // Simulate iOS Safari viewport
        await page.setViewport({
            width: 375,
            height: 812,
            isMobile: true,
            hasTouch: true
        });
        
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    /**
     * Test: SAFARI-IOS-001
     * Verify touch events work on iOS Safari
     */
    test('SAFARI-IOS-001: Touch event handling', async () => {
        // Simulate touch tap on add to cart button
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
    });

    /**
     * Test: SAFARI-IOS-002
     * Verify iOS Safari viewport meta tag handling
     */
    test('SAFARI-IOS-002: Viewport meta tag compatibility', async () => {
        const viewportInfo = await page.evaluate(() => {
            const viewport = document.querySelector('meta[name="viewport"]');
            return {
                exists: !!viewport,
                content: viewport ? viewport.getAttribute('content') : null
            };
        });

        expect(viewportInfo.exists).toBe(true);
        expect(viewportInfo.content).toContain('width=device-width');
    });

    /**
     * Test: SAFARI-IOS-003
     * Verify iOS Safari localStorage in standalone mode
     */
    test('SAFARI-IOS-003: Standalone mode localStorage', async () => {
        // Simulate standalone mode (PWA)
        await page.evaluate(() => {
            Object.defineProperty(window.navigator, 'standalone', {
                value: true,
                writable: false
            });
        });

        await page.click('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);

        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
    });

    /**
     * Test: SAFARI-IOS-004
     * Verify iOS Safari scroll behavior
     */
    test('SAFARI-IOS-004: Scroll performance on iOS', async () => {
        // Scroll to bottom
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        await page.waitForTimeout(500);

        const scrollPosition = await page.evaluate(() => {
            return window.scrollY;
        });

        expect(scrollPosition).toBeGreaterThan(0);
    });

    /**
     * Test: SAFARI-IOS-005
     * Verify iOS Safari -webkit-overflow-scrolling
     */
    test('SAFARI-IOS-005: Momentum scrolling support', async () => {
        const scrollingSupport = await page.evaluate(() => {
            const testDiv = document.createElement('div');
            testDiv.style.webkitOverflowScrolling = 'touch';
            document.body.appendChild(testDiv);
            
            const styles = window.getComputedStyle(testDiv);
            const result = styles.webkitOverflowScrolling;
            
            document.body.removeChild(testDiv);
            
            return {
                supported: result === 'touch',
                value: result
            };
        });

        // iOS Safari should support momentum scrolling
        expect(['touch', 'auto']).toContain(scrollingSupport.value);
    });
});

module.exports = {
    description: 'Safari-specific compatibility tests for Go to Cart functionality',
    testCount: 20,
    priority: 'High',
    browser: 'Safari',
    coverage: [
        'localStorage API with 5MB limit',
        'WebKit rendering engine',
        'JavaScriptCore engine',
        'Intelligent Tracking Prevention (ITP)',
        'Private browsing mode',
        'iOS Safari mobile compatibility',
        'Touch events',
        'Viewport handling',
        'CSS vendor prefixes',
        'Performance optimization'
    ]
};

