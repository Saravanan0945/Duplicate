/**
 * Mobile Device Compatibility Tests for "Go to Cart" Functionality
 * 
 * Test ID Prefix: MOBILE-
 * Devices: iOS, Android, Tablets
 * Focus Areas:
 * - Touch events and gestures
 * - Viewport and responsive design
 * - Mobile browser quirks
 * - Performance on mobile devices
 * - Orientation changes
 * 
 * Related Jira: ST-2
 * Priority: High
 * Test Type: Mobile Compatibility Testing
 */

const puppeteer = require('puppeteer');
const { testConfig } = require('../test-config');
const { 
    setupTestEnvironment, 
    cleanupTestEnvironment,
    waitForElement,
    measurePerformance
} = require('../test-utils');

// Mobile device configurations
const DEVICES = {
    iPhoneSE: {
        name: 'iPhone SE',
        viewport: { width: 375, height: 667, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    },
    iPhone12: {
        name: 'iPhone 12',
        viewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
    },
    iPadAir: {
        name: 'iPad Air',
        viewport: { width: 820, height: 1180, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    },
    galaxyS21: {
        name: 'Samsung Galaxy S21',
        viewport: { width: 360, height: 800, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36'
    },
    pixelXL: {
        name: 'Google Pixel XL',
        viewport: { width: 411, height: 731, isMobile: true, hasTouch: true },
        userAgent: 'Mozilla/5.0 (Linux; Android 10; Pixel XL) AppleWebKit/537.36'
    }
};

describe('Mobile Device Compatibility Tests - Go to Cart Functionality', () => {
    let browser;
    let page;
    const baseUrl = testConfig.baseUrl;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: testConfig.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    /**
     * Test: MOBILE-001
     * Verify touch events work on mobile devices
     */
    test('MOBILE-001: Touch event handling on mobile', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.setUserAgent(DEVICES.iPhone12.userAgent);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Simulate touch tap
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
        await page.close();
    });

    /**
     * Test: MOBILE-002
     * Verify responsive layout on different mobile screen sizes
     */
    test('MOBILE-002: Responsive layout across devices', async () => {
        const results = [];

        for (const [key, device] of Object.entries(DEVICES)) {
            page = await browser.newPage();
            await page.setViewport(device.viewport);
            await page.setUserAgent(device.userAgent);
            await page.goto(baseUrl, { waitUntil: 'networkidle0' });

            const layoutInfo = await page.evaluate(() => {
                const grid = document.querySelector('.product-grid');
                const styles = window.getComputedStyle(grid);
                
                return {
                    display: styles.display,
                    gridTemplateColumns: styles.gridTemplateColumns,
                    width: grid.offsetWidth
                };
            });

            results.push({
                device: device.name,
                layout: layoutInfo
            });

            await page.close();
        }

        // Verify all devices have proper grid layout
        results.forEach(result => {
            expect(result.layout.display).toBe('grid');
            expect(result.layout.width).toBeGreaterThan(0);
        });
    });

    /**
     * Test: MOBILE-003
     * Verify viewport meta tag for mobile optimization
     */
    test('MOBILE-003: Viewport meta tag configuration', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const viewportInfo = await page.evaluate(() => {
            const viewport = document.querySelector('meta[name="viewport"]');
            return {
                exists: !!viewport,
                content: viewport ? viewport.getAttribute('content') : null
            };
        });

        expect(viewportInfo.exists).toBe(true);
        expect(viewportInfo.content).toContain('width=device-width');
        expect(viewportInfo.content).toContain('initial-scale=1');

        await page.close();
    });

    /**
     * Test: MOBILE-004
     * Verify touch target sizes meet accessibility standards (44x44px minimum)
     */
    test('MOBILE-004: Touch target size accessibility', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const buttonSizes = await page.evaluate(() => {
            const buttons = document.querySelectorAll('.add-to-cart-btn, .go-to-cart-btn');
            return Array.from(buttons).map(btn => {
                const rect = btn.getBoundingClientRect();
                return {
                    width: rect.width,
                    height: rect.height,
                    meetsStandard: rect.width >= 44 && rect.height >= 44
                };
            });
        });

        // All buttons should meet 44x44px minimum
        buttonSizes.forEach(size => {
            expect(size.meetsStandard).toBe(true);
        });

        await page.close();
    });

    /**
     * Test: MOBILE-005
     * Verify swipe gestures don't interfere with cart functionality
     */
    test('MOBILE-005: Swipe gesture handling', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Add item to cart
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);

        // Simulate swipe (scroll)
        await page.evaluate(() => {
            window.scrollTo(0, 500);
        });

        await page.waitForTimeout(300);

        // Verify cart data persists
        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();
        await page.close();
    });

    /**
     * Test: MOBILE-006
     * Verify orientation change handling (portrait to landscape)
     */
    test('MOBILE-006: Orientation change handling', async () => {
        page = await browser.newPage();
        
        // Start in portrait
        await page.setViewport({
            width: 375,
            height: 667,
            isMobile: true,
            hasTouch: true
        });
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Add item in portrait mode
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);

        // Switch to landscape
        await page.setViewport({
            width: 667,
            height: 375,
            isMobile: true,
            hasTouch: true
        });
        await page.waitForTimeout(500);

        // Verify cart data persists
        const cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });

        expect(cartData).not.toBeNull();

        // Verify layout adapts
        const layoutInfo = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            return {
                display: styles.display,
                columns: styles.gridTemplateColumns
            };
        });

        expect(layoutInfo.display).toBe('grid');
        await page.close();
    });

    /**
     * Test: MOBILE-007
     * Verify mobile performance (page load time)
     */
    test('MOBILE-007: Mobile page load performance', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);

        const startTime = Date.now();
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
        const loadTime = Date.now() - startTime;

        // Mobile load time should be under 3 seconds
        expect(loadTime).toBeLessThan(3000);

        await page.close();
    });

    /**
     * Test: MOBILE-008
     * Verify mobile cart badge visibility
     */
    test('MOBILE-008: Cart badge visibility on mobile', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Add item
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(500);

        // Check badge visibility
        const badgeInfo = await page.evaluate(() => {
            const badge = document.querySelector('.cart-badge');
            if (!badge) return { visible: false };

            const rect = badge.getBoundingClientRect();
            const styles = window.getComputedStyle(badge);

            return {
                visible: styles.display !== 'none' && styles.visibility !== 'hidden',
                width: rect.width,
                height: rect.height,
                text: badge.textContent
            };
        });

        expect(badgeInfo.visible).toBe(true);
        expect(parseInt(badgeInfo.text)).toBeGreaterThan(0);

        await page.close();
    });

    /**
     * Test: MOBILE-009
     * Verify mobile navigation to cart page
     */
    test('MOBILE-009: Mobile navigation to cart page', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Add item
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);

        // Navigate to cart
        await page.tap('.go-to-cart-btn');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Verify on cart page
        const currentUrl = page.url();
        expect(currentUrl).toContain('cart.html');

        await page.close();
    });

    /**
     * Test: MOBILE-010
     * Verify mobile scroll performance
     */
    test('MOBILE-010: Mobile scroll performance', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const scrollPerformance = await page.evaluate(() => {
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
                
                // Start scrolling
                window.scrollTo(0, 100);
                requestAnimationFrame(countFrames);
            });
        });

        // Should maintain reasonable frame rate
        expect(scrollPerformance).toBeGreaterThan(30);

        await page.close();
    });

    /**
     * Test: MOBILE-011
     * Verify mobile localStorage functionality
     */
    test('MOBILE-011: Mobile localStorage operations', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.galaxyS21.viewport);
        await page.setUserAgent(DEVICES.galaxyS21.userAgent);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const storageTest = await page.evaluate(() => {
            try {
                // Test write
                localStorage.setItem('mobile_test', 'test_value');
                
                // Test read
                const value = localStorage.getItem('mobile_test');
                
                // Test delete
                localStorage.removeItem('mobile_test');
                
                return { success: true, value };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        expect(storageTest.success).toBe(true);
        expect(storageTest.value).toBe('test_value');

        await page.close();
    });

    /**
     * Test: MOBILE-012
     * Verify mobile font sizes are readable
     */
    test('MOBILE-012: Mobile font size accessibility', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const fontSizes = await page.evaluate(() => {
            const elements = {
                productName: document.querySelector('.product-name'),
                productPrice: document.querySelector('.product-price'),
                button: document.querySelector('.add-to-cart-btn')
            };

            const sizes = {};
            for (const [key, element] of Object.entries(elements)) {
                if (element) {
                    const styles = window.getComputedStyle(element);
                    sizes[key] = parseFloat(styles.fontSize);
                }
            }

            return sizes;
        });

        // Minimum font sizes for mobile readability
        Object.values(fontSizes).forEach(size => {
            expect(size).toBeGreaterThanOrEqual(14); // Minimum 14px
        });

        await page.close();
    });

    /**
     * Test: MOBILE-013
     * Verify mobile tap delay is minimal
     */
    test('MOBILE-013: Mobile tap response time', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const tapDelay = await page.evaluate(() => {
            return new Promise((resolve) => {
                const button = document.querySelector('.add-to-cart-btn');
                const startTime = performance.now();
                
                button.addEventListener('click', () => {
                    const endTime = performance.now();
                    resolve(endTime - startTime);
                }, { once: true });
                
                button.click();
            });
        });

        // Tap delay should be minimal (< 100ms)
        expect(tapDelay).toBeLessThan(100);

        await page.close();
    });

    /**
     * Test: MOBILE-014
     * Verify mobile network conditions (3G simulation)
     */
    test('MOBILE-014: Mobile network performance (3G)', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);

        // Simulate 3G network
        const client = await page.target().createCDPSession();
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: 750 * 1024 / 8, // 750kb/s
            uploadThroughput: 250 * 1024 / 8,   // 250kb/s
            latency: 100
        });

        const startTime = Date.now();
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });
        const loadTime = Date.now() - startTime;

        // Should load within reasonable time on 3G
        expect(loadTime).toBeLessThan(5000);

        await page.close();
    });

    /**
     * Test: MOBILE-015
     * Verify mobile pinch-to-zoom doesn't break layout
     */
    test('MOBILE-015: Pinch-to-zoom handling', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPhone12.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Simulate zoom
        await page.evaluate(() => {
            document.body.style.zoom = '1.5';
        });

        await page.waitForTimeout(300);

        // Verify layout still works
        const layoutInfo = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            return {
                visible: grid.offsetWidth > 0 && grid.offsetHeight > 0,
                overflow: window.getComputedStyle(grid).overflow
            };
        });

        expect(layoutInfo.visible).toBe(true);

        // Reset zoom
        await page.evaluate(() => {
            document.body.style.zoom = '1';
        });

        await page.close();
    });
});

