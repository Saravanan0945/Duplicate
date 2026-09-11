# Go to Cart Button Functionality - Comprehensive Test Plan

## Test Artifact Overview
This document contains 50+ test cases covering positive, negative, security, and boundary value scenarios for the "Go to Cart" button functionality.

---

## Test Environment Setup

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- localStorage enabled
- Network connectivity for external resources

### Test Data
- 18 products available in catalog
- Product IDs: prod-001 through prod-018
- Price range: $12.99 - $299.99
- Stock range: 30 - 400 units

---

## Test Categories

### Category 1: Positive Test Cases (Tests 1-15)
### Category 2: Negative Test Cases (Tests 16-30)
### Category 3: Security Test Cases (Tests 31-40)
### Category 4: Boundary Value Test Cases (Tests 41-50)
### Category 5: Performance & Usability Test Cases (Tests 51-60)

---

## CATEGORY 1: POSITIVE TEST CASES

### Test Case 1: Basic "Go to Cart" Navigation
**Test ID:** GTC-POS-001  
**Priority:** Critical  
**Objective:** Verify basic navigation to cart page with items

**Preconditions:**
- User is on index.html
- Cart is empty

**Test Steps:**
1. Click "Add to Cart" button for product prod-001
2. Verify cart badge shows "1"
3. Click "Go to Cart" button
4. Verify navigation to cart.html
5. Verify product prod-001 is displayed in cart

**Expected Results:**
- ✅ Navigation successful to cart.html
- ✅ Product displayed with correct details
- ✅ Cart badge persists with count "1"

**Test Data:**
- Product: Wireless Bluetooth Headphones (prod-001)
- Quantity: 1
- Price: $79.99

---

### Test Case 2: Multiple Products in Cart Navigation
**Test ID:** GTC-POS-002  
**Priority:** Critical  
**Objective:** Verify navigation with multiple products

**Preconditions:**
- User is on index.html
- Cart is empty

**Test Steps:**
1. Add prod-001 to cart (quantity: 1)
2. Add prod-002 to cart (quantity: 2)
3. Add prod-003 to cart (quantity: 3)
4. Verify cart badge shows "6"
5. Click "Go to Cart" button
6. Verify all 3 products displayed in cart

**Expected Results:**
- ✅ All products displayed correctly
- ✅ Quantities match: 1, 2, 3
- ✅ Total items: 6
- ✅ Subtotal calculated correctly

**Test Data:**
- Products: prod-001, prod-002, prod-003
- Total items: 6
- Expected subtotal: $529.96

---

### Test Case 3: Cart Badge Update After Adding Items
**Test ID:** GTC-POS-003  
**Priority:** High  
**Objective:** Verify cart badge updates correctly

**Test Steps:**
1. Start with empty cart
2. Add prod-001 (quantity: 1)
3. Verify badge shows "1"
4. Add prod-002 (quantity: 5)
5. Verify badge shows "6"
6. Click "Go to Cart"
7. Verify badge persists on cart page

**Expected Results:**
- ✅ Badge updates in real-time
- ✅ Badge shows correct count
- ✅ Badge visible on cart page

---

### Test Case 4: Navigation with Maximum Quantity
**Test ID:** GTC-POS-004  
**Priority:** Medium  
**Objective:** Verify navigation with max quantity items

**Test Steps:**
1. Add prod-012 with quantity 300 (max stock)
2. Verify cart badge shows "300"
3. Click "Go to Cart"
4. Verify product displayed with quantity 300

**Expected Results:**
- ✅ Navigation successful
- ✅ Quantity 300 displayed correctly
- ✅ Subtotal: $4,497.00

**Test Data:**
- Product: Cable Organizer Set (prod-012)
- Stock: 300
- Price: $14.99

---

### Test Case 5: Cart Persistence After Navigation
**Test ID:** GTC-POS-005  
**Priority:** Critical  
**Objective:** Verify cart data persists using localStorage

**Test Steps:**
1. Add prod-001, prod-002, prod-003 to cart
2. Click "Go to Cart"
3. Click "Continue Shopping" (back to index.html)
4. Verify cart badge still shows correct count
5. Click "Go to Cart" again
6. Verify all products still in cart

