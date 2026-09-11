/**
 * Security Test Suite Runner
 * Executes all security test cases
 * 
 * @module test-suite-security
 * @description Runs all 10 security test files with 185 test cases
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Import configuration and utilities
const TestConfig = require('./test-config');
const TestUtils = require('./test-utils');

class SecurityTestSuiteRunner {
  constructor() {
    this.browser = null;
    this.results = {
      suiteName: 'Security Tests',
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      testFiles: [],
      startTime: null,
      endTime: null,
      vulnerabilities: []
    };
  }

  /**
   * Initialize test suite
   */
  async initialize() {
    console.log('\n' + '='.repeat(80));
    console.log('SECURITY TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Environment: ${TestConfig.currentEnvironment}`);
    console.log(`Base URL: ${TestConfig.getEnvironment().baseUrl}`);
    console.log('⚠️  Running security tests - may attempt malicious inputs');
    console.log('='.repeat(80) + '\n');

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: TestConfig.browser.headless,
      args: TestConfig.browser.args,
      slowMo: TestConfig.browser.slowMo,
      devtools: TestConfig.browser.devtools
    });

    this.results.startTime = Date.now();
  }

  /**
   * Run all security test files
   */
  async runAllTests() {
    const testFiles = [
      'security/test-xss-product-name.js',
      'security/test-xss-cart-data.js',
      'security/test-localstorage-tampering.js',
      'security/test-price-manipulation.js',
      'security/test-quantity-manipulation.js',
      'security/test-sql-injection.js',
      'security/test-html-injection.js',
      'security/test-session-hijacking.js',
      'security/test-data-sanitization.js',
      'security/test-csrf-protection.js'
    ];

    // Run security tests sequentially (not in parallel)
    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }
  }

  /**
   * Run individual test file
   * @param {string} testFile - Test file path
   */
  async runTestFile(testFile) {
    const testPath = path.join(__dirname, testFile);
    const testName = path.basename(testFile, '.js');

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Running: ${testName}`);
    console.log(`${'─'.repeat(80)}`);

    const fileResult = {
      fileName: testFile,
      testName: testName,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
      vulnerabilities: [],
      startTime: Date.now()
    };

    try {
      // Check if file exists
      if (!fs.existsSync(testPath)) {
        console.log(`⚠️  Test file not found: ${testFile}`);
        fileResult.skipped++;
        this.results.skipped++;
        this.results.testFiles.push(fileResult);
        return;
      }

      // Import and run test file
      const TestModule = require(testPath);
      
      // Create new page for this test file
      const page = await this.browser.newPage();
      
      try {
        // Setup test environment
        await TestUtils.setupTest(page, {
          clearStorage: true,
          clearCookies: true,
          viewport: TestConfig.browser.viewport
        });

        // Run tests from the module
        if (typeof TestModule.runTests === 'function') {
          const testResults = await TestModule.runTests(page, TestConfig.getEnvironment().baseUrl);
          
          // Process results
          if (Array.isArray(testResults)) {
            testResults.forEach(result => {
              fileResult.tests.push(result);
              if (result.passed) {
                fileResult.passed++;
                this.results.passed++;
              } else {
                fileResult.failed++;
                this.results.failed++;
                
                // Track vulnerabilities
                if (result.vulnerability) {
                  const vuln = {
                    testName: result.name,
                    severity: result.severity || 'medium',
                    description: result.error || 'Security vulnerability detected',
                    file: testFile
                  };
                  fileResult.vulnerabilities.push(vuln);
                  this.results.vulnerabilities.push(vuln);
                }
              }
              this.results.totalTests++;
            });
          }
        } else {
          console.log(`⚠️  Test file does not export runTests function: ${testFile}`);
          fileResult.skipped++;
          this.results.skipped++;
        }

        // Teardown
        await TestUtils.teardownTest(page, { clearStorage: true });
      } finally {
        await page.close();
      }

      fileResult.duration = Date.now() - fileResult.startTime;

      // Log results
      console.log(`\n✅ Passed: ${fileResult.passed}`);
      console.log(`❌ Failed: ${fileResult.failed}`);
      console.log(`⏭️  Skipped: ${fileResult.skipped}`);
      console.log(`🔒 Vulnerabilities: ${fileResult.vulnerabilities.length}`);
      console.log(`⏱️  Duration: ${fileResult.duration}ms`);

    } catch (error) {
      console.error(`\n❌ Error running test file: ${error.message}`);
      fileResult.failed++;
      this.results.failed++;
      fileResult.tests.push({
        name: 'Test File Execution',
        passed: false,
        error: error.message,
        duration: 0
      });
    }

    this.results.testFiles.push(fileResult);
  }

  /**
   * Generate test report
   */
  generateReport() {
    this.results.endTime = Date.now();
    this.results.duration = this.results.endTime - this.results.startTime;

    console.log('\n' + '='.repeat(80));
    console.log('SECURITY TEST SUITE RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passed} (${this.getPercentage(this.results.passed)}%)`);
    console.log(`❌ Failed: ${this.results.failed} (${this.getPercentage(this.results.failed)}%)`);
    console.log(`⏭️  Skipped: ${this.results.skipped} (${this.getPercentage(this.results.skipped)}%)`);
    console.log(`🔒 Vulnerabilities Found: ${this.results.vulnerabilities.length}`);
    console.log(`⏱️  Total Duration: ${this.formatDuration(this.results.duration)}`);
    console.log('='.repeat(80));

    // Pass rate
    const passRate = this.results.totalTests > 0 
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
      : 0;

    console.log(`\n📊 Pass Rate: ${passRate}%`);

    // Vulnerability summary
    if (this.results.vulnerabilities.length > 0) {
      console.log('\n🔒 SECURITY VULNERABILITIES:');
      
      const bySeverity = {
        critical: this.results.vulnerabilities.filter(v => v.severity === 'critical'),
        high: this.results.vulnerabilities.filter(v => v.severity === 'high'),
        medium: this.results.vulnerabilities.filter(v => v.severity === 'medium'),
        low: this.results.vulnerabilities.filter(v => v.severity === 'low')
      };

      if (bySeverity.critical.length > 0) {
        console.log(`\n  🔴 CRITICAL (${bySeverity.critical.length}):`);
        bySeverity.critical.forEach(v => {
          console.log(`    - ${v.testName}`);
          console.log(`      ${v.description}`);
        });
      }

      if (bySeverity.high.length > 0) {
        console.log(`\n  🟠 HIGH (${bySeverity.high.length}):`);
        bySeverity.high.forEach(v => {
          console.log(`    - ${v.testName}`);
          console.log(`      ${v.description}`);
        });
      }

      if (bySeverity.medium.length > 0) {
        console.log(`\n  🟡 MEDIUM (${bySeverity.medium.length}):`);
        bySeverity.medium.forEach(v => {
          console.log(`    - ${v.testName}`);
        });
      }

      if (bySeverity.low.length > 0) {
        console.log(`\n  🟢 LOW (${bySeverity.low.length}):`);
        bySeverity.low.forEach(v => {
          console.log(`    - ${v.testName}`);
        });
      }
    } else {
      console.log('\n✅ No security vulnerabilities detected!');
    }

    console.log('\n' + '='.repeat(80) + '\n');

    return this.results;
  }

  /**
   * Save report to file
   * @param {string} format - Report format (json, html)
   */
  async saveReport(format = 'json') {
    const reportDir = path.join(__dirname, 'reports', 'security');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    if (format === 'json') {
      const reportPath = path.join(reportDir, 'security-test-results.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 JSON report saved: ${reportPath}`);
    }

    if (format === 'html') {
      const reportPath = path.join(reportDir, 'security-test-report.html');
      const html = this.generateHTMLReport();
      fs.writeFileSync(reportPath, html);
      console.log(`📄 HTML report saved: ${reportPath}`);
    }
  }

  /**
   * Generate HTML report
   * @returns {string} HTML report
   */
  generateHTMLReport() {
    const passRate = this.results.totalTests > 0 
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
      : 0;

    const bySeverity = {
      critical: this.results.vulnerabilities.filter(v => v.severity === 'critical'),
      high: this.results.vulnerabilities.filter(v => v.severity === 'high'),
      medium: this.results.vulnerabilities.filter(v => v.severity === 'medium'),
      low: this.results.vulnerabilities.filter(v => v.severity === 'low')
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Test Suite Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #f44336; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card.passed { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
    .stat-card.failed { background: linear-gradient(135deg, #f44336 0%, #da190b 100%); }
    .stat-card.vulnerabilities { background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%); }
    .stat-card h3 { margin: 0; font-size: 14px; opacity: 0.9; }
    .stat-card .value { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .vulnerability-section { margin: 30px 0; padding: 20px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px; }
    .vulnerability { margin: 10px 0; padding: 15px; background: white; border-radius: 4px; border-left: 4px solid #ddd; }
    .vulnerability.critical { border-left-color: #d32f2f; background: #ffebee; }
    .vulnerability.high { border-left-color: #f57c00; background: #fff3e0; }
    .vulnerability.medium { border-left-color: #fbc02d; background: #fffde7; }
    .vulnerability.low { border-left-color: #689f38; background: #f1f8e9; }
    .pass-rate { font-size: 48px; font-weight: bold; text-align: center; margin: 30px 0; color: ${passRate >= 80 ? '#4CAF50' : passRate >= 60 ? '#ff9800' : '#f44336'}; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔒 Security Test Suite Report</h1>
    
    <div class="summary">
      <div class="stat-card">
        <h3>Total Tests</h3>
        <div class="value">${this.results.totalTests}</div>
      </div>
      <div class="stat-card passed">
        <h3>Passed</h3>
        <div class="value">${this.results.passed}</div>
        <div>${this.getPercentage(this.results.passed)}%</div>
      </div>
      <div class="stat-card failed">
        <h3>Failed</h3>
        <div class="value">${this.results.failed}</div>
        <div>${this.getPercentage(this.results.failed)}%</div>
      </div>
      <div class="stat-card vulnerabilities">
        <h3>Vulnerabilities</h3>
        <div class="value">${this.results.vulnerabilities.length}</div>
      </div>
    </div>

    <div class="pass-rate">Security Score: ${passRate}%</div>

    ${this.results.vulnerabilities.length > 0 ? `
      <div class="vulnerability-section">
        <h2>🔒 Security Vulnerabilities Found</h2>
        
        ${bySeverity.critical.length > 0 ? `
          <h3 style="color: #d32f2f;">🔴 Critical (${bySeverity.critical.length})</h3>
          ${bySeverity.critical.map(v => `
            <div class="vulnerability critical">
              <strong>${v.testName}</strong>
              <p>${v.description}</p>
              <small>File: ${v.file}</small>
            </div>
          `).join('')}
        ` : ''}

        ${bySeverity.high.length > 0 ? `
          <h3 style="color: #f57c00;">🟠 High (${bySeverity.high.length})</h3>
          ${bySeverity.high.map(v => `
            <div class="vulnerability high">
              <strong>${v.testName}</strong>
              <p>${v.description}</p>
              <small>File: ${v.file}</small>
            </div>
          `).join('')}
        ` : ''}

        ${bySeverity.medium.length > 0 ? `
          <h3 style="color: #fbc02d;">🟡 Medium (${bySeverity.medium.length})</h3>
          ${bySeverity.medium.map(v => `
            <div class="vulnerability medium">
              <strong>${v.testName}</strong>
              <p>${v.description}</p>
              <small>File: ${v.file}</small>
            </div>
          `).join('')}
        ` : ''}

        ${bySeverity.low.length > 0 ? `
          <h3 style="color: #689f38;">🟢 Low (${bySeverity.low.length})</h3>
          ${bySeverity.low.map(v => `
            <div class="vulnerability low">
              <strong>${v.testName}</strong>
              <p>${v.description}</p>
              <small>File: ${v.file}</small>
            </div>
          `).join('')}
        ` : ''}
      </div>
    ` : '<div style="padding: 20px; background: #e8f5e9; border-radius: 4px; text-align: center;"><h2>✅ No Security Vulnerabilities Detected!</h2></div>'}

    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px; text-align: center; color: #666;">
      <p>Generated: ${new Date(this.results.endTime).toLocaleString()}</p>
      <p>Total Duration: ${this.formatDuration(this.results.duration)}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get percentage
   * @param {number} value - Value
   * @returns {string} Percentage
   */
  getPercentage(value) {
    if (this.results.totalTests === 0) return '0.00';
    return ((value / this.results.totalTests) * 100).toFixed(2);
  }

  /**
   * Format duration
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Run complete test suite
   */
  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      const results = this.generateReport();
      await this.saveReport('json');
      await this.saveReport('html');
      return results;
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new SecurityTestSuiteRunner();
  runner.run()
    .then(results => {
      // Exit with error if vulnerabilities found
      process.exit(results.vulnerabilities.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = SecurityTestSuiteRunner;

