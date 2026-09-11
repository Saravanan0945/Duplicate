# Positive Test Cases for Shopping Cart Application

## Overview
This directory contains 15 comprehensive positive test case files that verify the core functionality of the "Go to Cart" button and shopping cart features as specified in Jira ticket ST-2.

## Test Files Summary

### 1. **test-add-single-item.js** (POS-001)
- **Test Cases**: 8
- **Coverage**: Adding single items to cart, badge updates, localStorage persistence, data structure validation
- **Priority**: High

### 2. **test-add-multiple-items.js** (POS-002)
- **Test Cases**: 10
- **Coverage**: Adding multiple different products, badge increments, unique product tracking, rapid additions
- **Priority**: High

### 3. **test-add-same-item-multiple-times.js** (POS-003)
- **Test Cases**: 11
- **Coverage**: Quantity increments, no duplicate entries, badge accuracy, timestamp updates
- **Priority**: High

### 4. **test-go-to-cart-navigation.js** (POS-004) ⭐ **PRIMARY ST-2 TEST**
- **Test Cases**: 12
- **Coverage**: Navigation to cart page, data preservation, product display, no data loss
- **Priority**: CRITICAL
- **ST-2 Acceptance Criteria**:
  - ✅ "Go to Cart" button is visible and clickable
  - ✅ User is redirected to the Cart page
  - ✅ Selected products are retained and displayed
  - ✅ No navigation or data loss issues

### 5. **test-cart-persistence.js** (POS-005)
- **Test Cases**: 10
- **Coverage**: Page reloads, navigation persistence, badge restoration, data structure integrity
- **Priority**: High

### 6. **test-cart-badge-update.js** (POS-006)
- **Test Cases**: 13
- **Coverage**: Badge display, real-time updates, quantity tracking, visibility, accessibility
- **Priority**: High

### 7. **test-remove-item.js** (POS-007)
- **Test Cases**: 8
- **Coverage**: Item removal, badge updates, total recalculation, empty cart state
- **Priority**: High

### 8. **test-update-quantity.js** (POS-008)
- **Test Cases**: 8
- **Coverage**: Increase/decrease quantity, total updates, badge updates, persistence
- **Priority**: High

### 9. **test-cart-total-calculation.js** (POS-009)
- **Test Cases**: 8
- **Coverage**: Subtotal, tax, total calculations, decimal handling, quantity updates
- **Priority**: High

### 10. **test-empty-cart.js** (POS-010)
- **Test Cases**: 7
- **Coverage**: Empty cart state, clear cart functionality, badge updates, messaging
- **Priority**: Medium

### 11. **test-continue-shopping.js** (POS-011)
- **Test Cases**: 6
- **Coverage**: Back navigation, cart preservation, button visibility, workflow continuity
- **Priority**: Medium

### 12. **test-product-display.js** (POS-012)
- **Test Cases**: 12
- **Coverage**: Product listing, images, prices, descriptions, layout, responsiveness
- **Priority**: High

### 13. **test-cart-item-display.js** (POS-013)
- **Test Cases**: 11
- **Coverage**: Cart item display, product details, quantities, controls, layout
- **Priority**: High

### 14. **test-multiple-sessions.js** (POS-014)
- **Test Cases**: 5
- **Coverage**: Session persistence, multiple tabs, quantities across sessions
- **Priority**: Medium

### 15. **test-responsive-layout.js** (POS-015)
- **Test Cases**: 15
- **Coverage**: Mobile, tablet, desktop viewports, orientation changes, touch targets
- **Priority**: High

---

## Total Test Coverage

| Metric | Count |
|--------|-------|
| **Total Test Files** | 15 |
| **Total Test Cases** | 134 |
| **Critical Tests** | 12 (ST-2 primary) |
| **High Priority Tests** | 108 |
| **Medium Priority Tests** | 14 |

---

## Running the Tests

### Prerequisites
```bash
npm install
```

### Run All Positive Tests
```bash
npm test tests/positive/
```

### Run Individual Test Files
```bash
# Primary ST-2 test
npm test tests/positive/test-go-to-cart-navigation.js

# Add to cart tests
npm test tests/positive/test-add-single-item.js
npm test tests/positive/test-add-multiple-items.js

# Cart functionality tests
npm test tests/positive/test-cart-persistence.js
npm test tests/positive/test-cart-badge-update.js

# And so on...
```

