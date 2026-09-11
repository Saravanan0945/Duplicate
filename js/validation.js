/**
 * Validation Module
 * Handles input validation and data sanitization
 */

/**
 * Validate quantity input
 * @param {number} quantity - Quantity to validate
 * @param {number} maxStock - Maximum stock available
 * @returns {Object} Validation result with isValid and error message
 */
function validateQuantity(quantity, maxStock = 999) {
  const result = {
    isValid: false,
    error: '',
    sanitized: 0
  };

  if (quantity === null || quantity === undefined) {
    result.error = 'Quantity is required';
    return result;
  }

  const parsed = parseInt(quantity);

  if (isNaN(parsed)) {
    result.error = 'Quantity must be a valid number';
    return result;
  }

  if (!Number.isInteger(parsed)) {
    result.error = 'Quantity must be a whole number';
    return result;
  }

  if (parsed < 1) {
    result.error = 'Quantity must be at least 1';
    return result;
  }

  if (parsed > maxStock) {
    result.error = `Quantity cannot exceed available stock (${maxStock})`;
    return result;
  }

  if (parsed > 999) {
    result.error = 'Quantity cannot exceed 999';
    return result;
  }

  result.isValid = true;
  result.sanitized = parsed;
  return result;
}

/**
 * Validate product ID
 * @param {string} id - Product ID to validate
 * @param {Array} validProducts - Array of valid product objects (optional)
 * @returns {Object} Validation result
 */
function validateProductId(id, validProducts = null) {
  const result = {
    isValid: false,
    error: '',
    sanitized: ''
  };

  if (!id) {
    result.error = 'Product ID is required';
    return result;
  }

  if (typeof id !== 'string') {
    result.error = 'Product ID must be a string';
    return result;
  }

  const sanitized = sanitizeInput(id);

  if (sanitized.length === 0) {
    result.error = 'Product ID cannot be empty after sanitization';
    return result;
  }

  if (!/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
    result.error = 'Product ID contains invalid characters';
    return result;
  }

  if (validProducts) {
    const exists = validProducts.some(p => p.id === sanitized);
    if (!exists) {
      result.error = 'Product ID does not exist';
      return result;
    }
  }

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

/**
 * Sanitize input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"'&]/g, char => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    })
    .slice(0, 1000);
}

/**
 * Validate cart data structure
 * @param {Object} data - Cart data to validate
 * @returns {Object} Validation result
 */
function validateCartData(data) {
  const result = {
    isValid: false,
    error: '',
    sanitized: null
  };

  if (!data || typeof data !== 'object') {
    result.error = 'Cart data must be an object';
    return result;
  }

  if (!data.items || !Array.isArray(data.items)) {
    result.error = 'Cart items must be an array';
    return result;
  }

  const sanitizedItems = [];

  for (const item of data.items) {
    if (!item || typeof item !== 'object') {
      result.error = 'Invalid cart item structure';
      return result;
    }

    const idValidation = validateProductId(item.productId);
    if (!idValidation.isValid) {
      result.error = `Invalid product ID: ${idValidation.error}`;
      return result;
    }

    const quantityValidation = validateQuantity(item.quantity);
    if (!quantityValidation.isValid) {
      result.error = `Invalid quantity: ${quantityValidation.error}`;
      return result;
    }

    sanitizedItems.push({
      productId: idValidation.sanitized,
      quantity: quantityValidation.sanitized
    });
  }

  result.isValid = true;
  result.sanitized = {
    items: sanitizedItems,
    timestamp: Date.now()
  };

  return result;
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
function validateEmail(email) {
  const result = {
    isValid: false,
    error: '',
    sanitized: ''
  };

  if (!email || typeof email !== 'string') {
    result.error = 'Email is required';
    return result;
  }

  const sanitized = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    result.error = 'Invalid email format';
    return result;
  }

  if (sanitized.length > 254) {
    result.error = 'Email is too long';
    return result;
  }

  result.isValid = true;
  result.sanitized = sanitized.toLowerCase();
  return result;
}

/**
 * Validate price
 * @param {number} price - Price to validate
 * @returns {Object} Validation result
 */
function validatePrice(price) {
  const result = {
    isValid: false,
    error: '',
    sanitized: 0
  };

  if (price === null || price === undefined) {
    result.error = 'Price is required';
    return result;
  }

  const parsed = parseFloat(price);

  if (isNaN(parsed)) {
    result.error = 'Price must be a valid number';
    return result;
  }

  if (parsed < 0) {
    result.error = 'Price cannot be negative';
    return result;
  }

  if (parsed > 999999.99) {
    result.error = 'Price is too high';
    return result;
  }

  const rounded = Math.round(parsed * 100) / 100;

  result.isValid = true;
  result.sanitized = rounded;
  return result;
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
function validateUrl(url) {
  const result = {
    isValid: false,
    error: '',
    sanitized: ''
  };

  if (!url || typeof url !== 'string') {
    result.error = 'URL is required';
    return result;
  }

  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      result.error = 'URL must use HTTP or HTTPS protocol';
      return result;
    }

    result.isValid = true;
    result.sanitized = urlObj.href;
    return result;
  } catch (error) {
    result.error = 'Invalid URL format';
    return result;
  }
}

/**
 * Validate navigation target
 * @param {string} target - Navigation target (cart.html, index.html, etc.)
 * @returns {Object} Validation result
 */
function validateNavigationTarget(target) {
  const result = {
    isValid: false,
    error: '',
    sanitized: ''
  };

  if (!target || typeof target !== 'string') {
    result.error = 'Navigation target is required';
    return result;
  }

  const sanitized = sanitizeInput(target);
  const validTargets = ['cart.html', 'index.html', 'checkout.html'];

  if (!validTargets.includes(sanitized)) {
    result.error = 'Invalid navigation target';
    return result;
  }

  result.isValid = true;
  result.sanitized = sanitized;
  return result;
}

export {
  validateQuantity,
  validateProductId,
  sanitizeInput,
  validateCartData,
  validateEmail,
  validatePrice,
  validateUrl,
  validateNavigationTarget
};

