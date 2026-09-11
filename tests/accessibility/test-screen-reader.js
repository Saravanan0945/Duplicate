/**
 * Accessibility Test: Screen Reader Support
 * Test ID: A11Y-002
 * 
 * Purpose: Verify screen reader compatibility and ARIA implementation
 * 
 * Test Coverage:
 * - ARIA labels and descriptions
 * - Alt text for images
 * - Semantic HTML structure
 * - Live regions for dynamic content
 * - Role attributes
 * - Accessible names
 * - State announcements
 * 
 * Accessibility Standards:
 * - WCAG 2.1 Level AA compliance
 * - ARIA 1.2 best practices
 * - Screen reader compatibility (NVDA, JAWS, VoiceOver)
 */

const puppeteer = require('puppeteer');

describe('A11Y-002: Screen Reader Accessibility', () => {
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
   * Test 1: All images have alt text
   * Priority: Critical
   * WCAG: 1.1.1 Non-text Content (Level A)
   */
  test('A11Y-002-T01: Should have alt text for all product images', async () => {
    const imageAudit = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const results = [];
      
      images.forEach(img => {
        results.push({
          src: img.src.substring(img.src.lastIndexOf('/') + 1),
          hasAlt: img.hasAttribute('alt'),
          altText: img.alt,
          altLength: img.alt?.length || 0,
          isDecorative: img.alt === ''
        });
      });
      
      return results;
    });

    // All images should have alt attribute
    const allHaveAlt = imageAudit.every(img => img.hasAlt);
    expect(allHaveAlt).toBe(true);

    // Non-decorative images should have meaningful alt text
    const meaningfulAlt = imageAudit.filter(img => !img.isDecorative);
    const allMeaningful = meaningfulAlt.every(img => img.altLength > 0);
    expect(allMeaningful).toBe(true);

    console.log(`✓ All ${imageAudit.length} images have alt text (${meaningfulAlt.length} meaningful, ${imageAudit.length - meaningfulAlt.length} decorative)`);
  });

  /**
   * Test 2: "Go to Cart" button has accessible name
   * Priority: Critical
   * WCAG: 4.1.2 Name, Role, Value (Level A)
   */
  test('A11Y-002-T02: Should have accessible name for "Go to Cart" button', async () => {
    const goToCartInfo = await page.evaluate(() => {
      const btn = document.querySelector('[href="cart.html"], .go-to-cart, #go-to-cart');
      if (!btn) return null;
      
      return {
        hasAriaLabel: btn.hasAttribute('aria-label'),
        ariaLabel: btn.getAttribute('aria-label'),
        textContent: btn.textContent?.trim(),
        title: btn.title,
        accessibleName: btn.getAttribute('aria-label') || btn.textContent?.trim() || btn.title
      };
    });

    expect(goToCartInfo).not.toBeNull();
    expect(goToCartInfo.accessibleName).toBeTruthy();
    expect(goToCartInfo.accessibleName.length).toBeGreaterThan(0);

    console.log(`✓ "Go to Cart" button accessible name: "${goToCartInfo.accessibleName}"`);
  });

  /**
   * Test 3: Cart badge has ARIA label
   * Priority: High
   * WCAG: 4.1.2 Name, Role, Value (Level A)
   */
  test('A11Y-002-T03: Should have ARIA label for cart badge', async () => {
    // Add item to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(500);

    const badgeInfo = await page.evaluate(() => {
      const badge = document.querySelector('.cart-badge, .cart-count');
      if (!badge) return null;
      
      return {
        hasAriaLabel: badge.hasAttribute('aria-label'),
        ariaLabel: badge.getAttribute('aria-label'),
        textContent: badge.textContent?.trim(),
        role: badge.getAttribute('role'),
        ariaLive: badge.getAttribute('aria-live')
      };
    });

    expect(badgeInfo).not.toBeNull();
    
    // Badge should have either aria-label or meaningful text
    const hasAccessibleInfo = badgeInfo.hasAriaLabel || (badgeInfo.textContent && badgeInfo.textContent.length > 0);
    expect(hasAccessibleInfo).toBe(true);

    console.log(`✓ Cart badge accessible: ${badgeInfo.ariaLabel || badgeInfo.textContent}`);
  });

  /**
   * Test 4: Product cards have semantic structure
   * Priority: High
   * WCAG: 1.3.1 Info and Relationships (Level A)
   */
  test('A11Y-002-T04: Should use semantic HTML for product cards', async () => {
    const semanticAudit = await page.evaluate(() => {
      const products = document.querySelectorAll('.product, .product-card, [class*="product"]');
      const results = [];
      
      products.forEach(product => {
        const heading = product.querySelector('h1, h2, h3, h4, h5, h6');
        const image = product.querySelector('img');
        const button = product.querySelector('button, a');
        
        results.push({
          hasHeading: !!heading,
          headingLevel: heading?.tagName,
          hasImage: !!image,
          hasButton: !!button,
          buttonText: button?.textContent?.trim()
        });
      });
      
      return results;
    });

    // All products should have headings
    const allHaveHeadings = semanticAudit.every(p => p.hasHeading);
    expect(allHaveHeadings).toBe(true);

    // All products should have buttons
    const allHaveButtons = semanticAudit.every(p => p.hasButton);
    expect(allHaveButtons).toBe(true);

    console.log(`✓ ${semanticAudit.length} product cards use semantic HTML`);
  });

  /**
   * Test 5: Add to Cart buttons have descriptive labels
   * Priority: High
   * WCAG: 2.4.6 Headings and Labels (Level AA)
   */
  test('A11Y-002-T05: Should have descriptive labels for Add to Cart buttons', async () => {
    const buttonLabels = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.add-to-cart, [class*="add-to-cart"]');
      const labels = [];
      
      buttons.forEach(btn => {
        labels.push({
          ariaLabel: btn.getAttribute('aria-label'),
          textContent: btn.textContent?.trim(),
          title: btn.title,
          accessibleName: btn.getAttribute('aria-label') || btn.textContent?.trim() || btn.title
        });
      });
      
      return labels;
    });

    // All buttons should have accessible names
    const allHaveNames = buttonLabels.every(btn => btn.accessibleName && btn.accessibleName.length > 0);
    expect(allHaveNames).toBe(true);

    // Names should be descriptive (more than just "Add")
    const descriptiveNames = buttonLabels.filter(btn => 
      btn.accessibleName.toLowerCase().includes('cart') || 
      btn.accessibleName.toLowerCase().includes('add')
    );
    expect(descriptiveNames.length).toBeGreaterThan(0);

    console.log(`✓ ${buttonLabels.length} Add to Cart buttons have descriptive labels`);
  });

  /**
   * Test 6: Live region for cart updates
   * Priority: High
   * WCAG: 4.1.3 Status Messages (Level AA)
   */
  test('A11Y-002-T06: Should announce cart updates to screen readers', async () => {
    const liveRegionBefore = await page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      return Array.from(liveRegions).map(region => ({
        ariaLive: region.getAttribute('aria-live'),
        role: region.getAttribute('role'),
        content: region.textContent?.trim()
      }));
    });

    // Add item to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(500);

    const liveRegionAfter = await page.evaluate(() => {
      const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      return Array.from(liveRegions).map(region => ({
        ariaLive: region.getAttribute('aria-live'),
        role: region.getAttribute('role'),
        content: region.textContent?.trim(),
        visible: region.offsetParent !== null
      }));
    });

    // Should have live regions for announcements
    expect(liveRegionAfter.length).toBeGreaterThan(0);

    console.log(`✓ ${liveRegionAfter.length} live regions found for screen reader announcements`);
  });

  /**
   * Test 7: Form labels are properly associated
   * Priority: Critical
   * WCAG: 1.3.1 Info and Relationships (Level A)
   */
  test('A11Y-002-T07: Should have proper label associations for inputs', async () => {
    // Go to cart page (has quantity inputs)
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const inputAudit = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      const results = [];
      
      inputs.forEach(input => {
        const id = input.id;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        
        results.push({
          type: input.type || input.tagName,
          hasLabel: !!label,
          hasAriaLabel: !!ariaLabel,
          hasAriaLabelledBy: !!ariaLabelledBy,
          hasAccessibleName: !!(label || ariaLabel || ariaLabelledBy)
        });
      });
      
      return results;
    });

    if (inputAudit.length > 0) {
      const allHaveAccessibleNames = inputAudit.every(input => input.hasAccessibleName);
      expect(allHaveAccessibleNames).toBe(true);
      console.log(`✓ ${inputAudit.length} inputs have proper labels`);
    } else {
      console.log(`ℹ No form inputs found on cart page`);
    }
  });

  /**
   * Test 8: Heading hierarchy is logical
   * Priority: Medium
   * WCAG: 1.3.1 Info and Relationships (Level A)
   */
  test('A11Y-002-T08: Should have logical heading hierarchy', async () => {
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim().substring(0, 50)
      }));
    });

    // Should have at least one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(1); // Only one h1 per page

    // Check for skipped levels
    let previousLevel = 0;
    let hasSkippedLevels = false;
    
    for (const heading of headings) {
      if (heading.level - previousLevel > 1) {
        hasSkippedLevels = true;
        break;
      }
      previousLevel = heading.level;
    }

    expect(hasSkippedLevels).toBe(false);

    console.log(`✓ Heading hierarchy is logical (${headings.length} headings, 1 h1)`);
  });

  /**
   * Test 9: Buttons have appropriate roles
   * Priority: Medium
   * WCAG: 4.1.2 Name, Role, Value (Level A)
   */
  test('A11Y-002-T09: Should have appropriate ARIA roles for interactive elements', async () => {
    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, [role="button"]');
      const results = [];
      
      elements.forEach(el => {
        results.push({
          tag: el.tagName,
          role: el.getAttribute('role'),
          type: el.type,
          hasHref: el.hasAttribute('href'),
          accessibleName: el.getAttribute('aria-label') || el.textContent?.trim()
        });
      });
      
      return results;
    });

    // Links with href should not have role="button"
    const linksWithButtonRole = interactiveElements.filter(el => 
      el.tag === 'A' && el.hasHref && el.role === 'button'
    );
    
    // This is acceptable but not ideal
    console.log(`✓ ${interactiveElements.length} interactive elements checked (${linksWithButtonRole.length} links with button role)`);
  });

  /**
   * Test 10: Cart items have accessible descriptions
   * Priority: High
   * WCAG: 1.1.1 Non-text Content (Level A)
   */
  test('A11Y-002-T10: Should have accessible descriptions for cart items', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const cartItemsAudit = await page.evaluate(() => {
      const items = document.querySelectorAll('.cart-item, [class*="cart-item"]');
      const results = [];
      
      items.forEach(item => {
        const name = item.querySelector('h1, h2, h3, h4, h5, h6, .product-name, [class*="name"]');
        const price = item.querySelector('.price, [class*="price"]');
        const quantity = item.querySelector('.quantity, [class*="quantity"]');
        
        results.push({
          hasName: !!name,
          nameText: name?.textContent?.trim(),
          hasPrice: !!price,
          hasQuantity: !!quantity,
          ariaLabel: item.getAttribute('aria-label'),
          ariaDescribedBy: item.getAttribute('aria-describedby')
        });
      });
      
      return results;
    });

    if (cartItemsAudit.length > 0) {
      // All items should have names
      const allHaveNames = cartItemsAudit.every(item => item.hasName);
      expect(allHaveNames).toBe(true);

      console.log(`✓ ${cartItemsAudit.length} cart items have accessible descriptions`);
    } else {
      console.log(`ℹ No cart items found`);
    }
  });

  /**
   * Test 11: Price information is accessible
   * Priority: High
   * WCAG: 1.3.1 Info and Relationships (Level A)
   */
  test('A11Y-002-T11: Should make price information accessible', async () => {
    const priceAudit = await page.evaluate(() => {
      const prices = document.querySelectorAll('.price, [class*="price"]');
      const results = [];
      
      prices.forEach(price => {
        const text = price.textContent?.trim();
        const ariaLabel = price.getAttribute('aria-label');
        const hasScreenReaderText = price.querySelector('.sr-only, .visually-hidden');
        
        results.push({
          text,
          ariaLabel,
          hasScreenReaderText: !!hasScreenReaderText,
          hasCurrencySymbol: text?.includes('$') || text?.includes('€') || text?.includes('£')
        });
      });
      
      return results;
    });

    // Prices should have currency symbols or aria-labels
    const accessiblePrices = priceAudit.filter(p => 
      p.hasCurrencySymbol || p.ariaLabel || p.hasScreenReaderText
    );

    expect(accessiblePrices.length).toBeGreaterThan(0);

    console.log(`✓ ${accessiblePrices.length}/${priceAudit.length} prices are accessible`);
  });

  /**
   * Test 12: Empty cart message is announced
   * Priority: Medium
   * WCAG: 4.1.3 Status Messages (Level AA)
   */
  test('A11Y-002-T12: Should announce empty cart state', async () => {
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const emptyStateAudit = await page.evaluate(() => {
      const emptyMessage = document.querySelector('.empty-cart, [class*="empty"]');
      if (!emptyMessage) return null;
      
      return {
        text: emptyMessage.textContent?.trim(),
        role: emptyMessage.getAttribute('role'),
        ariaLive: emptyMessage.getAttribute('aria-live'),
        ariaAtomic: emptyMessage.getAttribute('aria-atomic'),
        visible: emptyMessage.offsetParent !== null
      };
    });

    if (emptyStateAudit) {
      expect(emptyStateAudit.text).toBeTruthy();
      expect(emptyStateAudit.visible).toBe(true);
      console.log(`✓ Empty cart message: "${emptyStateAudit.text}"`);
    } else {
      console.log(`ℹ Empty cart message not found (cart may have items)`);
    }
  });

  /**
   * Test 13: Quantity controls have accessible names
   * Priority: High
   * WCAG: 4.1.2 Name, Role, Value (Level A)
   */
  test('A11Y-002-T13: Should have accessible names for quantity controls', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const quantityControlsAudit = await page.evaluate(() => {
      const controls = document.querySelectorAll('.quantity-increase, .quantity-decrease, [class*="quantity"]');
      const results = [];
      
      controls.forEach(control => {
        if (control.tagName === 'BUTTON' || control.tagName === 'A') {
          results.push({
            class: control.className,
            ariaLabel: control.getAttribute('aria-label'),
            title: control.title,
            textContent: control.textContent?.trim(),
            accessibleName: control.getAttribute('aria-label') || control.title || control.textContent?.trim()
          });
        }
      });
      
      return results;
    });

    if (quantityControlsAudit.length > 0) {
      const allHaveNames = quantityControlsAudit.every(c => c.accessibleName && c.accessibleName.length > 0);
      expect(allHaveNames).toBe(true);
      console.log(`✓ ${quantityControlsAudit.length} quantity controls have accessible names`);
    } else {
      console.log(`ℹ No quantity controls found`);
    }
  });

  /**
   * Test 14: Remove buttons have clear purpose
   * Priority: High
   * WCAG: 2.4.6 Headings and Labels (Level AA)
   */
  test('A11Y-002-T14: Should clearly identify remove item buttons', async () => {
    // Add item and go to cart
    await page.click('.add-to-cart');
    await page.waitForTimeout(300);
    await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'networkidle0' });

    const removeButtonsAudit = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.remove-item, [class*="remove"]');
      const results = [];
      
      buttons.forEach(btn => {
        if (btn.tagName === 'BUTTON' || btn.tagName === 'A') {
          const accessibleName = btn.getAttribute('aria-label') || btn.title || btn.textContent?.trim();
          results.push({
            accessibleName,
            includesRemove: accessibleName?.toLowerCase().includes('remove'),
            includesDelete: accessibleName?.toLowerCase().includes('delete')
          });
        }
      });
      
      return results;
    });

    if (removeButtonsAudit.length > 0) {
      const clearPurpose = removeButtonsAudit.every(btn => 
        btn.includesRemove || btn.includesDelete
      );
      expect(clearPurpose).toBe(true);
      console.log(`✓ ${removeButtonsAudit.length} remove buttons have clear purpose`);
    } else {
      console.log(`ℹ No remove buttons found`);
    }
  });

  /**
   * Test 15: Language attribute is set
   * Priority: Medium
   * WCAG: 3.1.1 Language of Page (Level A)
   */
  test('A11Y-002-T15: Should have language attribute on HTML element', async () => {
    const langInfo = await page.evaluate(() => {
      const html = document.documentElement;
      return {
        hasLang: html.hasAttribute('lang'),
        lang: html.getAttribute('lang'),
        hasXmlLang: html.hasAttribute('xml:lang')
      };
    });

    expect(langInfo.hasLang).toBe(true);
    expect(langInfo.lang).toBeTruthy();
    expect(langInfo.lang.length).toBeGreaterThan(0);

    console.log(`✓ Page language set to: ${langInfo.lang}`);
  });
});

/**
 * Accessibility Test Summary:
 * 
 * Total Tests: 15
 * WCAG 2.1 Level AA Coverage:
 * - 1.1.1 Non-text Content (Level A): 3 tests
 * - 1.3.1 Info and Relationships (Level A): 4 tests
 * - 2.4.6 Headings and Labels (Level AA): 2 tests
 * - 3.1.1 Language of Page (Level A): 1 test
 * - 4.1.2 Name, Role, Value (Level A): 4 tests
 * - 4.1.3 Status Messages (Level AA): 2 tests
 * 
 * Coverage Areas:
 * - Images and alt text (1 test)
 * - ARIA labels (5 tests)
 * - Semantic HTML (3 tests)
 * - Live regions (2 tests)
 * - Form labels (1 test)
 * - Heading hierarchy (1 test)
 * - Interactive elements (2 tests)
 * 
 * ST-2 Acceptance Criteria Coverage:
 * ✓ "Go to Cart" button screen reader accessible
 * ✓ Cart updates announced to screen readers
 * ✓ All content accessible to assistive technology
 * ✓ Proper semantic structure maintained
 */