### Run with Coverage
```bash
npm test -- --coverage tests/positive/
```

---

## ST-2 Acceptance Criteria Mapping

### ✅ "Go to Cart" button is visible and clickable
- **test-go-to-cart-navigation.js**: Tests 1, 5
- **test-product-display.js**: Test 6

### ✅ User is redirected to the Cart page
- **test-go-to-cart-navigation.js**: Tests 2, 7, 8, 10
- **test-continue-shopping.js**: Test 1

### ✅ Selected products are retained and displayed
- **test-go-to-cart-navigation.js**: Tests 3, 4, 11
- **test-cart-persistence.js**: Tests 1, 3, 10
- **test-cart-item-display.js**: Tests 1-9

### ✅ No navigation or data loss issues
- **test-go-to-cart-navigation.js**: Tests 6, 12
- **test-cart-persistence.js**: Tests 1-7
- **test-multiple-sessions.js**: Tests 1-5

---

## Test Execution Guidelines

### 1. **Sequential Execution**
Run tests in order for best results:
```bash
npm test tests/positive/test-add-single-item.js
npm test tests/positive/test-add-multiple-items.js
npm test tests/positive/test-go-to-cart-navigation.js
# ... continue with remaining tests
```

### 2. **Parallel Execution**
For faster execution (if supported):
```bash
npm test tests/positive/ -- --maxWorkers=4
```

### 3. **Watch Mode**
For development:
```bash
npm test tests/positive/ -- --watch
```

### 4. **Debugging**
Run with headful browser:
```bash
HEADLESS=false npm test tests/positive/test-go-to-cart-navigation.js
```

---

## Expected Results

### Pass Criteria
- ✅ All 134 test cases pass
- ✅ No console errors
- ✅ Cart badge updates correctly
- ✅ localStorage contains valid data
- ✅ Navigation works reliably
- ✅ Products display correctly
- ✅ Calculations are accurate

### Performance Targets
- Page load: < 2 seconds
- Cart navigation: < 2 seconds
- Badge update: < 100ms
- Add to cart: < 500ms
- localStorage operations: < 50ms

---

## Test Data

### Products Used
- Minimum 10 products required
- Products have: id, name, price, description, image
- Price range: $39.99 - $199.99
- All products have valid images

### Cart States Tested
- Empty cart (0 items)
- Single item (1 item)
- Multiple items (2-10 items)
- High quantity (10+ of same item)
- Mixed quantities

---

## Browser Compatibility

Tests are designed to work on:
- ✅ Chrome/Chromium (primary)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

---

## Troubleshooting

### Common Issues

**1. Tests timing out**
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**2. localStorage not persisting**
```bash
# Clear browser data
rm -rf ~/.config/chromium/Default/Local\ Storage
```

**3. Selector not found**
```bash
# Check if selectors match your HTML
# Update selectors in test files if needed
```

**4. Port already in use**
```bash
# Change BASE_URL in test files
# Or kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

---

## Maintenance

### Updating Tests
When modifying the application:
1. Update affected test files
2. Run full test suite
3. Update this README if test counts change
4. Document any new test cases

### Adding New Tests
1. Follow naming convention: `test-feature-name.js`
2. Include test ID (POS-XXX)
3. Add summary to this README
4. Update total test count

---

## Success Metrics

### Definition of Done
- ✅ All 134 positive test cases pass
- ✅ ST-2 acceptance criteria fully covered
- ✅ No critical bugs found
- ✅ Performance targets met
- ✅ All browsers supported
- ✅ Documentation complete

### Quality Gates
- **Code Coverage**: > 80%
- **Pass Rate**: 100%
- **Performance**: All targets met
- **Accessibility**: WCAG 2.1 AA compliant

---

## Related Documentation
- [Main Test Plan](../go-to-cart-test-plan.md)
- [Test Execution Guide](../TEST_EXECUTION_GUIDE.md)
- [Test Coverage Matrix](../TEST_COVERAGE_MATRIX.md)
- [Security Tests](../security.test.js)
- [Performance Tests](../performance.test.js)

---

## Contact
For questions or issues with these tests, please refer to the main project documentation or contact the QA team.

---

**Last Updated**: 2024
**Test Suite Version**: 1.0
**Status**: ✅ Complete and Ready for Execution

