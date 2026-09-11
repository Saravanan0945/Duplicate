/**
 * Product Data Module
 * Manages product catalog and product-related operations
 */

const products = [
  {
    id: 'prod-001',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    description: 'Premium noise-cancelling headphones with 30-hour battery life',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
    stock: 50
  },
  {
    id: 'prod-002',
    name: 'Smart Watch Pro',
    price: 299.99,
    description: 'Advanced fitness tracking with heart rate monitor and GPS',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category: 'Electronics',
    stock: 30
  },
  {
    id: 'prod-003',
    name: 'Laptop Backpack',
    price: 49.99,
    description: 'Water-resistant backpack with padded laptop compartment',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Accessories',
    stock: 100
  },
  {
    id: 'prod-004',
    name: 'Mechanical Keyboard',
    price: 129.99,
    description: 'RGB backlit mechanical keyboard with blue switches',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    category: 'Electronics',
    stock: 45
  },
  {
    id: 'prod-005',
    name: 'Wireless Mouse',
    price: 39.99,
    description: 'Ergonomic wireless mouse with precision tracking',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    category: 'Electronics',
    stock: 75
  },
  {
    id: 'prod-006',
    name: 'USB-C Hub',
    price: 59.99,
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
    category: 'Electronics',
    stock: 60
  },
  {
    id: 'prod-007',
    name: 'Portable Charger',
    price: 34.99,
    description: '20000mAh power bank with fast charging support',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
    category: 'Electronics',
    stock: 120
  },
  {
    id: 'prod-008',
    name: 'Phone Stand',
    price: 19.99,
    description: 'Adjustable aluminum phone stand for desk',
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
    category: 'Accessories',
    stock: 200
  },
  {
    id: 'prod-009',
    name: 'Webcam HD',
    price: 89.99,
    description: '1080p webcam with auto-focus and built-in microphone',
    image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400',
    category: 'Electronics',
    stock: 40
  },
  {
    id: 'prod-010',
    name: 'Desk Lamp LED',
    price: 44.99,
    description: 'Adjustable LED desk lamp with touch controls',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    category: 'Home',
    stock: 85
  },
  {
    id: 'prod-011',
    name: 'Bluetooth Speaker',
    price: 69.99,
    description: 'Waterproof portable speaker with 360° sound',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    category: 'Electronics',
    stock: 55
  },
  {
    id: 'prod-012',
    name: 'Cable Organizer Set',
    price: 14.99,
    description: 'Set of 10 cable clips and organizers',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    category: 'Accessories',
    stock: 300
  },
  {
    id: 'prod-013',
    name: 'Monitor Stand',
    price: 54.99,
    description: 'Wooden monitor stand with storage drawer',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    category: 'Accessories',
    stock: 70
  },
  {
    id: 'prod-014',
    name: 'Gaming Mouse Pad',
    price: 24.99,
    description: 'Extended RGB gaming mouse pad (900x400mm)',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400',
    category: 'Accessories',
    stock: 150
  },
  {
    id: 'prod-015',
    name: 'Laptop Cooling Pad',
    price: 39.99,
    description: 'Laptop cooling pad with 5 quiet fans',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
    category: 'Accessories',
    stock: 90
  },
  {
    id: 'prod-016',
    name: 'Screen Cleaning Kit',
    price: 12.99,
    description: 'Professional screen cleaning solution and microfiber cloth',
    image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400',
    category: 'Accessories',
    stock: 250
  },
  {
    id: 'prod-017',
    name: 'Ergonomic Wrist Rest',
    price: 18.99,
    description: 'Memory foam wrist rest for keyboard and mouse',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    category: 'Accessories',
    stock: 180
  },
  {
    id: 'prod-018',
    name: 'HDMI Cable 4K',
    price: 16.99,
    description: '6ft HDMI 2.1 cable supporting 4K@120Hz',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    category: 'Electronics',
    stock: 400
  }
];

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product object or null if not found
 */
function getProductById(id) {
  if (!id || typeof id !== 'string') {
    console.error('Invalid product ID provided');
    return null;
  }

  const product = products.find(p => p.id === id);
  return product ? { ...product } : null;
}

/**
 * Get all products
 * @returns {Array} Array of all products
 */
function getAllProducts() {
  return products.map(p => ({ ...p }));
}

/**
 * Get products by category
 * @param {string} category - Category name
 * @returns {Array} Array of products in the category
 */
function getProductsByCategory(category) {
  if (!category || typeof category !== 'string') {
    console.error('Invalid category provided');
    return [];
  }

  return products
    .filter(p => p.category.toLowerCase() === category.toLowerCase())
    .map(p => ({ ...p }));
}

/**
 * Get all unique categories
 * @returns {Array} Array of category names
 */
function getAllCategories() {
  const categories = [...new Set(products.map(p => p.category))];
  return categories.sort();
}

/**
 * Search products by name or description
 * @param {string} query - Search query
 * @returns {Array} Array of matching products
 */
function searchProducts(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return products
    .filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    )
    .map(p => ({ ...p }));
}

/**
 * Validate product data structure
 * @param {Object} product - Product object to validate
 * @returns {boolean} Validation result
 */
function validateProduct(product) {
  if (!product || typeof product !== 'object') {
    return false;
  }

  const requiredFields = ['id', 'name', 'price', 'description', 'image', 'category', 'stock'];
  
  for (const field of requiredFields) {
    if (!(field in product)) {
      return false;
    }
  }

  if (typeof product.id !== 'string' || product.id.length === 0) {
    return false;
  }

  if (typeof product.name !== 'string' || product.name.length === 0) {
    return false;
  }

  if (typeof product.price !== 'number' || product.price < 0) {
    return false;
  }

  if (typeof product.stock !== 'number' || product.stock < 0 || !Number.isInteger(product.stock)) {
    return false;
  }

  return true;
}

/**
 * Check if product is in stock
 * @param {string} productId - Product ID
 * @param {number} quantity - Desired quantity
 * @returns {boolean} Stock availability
 */
function isInStock(productId, quantity = 1) {
  const product = getProductById(productId);
  if (!product) {
    return false;
  }

  return product.stock >= quantity;
}

export {
  products,
  getProductById,
  getAllProducts,
  getProductsByCategory,
  getAllCategories,
  searchProducts,
  validateProduct,
  isInStock
};