**Expected Results:**
- ✅ Cart data persists across navigation
- ✅ No data loss
- ✅ Badge count consistent

---

### Test Case 6: Toast Notification on Add to Cart
**Test ID:** GTC-POS-006  
**Priority:** Medium  
**Objective:** Verify success notification appears

**Test Steps:**
1. Click "Add to Cart" for prod-001
2. Observe toast notification
3. Verify message: "Added to cart successfully"
4. Verify notification type: success (green)

**Expected Results:**
- ✅ Toast appears immediately
- ✅ Success styling applied
- ✅ Auto-dismisses after 3 seconds

---

### Test Case 7: Cart Icon Visibility
**Test ID:** GTC-POS-007  
**Priority:** High  
**Objective:** Verify cart icon always visible

**Test Steps:**
1. Load index.html
2. Verify cart icon visible in header
3. Add items to cart
4. Verify icon remains visible
5. Navigate to cart.html
6. Verify icon visible on cart page

**Expected Results:**
- ✅ Icon visible on all pages
- ✅ Icon positioned correctly
- ✅ Icon clickable

---

### Test Case 8: Multiple Add to Cart Actions
**Test ID:** GTC-POS-008  
**Priority:** Medium  
**Objective:** Verify adding same product multiple times

**Test Steps:**
1. Click "Add to Cart" for prod-001
2. Click "Add to Cart" for prod-001 again
3. Click "Add to Cart" for prod-001 third time
4. Verify badge shows "3"
5. Click "Go to Cart"
6. Verify single product entry with quantity 3

**Expected Results:**
- ✅ Quantities aggregate correctly
- ✅ Single product entry in cart
- ✅ Total quantity: 3

---

### Test Case 9: Cart Summary Calculations
**Test ID:** GTC-POS-009  
**Priority:** Critical  
**Objective:** Verify cart totals calculated correctly

**Test Steps:**
1. Add prod-001 (qty: 2, price: $79.99)
2. Add prod-005 (qty: 1, price: $39.99)
3. Click "Go to Cart"
4. Verify subtotal: $199.97
5. Verify tax (10%): $19.99
6. Verify total: $219.96

**Expected Results:**
- ✅ Subtotal correct
- ✅ Tax calculated at 10%
- ✅ Total = subtotal + tax

---

### Test Case 10: Responsive Design - Desktop
**Test ID:** GTC-POS-010  
**Priority:** Medium  
**Objective:** Verify functionality on desktop (1920x1080)

**Test Steps:**
1. Set viewport to 1920x1080
2. Add products to cart
3. Click "Go to Cart"
4. Verify layout displays correctly
5. Verify all elements visible

**Expected Results:**
- ✅ 4-column product grid
- ✅ Cart button prominent
- ✅ No layout issues

---

### Test Case 11: Responsive Design - Tablet
**Test ID:** GTC-POS-011  
**Priority:** Medium  
**Objective:** Verify functionality on tablet (768x1024)

**Test Steps:**
1. Set viewport to 768x1024
2. Add products to cart
3. Click "Go to Cart"
4. Verify responsive layout

**Expected Results:**
- ✅ 2-column product grid
- ✅ Cart button accessible
- ✅ Touch-friendly buttons

---

### Test Case 12: Responsive Design - Mobile
**Test ID:** GTC-POS-012  
**Priority:** High  
**Objective:** Verify functionality on mobile (375x667)

**Test Steps:**
1. Set viewport to 375x667
2. Add products to cart
3. Click "Go to Cart"
4. Verify mobile layout

**Expected Results:**
- ✅ Single-column layout
- ✅ Cart button visible
- ✅ Easy navigation

---

### Test Case 13: Browser Back Button After Navigation
**Test ID:** GTC-POS-013  
**Priority:** Medium  
**Objective:** Verify browser back button works correctly

**Test Steps:**
1. Add products to cart on index.html
2. Click "Go to Cart"
3. Click browser back button
4. Verify returned to index.html
5. Verify cart badge still shows items

