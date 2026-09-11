/**
 * Negative Test Suite Runner
 * Executes all negative test cases
 * 
 * @module test-suite-negative
 * @description Runs all 12 negative test files with 168 test cases
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Import configuration and utilities
const TestConfig = require('./test-config');
const TestUtils = require('./test-utils');

class NegativeTestSuiteRunner {
  constructor() {
    this.browser = null;
    this.results = {
      suiteName: 'Negative Tests',
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      testFiles: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Initialize test suite
   */
  async initialize() {
    console.log('\n' + '='.repeat(80));
    console.log('NEGATIVE TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Environment: ${TestConfig.currentEnvironment}`);
    console.log(`Base URL: ${TestConfig.getEnvironment().baseUrl}`);
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
   * Run all negative test files
   */
  async runAllTests() {
    const testFiles = [
      'negative/test-add-invalid-product.js',
      'negative/test-add-zero-quantity.js',
      'negative/test-add-negative-quantity.js',
      'negative/test-remove-nonexistent-item.js',
      'negative/test-exceed-stock-limit.js',
      'negative/test-invalid-cart-data.js',
      'negative/test-missing-product-data.js',
      'negative/test-navigation-without-items.js',
      'negative/test-duplicate-add-clicks.js',
      'negative/test-browser-back-button.js',
      'negative/test-disabled-javascript.js',
      'negative/test-network-failure.js'
    ];

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
    console.log('NEGATIVE TEST SUITE RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passed} (${this.getPercentage(this.results.passed)}%)`);
    console.log(`❌ Failed: ${this.results.failed} (${this.getPercentage(this.results.failed)}%)`);
    console.log(`⏭️  Skipped: ${this.results.skipped} (${this.getPercentage(this.results.skipped)}%)`);
    console.log(`⏱️  Total Duration: ${this.formatDuration(this.results.duration)}`);
    console.log('='.repeat(80));

    // Pass rate
    const passRate = this.results.totalTests > 0 
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
      : 0;

    console.log(`\n📊 Pass Rate: ${passRate}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.testFiles.forEach(file => {
        if (file.failed > 0) {
          console.log(`\n  ${file.testName}:`);
          file.tests.forEach(test => {
            if (!test.passed) {
              console.log(`    ❌ ${test.name}`);
              if (test.error) {
                console.log(`       Error: ${test.error}`);
              }
            }
          });
        }
      });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    return this.results;
  }

  /**
   * Save report to file
   * @param {string} format - Report format (json, html)
   */
  async saveReport(format = 'json') {
    const reportDir = path.join(__dirname, 'reports', 'negative');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    if (format === 'json') {
      const reportPath = path.join(reportDir, 'negative-test-results.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 JSON report saved: ${reportPath}`);
    }

    if (format === 'html') {
      const reportPath = path.join(reportDir, 'negative-test-report.html');
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

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Negative Test Suite Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #f44336; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card.passed { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
    .stat-card.failed { background: linear-gradient(135deg, #f44336 0%, #da190b 100%); }
    .stat-card.skipped { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }
    .stat-card h3 { margin: 0; font-size: 14px; opacity: 0.9; }
    .stat-card .value { font-size: 36px; font-weight: bold; margin: 10px 0; }
    .test-file { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .test-file-header { background: #f9f9f9; padding: 15px; border-bottom: 1px solid #ddd; cursor: pointer; }
    .test-file-header:hover { background: #f0f0f0; }
    .test-file-body { padding: 15px; display: none; }
    .test-file-body.active { display: block; }
    .test-case { padding: 10px; margin: 5px 0; border-left: 4px solid #ddd; background: #f9f9f9; }
    .test-case.passed { border-left-color: #4CAF50; }
    .test-case.failed { border-left-color: #f44336; background: #ffebee; }
    .pass-rate { font-size: 48px; font-weight: bold; text-align: center; margin: 30px 0; color: ${passRate >= 80 ? '#4CAF50' : passRate >= 60 ? '#ff9800' : '#f44336'}; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Negative Test Suite Report</h1>
    
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
      <div class="stat-card skipped">
        <h3>Skipped</h3>
        <div class="value">${this.results.skipped}</div>
        <div>${this.getPercentage(this.results.skipped)}%</div>
      </div>
    </div>

    <div class="pass-rate">Pass Rate: ${passRate}%</div>

    <h2>Test Files</h2>
    ${this.results.testFiles.map((file, index) => `
      <div class="test-file">
        <div class="test-file-header" onclick="document.getElementById('file-${index}').classList.toggle('active')">
          <strong>${file.testName}</strong>
          <span style="float: right;">
            ✅ ${file.passed} | ❌ ${file.failed} | ⏭️ ${file.skipped} | ⏱️ ${file.duration}ms
          </span>
        </div>
        <div class="test-file-body" id="file-${index}">
          ${file.tests.map(test => `
            <div class="test-case ${test.passed ? 'passed' : 'failed'}">
              <strong>${test.passed ? '✅' : '❌'} ${test.name}</strong>
              ${test.error ? `<div style="color: #f44336; margin-top: 5px;">Error: ${test.error}</div>` : ''}
              <div style="color: #666; font-size: 12px; margin-top: 5px;">Duration: ${test.duration}ms</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

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
  const runner = new NegativeTestSuiteRunner();
  runner.run()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = NegativeTestSuiteRunner;

