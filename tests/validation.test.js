/**
 * Unit Tests for Validation Module
 * Tests: Input validation, sanitization, security
 */

import {
  validateQuantity,
  validateProductId,
  sanitizeInput,
  validateCartData,
  validateEmail,
  validatePrice,
  validateUrl,
  validateNavigationTarget
} from '../js/validation.js';

describe('Validation Module - Unit Tests', () => {

  // QUANTITY VALIDATION TESTS

  describe('validateQuantity() - Positive Tests', () => {
    
    test('should accept valid quantity of 1', () => {
      const result = validateQuantity(1);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(1);
      expect(result.error).toBe('');
    });

    test('should accept quantity within stock limit', () => {
      const result = validateQuantity(50, 100);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(50);
    });

    test('should accept maximum quantity of 999', () => {
      const result = validateQuantity(999);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(999);
    });

    test('should accept string numbers', () => {
      const result = validateQuantity('5');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(5);
    });
  });

  describe('validateQuantity() - Negative Tests', () => {
    
    test('should reject null quantity', () => {
      const result = validateQuantity(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject undefined quantity', () => {
      const result = validateQuantity(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject negative quantity', () => {
      const result = validateQuantity(-5);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 1');
    });

    test('should reject zero quantity', () => {
      const result = validateQuantity(0);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 1');
    });

    test('should reject non-integer quantity', () => {
      const result = validateQuantity(2.5);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('whole number');
    });

    test('should reject quantity exceeding stock', () => {
      const result = validateQuantity(150, 100);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceed available stock');
    });

    test('should reject quantity over 999', () => {
      const result = validateQuantity(1000);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed 999');
    });

    test('should reject non-numeric strings', () => {
      const result = validateQuantity('abc');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid number');
    });
  });

  // PRODUCT ID VALIDATION TESTS

  describe('validateProductId() - Positive Tests', () => {
    
    test('should accept valid product ID', () => {
      const result = validateProductId('prod-001');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('prod-001');
    });

    test('should accept alphanumeric with hyphens', () => {
      const result = validateProductId('product-123-abc');
      
      expect(result.isValid).toBe(true);
    });

    test('should accept underscores', () => {
      const result = validateProductId('prod_001');
      
      expect(result.isValid).toBe(true);
    });

    test('should validate against product list', () => {
      const validProducts = [
        { id: 'prod-001' },
        { id: 'prod-002' }
      ];
      const result = validateProductId('prod-001', validProducts);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateProductId() - Negative Tests', () => {
    
    test('should reject empty string', () => {
      const result = validateProductId('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject null', () => {
      const result = validateProductId(null);
      
      expect(result.isValid).toBe(false);
    });

    test('should reject non-string', () => {
      const result = validateProductId(123);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    test('should reject special characters', () => {
      const result = validateProductId('prod@001');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('should reject non-existent product ID', () => {
      const validProducts = [{ id: 'prod-001' }];
      const result = validateProductId('prod-999', validProducts);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not exist');
    });
  });

  // SANITIZATION TESTS

  describe('sanitizeInput() - Security Tests', () => {
    
    test('should escape HTML tags', () => {
      const result = sanitizeInput('<script>alert("XSS")</script>');
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    test('should escape quotes', () => {
      const result = sanitizeInput('Test "quoted" text');
      
      expect(result).toContain('&quot;');
    });

    test('should escape ampersands', () => {
      const result = sanitizeInput('Tom & Jerry');
      
      expect(result).toContain('&amp;');
    });

    test('should trim whitespace', () => {
      const result = sanitizeInput('  test  ');
      
      expect(result).toBe('test');
    });

    test('should limit length to 1000 characters', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeInput(longString);
      
      expect(result.length).toBe(1000);
    });

    test('should handle empty string', () => {
      const result = sanitizeInput('');
      
      expect(result).toBe('');
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
    });

    test('should escape multiple dangerous characters', () => {
      const result = sanitizeInput('<img src=x onerror="alert(\'XSS\')">');
      
      expect(result).not.toContain('<img');
      expect(result).not.toContain('onerror=');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  // CART DATA VALIDATION TESTS

  describe('validateCartData() - Positive Tests', () => {
    
    test('should accept valid cart data', () => {
      const cartData = {
        items: [
          { productId: 'prod-001', quantity: 2 },
          { productId: 'prod-002', quantity: 1 }
        ]
      };
      const result = validateCartData(cartData);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized.items.length).toBe(2);
    });

    test('should accept empty cart', () => {
      const cartData = { items: [] };
      const result = validateCartData(cartData);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized.items.length).toBe(0);
    });

    test('should add timestamp to sanitized data', () => {
      const cartData = { items: [] };
      const result = validateCartData(cartData);
      
      expect(result.sanitized.timestamp).toBeDefined();
      expect(typeof result.sanitized.timestamp).toBe('number');
    });
  });

  describe('validateCartData() - Negative Tests', () => {
    
    test('should reject null data', () => {
      const result = validateCartData(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    test('should reject data without items array', () => {
      const result = validateCartData({ foo: 'bar' });
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be an array');
    });

    test('should reject invalid product ID in items', () => {
      const cartData = {
        items: [{ productId: '', quantity: 1 }]
      };
      const result = validateCartData(cartData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid product ID');
    });

    test('should reject invalid quantity in items', () => {
      const cartData = {
        items: [{ productId: 'prod-001', quantity: -1 }]
      };
      const result = validateCartData(cartData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid quantity');
    });

    test('should reject non-object items', () => {
      const cartData = {
        items: ['invalid']
      };
      const result = validateCartData(cartData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid cart item structure');
    });
  });

  // EMAIL VALIDATION TESTS

  describe('validateEmail()', () => {
    
    test('should accept valid email', () => {
      const result = validateEmail('user@example.com');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
    });

    test('should convert to lowercase', () => {
      const result = validateEmail('User@Example.COM');
      
      expect(result.sanitized).toBe('user@example.com');
    });

    test('should reject invalid format', () => {
      expect(validateEmail('invalid-email').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('@example.com').isValid).toBe(false);
    });

    test('should reject too long email', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      
      expect(result.isValid).toBe(false);
    });
  });

  // PRICE VALIDATION TESTS

  describe('validatePrice()', () => {
    
    test('should accept valid price', () => {
      const result = validatePrice(19.99);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(19.99);
    });

    test('should round to 2 decimal places', () => {
      const result = validatePrice(19.999);
      
      expect(result.sanitized).toBe(20.00);
    });

    test('should accept zero price', () => {
      const result = validatePrice(0);
      
      expect(result.isValid).toBe(true);
    });

    test('should reject negative price', () => {
      const result = validatePrice(-10);
      
      expect(result.isValid).toBe(false);
    });

    test('should reject extremely high price', () => {
      const result = validatePrice(1000000);
      
      expect(result.isValid).toBe(false);
    });
  });

  // URL VALIDATION TESTS

  describe('validateUrl()', () => {
    
    test('should accept valid HTTP URL', () => {
      const result = validateUrl('http://example.com');
      
      expect(result.isValid).toBe(true);
    });

    test('should accept valid HTTPS URL', () => {
      const result = validateUrl('https://example.com/path');
      
      expect(result.isValid).toBe(true);
    });

    test('should reject non-HTTP protocols', () => {
      expect(validateUrl('ftp://example.com').isValid).toBe(false);
      expect(validateUrl('javascript:alert(1)').isValid).toBe(false);
    });

    test('should reject invalid URL format', () => {
      const result = validateUrl('not-a-url');
      
      expect(result.isValid).toBe(false);
    });
  });

  // NAVIGATION TARGET VALIDATION TESTS

  describe('validateNavigationTarget()', () => {
    
    test('should accept cart.html', () => {
      const result = validateNavigationTarget('cart.html');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('cart.html');
    });

    test('should accept index.html', () => {
      const result = validateNavigationTarget('index.html');
      
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid targets', () => {
      expect(validateNavigationTarget('malicious.html').isValid).toBe(false);
      expect(validateNavigationTarget('../etc/passwd').isValid).toBe(false);
    });

    test('should reject empty target', () => {
      const result = validateNavigationTarget('');
      
      expect(result.isValid).toBe(false);
    });
  });

  // BOUNDARY VALUE TESTS

  describe('Boundary Value Tests', () => {
    
    test('should handle quantity at exact boundary (999)', () => {
      const result = validateQuantity(999);
      expect(result.isValid).toBe(true);
    });

    test('should reject quantity just over boundary (1000)', () => {
      const result = validateQuantity(1000);
      expect(result.isValid).toBe(false);
    });

    test('should handle price at maximum (999999.99)', () => {
      const result = validatePrice(999999.99);
      expect(result.isValid).toBe(true);
    });

    test('should reject price over maximum', () => {
      const result = validatePrice(1000000);
      expect(result.isValid).toBe(false);
    });

    test('should handle input at length limit (1000 chars)', () => {
      const input = 'a'.repeat(1000);
      const result = sanitizeInput(input);
      expect(result.length).toBe(1000);
    });

    test('should truncate input over limit', () => {
      const input = 'a'.repeat(1001);
      const result = sanitizeInput(input);
      expect(result.length).toBe(1000);
    });
  });

  // PERFORMANCE TESTS

  describe('Performance Tests', () => {
    
    test('should validate quantity quickly', () => {
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        validateQuantity(i % 100);
      }
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should sanitize input quickly', () => {
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        sanitizeInput('<script>test</script>');
      }
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});