**Expected Results:**
- ✅ Back navigation works
- ✅ Cart data preserved
- ✅ No errors

---

### Test Case 14: Keyboard Navigation
**Test ID:** GTC-POS-014  
**Priority:** Medium  
**Objective:** Verify keyboard accessibility

**Test Steps:**
1. Use Tab key to navigate to "Add to Cart" button
2. Press Enter to add item
3. Tab to "Go to Cart" button
4. Press Enter to navigate
5. Verify navigation successful

**Expected Results:**
- ✅ All buttons keyboard accessible
- ✅ Focus indicators visible
- ✅ Enter key triggers actions

---

### Test Case 15: Screen Reader Compatibility
**Test ID:** GTC-POS-015  
**Priority:** Medium  
**Objective:** Verify ARIA labels and screen reader support

**Test Steps:**
1. Enable screen reader (NVDA/JAWS)
2. Navigate to "Go to Cart" button
3. Verify button announced correctly
4. Verify cart count announced
5. Click button and verify navigation

**Expected Results:**
- ✅ Button has proper ARIA label
- ✅ Cart count announced
- ✅ Navigation successful

---

## CATEGORY 2: NEGATIVE TEST CASES

### Test Case 16: Empty Cart Navigation Attempt
**Test ID:** GTC-NEG-001  
**Priority:** Critical  
**Objective:** Verify behavior when clicking "Go to Cart" with empty cart

**Preconditions:**
- Cart is empty
- User on index.html

**Test Steps:**
1. Ensure cart is empty (badge shows 0 or hidden)
2. Click "Go to Cart" button
3. Observe behavior

**Expected Results:**
- ✅ Error toast notification appears
- ✅ Message: "Your cart is empty. Add items before proceeding."
- ✅ No navigation occurs
- ✅ User remains on index.html

---

### Test Case 17: localStorage Disabled
**Test ID:** GTC-NEG-002  
**Priority:** High  
**Objective:** Verify graceful handling when localStorage unavailable

**Test Steps:**
1. Disable localStorage in browser
2. Add product to cart
3. Observe behavior
4. Click "Go to Cart"

**Expected Results:**
- ✅ Warning notification shown
- ✅ Cart functions in memory only
- ✅ Warning about data loss on refresh

---

### Test Case 18: Corrupted localStorage Data
**Test ID:** GTC-NEG-003  
**Priority:** High  
**Objective:** Verify handling of corrupted cart data

**Test Steps:**
1. Add products to cart
2. Manually corrupt localStorage data:
   ```javascript
   localStorage.setItem('shopping_cart', '{invalid json}')
   ```
3. Refresh page
4. Click "Go to Cart"

**Expected Results:**
- ✅ Corrupted data detected
- ✅ localStorage cleared
- ✅ Cart reset to empty
- ✅ Error notification shown

---

### Test Case 19: Network Disconnection
**Test ID:** GTC-NEG-004  
**Priority:** Medium  
**Objective:** Verify behavior when offline

**Test Steps:**
1. Add products to cart
2. Disconnect network
3. Click "Go to Cart"
4. Observe behavior

**Expected Results:**
- ✅ Navigation still works (local pages)
- ✅ Product images may fail to load
- ✅ Functionality preserved

---

### Test Case 20: JavaScript Disabled
**Test ID:** GTC-NEG-005  
**Priority:** Low  
**Objective:** Verify behavior without JavaScript

**Test Steps:**
1. Disable JavaScript in browser
2. Load index.html
3. Attempt to add products
4. Attempt to navigate to cart

**Expected Results:**
- ✅ Graceful degradation
- ✅ Fallback message displayed
- ✅ No JavaScript errors

---

### Test Case 21: Rapid Multiple Clicks on "Go to Cart"
**Test ID:** GTC-NEG-006  
**Priority:** Medium  
**Objective:** Verify no duplicate navigation or errors

**Test Steps:**
1. Add product to cart
2. Rapidly click "Go to Cart" button 10 times
3. Observe behavior

**Expected Results:**
- ✅ Single navigation occurs
- ✅ No duplicate page loads
- ✅ No errors in console

