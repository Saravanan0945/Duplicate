/**
 * Navigation Mock for Testing
 * 
 * Provides mock implementations of browser navigation APIs
 * for use in Jest tests and other testing environments.
 * 
 * Features:
 * - window.location mock with full API
 * - Navigation history tracking
 * - URL manipulation
 * - Navigation event simulation
 * - Back/forward navigation
 * - Hash and query parameter handling
 * 
 * Usage:
 *   import { createNavigationMock } from './navigation-mock.js';
 *   const navMock = createNavigationMock();
 *   global.window.location = navMock.location;
 */

class NavigationMock {
  constructor(initialUrl = 'http://localhost/') {
    this.history = [initialUrl];
    this.currentIndex = 0;
    this.listeners = {
      beforeunload: [],
      hashchange: [],
      popstate: []
    };
    this._createLocationObject();
  }

  /**
   * Create location object with getters and setters
   * @private
   */
  _createLocationObject() {
    const self = this;
    
    this.location = {
      get href() {
        return self.history[self.currentIndex];
      },
      set href(url) {
        self.navigate(url);
      },
      get protocol() {
        return self._parseUrl().protocol;
      },
      get host() {
        return self._parseUrl().host;
      },
      get hostname() {
        return self._parseUrl().hostname;
      },
      get port() {
        return self._parseUrl().port;
      },
      get pathname() {
        return self._parseUrl().pathname;
      },
      set pathname(path) {
        const current = self._parseUrl();
        const newUrl = `${current.protocol}//${current.host}${path}${current.search}${current.hash}`;
        self.navigate(newUrl);
      },
      get search() {
        return self._parseUrl().search;
      },
      set search(query) {
        const current = self._parseUrl();
        const newUrl = `${current.protocol}//${current.host}${current.pathname}${query}${current.hash}`;
        self.navigate(newUrl);
      },
      get hash() {
        return self._parseUrl().hash;
      },
      set hash(hash) {
        const current = self._parseUrl();
        const oldHash = current.hash;
        const newUrl = `${current.protocol}//${current.host}${current.pathname}${current.search}${hash}`;
        self.navigate(newUrl);
        self._triggerHashChange(oldHash, hash);
      },
      get origin() {
        const parsed = self._parseUrl();
        return `${parsed.protocol}//${parsed.host}`;
      },
      assign(url) {
        self.navigate(url);
      },
      replace(url) {
        self.replace(url);
      },
      reload() {
        self.reload();
      },
      toString() {
        return self.history[self.currentIndex];
      }
    };
  }

  /**
   * Parse current URL
   * @private
   * @returns {Object} - Parsed URL components
   */
  _parseUrl() {
    const url = this.history[this.currentIndex];
    const match = url.match(/^(https?:)\/\/(([^:/?#]*)(?::([0-9]+))?)([^?#]*)(\?[^#]*)?(#.*)?$/);
    
    if (!match) {
      return {
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '',
        pathname: '/',
        search: '',
        hash: ''
      };
    }

    return {
      protocol: match[1] || 'http:',
      host: match[2] || 'localhost',
      hostname: match[3] || 'localhost',
      port: match[4] || '',
      pathname: match[5] || '/',
      search: match[6] || '',
      hash: match[7] || ''
    };
  }

  /**
   * Navigate to URL
   * @param {string} url - URL to navigate to
   */
  navigate(url) {
    const resolvedUrl = this._resolveUrl(url);
    
    // Trigger beforeunload
    const shouldNavigate = this._triggerBeforeUnload();
    if (!shouldNavigate) {
      return;
    }

    // Add to history
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(resolvedUrl);
    this.currentIndex++;

    // Trigger popstate
    this._triggerPopState();
  }

  /**
   * Replace current URL without adding to history
   * @param {string} url - URL to replace with
   */
  replace(url) {
    const resolvedUrl = this._resolveUrl(url);
    this.history[this.currentIndex] = resolvedUrl;
  }

  /**
   * Reload current page
   */
  reload() {
    // In mock, just trigger events
    this._triggerPopState();
  }

  /**
   * Go back in history
   * @returns {boolean} - True if navigation occurred
   */
  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._triggerPopState();
      return true;
    }
    return false;
  }

  /**
   * Go forward in history
   * @returns {boolean} - True if navigation occurred
   */
  forward() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this._triggerPopState();
      return true;
    }
    return false;
  }

  /**
   * Go to specific history index
   * @param {number} delta - Number of steps (negative for back, positive for forward)
   */
  go(delta) {
    const newIndex = this.currentIndex + delta;
    if (newIndex >= 0 && newIndex < this.history.length) {
      this.currentIndex = newIndex;
      this._triggerPopState();
    }
  }

