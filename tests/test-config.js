/**
 * Test Configuration
 * Central configuration for all test suites
 * 
 * @module test-config
 * @description Provides configuration settings for test execution including
 *              timeouts, retries, environments, and test suite settings
 */

const TestConfig = {
  // ============================================================================
  // ENVIRONMENT CONFIGURATION
  // ============================================================================
  
  environments: {
    development: {
      baseUrl: 'http://localhost:3000',
      cartUrl: 'http://localhost:3000/cart.html',
      indexUrl: 'http://localhost:3000/index.html',
      apiUrl: null, // No backend API in this implementation
      debug: true,
      verbose: true
    },
    staging: {
      baseUrl: 'https://staging.example.com',
      cartUrl: 'https://staging.example.com/cart.html',
      indexUrl: 'https://staging.example.com/index.html',
      apiUrl: null,
      debug: true,
      verbose: false
    },
    production: {
      baseUrl: 'https://example.com',
      cartUrl: 'https://example.com/cart.html',
      indexUrl: 'https://example.com/index.html',
      apiUrl: null,
      debug: false,
      verbose: false
    }
  },

  // Current environment (can be overridden by ENV variable)
  currentEnvironment: process.env.TEST_ENV || 'development',

  // ============================================================================
  // TIMEOUT CONFIGURATION
  // ============================================================================
  
  timeouts: {
    // Default timeout for all tests (30 seconds)
    default: 30000,
    
    // Page load timeout (10 seconds)
    pageLoad: 10000,
    
    // Navigation timeout (5 seconds)
    navigation: 5000,
    
    // Element wait timeout (5 seconds)
    elementWait: 5000,
    
    // Animation timeout (1 second)
    animation: 1000,
    
    // localStorage operation timeout (500ms)
    storage: 500,
    
    // Network request timeout (10 seconds)
    network: 10000,
    
    // Performance test timeout (60 seconds)
    performance: 60000,
    
    // E2E test timeout (120 seconds)
    e2e: 120000,
    
    // Security test timeout (45 seconds)
    security: 45000
  },

  // ============================================================================
  // RETRY CONFIGURATION
  // ============================================================================
  
  retries: {
    // Default retry count for flaky tests
    default: 2,
    
    // Retry count for critical tests
    critical: 3,
    
    // Retry count for performance tests (no retries)
    performance: 0,
    
    // Retry count for E2E tests
    e2e: 2,
    
    // Retry count for security tests
    security: 1,
    
    // Retry delay in milliseconds
    delay: 1000,
    
    // Exponential backoff multiplier
    backoffMultiplier: 2
  },

  // ============================================================================
  // BROWSER CONFIGURATION
  // ============================================================================
  
  browser: {
    // Headless mode (set to false for debugging)
    headless: process.env.HEADLESS !== 'false',
    
    // Browser viewport
    viewport: {
      width: 1280,
      height: 720
    },
    
    // Slow down operations for debugging (milliseconds)
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    
    // DevTools open (for debugging)
    devtools: process.env.DEVTOOLS === 'true',
    
    // Browser args
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    
    // Browsers to test
    browsers: ['chromium', 'firefox', 'webkit']
  },

  // ============================================================================
  // TEST SUITE CONFIGURATION
  // ============================================================================
  
  suites: {
    positive: {
      enabled: true,
      parallel: true,
      maxWorkers: 4,
      timeout: 30000,
      retries: 2
    },
    negative: {
      enabled: true,
      parallel: true,
      maxWorkers: 4,
      timeout: 30000,
      retries: 2
    },
    security: {
      enabled: true,
      parallel: false, // Run sequentially for security tests
      maxWorkers: 1,
      timeout: 45000,
      retries: 1
    },
    boundary: {
      enabled: true,
      parallel: true,
      maxWorkers: 4,
      timeout: 30000,
      retries: 2
    },
    integration: {
      enabled: true,
      parallel: false,
      maxWorkers: 2,
      timeout: 60000,
      retries: 2
    },
    e2e: {
      enabled: true,
      parallel: false,
      maxWorkers: 1,
      timeout: 120000,
      retries: 2
    },
    performance: {
      enabled: true,
      parallel: false,
      maxWorkers: 1,
      timeout: 60000,
      retries: 0
    },
    accessibility: {
      enabled: true,
      parallel: true,
      maxWorkers: 2,
      timeout: 30000,
      retries: 1
    }
  },

  // ============================================================================
  // REPORTING CONFIGURATION
  // ============================================================================
  
  reporting: {
    // Console output
    console: {
      enabled: true,
      verbose: process.env.VERBOSE === 'true',
      colors: process.env.NO_COLOR !== '1'
    },
    
    // HTML report
    html: {
      enabled: true,
      outputDir: 'tests/reports/html',
      filename: 'test-report.html'
    },
    
    // JSON report
    json: {
      enabled: true,
      outputDir: 'tests/reports/json',
      filename: 'test-results.json'
    },
    
    // JUnit XML report (for CI/CD)
    junit: {
      enabled: true,
      outputDir: 'tests/reports/junit',
      filename: 'junit.xml'
    },
    
    // Coverage report
    coverage: {
      enabled: true,
      outputDir: 'tests/reports/coverage',
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },
    
    // Screenshots on failure
    screenshots: {
      enabled: true,
      outputDir: 'tests/reports/screenshots',
      onFailure: true,
      onSuccess: false
    },
    
    // Video recording
    video: {
      enabled: false,
      outputDir: 'tests/reports/videos',
      onFailure: true,
      onSuccess: false
    }
  },

  // ============================================================================
  // PERFORMANCE BENCHMARKS
  // ============================================================================
  
  performance: {
    // Page load time (milliseconds)
    pageLoadTime: {
      target: 2000,
      warning: 3000,
      critical: 5000
    },
    
    // Cart load time (milliseconds)
    cartLoadTime: {
      target: 1000,
      warning: 2000,
      critical: 3000
    },
    
    // Badge update time (milliseconds)
    badgeUpdateTime: {
      target: 100,
      warning: 200,
      critical: 500
    },
    
    // localStorage operation time (milliseconds)
    storageOperationTime: {
      target: 50,
      warning: 100,
      critical: 200
    },
    
    // Rendering time for 50 items (milliseconds)
    largeCartRenderTime: {
      target: 500,
      warning: 1000,
      critical: 2000
    },
    
    // Memory usage (MB)
    memoryUsage: {
      target: 50,
      warning: 100,
      critical: 200
    },
    
    // FPS (frames per second)
    fps: {
      target: 60,
      warning: 30,
      critical: 15
    }
  },

  // ============================================================================
  // ACCESSIBILITY STANDARDS
  // ============================================================================
  
  accessibility: {
    // WCAG compliance level
    wcagLevel: 'AA', // 'A', 'AA', or 'AAA'
    
    // WCAG version
    wcagVersion: '2.1',
    
    // Rules to check
    rules: {
      colorContrast: true,
      keyboardNavigation: true,
      ariaLabels: true,
      altText: true,
      focusManagement: true,
      semanticHTML: true,
      formLabels: true,
      headingStructure: true
    },
    
    // Minimum contrast ratio
    contrastRatio: {
      normal: 4.5,
      large: 3.0
    }
  },

  // ============================================================================
  // SECURITY CONFIGURATION
  // ============================================================================
  
  security: {
    // XSS test payloads
    xssPayloads: [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>'
    ],
    
    // SQL injection payloads
    sqlPayloads: [
      "' OR '1'='1",
      "1' OR '1'='1' --",
      "admin'--",
      "' UNION SELECT NULL--"
    ],
    
    // Maximum allowed input length
    maxInputLength: 1000,
    
    // Allowed characters regex
    allowedCharsRegex: /^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=[\]{}:;"'<>\/\\|`~]+$/
  },

  // ============================================================================
  // DATA VALIDATION
  // ============================================================================
  
  validation: {
    // Product ID validation
    productId: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9\-_]+$/
    },
    
    // Quantity validation
    quantity: {
      min: 1,
      max: 999,
      default: 1
    },
    
    // Price validation
    price: {
      min: 0,
      max: 999999.99,
      decimals: 2
    },
    
    // Product name validation
    productName: {
      minLength: 1,
      maxLength: 255
    },
    
    // Cart size limits
    cart: {
      maxItems: 100,
      maxTotalQuantity: 9999
    }
  },

  // ============================================================================
  // STORAGE CONFIGURATION
  // ============================================================================
  
  storage: {
    // localStorage key
    cartKey: 'shopping_cart',
    
    // Storage quota (bytes)
    quota: 5 * 1024 * 1024, // 5MB
    
    // Data expiration (milliseconds)
    expiration: 7 * 24 * 60 * 60 * 1000, // 7 days
    
    // Version for data migration
    version: '1.0.0'
  },

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Get current environment configuration
   * @returns {Object} Environment configuration
   */
  getEnvironment() {
    return this.environments[this.currentEnvironment];
  },

  /**
   * Get timeout for specific test type
   * @param {string} type - Test type (default, pageLoad, etc.)
   * @returns {number} Timeout in milliseconds
   */
  getTimeout(type = 'default') {
    return this.timeouts[type] || this.timeouts.default;
  },

  /**
   * Get retry configuration for test type
   * @param {string} type - Test type
   * @returns {Object} Retry configuration
   */
  getRetryConfig(type = 'default') {
    return {
      count: this.retries[type] || this.retries.default,
      delay: this.retries.delay,
      backoffMultiplier: this.retries.backoffMultiplier
    };
  },

  /**
   * Check if test suite is enabled
   * @param {string} suite - Suite name
   * @returns {boolean} True if enabled
   */
  isSuiteEnabled(suite) {
    return this.suites[suite]?.enabled ?? true;
  },

  /**
   * Get suite configuration
   * @param {string} suite - Suite name
   * @returns {Object} Suite configuration
   */
  getSuiteConfig(suite) {
    return this.suites[suite] || {
      enabled: true,
      parallel: true,
      maxWorkers: 4,
      timeout: 30000,
      retries: 2
    };
  },

  /**
   * Check if performance benchmark is met
   * @param {string} metric - Metric name
   * @param {number} value - Measured value
   * @returns {Object} Result with status and message
   */
  checkPerformance(metric, value) {
    const benchmark = this.performance[metric];
    if (!benchmark) {
      return { status: 'unknown', message: 'Unknown metric' };
    }

    if (value <= benchmark.target) {
      return { status: 'pass', message: 'Performance target met' };
    } else if (value <= benchmark.warning) {
      return { status: 'warning', message: 'Performance warning threshold exceeded' };
    } else if (value <= benchmark.critical) {
      return { status: 'critical', message: 'Performance critical threshold exceeded' };
    } else {
      return { status: 'fail', message: 'Performance benchmark failed' };
    }
  }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestConfig;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.TestConfig = TestConfig;
}