---

### Test Case 22: Product Removed from Catalog
**Test ID:** GTC-NEG-007  
**Priority:** Medium  
**Objective:** Verify handling when product no longer exists

**Test Steps:**
1. Add prod-001 to cart
2. Manually remove prod-001 from product catalog
3. Click "Go to Cart"
4. Observe cart display

**Expected Results:**
- ✅ Error handling for missing product
- ✅ Item shown with "Product unavailable" message
- ✅ Option to remove item

---

### Test Case 23: Stock Reduced Below Cart Quantity
**Test ID:** GTC-NEG-008  
**Priority:** High  
**Objective:** Verify handling when stock becomes insufficient

**Test Steps:**
1. Add prod-001 with quantity 10
2. Manually reduce stock to 5
3. Click "Go to Cart"
4. Observe warning

**Expected Results:**
- ✅ Warning notification shown
- ✅ Message: "Stock reduced. Max available: 5"
- ✅ Quantity auto-adjusted or user prompted

---

### Test Case 24: Browser Storage Quota Exceeded
**Test ID:** GTC-NEG-009  
**Priority:** Medium  
**Objective:** Verify handling when storage quota full

**Test Steps:**
1. Fill localStorage to quota limit
2. Attempt to add products to cart
3. Click "Go to Cart"

**Expected Results:**
- ✅ Quota exceeded error caught
- ✅ Old data cleared automatically
- ✅ Cart save retried
- ✅ User notified if retry fails

---

### Test Case 25: Invalid Product ID in Cart
**Test ID:** GTC-NEG-010  
**Priority:** High  
**Objective:** Verify validation of product IDs

**Test Steps:**
1. Manually inject invalid product ID into localStorage:
   ```javascript
   localStorage.setItem('shopping_cart', JSON.stringify({
     items: [{productId: 'invalid-id', quantity: 1}]
   }))
   ```
2. Refresh page
3. Click "Go to Cart"

**Expected Results:**
- ✅ Invalid ID detected
- ✅ Item filtered out or error shown
- ✅ Cart displays valid items only

---

### Test Case 26: Negative Quantity in Cart
**Test ID:** GTC-NEG-011  
**Priority:** High  
**Objective:** Verify quantity validation

**Test Steps:**
1. Manually set negative quantity in localStorage
2. Refresh page
3. Click "Go to Cart"

**Expected Results:**
- ✅ Negative quantity rejected
- ✅ Item removed or quantity set to 1
- ✅ Validation error logged

---

### Test Case 27: Non-Integer Quantity
**Test ID:** GTC-NEG-012  
**Priority:** Medium  
**Objective:** Verify integer validation for quantities

**Test Steps:**
1. Manually set quantity to 2.5 in localStorage
2. Refresh page
3. Click "Go to Cart"

**Expected Results:**
- ✅ Decimal quantity rejected
- ✅ Quantity rounded to integer
- ✅ User notified of correction

---

### Test Case 28: Extremely Large Quantity
**Test ID:** GTC-NEG-013  
**Priority:** Medium  
**Objective:** Verify upper limit validation

**Test Steps:**
1. Attempt to add product with quantity 10000
2. Click "Go to Cart"

**Expected Results:**
- ✅ Quantity capped at 999 or stock limit
- ✅ Warning notification shown
- ✅ Cart displays corrected quantity

---

### Test Case 29: Special Characters in Product Data
**Test ID:** GTC-NEG-014  
**Priority:** High  
**Objective:** Verify XSS prevention

**Test Steps:**
1. Manually inject product with malicious name:
   ```javascript
   {name: '<script>alert("XSS")</script>'}
   ```
2. Add to cart
3. Click "Go to Cart"

**Expected Results:**
- ✅ Script tags escaped/sanitized
- ✅ No script execution
- ✅ Safe display of product name

---

### Test Case 30: Concurrent Tab Modifications
**Test ID:** GTC-NEG-015  
**Priority:** Medium  
**Objective:** Verify behavior with multiple tabs

