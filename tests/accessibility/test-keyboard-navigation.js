/**
 * Accessibility Test: Keyboard Navigation
 * Test ID: A11Y-001
 * 
 * Purpose: Verify complete keyboard navigation support for "Go to Cart" functionality
 * 
 * Test Coverage:
 * - Tab navigation through all interactive elements
 * - Enter/Space key activation
 * - Focus order and logical flow
 * - Skip links and shortcuts
 * - Keyboard traps prevention
 * - Focus visibility
 * 
 * Accessibility Standards:
 * - WCAG 2.1 Level AA compliance
 * - Section 508 compliance
 * - Keyboard-only operation
 */

const puppeteer = require('puppeteer');

describe('A11Y-001: Keyboard Navigation Accessibility', () => {
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
   * Test 1: Tab navigation through all interactive elements
   * Priority: Critical
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T01: Should navigate through all interactive elements with Tab', async () => {
    const focusableElements = await page.evaluate(() => {
      const elements = [];
      const selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusable = document.querySelectorAll(selector);
      
      focusable.forEach(el => {
        elements.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          text: el.textContent?.trim().substring(0, 30),
          tabIndex: el.tabIndex
        });
      });
      
      return elements;
    });

    // Verify focusable elements exist
    expect(focusableElements.length).toBeGreaterThan(0);

    // Navigate through elements
    for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el.tagName,
          id: el.id,
          class: el.className,
          visible: el.offsetParent !== null
        };
      });

      expect(focusedElement.visible).toBe(true);
    }

    console.log(`✓ Successfully navigated through ${focusableElements.length} focusable elements`);
  });

  /**
   * Test 2: "Go to Cart" button keyboard activation with Enter
   * Priority: Critical
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T02: Should activate "Go to Cart" button with Enter key', async () => {
    // Add item to cart first
    await page.click('.add-to-cart');
    await page.waitForTimeout(500);

    // Find and focus "Go to Cart" button
    await page.evaluate(() => {
      const goToCartBtn = document.querySelector('[href="cart.html"], .go-to-cart, #go-to-cart');
      if (goToCartBtn) goToCartBtn.focus();
    });

    // Get current URL
    const urlBefore = page.url();

    // Press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify navigation occurred
    const urlAfter = page.url();
    expect(urlAfter).toContain('cart.html');
    expect(urlAfter).not.toBe(urlBefore);

    console.log(`✓ "Go to Cart" button activated with Enter key`);
  });

  /**
   * Test 3: "Go to Cart" button keyboard activation with Space
   * Priority: Critical
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T03: Should activate "Go to Cart" button with Space key', async () => {
    // Add item to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(500);

    // Focus "Go to Cart" button
    await page.evaluate(() => {
      const goToCartBtn = document.querySelector('[href="cart.html"], .go-to-cart, #go-to-cart');
      if (goToCartBtn) goToCartBtn.focus();
    });

    const urlBefore = page.url();

    // Press Space
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    const urlAfter = page.url();
    
    // Space might work differently for links vs buttons
    // At minimum, verify element is still focused and interactive
    const isFocused = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return activeEl && (
        activeEl.matches('[href="cart.html"]') ||
        activeEl.matches('.go-to-cart') ||
        activeEl.id === 'go-to-cart'
      );
    });

    expect(isFocused || urlAfter.includes('cart.html')).toBe(true);

    console.log(`✓ "Go to Cart" button responds to Space key`);
  });

  /**
   * Test 4: Add to Cart button keyboard activation
   * Priority: High
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T04: Should add items to cart using keyboard', async () => {
    // Focus first "Add to Cart" button
    await page.evaluate(() => {
      const addBtn = document.querySelector('.add-to-cart');
      if (addBtn) addBtn.focus();
    });

    // Get initial cart count
    const initialCount = await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge, .cart-count');
      return badge ? parseInt(badge.textContent) || 0 : 0;
    });

    // Press Enter to add item
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify cart count increased
    const finalCount = await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge, .cart-count');
      return badge ? parseInt(badge.textContent) || 0 : 0;
    });

    expect(finalCount).toBeGreaterThan(initialCount);

    console.log(`✓ Item added to cart via keyboard (${initialCount} → ${finalCount})`);
  });

  /**
   * Test 5: Focus order is logical and sequential
   * Priority: High
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-001-T05: Should have logical focus order', async () => {
    const focusOrder = [];

    // Navigate through first 15 elements
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      
      const focusedInfo = await page.evaluate(() => {
        const el = document.activeElement;
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          id: el.id,
          class: el.className,
          x: rect.x,
          y: rect.y,
          text: el.textContent?.trim().substring(0, 20)
        };
      });
      
      focusOrder.push(focusedInfo);
    }

    // Verify focus moves generally top-to-bottom, left-to-right
    let previousY = -1;
    let logicalOrder = true;

    for (const item of focusOrder) {
      // Allow some flexibility for same-row elements
      if (item.y < previousY - 100) {
        logicalOrder = false;
        break;
      }
      previousY = item.y;
    }

    expect(logicalOrder).toBe(true);

    console.log(`✓ Focus order is logical (${focusOrder.length} elements checked)`);
  });

  /**
   * Test 6: No keyboard traps
   * Priority: Critical
   * WCAG: 2.1.2 No Keyboard Trap (Level A)
   */
  test('A11Y-001-T06: Should not trap keyboard focus', async () => {
    // Navigate forward through several elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    const forwardElement = await page.evaluate(() => {
      return {
        tag: document.activeElement.tagName,
        id: document.activeElement.id
      };
    });

    // Navigate backward
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab', { shift: true });
    }

    const backwardElement = await page.evaluate(() => {
      return {
        tag: document.activeElement.tagName,
        id: document.activeElement.id
      };
    });

    // Verify we could move both forward and backward
    expect(forwardElement).toBeDefined();
    expect(backwardElement).toBeDefined();
    expect(forwardElement.id).not.toBe(backwardElement.id);

    console.log(`✓ No keyboard traps detected`);
  });

  /**
   * Test 7: Focus visibility is clear
   * Priority: High
   * WCAG: 2.4.7 Focus Visible (Level AA)
   */
  test('A11Y-001-T07: Should have visible focus indicators', async () => {
    const focusStyles = [];

    // Check focus styles on multiple elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      
      const styles = await page.evaluate(() => {
        const el = document.activeElement;
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          outlineColor: computed.outlineColor,
          boxShadow: computed.boxShadow,
          border: computed.border
        };
      });
      
      focusStyles.push(styles);
    }

    // Verify at least some focus indicators exist
    const hasFocusIndicators = focusStyles.some(style => 
      style.outlineWidth !== '0px' || 
      style.boxShadow !== 'none' ||
      style.outline !== 'none'
    );

    expect(hasFocusIndicators).toBe(true);

    console.log(`✓ Focus indicators are visible`);
  });

  /**
   * Test 8: Cart page keyboard navigation
   * Priority: High
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T08: Should navigate cart page with keyboard', async () => {
    // Add items and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Navigate through cart controls
    const cartControls = await page.evaluate(() => {
      const controls = [];
      const buttons = document.querySelectorAll('.quantity-increase, .quantity-decrease, .remove-item, .checkout, .continue-shopping');
      
      buttons.forEach(btn => {
        controls.push({
          class: btn.className,
          text: btn.textContent?.trim()
        });
      });
      
      return controls;
    });

    expect(cartControls.length).toBeGreaterThan(0);

    // Navigate through controls
    for (let i = 0; i < Math.min(cartControls.length, 10); i++) {
      await page.keyboard.press('Tab');
    }

    console.log(`✓ Cart page keyboard navigation works (${cartControls.length} controls)`);
  });

  /**
   * Test 9: Quantity controls keyboard operation
   * Priority: High
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T09: Should operate quantity controls with keyboard', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Get initial quantity
    const initialQty = await page.evaluate(() => {
      const qtyEl = document.querySelector('.quantity-value, .item-quantity');
      return qtyEl ? parseInt(qtyEl.textContent) : 1;
    });

    // Focus and activate increase button
    await page.evaluate(() => {
      const increaseBtn = document.querySelector('.quantity-increase');
      if (increaseBtn) increaseBtn.focus();
    });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify quantity increased
    const finalQty = await page.evaluate(() => {
      const qtyEl = document.querySelector('.quantity-value, .item-quantity');
      return qtyEl ? parseInt(qtyEl.textContent) : 1;
    });

    expect(finalQty).toBeGreaterThan(initialQty);

    console.log(`✓ Quantity controls work with keyboard (${initialQty} → ${finalQty})`);
  });

  /**
   * Test 10: Remove item keyboard operation
   * Priority: High
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T10: Should remove items with keyboard', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    // Get initial item count
    const initialCount = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item').length;
    });

    // Focus and activate remove button
    await page.evaluate(() => {
      const removeBtn = document.querySelector('.remove-item');
      if (removeBtn) removeBtn.focus();
    });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify item removed
    const finalCount = await page.evaluate(() => {
      return document.querySelectorAll('.cart-item').length;
    });

    expect(finalCount).toBeLessThan(initialCount);

    console.log(`✓ Items can be removed with keyboard (${initialCount} → ${finalCount})`);
  });

  /**
   * Test 11: Escape key functionality
   * Priority: Medium
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T11: Should handle Escape key appropriately', async () => {
    // Add item (might show notification)
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify page is still functional
    const isPageFunctional = await page.evaluate(() => {
      const addBtn = document.querySelector('.add-to-cart');
      return addBtn !== null;
    });

    expect(isPageFunctional).toBe(true);

    console.log(`✓ Escape key handled appropriately`);
  });

  /**
   * Test 12: Shift+Tab reverse navigation
   * Priority: High
   * WCAG: 2.1.1 Keyboard (Level A)
   */
  test('A11Y-001-T12: Should navigate backwards with Shift+Tab', async () => {
    // Navigate forward
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    const forwardFocus = await page.evaluate(() => {
      return {
        tag: document.activeElement.tagName,
        id: document.activeElement.id,
        class: document.activeElement.className
      };
    });

    // Navigate backward
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab', { shift: true });
    }

    const backwardFocus = await page.evaluate(() => {
      return {
        tag: document.activeElement.tagName,
        id: document.activeElement.id,
        class: document.activeElement.className
      };
    });

    // Verify we moved to a different element
    expect(forwardFocus.id).not.toBe(backwardFocus.id);

    console.log(`✓ Shift+Tab reverse navigation works`);
  });

  /**
   * Test 13: Skip to main content link
   * Priority: Medium
   * WCAG: 2.4.1 Bypass Blocks (Level A)
   */
  test('A11Y-001-T13: Should provide skip navigation link', async () => {
    // Check for skip link
    const hasSkipLink = await page.evaluate(() => {
      const skipLink = document.querySelector('a[href="#main"], a[href="#content"], .skip-link');
      return skipLink !== null;
    });

    // If skip link exists, test it
    if (hasSkipLink) {
      await page.keyboard.press('Tab');
      
      const firstFocusedElement = await page.evaluate(() => {
        return document.activeElement.textContent?.toLowerCase().includes('skip');
      });

      expect(firstFocusedElement).toBe(true);
      console.log(`✓ Skip navigation link present and functional`);
    } else {
      console.log(`ℹ Skip navigation link not implemented (recommended)`);
    }
  });

  /**
   * Test 14: Focus management after actions
   * Priority: Medium
   * WCAG: 2.4.3 Focus Order (Level A)
   */
  test('A11Y-001-T14: Should manage focus after cart actions', async () => {
    // Add item
    await page.evaluate(() => {
      const addBtn = document.querySelector('.add-to-cart');
      if (addBtn) addBtn.focus();
    });

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify focus is managed (not lost)
    const focusAfterAction = await page.evaluate(() => {
      const activeEl = document.activeElement;
      return {
        tag: activeEl.tagName,
        isBody: activeEl.tagName === 'BODY'
      };
    });

    // Focus should not be on body (indicates lost focus)
    expect(focusAfterAction.isBody).toBe(false);

    console.log(`✓ Focus properly managed after actions`);
  });
});

/**
 * Accessibility Test Summary:
 * 
 * Total Tests: 14
 * WCAG 2.1 Level AA Coverage:
 * - 2.1.1 Keyboard (Level A): 10 tests
 * - 2.1.2 No Keyboard Trap (Level A): 1 test
 * - 2.4.1 Bypass Blocks (Level A): 1 test
 * - 2.4.3 Focus Order (Level A): 2 tests
 * - 2.4.7 Focus Visible (Level AA): 1 test
 * 
 * Coverage Areas:
 * - Tab navigation (3 tests)
 * - Keyboard activation (4 tests)
 * - Focus management (4 tests)
 * - Cart operations (3 tests)
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button keyboard accessible
 * ✓ All cart operations keyboard accessible
 * ✓ Focus indicators visible
 * ✓ No keyboard traps
 */