/**
 * Tablet-Specific Tests
 */
describe('Tablet Device Compatibility - Go to Cart', () => {
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

    /**
     * Test: TABLET-001
     * Verify tablet layout (2-column grid)
     */
    test('TABLET-001: Tablet responsive layout', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPadAir.viewport);
        await page.setUserAgent(DEVICES.iPadAir.userAgent);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const gridInfo = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            const styles = window.getComputedStyle(grid);
            
            return {
                display: styles.display,
                gridTemplateColumns: styles.gridTemplateColumns,
                width: grid.offsetWidth
            };
        });

        expect(gridInfo.display).toBe('grid');
        expect(gridInfo.width).toBeGreaterThan(700);

        await page.close();
    });

    /**
     * Test: TABLET-002
     * Verify tablet touch and mouse events both work
     */
    test('TABLET-002: Hybrid touch/mouse input', async () => {
        page = await browser.newPage();
        await page.setViewport(DEVICES.iPadAir.viewport);
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        // Test touch
        await page.tap('.product-card:first-child .add-to-cart-btn');
        await page.waitForTimeout(300);

        let cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });
        expect(cartData).not.toBeNull();

        // Clear cart
        await page.evaluate(() => localStorage.clear());

        // Test mouse click
        await page.click('.product-card:nth-child(2) .add-to-cart-btn');
        await page.waitForTimeout(300);

        cartData = await page.evaluate(() => {
            return localStorage.getItem('shopping_cart');
        });
        expect(cartData).not.toBeNull();

        await page.close();
    });

    /**
     * Test: TABLET-003
     * Verify tablet orientation change
     */
    test('TABLET-003: Tablet orientation change', async () => {
        page = await browser.newPage();
        
        // Portrait
        await page.setViewport({
            width: 820,
            height: 1180,
            isMobile: true,
            hasTouch: true
        });
        await page.goto(baseUrl, { waitUntil: 'networkidle0' });

        const portraitLayout = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            return window.getComputedStyle(grid).gridTemplateColumns;
        });

        // Landscape
        await page.setViewport({
            width: 1180,
            height: 820,
            isMobile: true,
            hasTouch: true
        });
        await page.waitForTimeout(500);

        const landscapeLayout = await page.evaluate(() => {
            const grid = document.querySelector('.product-grid');
            return window.getComputedStyle(grid).gridTemplateColumns;
        });

        // Layouts should be different
        expect(portraitLayout).not.toBe(landscapeLayout);

        await page.close();
    });
});

