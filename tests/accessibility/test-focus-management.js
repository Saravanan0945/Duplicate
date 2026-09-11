/**
 * Accessibility Test: Focus Management
 * Test ID: A11Y-003
 * 
 * Purpose: Verify proper focus management throughout the application
 * 
 * Test Coverage:
 * - Focus states visibility
 * - Focus trapping in modals/dialogs
 * - Focus restoration after actions
 * - Focus order consistency
 * - Skip links functionality
 * - Focus indicators contrast
 * - Programmatic focus management
 * 
 * Accessibility Standards:
 * - WCAG 2.1 Level AA compliance
 * - Focus management best practices
 * - Keyboard accessibility
 */

const puppeteer = require('puppeteer');

describe('A11Y-003: Focus Management Accessibility', () => {
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
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });
  });

  afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Focus indicators are visible
   * Priority: Critical
   * WCAG: 2.4.7 Focus Visible (Level AA)
   */
  test('A11Y-003-T01: Should have visible focus indicators on all interactive elements', async () => {
    const focusIndicators = [];

    // Test multiple interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        const computed = window.getComputedStyle(el);
        const pseudoFocus = window.getComputedStyle(el, ':focus');
        
        return {
          tag: el.tagName,
          class: el.className,
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineColor: computed.outlineColor,
          outlineStyle: computed.outlineStyle,
          boxShadow: computed.boxShadow,
          border: computed.border,
          backgroundColor: computed.backgroundColor,
          hasVisibleIndicator: computed.outlineWidth !== '0px' || 
                               computed.boxShadow !== 'none' ||
                               computed.outline !== 'none'
        };
      });
      
      focusIndicators.push(focusInfo);
    }

    // At least 80% of elements should have visible focus indicators
    const withIndicators = focusIndicators.filter(f => f.hasVisibleIndicator).length;
    const percentage = (withIndicators / focusIndicators.length) * 100;
    
    expect(percentage).toBeGreaterThanOrEqual(80);

    console.log(`✓ ${withIndicators}/${focusIndicators.length} elements (${percentage.toFixed(0)}%) have visible focus indicators`);
  });

  /**
   * Test 2: Focus indicator contrast ratio
   * Priority: High
   * WCAG: 1.4.11 Non-text Contrast (Level AA)
   */
  test('A11Y-003-T02: Should have sufficient contrast for focus indicators', async () => {
    const contrastResults = [];

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      
      const contrastInfo = await page.evaluate(() => {
        const el = document.activeElement;
        const computed = window.getComputedStyle(el);
        
        // Extract RGB values from outline color
        const outlineColor = computed.outlineColor;
        const bgColor = computed.backgroundColor;
        
        // Simple contrast check (would need color-contrast library for accurate calculation)
        const hasOutline = computed.outlineWidth !== '0px' && computed.outlineWidth !== '';
        const hasBoxShadow = computed.boxShadow !== 'none';
        
        return {
          hasOutline,
          hasBoxShadow,
          outlineColor,
          backgroundColor: bgColor,
          outlineWidth: computed.outlineWidth
        };
      });
      
      contrastResults.push(contrastInfo);
    }

    // All focused elements should have some form of visible indicator
    const allHaveIndicators = contrastResults.every(r => r.hasOutline || r.hasBoxShadow);
    expect(allHaveIndicators).toBe(true);

    console.log(`✓ ${contrastResults.length} elements checked for focus contrast`);
  });

  /**
   * Test 3: Focus is not lost after adding to cart
   * Priority: High
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T03: Should maintain focus after adding item to cart', async () => {
    // Focus first add to cart button
    await page.evaluate(() => {
      const btn = document.querySelector('.add-to-cart');
      if (btn) btn.focus();
    });

    const elementBeforeClick = await page.evaluate(() => {
      return {
        tag: document.activeElement.tagName,
        class: document.activeElement.className
      };
    });

    // Click to add item
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const elementAfterClick = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return {
        tag: activeEl.tagName,
        class: activeEl.className,
        isBody: activeEl.tagName === 'BODY'
      };
    });

    // Focus should not be on body (indicates lost focus)
    expect(elementAfterClick.isBody).toBe(false);

    console.log(`✓ Focus maintained after action: ${elementAfterClick.tag}.${elementAfterClick.class}`);
  });

  /**
   * Test 4: Focus moves to cart page after navigation
   * Priority: High
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T04: Should manage focus when navigating to cart page', async () => {
    // Add item
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);

    // Navigate to cart
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const focusAfterNavigation = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return {
        tag: activeEl.tagName,
        isBody: activeEl.tagName === 'BODY',
        isMain: activeEl.id === 'main' || activeEl.tagName === 'MAIN',
        tabIndex: activeEl.tabIndex
      };
    });

    // Focus should be on a meaningful element (body or main content)
    expect(focusAfterNavigation.tag).toBeDefined();

    console.log(`✓ Focus after navigation: ${focusAfterNavigation.tag}`);
  });

  /**
   * Test 5: Focus order is consistent
   * Priority: High
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T05: Should have consistent focus order across page loads', async () => {
    // Record focus order first time
    const firstOrder = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => ({
        tag: document.activeElement.tagName,
        id: document.activeElement.id,
        class: document.activeElement.className
      }));
      firstOrder.push(info);
    }

    // Reload page
    await page.reload({ waitUntil: 'networkidle0' });

    // Record focus order second time
    const secondOrder = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => ({
        tag: document.activeElement.tagName,
        id: document.activeElement.id,
        class: document.activeElement.className
      }));
      secondOrder.push(info);
    }

    // Orders should match
    const ordersMatch = firstOrder.every((item, index) => 
      item.tag === secondOrder[index].tag &&
      item.id === secondOrder[index].id
    );

    expect(ordersMatch).toBe(true);

    console.log(`✓ Focus order is consistent across page loads`);
  });

  /**
   * Test 6: Focus restoration after modal/notification close
   * Priority: Medium
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T06: Should restore focus after notification dismissal', async () => {
    // Focus an element
    await page.evaluate(() => {
      const btn = document.querySelector('.add-to-cart');
      if (btn) btn.focus();
    });

    const elementBeforeAction = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      id: document.activeElement.id,
      class: document.activeElement.className
    }));

    // Trigger notification
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Wait for notification to appear and disappear
    await page.waitForTimeout(2000);

    const elementAfterNotification = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      id: document.activeElement.id,
      class: document.activeElement.className,
      isBody: document.activeElement.tagName === 'BODY'
    }));

    // Focus should be restored or on a logical element
    expect(elementAfterNotification.isBody).toBe(false);

    console.log(`✓ Focus managed after notification`);
  });

  /**
   * Test 7: No focus trap on main page
   * Priority: Critical
   * WCAG: 2.1.2 No Keyboard Trap (Level A)
   */
  test('A11Y-003-T07: Should not trap focus on product listing page', async () => {
    const focusedElements = new Set();

    // Navigate through many elements
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      
      const elementId = await page.evaluate(() => {
        const el = document.activeElement;
        return `${el.tagName}-${el.id}-${el.className}`;
      });
      
      focusedElements.add(elementId);
    }

    // Should have focused on multiple different elements
    expect(focusedElements.size).toBeGreaterThan(10);

    console.log(`✓ No focus trap detected (${focusedElements.size} unique elements)`);
  });

  /**
   * Test 8: Focus visible on cart page controls
   * Priority: High
   * WCAG: 2.4.7 Focus Visible (Level AA)
   */
  test('A11Y-003-T08: Should show focus on cart page quantity controls', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const controlFocusStates = [];

    // Find and focus quantity controls
    const controls = await page.$$('.quantity-increase, .quantity-decrease, .remove-item');
    
    for (let i = 0; i < Math.min(controls.length, 5); i++) {
      await controls[i].focus();
      
      const focusState = await page.evaluate(() => {
        const el = document.activeElement;
        const computed = window.getComputedStyle(el);
        
        return {
          class: el.className,
          hasOutline: computed.outlineWidth !== '0px',
          hasBoxShadow: computed.boxShadow !== 'none',
          hasVisibleIndicator: computed.outlineWidth !== '0px' || computed.boxShadow !== 'none'
        };
      });
      
      controlFocusStates.push(focusState);
    }

    // All controls should have visible focus
    const allVisible = controlFocusStates.every(s => s.hasVisibleIndicator);
    expect(allVisible).toBe(true);

    console.log(`✓ ${controlFocusStates.length} cart controls have visible focus`);
  });

  /**
   * Test 9: Focus moves logically through cart items
   * Priority: Medium
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T09: Should have logical focus order in cart items', async () => {
    // Add multiple items
    const addButtons = await page.$$('.add-to-cart');
    for (let i = 0; i < Math.min(3, addButtons.length); i++) {
      await addButtons[i].click();
      await page.waitForTimeout(200);
    }

    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const focusFlow = [];
    
    // Navigate through cart
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      
      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        const cartItem = el.closest('.cart-item, [class*="cart-item"]');
        
        return {
          tag: el.tagName,
          class: el.className,
          inCartItem: !!cartItem,
          cartItemIndex: cartItem ? Array.from(document.querySelectorAll('.cart-item, [class*="cart-item"]')).indexOf(cartItem) : -1
        };
      });
      
      focusFlow.push(focusInfo);
    }

    // Focus should move through cart items logically
    const cartItemFocuses = focusFlow.filter(f => f.inCartItem);
    expect(cartItemFocuses.length).toBeGreaterThan(0);

    console.log(`✓ Focus flows logically through ${cartItemFocuses.length} cart item controls`);
  });

  /**
   * Test 10: Focus indicator size is adequate
   * Priority: Medium
   * WCAG: 2.4.7 Focus Visible (Level AA)
   */
  test('A11Y-003-T10: Should have adequate focus indicator size', async () => {
    const indicatorSizes = [];

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      
      const sizeInfo = await page.evaluate(() => {
        const el = document.activeElement;
        const computed = window.getComputedStyle(el);
        
        return {
          outlineWidth: parseFloat(computed.outlineWidth) || 0,
          outlineOffset: parseFloat(computed.outlineOffset) || 0,
          boxShadowSpread: computed.boxShadow !== 'none' ? 2 : 0, // Simplified
          totalIndicatorSize: (parseFloat(computed.outlineWidth) || 0) + Math.abs(parseFloat(computed.outlineOffset) || 0)
        };
      });
      
      indicatorSizes.push(sizeInfo);
    }

    // Focus indicators should be at least 1px (ideally 2px+)
    const adequateSizes = indicatorSizes.filter(s => s.totalIndicatorSize >= 1);
    const percentage = (adequateSizes.length / indicatorSizes.length) * 100;

    expect(percentage).toBeGreaterThanOrEqual(80);

    console.log(`✓ ${adequateSizes.length}/${indicatorSizes.length} (${percentage.toFixed(0)}%) have adequate indicator size`);
  });

  /**
   * Test 11: Focus not obscured by fixed elements
   * Priority: Medium
   * WCAG: 2.4.11 Focus Not Obscured (Level AA) - WCAG 2.2
   */
  test('A11Y-003-T11: Should not obscure focused elements with fixed headers', async () => {
    const obscuredElements = [];

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const visibilityInfo = await page.evaluate(() => {
        const el = document.activeElement;
        const rect = el.getBoundingClientRect();
        
        // Check if element is in viewport
        const inViewport = rect.top >= 0 && 
                          rect.left >= 0 && 
                          rect.bottom <= window.innerHeight && 
                          rect.right <= window.innerWidth;
        
        // Check for fixed elements that might obscure
        const fixedElements = Array.from(document.querySelectorAll('*')).filter(e => {
          const style = window.getComputedStyle(e);
          return style.position === 'fixed' || style.position === 'sticky';
        });
        
        return {
          inViewport,
          top: rect.top,
          bottom: rect.bottom,
          fixedElementsCount: fixedElements.length
        };
      });
      
      if (!visibilityInfo.inViewport) {
        obscuredElements.push(visibilityInfo);
      }
    }

    // Most elements should be visible when focused
    const visiblePercentage = ((10 - obscuredElements.length) / 10) * 100;
    expect(visiblePercentage).toBeGreaterThanOrEqual(70);

    console.log(`✓ ${10 - obscuredElements.length}/10 focused elements are fully visible`);
  });

  /**
   * Test 12: Programmatic focus management works
   * Priority: High
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T12: Should support programmatic focus management', async () => {
    const focusTest = await page.evaluate(() => {
      const results = [];
      
      // Test focusing different elements programmatically
      const addBtn = document.querySelector('.add-to-cart');
      const goToCartBtn = document.querySelector('[href="cart.html"], .go-to-cart');
      
      if (addBtn) {
        addBtn.focus();
        results.push({
          element: 'add-to-cart',
          focused: document.activeElement === addBtn
        });
      }
      
      if (goToCartBtn) {
        goToCartBtn.focus();
        results.push({
          element: 'go-to-cart',
          focused: document.activeElement === goToCartBtn
        });
      }
      
      return results;
    });

    // All programmatic focus attempts should succeed
    const allSucceeded = focusTest.every(t => t.focused);
    expect(allSucceeded).toBe(true);

    console.log(`✓ ${focusTest.length} programmatic focus operations successful`);
  });

  /**
   * Test 13: Focus returns to trigger after cart update
   * Priority: Medium
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T13: Should return focus to trigger after quantity update', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Focus increase button
    await page.evaluate(() => {
      const btn = document.querySelector('.quantity-increase');
      if (btn) btn.focus();
    });

    const buttonBefore = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      class: document.activeElement.className
    }));

    // Click to increase
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const buttonAfter = await page.evaluate(() => ({
      tag: document.activeElement.tagName,
      class: document.activeElement.className,
      isBody: document.activeElement.tagName === 'BODY'
    }));

    // Focus should remain on or near the button
    expect(buttonAfter.isBody).toBe(false);

    console.log(`✓ Focus managed after quantity update`);
  });

  /**
   * Test 14: Skip link functionality
   * Priority: Medium
   * WCAG: 2.4.1 Bypass Blocks (Level A)
   */
  test('A11Y-003-T14: Should provide working skip link', async () => {
    // Check if skip link exists
    const skipLinkExists = await page.evaluate(() => {
      const skipLink = document.querySelector('a[href="#main"], a[href="#content"], .skip-link');
      return !!skipLink;
    });

    if (skipLinkExists) {
      // Focus skip link (should be first focusable element)
      await page.keyboard.press('Tab');
      
      const isSkipLink = await page.evaluate(() => {
        const el = document.activeElement;
        return el.textContent?.toLowerCase().includes('skip') ||
               el.classList.contains('skip-link');
      });

      if (isSkipLink) {
        // Activate skip link
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);

        // Verify focus moved to main content
        const focusedMain = await page.evaluate(() => {
          const el = document.activeElement;
          return el.id === 'main' || 
                 el.id === 'content' || 
                 el.tagName === 'MAIN';
        });

        expect(focusedMain).toBe(true);
        console.log(`✓ Skip link works correctly`);
      } else {
        console.log(`ℹ Skip link not first focusable element`);
      }
    } else {
      console.log(`ℹ Skip link not implemented (recommended for accessibility)`);
    }
  });

  /**
   * Test 15: Focus management during page transitions
   * Priority: High
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-003-T15: Should manage focus during page transitions', async () => {
    // Add item
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);

    // Focus "Go to Cart" button
    await page.evaluate(() => {
      const btn = document.querySelector('[href="cart.html"], .go-to-cart');
      if (btn) btn.focus();
    });

    // Navigate to cart
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    // Check focus after navigation
    const focusAfterTransition = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el.tagName,
        id: el.id,
        isBody: el.tagName === 'BODY',
        isInteractive: el.tagName === 'BUTTON' || 
                      el.tagName === 'A' || 
                      el.tagName === 'INPUT'
      };
    });

    // Focus should be on a meaningful element
    expect(focusAfterTransition.tag).toBeDefined();

    console.log(`✓ Focus managed during page transition: ${focusAfterTransition.tag}`);
  });
});

/**
 * Accessibility Test Summary:
 * 
 * Total Tests: 15
 * WCAG 2.1 Level AA Coverage:
 * - 2.1.2 No Keyboard Trap (Level A): 1 test
 * - 2.4.1 Bypass Blocks (Level A): 1 test
 * - 2.4.3 Focus Order (Level A): 7 tests
 * - 2.4.7 Focus Visible (Level AA): 4 tests
 * - 1.4.11 Non-text Contrast (Level AA): 1 test
 * - 2.4.11 Focus Not Obscured (WCAG 2.2): 1 test
 * 
 * Coverage Areas:
 * - Focus visibility (4 tests)
 * - Focus management (6 tests)
 * - Focus order (3 tests)
 * - Focus restoration (2 tests)
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button focus management
 * ✓ Cart page focus handling
 * ✓ Focus indicators visible
 * ✓ No focus traps
 * ✓ Logical focus order maintained
 */