**Test Steps:**
1. Open index.html in two tabs
2. Add products in Tab 1
3. Add different products in Tab 2
4. Click "Go to Cart" in Tab 1
5. Check cart contents

**Expected Results:**
- ✅ Last write wins (expected behavior)
- ✅ No data corruption
- ✅ Cart displays consistently

---

## CATEGORY 3: SECURITY TEST CASES

### Test Case 31: XSS Attack via Product Name
**Test ID:** GTC-SEC-001  
**Priority:** Critical  
**Objective:** Prevent XSS through product data

**Test Steps:**
1. Inject malicious script in product name
2. Add to cart
3. Navigate to cart page
4. Verify script not executed

**Expected Results:**
- ✅ HTML entities escaped
- ✅ No script execution
- ✅ Safe rendering

**Attack Vectors:**
- `<script>alert('XSS')</script>`
- `<img src=x onerror=alert('XSS')>`
- `javascript:alert('XSS')`

---

### Test Case 32: XSS Attack via localStorage Injection
**Test ID:** GTC-SEC-002  
**Priority:** Critical  
**Objective:** Prevent XSS through localStorage manipulation

**Test Steps:**
1. Inject malicious data into localStorage
2. Refresh page
3. Click "Go to Cart"
4. Verify no script execution

**Expected Results:**
- ✅ Data sanitized on load
- ✅ Malicious content neutralized
- ✅ Security warning logged

---

### Test Case 33: SQL Injection Attempt (Client-Side)
**Test ID:** GTC-SEC-003  
**Priority:** Medium  
**Objective:** Verify input sanitization

**Test Steps:**
1. Attempt to inject SQL-like strings:
   ```
   productId: "'; DROP TABLE products; --"
   ```
2. Add to cart
3. Navigate to cart

**Expected Results:**
- ✅ Input sanitized
- ✅ Special characters escaped
- ✅ No errors

---

### Test Case 34: CSRF Token Validation (Future-Proofing)
**Test ID:** GTC-SEC-004  
**Priority:** Low  
**Objective:** Prepare for backend integration

**Test Steps:**
1. Document CSRF protection requirements
2. Verify cart operations are idempotent
3. Plan for token implementation

**Expected Results:**
- ✅ Operations safe for CSRF protection
- ✅ No state-changing GET requests

---

### Test Case 35: Content Security Policy Compliance
**Test ID:** GTC-SEC-005  
**Priority:** Medium  
**Objective:** Verify CSP headers compatibility

**Test Steps:**
1. Add strict CSP headers
2. Test cart functionality
3. Verify no inline script violations

**Expected Results:**
- ✅ No CSP violations
- ✅ External scripts whitelisted
- ✅ Inline styles avoided

---

### Test Case 36: Clickjacking Prevention
**Test ID:** GTC-SEC-006  
**Priority:** Medium  
**Objective:** Verify X-Frame-Options protection

**Test Steps:**
1. Attempt to embed page in iframe
2. Verify frame-busting or X-Frame-Options
3. Test "Go to Cart" in iframe context

**Expected Results:**
- ✅ Page cannot be framed
- ✅ Or frame-busting active
- ✅ Clickjacking prevented

---

### Test Case 37: Session Fixation Prevention
**Test ID:** GTC-SEC-007  
**Priority:** Low  
**Objective:** Verify cart isolation per session

**Test Steps:**
1. Create cart in one session
2. Attempt to access from different session
3. Verify isolation

**Expected Results:**
- ✅ Carts isolated by localStorage
- ✅ No cross-session access
- ✅ Data privacy maintained

---

### Test Case 38: Sensitive Data Exposure
**Test ID:** GTC-SEC-008  
**Priority:** Medium  
**Objective:** Verify no sensitive data in localStorage

**Test Steps:**
1. Add products to cart
2. Inspect localStorage contents
3. Verify no sensitive data stored

**Expected Results:**
- ✅ No payment information
- ✅ No personal data
- ✅ Only cart items stored

---

### Test Case 39: DOM-Based XSS Prevention
**Test ID:** GTC-SEC-009  
**Priority:** Critical  
**Objective:** Prevent DOM manipulation attacks

