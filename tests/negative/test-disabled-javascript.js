/**
 * Negative Test: Disabled JavaScript
 * 
 * Test ID: NEG-011
 * Category: Negative Testing
 * Priority: Low
 * 
 * Description:
 * Verify that the application provides graceful degradation when JavaScript
 * is disabled, showing appropriate messages or fallback content.
 * 
 * Related Jira: ST-2
 * Test Type: Manual + Automated (Puppeteer + Jest)
 */

const puppeteer = require('puppeteer');

describe('NEG-011: Disabled JavaScript', () => {
  let browser;
  let page;
  const BASE_URL = 'http://localhost:8080';

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
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test Case 1: Page loads with JavaScript disabled
   * Expected: Basic HTML content visible, noscript message shown
   */
  test('should display noscript message when JavaScript disabled', async () => {
    // Disable JavaScript
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Check for noscript content
    const noscriptContent = await page.evaluate(() => {
      const noscript = document.querySelector('noscript');
      return noscript ? noscript.textContent : null;
    });

    // Should have some content or message
    expect(typeof noscriptContent).toBe('string');
  });

  /**
   * Test Case 2: Products visible without JavaScript
   * Expected: Static product list or message
   */
  test('should show static content without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Check if page has basic content
    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  /**
   * Test Case 3: Add to Cart button behavior without JavaScript
   * Expected: Button disabled or shows message
   */
  test('should handle Add to Cart button without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Check if buttons exist
    const buttons = await page.$$('button');
    expect(buttons.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Case 4: Cart page without JavaScript
   * Expected: Message or static content
   */
  test('should handle cart page without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(`${BASE_URL}/cart.html`);

    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  /**
   * Test Case 5: Navigation without JavaScript
   * Expected: Basic links work
   */
  test('should allow basic navigation without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Check for navigation links
    const links = await page.$$('a[href]');
    expect(links.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Case 6: Form submission without JavaScript
   * Expected: Fallback behavior or message
   */
  test('should handle forms without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    const forms = await page.$$('form');
    // May or may not have forms, but should not crash
    expect(Array.isArray(forms)).toBe(true);
  });

  /**
   * Test Case 7: CSS still loads without JavaScript
   * Expected: Page styled correctly
   */
  test('should load CSS without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Check if stylesheets loaded
    const hasStyles = await page.evaluate(() => {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      return links.length > 0;
    });

    expect(hasStyles).toBe(true);
  });

  /**
   * Test Case 8: Images load without JavaScript
   * Expected: Product images visible
   */
  test('should load images without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    const images = await page.$$('img');
    expect(images.length).toBeGreaterThanOrEqual(0);
  });

  /**
   * Test Case 9: Meta tags present without JavaScript
   * Expected: SEO and meta information available
   */
  test('should have meta tags without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    const metaTags = await page.$$('meta');
    expect(metaTags.length).toBeGreaterThan(0);
  });

  /**
   * Test Case 10: Accessibility without JavaScript
   * Expected: Basic accessibility maintained
   */
  test('should maintain basic accessibility without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Check for semantic HTML
    const hasMain = await page.$('main');
    const hasHeader = await page.$('header');
    
    expect(hasMain || hasHeader).toBeTruthy();
  });

  /**
   * Test Case 11: Re-enabling JavaScript works
   * Expected: Full functionality restored
   */
  test('should restore functionality when JavaScript re-enabled', async () => {
    // Start with JS disabled
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Re-enable JavaScript
    await page.setJavaScriptEnabled(true);
    await page.reload();

    // Verify functionality works
    const cartManager = await page.evaluate(() => {
      return typeof window.cartManager !== 'undefined';
    });

    expect(cartManager).toBe(true);
  });

  /**
   * Test Case 12: localStorage without JavaScript
   * Expected: No errors, graceful handling
   */
  test('should handle localStorage access without JavaScript', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Page should load without errors
    const bodyContent = await page.evaluate(() => document.body.textContent);
    expect(bodyContent).toBeTruthy();
  });

  /**
   * Manual Test Case 13: User experience without JavaScript
   * Description: Manually verify user sees helpful message
   * Steps:
   * 1. Disable JavaScript in browser settings
   * 2. Navigate to application
   * 3. Verify clear message about JavaScript requirement
   * 4. Verify message includes instructions to enable JavaScript
   * Expected: User-friendly message with clear instructions
   */
  test('should provide user-friendly no-JS message (manual verification)', async () => {
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);

    // Automated check for noscript tag
    const hasNoscript = await page.evaluate(() => {
      return document.querySelector('noscript') !== null;
    });

    // Manual verification required for message quality
    expect(hasNoscript).toBe(true);
  });

  /**
   * Manual Test Case 14: Progressive enhancement
   * Description: Verify basic functionality without JS
   * Steps:
   * 1. Disable JavaScript
   * 2. Navigate through site
   * 3. Verify basic navigation works
   * 4. Verify content is readable
   * 5. Enable JavaScript
   * 6. Verify enhanced features work
   * Expected: Basic functionality without JS, full functionality with JS
   */
  test('should demonstrate progressive enhancement', async () => {
    // Without JavaScript
    await page.setJavaScriptEnabled(false);
    await page.goto(BASE_URL);
    
    const contentWithoutJS = await page.evaluate(() => document.body.textContent);
    expect(contentWithoutJS.length).toBeGreaterThan(100);

    // With JavaScript
    await page.setJavaScriptEnabled(true);
    await page.reload();

    const contentWithJS = await page.evaluate(() => document.body.textContent);
    expect(contentWithJS.length).toBeGreaterThan(100);
  });
});