/**
 * Cross-Device Tests
 */
describe('Cross-Device Compatibility - Go to Cart', () => {
    let browser;
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

    /**
     * Test: CROSS-001
     * Verify cart data syncs across devices (same localStorage)
     */
    test('CROSS-001: Cart data consistency across devices', async () => {
        const results = [];

        // Test on multiple devices
        for (const [key, device] of Object.entries(DEVICES)) {
            const page = await browser.newPage();
            await page.setViewport(device.viewport);
            await page.setUserAgent(device.userAgent);
            await page.goto(baseUrl, { waitUntil: 'networkidle0' });

            // Add item
            await page.tap('.product-card:first-child .add-to-cart-btn');
            await page.waitForTimeout(300);

            // Get cart data
            const cartData = await page.evaluate(() => {
                return localStorage.getItem('shopping_cart');
            });

            results.push({
                device: device.name,
                hasData: cartData !== null,
                data: cartData
            });

            await page.close();
        }

        // All devices should have cart data
        results.forEach(result => {
            expect(result.hasData).toBe(true);
        });
    });

    /**
     * Test: CROSS-002
     * Verify "Go to Cart" button works on all devices
     */
    test('CROSS-002: Go to Cart button across all devices', async () => {
        for (const [key, device] of Object.entries(DEVICES)) {
            const page = await browser.newPage();
            await page.setViewport(device.viewport);
            await page.setUserAgent(device.userAgent);
            await page.goto(baseUrl, { waitUntil: 'networkidle0' });

            // Add item
            await page.tap('.product-card:first-child .add-to-cart-btn');
            await page.waitForTimeout(300);

            // Click Go to Cart
            await page.tap('.go-to-cart-btn');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });

            // Verify navigation
            const url = page.url();
            expect(url).toContain('cart.html');

            await page.close();
        }
    });
});

module.exports = {
    description: 'Mobile device compatibility tests for Go to Cart functionality',
    testCount: 20,
    priority: 'High',
    devices: Object.keys(DEVICES),
    coverage: [
        'Touch events and gestures',
        'Responsive design',
        'Viewport handling',
        'Touch target sizes',
        'Orientation changes',
        'Mobile performance',
        'Network conditions',
        'Tablet compatibility',
        'Cross-device consistency',
        'Mobile accessibility'
    ]
};