**Test Steps:**
1. Attempt to inject malicious URL parameters
2. Test with crafted hash fragments
3. Verify safe DOM updates

**Expected Results:**
- ✅ URL parameters sanitized
- ✅ Hash fragments validated
- ✅ No unsafe DOM manipulation

---

### Test Case 40: Prototype Pollution Prevention
**Test ID:** GTC-SEC-010  
**Priority:** High  
**Objective:** Prevent prototype pollution attacks

**Test Steps:**
1. Attempt to pollute Object.prototype
2. Add products to cart
3. Verify cart functionality unaffected

**Expected Results:**
- ✅ Prototype pollution prevented
- ✅ Object.create(null) used where appropriate
- ✅ Safe object operations

---

## CATEGORY 4: BOUNDARY VALUE TEST CASES

### Test Case 41: Zero Items in Cart
**Test ID:** GTC-BND-001  
**Priority:** Critical  
**Objective:** Test minimum boundary (0 items)

**Test Steps:**
1. Ensure cart has 0 items
2. Click "Go to Cart"
3. Verify error handling

**Expected Results:**
- ✅ Navigation blocked
- ✅ Error message shown
- ✅ User remains on index.html

---

### Test Case 42: Single Item in Cart
**Test ID:** GTC-BND-002  
**Priority:** High  
**Objective:** Test minimum valid boundary (1 item)

**Test Steps:**
1. Add exactly 1 item to cart
2. Click "Go to Cart"
3. Verify successful navigation

**Expected Results:**
- ✅ Navigation successful
- ✅ Single item displayed
- ✅ Totals calculated correctly

---

### Test Case 43: Maximum Items Per Product
**Test ID:** GTC-BND-003  
**Priority:** High  
**Objective:** Test quantity limit (999)

**Test Steps:**
1. Add product with quantity 999
2. Click "Go to Cart"
3. Verify display and calculations

**Expected Results:**
- ✅ Quantity 999 accepted
- ✅ Calculations correct
- ✅ No overflow errors

---

### Test Case 44: Maximum Items Per Product + 1
**Test ID:** GTC-BND-004  
**Priority:** High  
**Objective:** Test quantity limit exceeded (1000)

**Test Steps:**
1. Attempt to add product with quantity 1000
2. Verify validation error
3. Click "Go to Cart"

**Expected Results:**
- ✅ Quantity capped at 999
- ✅ Warning shown
- ✅ Cart displays 999

---

### Test Case 45: Maximum Unique Products
**Test ID:** GTC-BND-005  
**Priority:** Medium  
**Objective:** Test with all 18 products in cart

**Test Steps:**
1. Add all 18 products to cart (1 each)
2. Verify badge shows "18"
3. Click "Go to Cart"
4. Verify all products displayed

**Expected Results:**
- ✅ All 18 products shown
- ✅ Scrollable cart list
- ✅ Performance acceptable

---

### Test Case 46: Minimum Price Product
**Test ID:** GTC-BND-006  
**Priority:** Low  
**Objective:** Test lowest price ($12.99)

**Test Steps:**
1. Add prod-016 (Screen Cleaning Kit - $12.99)
2. Click "Go to Cart"
3. Verify calculations

**Expected Results:**
- ✅ Price displayed correctly
- ✅ Tax calculated: $1.30
- ✅ Total: $14.29

---

### Test Case 47: Maximum Price Product
**Test ID:** GTC-BND-007  
**Priority:** Low  
**Objective:** Test highest price ($299.99)

**Test Steps:**
1. Add prod-002 (Smart Watch Pro - $299.99)
2. Click "Go to Cart"
3. Verify calculations

**Expected Results:**
- ✅ Price displayed correctly
- ✅ Tax calculated: $30.00
- ✅ Total: $329.99

---

### Test Case 48: Cart Total Near Integer Overflow
**Test ID:** GTC-BND-008  
**Priority:** Low  
**Objective:** Test large cart totals

**Test Steps:**
1. Add prod-002 with quantity 999
2. Click "Go to Cart"
3. Verify calculations handle large numbers