  /**
   * Resolve relative URL to absolute
   * @private
   * @param {string} url - URL to resolve
   * @returns {string} - Absolute URL
   */
  _resolveUrl(url) {
    // If already absolute, return as-is
    if (url.match(/^https?:\/\//)) {
      return url;
    }

    const current = this._parseUrl();
    const base = `${current.protocol}//${current.host}`;

    // Absolute path
    if (url.startsWith('/')) {
      return base + url;
    }

    // Relative path
    const currentPath = current.pathname.split('/').slice(0, -1).join('/');
    return base + currentPath + '/' + url;
  }

  /**
   * Trigger beforeunload event
   * @private
   * @returns {boolean} - True if navigation should proceed
   */
  _triggerBeforeUnload() {
    let shouldNavigate = true;
    
    this.listeners.beforeunload.forEach(listener => {
      try {
        const result = listener({ preventDefault: () => { shouldNavigate = false; } });
        if (result === false) {
          shouldNavigate = false;
        }
      } catch (error) {
        console.error('Error in beforeunload listener:', error);
      }
    });

    return shouldNavigate;
  }

  /**
   * Trigger hashchange event
   * @private
   * @param {string} oldHash - Old hash value
   * @param {string} newHash - New hash value
   */
  _triggerHashChange(oldHash, newHash) {
    const event = {
      oldURL: this.history[this.currentIndex].replace(newHash, oldHash),
      newURL: this.history[this.currentIndex]
    };

    this.listeners.hashchange.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in hashchange listener:', error);
      }
    });
  }

  /**
   * Trigger popstate event
   * @private
   */
  _triggerPopState() {
    const event = {
      state: null
    };

    this.listeners.popstate.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in popstate listener:', error);
      }
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  addEventListener(event, listener) {
    if (this.listeners[event]) {
      this.listeners[event].push(listener);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  removeEventListener(event, listener) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(listener);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  /**
   * Get navigation history
   * @returns {Array} - History array
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Get current history index
   * @returns {number} - Current index
   */
  getCurrentIndex() {
    return this.currentIndex;
  }

  /**
   * Check if can go back
   * @returns {boolean} - True if can go back
   */
  canGoBack() {
    return this.currentIndex > 0;
  }

  /**
   * Check if can go forward
   * @returns {boolean} - True if can go forward
   */
  canGoForward() {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Reset navigation mock
   * @param {string} url - Initial URL
   */
  reset(url = 'http://localhost/') {
    this.history = [url];
    this.currentIndex = 0;
    this.listeners = {
      beforeunload: [],
      hashchange: [],
      popstate: []
    };
  }

  /**
   * Get query parameters as object
   * @returns {Object} - Query parameters
   */
  getQueryParams() {
    const search = this._parseUrl().search;
    if (!search) return {};

    const params = {};
    const query = search.substring(1);
    const pairs = query.split('&');

    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });

    return params;
  }

  /**
   * Set query parameter
   * @param {string} key - Parameter key
   * @param {string} value - Parameter value
   */
  setQueryParam(key, value) {
    const params = this.getQueryParams();
    params[key] = value;
    
    const query = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    
    this.location.search = '?' + query;
  }

  /**
   * Remove query parameter
   * @param {string} key - Parameter key
   */
  removeQueryParam(key) {
    const params = this.getQueryParams();
    delete params[key];
    
    const query = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    
    this.location.search = query ? '?' + query : '';
  }
}

/**
 * Create navigation mock instance
 * @param {string} initialUrl - Initial URL
 * @returns {NavigationMock} - Mock instance
 */
function createNavigationMock(initialUrl) {
  return new NavigationMock(initialUrl);
}

/**
 * Setup navigation mock for Jest
 * @param {string} initialUrl - Initial URL
 * @returns {NavigationMock} - Mock instance
 */
function setupNavigationMock(initialUrl = 'http://localhost/') {
  const mock = createNavigationMock(initialUrl);
  
  // Mock window.location
  delete global.window.location;
  global.window.location = mock.location;
  
  // Mock window.history
  global.window.history = {
    back: () => mock.back(),
    forward: () => mock.forward(),
    go: (delta) => mock.go(delta),
    length: mock.history.length
  };

  return mock;
}

/**
 * Create mock for cart page navigation
 * @returns {NavigationMock} - Mock configured for cart testing
 */
function createCartNavigationMock() {
  return createNavigationMock('http://localhost/index.html');
}

/**
 * Simulate navigation to cart page
 * @param {NavigationMock} mock - Navigation mock instance
 */
function navigateToCart(mock) {
  mock.navigate('http://localhost/cart.html');
}

/**
 * Simulate navigation back to products
 * @param {NavigationMock} mock - Navigation mock instance
 */
function navigateToProducts(mock) {
  mock.navigate('http://localhost/index.html');
}

/**
 * Check if currently on cart page
 * @param {NavigationMock} mock - Navigation mock instance
 * @returns {boolean} - True if on cart page
 */
function isOnCartPage(mock) {
  return mock.location.pathname.includes('cart.html');
}

/**
 * Check if currently on products page
 * @param {NavigationMock} mock - Navigation mock instance
 * @returns {boolean} - True if on products page
 */
function isOnProductsPage(mock) {
  return mock.location.pathname.includes('index.html') || mock.location.pathname === '/';
}

// Export for CommonJS (Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NavigationMock,
    createNavigationMock,
    setupNavigationMock,
    createCartNavigationMock,
    navigateToCart,
    navigateToProducts,
    isOnCartPage,
    isOnProductsPage
  };
}

// Export for ES6 modules
export {
  NavigationMock,
  createNavigationMock,
  setupNavigationMock,
  createCartNavigationMock,
  navigateToCart,
  navigateToProducts,
  isOnCartPage,
  isOnProductsPage
};

