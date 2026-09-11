# Test Execution Guide
## Go to Cart Button Functionality - Complete Testing Manual

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Test Execution Steps](#test-execution-steps)
4. [Manual Testing Procedures](#manual-testing-procedures)
5. [Automated Testing](#automated-testing)
6. [Test Data Management](#test-data-management)
7. [Troubleshooting](#troubleshooting)
8. [Reporting](#reporting)

---

## Prerequisites

### Required Software
- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Git**: For version control
- **Text Editor**: VS Code, Sublime, or similar

### Optional Tools
- **Puppeteer**: For E2E testing
- **Jest**: For unit testing
- **http-server**: For local development server
- **Browser DevTools**: For debugging

### System Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB
- **Disk Space**: 500MB free
- **Network**: Internet connection for CDN resources

---

## Environment Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd /path/to/Duplicate

# Install npm dependencies
npm install

# Verify installation
npm list
```

### Step 2: Start Local Server

```bash
# Start HTTP server on port 8080
npm run serve

# Or use Python's built-in server
python -m http.server 8080

# Or use PHP's built-in server
php -S localhost:8080
```

### Step 3: Verify Server

Open browser and navigate to:
- **Index Page**: http://localhost:8080/index.html
- **Cart Page**: http://localhost:8080/cart.html

### Step 4: Clear Browser Data

Before testing:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear localStorage
4. Clear sessionStorage
5. Clear cookies
6. Hard refresh (Ctrl+Shift+R)

---

## Test Execution Steps

### Phase 1: Smoke Testing (15 minutes)

**Objective**: Verify basic functionality works

1. **Load Index Page**
   - Navigate to http://localhost:8080/index.html
   - Verify page loads without errors
   - Check console for JavaScript errors

2. **Add Product to Cart**
   - Click "Add to Cart" on any product
   - Verify toast notification appears
   - Verify cart badge updates

3. **Navigate to Cart**
   - Click "Go to Cart" button
   - Verify navigation to cart.html
   - Verify product appears in cart

4. **Return to Index**
   - Click "Continue Shopping"
   - Verify return to index.html
   - Verify cart badge persists

**Pass Criteria**: All 4 steps complete without errors

---

### Phase 2: Functional Testing (2 hours)

#### Test Suite 1: Positive Scenarios (45 minutes)

Execute tests GTC-POS-001 through GTC-POS-015 from the test plan.

**Execution Template**:
```
Test ID: GTC-POS-001
Status: [ ] Not Started [ ] In Progress [ ] Passed [ ] Failed
Start Time: __:__
End Time: __:__
Tester: ___________
Notes: _____________
```

**Key Tests**:
- ✅ Basic navigation (GTC-POS-001)
- ✅ Multiple products (GTC-POS-002)
- ✅ Badge updates (GTC-POS-003)
- ✅ Cart persistence (GTC-POS-005)
- ✅ Calculations (GTC-POS-009)

#### Test Suite 2: Negative Scenarios (45 minutes)

Execute tests GTC-NEG-001 through GTC-NEG-015.

**Critical Tests**:
- ❌ Empty cart navigation (GTC-NEG-001)
- ❌ Corrupted data (GTC-NEG-003)
- ❌ Invalid quantities (GTC-NEG-011, GTC-NEG-012)
- ❌ Large quantities (GTC-NEG-013)

#### Test Suite 3: Boundary Values (30 minutes)

Execute tests GTC-BND-001 through GTC-BND-010.

**Focus Areas**:
- 0 items (minimum)
- 1 item (minimum valid)
- 999 items (maximum)
- 18 products (all products)

---

### Phase 3: Security Testing (1 hour)

#### XSS Prevention Tests

**Test Procedure**:
1. Open browser DevTools Console
2. Execute injection attempts
3. Verify no script execution
4. Check for proper escaping

**Example Test**:
```javascript
// Attempt XSS injection
localStorage.setItem('shopping_cart', '<script>alert("XSS")</script>');
location.reload();
// Expected: No alert, data sanitized
```

**Tests to Execute**:
- SEC-001: Script tag injection
- SEC-002: Image onerror injection
- SEC-009: DOM-based XSS
- SEC-031: Iframe embedding

#### Input Validation Tests

**Test Procedure**:
1. Manually modify localStorage
2. Inject invalid data
3. Verify validation catches errors
4. Check error messages

**Example Test**:
```javascript
// Invalid quantity
localStorage.setItem('shopping_cart', JSON.stringify({
  version: '1.0',
  timestamp: Date.now(),
  cart: { items: [{ productId: 'prod-001', quantity: -5 }] }
}));
location.reload();
// Expected: Error notification, cart cleared
```

---

### Phase 4: Performance Testing (1 hour)

#### Load Time Tests

**Test Procedure**:
1. Open DevTools Network tab
2. Hard refresh page (Ctrl+Shift+R)
3. Record load times
4. Verify against thresholds

**Metrics to Capture**:
- **DOMContentLoaded**: < 1 second
- **Load Event**: < 2 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Time to Interactive**: < 3 seconds

**Recording Template**:
```
Test: Index Page Load
Attempt 1: ____ ms
Attempt 2: ____ ms
Attempt 3: ____ ms
Average: ____ ms
Pass/Fail: ____
```

#### Rendering Performance

**Test Procedure**:
1. Add 18 products to cart
2. Navigate to cart page
3. Measure render time using Performance API

**Console Test**:
```javascript
console.time('cartRender');
// Click "Go to Cart"
// Wait for page load
console.timeEnd('cartRender');
// Expected: < 500ms
```

---

### Phase 5: Responsive Design Testing (1 hour)

#### Desktop Testing (1920x1080)

**Test Procedure**:
1. Set viewport to 1920x1080
2. Execute core functionality tests
3. Verify layout and spacing
4. Check for overflow issues

**Checklist**:
- [ ] 4-column product grid
- [ ] Cart button visible and accessible
- [ ] No horizontal scrolling
- [ ] Images load properly
- [ ] Text readable

#### Tablet Testing (768x1024)

**Test Procedure**:
1. Set viewport to 768x1024
2. Test touch interactions
3. Verify responsive layout
4. Check button sizes (min 44x44px)

**Checklist**:
- [ ] 2-column product grid
- [ ] Touch-friendly buttons
- [ ] Proper spacing
- [ ] No layout breaks

#### Mobile Testing (375x667)

**Test Procedure**:
1. Set viewport to 375x667
2. Test with device emulation
3. Verify mobile navigation
4. Check performance on mobile

**Checklist**:
- [ ] Single-column layout
- [ ] Hamburger menu (if applicable)
- [ ] Easy thumb navigation
- [ ] Fast load times

---

## Manual Testing Procedures

### Procedure 1: Complete User Journey

**Objective**: Test end-to-end user flow

**Steps**:
1. Open index.html in fresh browser session
2. Browse products
3. Add 3 different products to cart
4. Verify cart badge shows "3"
5. Click "Go to Cart"
6. Verify all 3 products displayed
7. Update quantities
8. Remove one product
9. Verify totals recalculate
10. Click "Continue Shopping"
11. Add 2 more products
12. Return to cart
13. Verify all products present
14. Close browser
15. Reopen and navigate to index.html
16. Verify cart persists

**Expected Result**: All steps complete successfully, cart data persists

**Time Estimate**: 10 minutes

---

### Procedure 2: Error Handling Test

**Objective**: Verify graceful error handling

**Steps**:
1. Clear localStorage
2. Click "Go to Cart" with empty cart
3. Verify error message appears
4. Add product to cart
5. Manually corrupt localStorage:
   ```javascript
   localStorage.setItem('shopping_cart', '{invalid}');
   ```
6. Refresh page
7. Verify error handled gracefully
8. Add product again
9. Verify cart works normally

**Expected Result**: Errors caught and handled, user informed

**Time Estimate**: 5 minutes

---

### Procedure 3: Accessibility Test

**Objective**: Verify keyboard and screen reader accessibility

**Steps**:
1. Navigate using Tab key only
2. Verify focus indicators visible
3. Press Enter on "Add to Cart"
4. Tab to "Go to Cart"
5. Press Enter to navigate
6. Enable screen reader (NVDA/JAWS)
7. Navigate through page
8. Verify ARIA labels announced
9. Test with high contrast mode
10. Test with 200% zoom

**Expected Result**: Fully keyboard accessible, screen reader compatible

**Time Estimate**: 15 minutes

---

## Automated Testing

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test cart-storage.test.js

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Running E2E Tests

```bash
# Start server first
npm run serve

# In another terminal, run E2E tests
npm run test:e2e

# Run specific E2E test
npm test go-to-cart.test.js
```

### Running Security Tests

```bash
# Run security test suite
npm run test:security

# Expected: All tests pass, no vulnerabilities
```

### Running Performance Tests

```bash
# Run performance test suite
npm run test:performance

# Review performance metrics
```

### Continuous Integration

```bash
# Run CI test suite
npm run test:ci

# Generates coverage report and test results
```

---

## Test Data Management

### Test Data Sets

#### Dataset 1: Single Product
```javascript
{
  items: [
    { productId: 'prod-001', quantity: 1 }
  ]
}
```

#### Dataset 2: Multiple Products
```javascript
{
  items: [
    { productId: 'prod-001', quantity: 2 },
    { productId: 'prod-002', quantity: 1 },
    { productId: 'prod-003', quantity: 3 }
  ]
}
```

#### Dataset 3: Maximum Quantity
```javascript
{
  items: [
    { productId: 'prod-012', quantity: 300 }
  ]
}
```

#### Dataset 4: All Products
```javascript
{
  items: [
    { productId: 'prod-001', quantity: 1 },
    { productId: 'prod-002', quantity: 1 },
    // ... all 18 products
    { productId: 'prod-018', quantity: 1 }
  ]
}
```

### Loading Test Data

```javascript
// Function to load test data
function loadTestData(dataset) {
  localStorage.setItem('shopping_cart', JSON.stringify({
    version: '1.0',
    timestamp: Date.now(),
    cart: dataset
  }));
  location.reload();
}

// Usage
loadTestData(dataset1);
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Cart Badge Not Updating

**Symptoms**: Badge shows incorrect count or doesn't update

**Solutions**:
1. Check console for JavaScript errors
2. Verify `updateCartBadge()` function called
3. Check if badge element exists in DOM
4. Clear localStorage and retry

#### Issue 2: Navigation Fails

**Symptoms**: "Go to Cart" button doesn't navigate

**Solutions**:
1. Verify cart has items
2. Check for JavaScript errors
3. Verify cart.html exists
4. Check browser console for navigation errors

#### Issue 3: Data Not Persisting

**Symptoms**: Cart empties on page refresh

**Solutions**:
1. Check if localStorage enabled
2. Verify `saveCart()` function called
3. Check for storage quota errors
4. Test in incognito mode

#### Issue 4: Performance Issues

**Symptoms**: Slow page loads or laggy interactions

**Solutions**:
1. Check network tab for slow resources
2. Verify no memory leaks
3. Check for excessive DOM manipulation
4. Profile with DevTools Performance tab

---

## Reporting

### Test Report Template

```markdown
# Test Execution Report
## Go to Cart Button Functionality

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Browser/OS]
**Build**: [Version]

### Executive Summary
- Total Tests: 60
- Passed: __
- Failed: __
- Blocked: __
- Pass Rate: __%

### Test Results by Category

#### Positive Tests (15 tests)
- Passed: __
- Failed: __
- Pass Rate: __%

#### Negative Tests (15 tests)
- Passed: __
- Failed: __
- Pass Rate: __%

#### Security Tests (10 tests)
- Passed: __
- Failed: __
- Pass Rate: __%

#### Boundary Tests (10 tests)
- Passed: __
- Failed: __
- Pass Rate: __%

#### Performance Tests (10 tests)
- Passed: __
- Failed: __
- Pass Rate: __%

### Critical Defects
| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| | | | |

### Performance Metrics
- Index Load Time: __ ms
- Cart Load Time: __ ms
- Badge Update Time: __ ms
- Cart Render Time: __ ms

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

### Sign-off
Tester: _____________ Date: _______
Reviewer: ___________ Date: _______
```

---

## Test Execution Checklist

### Pre-Testing
- [ ] Environment setup complete
- [ ] Dependencies installed
- [ ] Server running
- [ ] Browser configured
- [ ] Test data prepared

### During Testing
- [ ] Record all test results
- [ ] Capture screenshots of failures
- [ ] Note console errors
- [ ] Document unexpected behavior
- [ ] Track time spent per test

### Post-Testing
- [ ] Complete test report
- [ ] File defect reports
- [ ] Update test cases
- [ ] Archive test artifacts
- [ ] Share results with team

---

## Appendix

### Keyboard Shortcuts

- **F12**: Open DevTools
- **Ctrl+Shift+R**: Hard refresh
- **Ctrl+Shift+I**: Inspect element
- **Ctrl+Shift+C**: Element picker
- **Ctrl+Shift+J**: Console

### Useful Console Commands

```javascript
// Clear localStorage
localStorage.clear();

// View cart data
console.log(JSON.parse(localStorage.getItem('shopping_cart')));

// Add test product
document.querySelector('[data-product-id="prod-001"]').click();

// Navigate to cart
document.getElementById('go-to-cart-btn').click();

// Check performance
performance.getEntriesByType('navigation')[0];
```

### Browser Compatibility Matrix

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 90+ | ✅ Supported | Recommended |
| Firefox | 88+ | ✅ Supported | Fully compatible |
| Safari | 14+ | ✅ Supported | Some CSS differences |
| Edge | 90+ | ✅ Supported | Chromium-based |
| IE 11 | - | ❌ Not Supported | Use Edge |

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Next Review**: [Date]

---

**END OF GUIDE**