**Expected Results:**
- ✅ Subtotal: $299,690.01
- ✅ Tax: $29,969.00
- ✅ Total: $329,659.01
- ✅ No overflow errors

---

### Test Case 49: Product Name Length Boundary
**Test ID:** GTC-BND-009  
**Priority:** Low  
**Objective:** Test display of long product names

**Test Steps:**
1. Add product with longest name
2. Click "Go to Cart"
3. Verify text wrapping/truncation

**Expected Results:**
- ✅ Name displays without breaking layout
- ✅ Text wraps or truncates gracefully
- ✅ Tooltip shows full name

---

### Test Case 50: localStorage Size Limit
**Test ID:** GTC-BND-010  
**Priority:** Medium  
**Objective:** Test storage capacity limits

**Test Steps:**
1. Add maximum products to approach 5MB limit
2. Click "Go to Cart"
3. Verify handling

**Expected Results:**
- ✅ Quota exceeded error caught
- ✅ Graceful degradation
- ✅ User notified

---

## CATEGORY 5: PERFORMANCE & USABILITY TEST CASES

### Test Case 51: Page Load Performance
**Test ID:** GTC-PERF-001  
**Priority:** Medium  
**Objective:** Verify fast page load times

**Test Steps:**
1. Clear cache
2. Load index.html
3. Measure time to interactive
4. Add products and navigate to cart
5. Measure cart page load time

**Expected Results:**
- ✅ Index.html loads < 2 seconds
- ✅ Cart.html loads < 1 second
- ✅ No render-blocking resources

---

### Test Case 52: Cart Badge Update Performance
**Test ID:** GTC-PERF-002  
**Priority:** Medium  
**Objective:** Verify real-time badge updates

**Test Steps:**
1. Add 10 products rapidly
2. Measure badge update latency
3. Verify no lag

**Expected Results:**
- ✅ Badge updates < 100ms
- ✅ Smooth animation
- ✅ No flickering

---

### Test Case 53: Large Cart Rendering Performance
**Test ID:** GTC-PERF-003  
**Priority:** Medium  
**Objective:** Test performance with many items

**Test Steps:**
1. Add all 18 products with high quantities
2. Click "Go to Cart"
3. Measure render time
4. Test scrolling performance

**Expected Results:**
- ✅ Cart renders < 500ms
- ✅ Smooth scrolling (60fps)
- ✅ No jank

---

### Test Case 54: Memory Leak Detection
**Test ID:** GTC-PERF-004  
**Priority:** Medium  
**Objective:** Verify no memory leaks

**Test Steps:**
1. Add/remove products 100 times
2. Navigate between pages 50 times
3. Monitor memory usage
4. Check for leaks

**Expected Results:**
- ✅ Memory usage stable
- ✅ No continuous growth
- ✅ Garbage collection effective

---

### Test Case 55: Button Click Responsiveness
**Test ID:** GTC-USA-001  
**Priority:** High  
**Objective:** Verify immediate visual feedback

**Test Steps:**
1. Click "Add to Cart" button
2. Observe button state change
3. Click "Go to Cart" button
4. Observe loading state

**Expected Results:**
- ✅ Immediate visual feedback (< 50ms)
- ✅ Button disabled during processing
- ✅ Loading indicator shown

---

### Test Case 56: Error Message Clarity
**Test ID:** GTC-USA-002  
**Priority:** High  
**Objective:** Verify user-friendly error messages

**Test Steps:**
1. Trigger various error conditions
2. Read error messages
3. Verify clarity and actionability

**Expected Results:**
- ✅ Messages clear and concise
- ✅ Suggest corrective actions
- ✅ No technical jargon

---

### Test Case 57: Color Contrast Accessibility
**Test ID:** GTC-USA-003  
**Priority:** Medium  
**Objective:** Verify WCAG AA compliance

**Test Steps:**
1. Use contrast checker tool
2. Test all button colors
3. Test text on backgrounds
4. Verify 4.5:1 ratio minimum

**Expected Results:**
- ✅ All text meets 4.5:1 ratio
- ✅ Buttons meet 3:1 ratio
- ✅ WCAG AA compliant

