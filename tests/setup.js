/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockProduct: (id = 'prod-001', overrides = {}) => ({
    id,
    name: 'Test Product',
    price: 19.99,
    description: 'Test description',
    image: 'https://example.com/image.jpg',
    category: 'Test',
    stock: 100,
    ...overrides
  }),

  createMockCartData: (items = []) => ({
    items: items.map(item => ({
      productId: item.productId || 'prod-001',
      quantity: item.quantity || 1
    }))
  }),

  simulateClick: (element) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  },

  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Console error suppression for expected errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('Error: Not implemented'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