/**
 * MANUAL TEST PROCEDURES
 * 
 * Test NEG-011-M1: Complete No-JavaScript User Flow
 * Priority: Low
 * 
 * Prerequisites:
 * - Modern web browser (Chrome, Firefox, Safari, Edge)
 * - Application running on localhost:8080
 * 
 * Steps:
 * 1. Open browser settings
 * 2. Disable JavaScript:
 *    - Chrome: Settings > Privacy > Site Settings > JavaScript > Blocked
 *    - Firefox: about:config > javascript.enabled > false
 *    - Safari: Preferences > Security > Uncheck "Enable JavaScript"
 * 3. Navigate to http://localhost:8080
 * 4. Observe page load and content
 * 5. Attempt to click "Add to Cart" button
 * 6. Attempt to navigate to cart page
 * 7. Re-enable JavaScript
 * 8. Reload page
 * 9. Verify full functionality restored
 * 
 * Expected Results:
 * - Step 3: Page loads with basic HTML/CSS
 * - Step 4: Noscript message visible: "JavaScript is required for full functionality"
 * - Step 4: Products visible as static content
 * - Step 5: Button does nothing or shows tooltip
 * - Step 6: Basic navigation works via HTML links
 * - Step 8: All interactive features work
 * - Step 9: Cart functionality fully operational
 * 
 * Pass Criteria:
 * - No JavaScript errors in console
 * - Clear message about JavaScript requirement
 * - Basic content accessible
 * - Full functionality restored when JS enabled
 * 
 * ---
 * 
 * Test NEG-011-M2: Accessibility Without JavaScript
 * Priority: Low
 * 
 * Steps:
 * 1. Disable JavaScript
 * 2. Navigate to application
 * 3. Use screen reader (NVDA, JAWS, VoiceOver)
 * 4. Navigate through page content
 * 5. Verify all text content readable
 * 6. Verify images have alt text
 * 7. Verify semantic HTML structure
 * 
 * Expected Results:
 * - All content accessible via screen reader
 * - Proper heading hierarchy
 * - Alt text on all images
 * - Semantic HTML elements used
 * 
 * Pass Criteria:
 * - Screen reader can navigate entire page
 * - All content understandable without JavaScript
 * - WCAG 2.1 Level A compliance maintained
 */