---

### Test Case 58: Touch Target Size (Mobile)
**Test ID:** GTC-USA-004  
**Priority:** High  
**Objective:** Verify mobile-friendly button sizes

**Test Steps:**
1. Test on mobile device (375x667)
2. Measure button dimensions
3. Verify minimum 44x44px

**Expected Results:**
- ✅ All buttons ≥ 44x44px
- ✅ Adequate spacing between buttons
- ✅ Easy to tap accurately

---

### Test Case 59: Loading State Indication
**Test ID:** GTC-USA-005  
**Priority:** Medium  
**Objective:** Verify loading feedback

**Test Steps:**
1. Click "Go to Cart" on slow connection
2. Observe loading indicators
3. Verify user informed of progress

**Expected Results:**
- ✅ Loading spinner shown
- ✅ Button disabled during load
- ✅ Progress indication clear

---

### Test Case 60: Confirmation Feedback
**Test ID:** GTC-USA-006  
**Priority:** Medium  
**Objective:** Verify success confirmation

**Test Steps:**
1. Add product to cart
2. Observe success feedback
3. Navigate to cart
4. Verify cart page confirms items

**Expected Results:**
- ✅ Toast notification on add
- ✅ Badge updates immediately
- ✅ Cart page shows confirmation

---

## Test Execution Summary Template

### Execution Metadata
- **Test Date:** [Date]
- **Tester:** [Name]
- **Environment:** [Browser/OS]
- **Build Version:** [Version]

### Results Summary
- **Total Tests:** 60
- **Passed:** [Count]
- **Failed:** [Count]
- **Blocked:** [Count]
- **Not Executed:** [Count]

### Pass Rate
- **Overall:** [Percentage]
- **Critical Tests:** [Percentage]
- **High Priority:** [Percentage]

### Defects Found
| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| | | | |

---

## Test Data Reference

### Valid Product IDs
```
prod-001 through prod-018
```

### Valid Quantities
```
Minimum: 1
Maximum: 999 or stock limit
```

### Valid Navigation Targets
```
- index.html (product listing)
- cart.html (shopping cart)
- checkout.html (future)
```

### localStorage Keys
```
- shopping_cart (main cart data)
```

---

## Automation Recommendations

### High Priority for Automation
1. Test Cases 1-15 (Positive scenarios)
2. Test Cases 16, 18, 25-29 (Critical negative scenarios)
3. Test Cases 31-32, 39 (Critical security scenarios)
4. Test Cases 41-44 (Boundary values)

### Manual Testing Recommended
1. Test Cases 14-15 (Accessibility)
2. Test Cases 55-60 (Usability)
3. Test Cases 10-12 (Responsive design)

---

## Appendix A: Test Environment Setup Script

```javascript
// Reset test environment
function resetTestEnvironment() {
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}

// Add test product to cart
function addTestProduct(productId, quantity = 1) {
  const addButton = document.querySelector(`[data-product-id="${productId}"]`);
  if (addButton) {
    for (let i = 0; i < quantity; i++) {
      addButton.click();
    }
  }
}

// Verify cart count
function verifyCartCount(expectedCount) {
  const badge = document.getElementById('cart-count');
  const actualCount = parseInt(badge.textContent);
  console.assert(actualCount === expectedCount, 
    `Expected ${expectedCount}, got ${actualCount}`);
}

// Navigate to cart
function navigateToCart() {
  document.getElementById('go-to-cart-btn').click();
}
```

---

## Appendix B: Bug Report Template

### Bug Report Format
```
**Bug ID:** [Unique ID]
**Title:** [Brief description]
**Severity:** Critical/High/Medium/Low
**Priority:** P0/P1/P2/P3

**Environment:**
- Browser: [Name/Version]
- OS: [Name/Version]
- Screen Resolution: [Width x Height]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Paste console errors]

**Additional Notes:**
[Any other relevant information]
```

---

## Document Control

**Version:** 1.0  
**Last Updated:** 2024  
**Author:** Test Engineering Team  
**Status:** Active  
**Next Review:** [Date]

---

**END OF TEST PLAN**

