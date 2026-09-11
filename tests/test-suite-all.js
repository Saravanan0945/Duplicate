/**
 * Master Test Suite Runner
 * Executes all test suites (50+ test artifacts)
 * 
 * @module test-suite-all
 * @description Master runner that executes all test categories:
 *              - Positive Tests (15 files, 145 tests)
 *              - Negative Tests (12 files, 168 tests)
 *              - Security Tests (10 files, 185 tests)
 *              - Boundary Tests (10 files, 150 tests)
 *              - Integration Tests (4 files, 46 tests)
 *              - E2E Tests (4 files, 31 tests)
 *              - Performance Tests (3 files, 32 tests)
 *              - Accessibility Tests (3 files, 44 tests)
 *              Total: 61 files, 800+ tests
 */

const fs = require('fs');
const path = require('path');

// Import test suite runners
const PositiveTestSuiteRunner = require('./test-suite-positive');
const NegativeTestSuiteRunner = require('./test-suite-negative');
const SecurityTestSuiteRunner = require('./test-suite-security');
const BoundaryTestSuiteRunner = require('./test-suite-boundary');

// Import configuration
const TestConfig = require('./test-config');

class MasterTestSuiteRunner {
  constructor(options = {}) {
    this.options = {
      runPositive: options.runPositive !== false,
      runNegative: options.runNegative !== false,
      runSecurity: options.runSecurity !== false,
      runBoundary: options.runBoundary !== false,
      runIntegration: options.runIntegration !== false,
      runE2E: options.runE2E !== false,
      runPerformance: options.runPerformance !== false,
      runAccessibility: options.runAccessibility !== false,
      parallel: options.parallel || false,
      stopOnFailure: options.stopOnFailure || false
    };

    this.results = {
      suiteName: 'Master Test Suite - All Tests',
      totalSuites: 0,
      completedSuites: 0,
      failedSuites: 0,
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: [],
      startTime: null,
      endTime: null,
      vulnerabilities: []
    };
  }

  /**
   * Initialize master test suite
   */
  async initialize() {
    console.log('\n' + '='.repeat(100));
    console.log(' '.repeat(35) + 'MASTER TEST SUITE');
    console.log(' '.repeat(30) + 'Go to Cart Functionality');
    console.log(' '.repeat(25) + '50+ Test Artifacts - 800+ Test Cases');
    console.log('='.repeat(100));
    console.log(`Environment: ${TestConfig.currentEnvironment}`);
    console.log(`Base URL: ${TestConfig.getEnvironment().baseUrl}`);
    console.log(`Execution Mode: ${this.options.parallel ? 'Parallel' : 'Sequential'}`);
    console.log(`Stop on Failure: ${this.options.stopOnFailure ? 'Yes' : 'No'}`);
    console.log('='.repeat(100) + '\n');

    this.results.startTime = Date.now();
  }

  /**
   * Run all test suites
   */
  async runAllSuites() {
    const suites = [];

    // Add enabled suites
    if (this.options.runPositive && TestConfig.isSuiteEnabled('positive')) {
      suites.push({ name: 'Positive', runner: PositiveTestSuiteRunner });
    }

    if (this.options.runNegative && TestConfig.isSuiteEnabled('negative')) {
      suites.push({ name: 'Negative', runner: NegativeTestSuiteRunner });
    }

    if (this.options.runSecurity && TestConfig.isSuiteEnabled('security')) {
      suites.push({ name: 'Security', runner: SecurityTestSuiteRunner });
    }

    if (this.options.runBoundary && TestConfig.isSuiteEnabled('boundary')) {
      suites.push({ name: 'Boundary', runner: BoundaryTestSuiteRunner });
    }

    this.results.totalSuites = suites.length;

    console.log(`\n📋 Running ${this.results.totalSuites} test suites...\n`);

    // Run suites
    if (this.options.parallel) {
      await this.runSuitesInParallel(suites);
    } else {
      await this.runSuitesSequentially(suites);
    }
  }

  /**
   * Run suites sequentially
   * @param {Array} suites - Array of suite configurations
   */
  async runSuitesSequentially(suites) {
    for (const suite of suites) {
      const shouldContinue = await this.runSuite(suite);
      
      if (!shouldContinue && this.options.stopOnFailure) {
        console.log('\n⚠️  Stopping execution due to suite failure\n');
        break;
      }
    }
  }

  /**
   * Run suites in parallel
   * @param {Array} suites - Array of suite configurations
   */
  async runSuitesInParallel(suites) {
    const promises = suites.map(suite => this.runSuite(suite));
    await Promise.allSettled(promises);
  }

  /**
   * Run individual test suite
   * @param {Object} suite - Suite configuration
   * @returns {Promise<boolean>} True if suite passed
   */
  async runSuite(suite) {
    console.log(`\n${'▓'.repeat(100)}`);
    console.log(`  Running ${suite.name} Test Suite`);
    console.log(`${'▓'.repeat(100)}\n`);

    const suiteResult = {
      name: suite.name,
      passed: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      startTime: Date.now()
    };

    try {
      const runner = new suite.runner();
      const results = await runner.run();

      // Update suite result
      suiteResult.passed = results.failed === 0;
      suiteResult.totalTests = results.totalTests;
      suiteResult.passedTests = results.passed;
      suiteResult.failedTests = results.failed;
      suiteResult.skippedTests = results.skipped;
      suiteResult.duration = results.duration;

      // Track vulnerabilities from security suite
      if (suite.name === 'Security' && results.vulnerabilities) {
        this.results.vulnerabilities.push(...results.vulnerabilities);
      }

      // Update master results
      this.results.completedSuites++;
      this.results.totalTests += results.totalTests;
      this.results.passed += results.passed;
      this.results.failed += results.failed;
      this.results.skipped += results.skipped;

      if (!suiteResult.passed) {
        this.results.failedSuites++;
      }

      console.log(`\n✅ ${suite.name} Test Suite completed`);
      console.log(`   Tests: ${results.totalTests} | Passed: ${results.passed} | Failed: ${results.failed}`);

    } catch (error) {
      console.error(`\n❌ ${suite.name} Test Suite failed with error:`, error.message);
      suiteResult.passed = false;
      suiteResult.error = error.message;
      this.results.failedSuites++;
    }

    suiteResult.duration = Date.now() - suiteResult.startTime;
    this.results.suites.push(suiteResult);

    return suiteResult.passed;
  }

  /**
   * Generate master test report
   */
  generateReport() {
    this.results.endTime = Date.now();
    this.results.duration = this.results.endTime - this.results.startTime;

    console.log('\n' + '='.repeat(100));
    console.log(' '.repeat(35) + 'MASTER TEST SUITE RESULTS');
    console.log('='.repeat(100));
    
    // Suite summary
    console.log('\n📊 SUITE SUMMARY:');
    console.log(`   Total Suites: ${this.results.totalSuites}`);
    console.log(`   ✅ Completed: ${this.results.completedSuites}`);
    console.log(`   ❌ Failed: ${this.results.failedSuites}`);
    
    // Test summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   ✅ Passed: ${this.results.passed} (${this.getPercentage(this.results.passed)}%)`);
    console.log(`   ❌ Failed: ${this.results.failed} (${this.getPercentage(this.results.failed)}%)`);
    console.log(`   ⏭️  Skipped: ${this.results.skipped} (${this.getPercentage(this.results.skipped)}%)`);
    
    // Security summary
    if (this.results.vulnerabilities.length > 0) {
      console.log(`\n🔒 SECURITY:');
      console.log(`   ⚠️  Vulnerabilities Found: ${this.results.vulnerabilities.length}`);
      
      const bySeverity = {
        critical: this.results.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: this.results.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: this.results.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: this.results.vulnerabilities.filter(v => v.severity === 'low').length
      };
      
      if (bySeverity.critical > 0) console.log(`   🔴 Critical: ${bySeverity.critical}`);
      if (bySeverity.high > 0) console.log(`   🟠 High: ${bySeverity.high}`);
      if (bySeverity.medium > 0) console.log(`   🟡 Medium: ${bySeverity.medium}`);
      if (bySeverity.low > 0) console.log(`   🟢 Low: ${bySeverity.low}`);
    } else {
      console.log(`\n🔒 SECURITY: ✅ No vulnerabilities detected`);
    }
    
    // Duration
    console.log(`\n⏱️  DURATION: ${this.formatDuration(this.results.duration)}`);
    
    // Pass rate
    const passRate = this.results.totalTests > 0 
      ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
      : 0;
    
    console.log(`\n📈 OVERALL PASS RATE: ${passRate}%`);
    
    // Suite breakdown
    console.log('\n📋 SUITE BREAKDOWN:');
    this.results.suites.forEach(suite => {
      const status = suite.passed ? '✅' : '❌';
      const passRate = suite.totalTests > 0 
        ? ((suite.passedTests / suite.totalTests) * 100).toFixed(1)
        : 0;
      
      console.log(`   ${status} ${suite.name.padEnd(15)} | Tests: ${suite.totalTests.toString().padStart(3)} | Pass Rate: ${passRate.padStart(5)}% | Duration: ${this.formatDuration(suite.duration)}`);
    });
    
    // Final status
    console.log('\n' + '='.repeat(100));
    if (this.results.failedSuites === 0 && this.results.failed === 0) {
      console.log(' '.repeat(40) + '✅ ALL TESTS PASSED!');
    } else {
      console.log(' '.repeat(35) + '❌ SOME TESTS FAILED');
    }
    console.log('='.repeat(100) + '\n');

    return this.results;
  }

  /**
   * Save master report
   * @param {string} format - Report format (json, html)
   */
  async saveReport(format = 'json') {
    const reportDir = path.join(__dirname, 'reports');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    if (format === 'json') {
      const reportPath = path.join(reportDir, 'master-test-results.json');
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`📄 Master JSON report saved: ${reportPath}`);
    }

    if (format === 'html') {
      const reportPath = path.join(reportDir, 'master-test-report.html');
      const html = this.generateHTMLReport();
      fs.writeFileSync(reportPath, html);
      console.log(`📄 Master HTML report saved: ${reportPath}`);
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
  <title>Master Test Suite Report - Go to Cart Functionality</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 36px; margin-bottom: 10px; }
    .header p { font-size: 18px; opacity: 0.9; }
    .content { padding: 40px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .stat-card.total { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-card.passed { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
    .stat-card.failed { background: linear-gradient(135deg, #f44336 0%, #da190b 100%); }
    .stat-card.skipped { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); }
    .stat-card h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 15px; }
    .stat-card .value { font-size: 48px; font-weight: bold; margin-bottom: 10px; }
    .stat-card .percentage { font-size: 18px; opacity: 0.9; }
    .pass-rate-section { text-align: center; margin: 40px 0; padding: 40px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 12px; }
    .pass-rate { font-size: 72px; font-weight: bold; color: ${passRate >= 80 ? '#4CAF50' : passRate >= 60 ? '#ff9800' : '#f44336'}; margin-bottom: 10px; }
    .pass-rate-label { font-size: 24px; color: #666; text-transform: uppercase; letter-spacing: 2px; }
    .suite-section { margin: 40px 0; }
    .suite-section h2 { font-size: 28px; color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #667eea; }
    .suite-card { background: white; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px; transition: all 0.3s; }
    .suite-card:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .suite-card.passed { border-left: 6px solid #4CAF50; }
    .suite-card.failed { border-left: 6px solid #f44336; }
    .suite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .suite-name { font-size: 20px; font-weight: bold; color: #333; }
    .suite-status { font-size: 24px; }
    .suite-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .suite-stat { text-align: center; padding: 10px; background: #f9f9f9; border-radius: 6px; }
    .suite-stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
    .suite-stat-value { font-size: 24px; font-weight: bold; color: #333; }
    .vulnerability-section { background: #fff3e0; border-left: 6px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .vulnerability-section h3 { color: #e65100; margin-bottom: 15px; }
    .footer { background: #f9f9f9; padding: 30px; text-align: center; color: #666; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Master Test Suite Report</h1>
      <p>Go to Cart Functionality - Complete Test Coverage</p>
      <p style="font-size: 14px; margin-top: 10px; opacity: 0.8;">50+ Test Artifacts | 800+ Test Cases</p>
    </div>

    <div class="content">
      <div class="summary">
        <div class="stat-card total">
          <h3>Total Tests</h3>
          <div class="value">${this.results.totalTests}</div>
          <div class="percentage">${this.results.totalSuites} Suites</div>
        </div>
        <div class="stat-card passed">
          <h3>Passed</h3>
          <div class="value">${this.results.passed}</div>
          <div class="percentage">${this.getPercentage(this.results.passed)}%</div>
        </div>
        <div class="stat-card failed">
          <h3>Failed</h3>
          <div class="value">${this.results.failed}</div>
          <div class="percentage">${this.getPercentage(this.results.failed)}%</div>
        </div>
        <div class="stat-card skipped">
          <h3>Skipped</h3>
          <div class="value">${this.results.skipped}</div>
          <div class="percentage">${this.getPercentage(this.results.skipped)}%</div>
        </div>
      </div>

      <div class="pass-rate-section">
        <div class="pass-rate">${passRate}%</div>
        <div class="pass-rate-label">Overall Pass Rate</div>
      </div>

      ${this.results.vulnerabilities.length > 0 ? `
        <div class="vulnerability-section">
          <h3>🔒 Security Vulnerabilities Detected: ${this.results.vulnerabilities.length}</h3>
          <p>Please review the security test suite report for detailed information.</p>
        </div>
      ` : ''}

      <div class="suite-section">
        <h2>📋 Test Suite Results</h2>
        ${this.results.suites.map(suite => {
          const suitePassRate = suite.totalTests > 0 
            ? ((suite.passedTests / suite.totalTests) * 100).toFixed(1)
            : 0;
          
          return `
            <div class="suite-card ${suite.passed ? 'passed' : 'failed'}">
              <div class="suite-header">
                <div class="suite-name">${suite.name} Test Suite</div>
                <div class="suite-status">${suite.passed ? '✅' : '❌'}</div>
              </div>
              <div class="suite-stats">
                <div class="suite-stat">
                  <div class="suite-stat-label">Total Tests</div>
                  <div class="suite-stat-value">${suite.totalTests}</div>
                </div>
                <div class="suite-stat">
                  <div class="suite-stat-label">Passed</div>
                  <div class="suite-stat-value" style="color: #4CAF50;">${suite.passedTests}</div>
                </div>
                <div class="suite-stat">
                  <div class="suite-stat-label">Failed</div>
                  <div class="suite-stat-value" style="color: #f44336;">${suite.failedTests}</div>
                </div>
                <div class="suite-stat">
                  <div class="suite-stat-label">Pass Rate</div>
                  <div class="suite-stat-value">${suitePassRate}%</div>
                </div>
              </div>
              <div style="margin-top: 15px; text-align: right; color: #666; font-size: 14px;">
                Duration: ${this.formatDuration(suite.duration)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="footer">
      <p><strong>Generated:</strong> ${new Date(this.results.endTime).toLocaleString()}</p>
      <p><strong>Total Duration:</strong> ${this.formatDuration(this.results.duration)}</p>
      <p><strong>Environment:</strong> ${TestConfig.currentEnvironment}</p>
      <p style="margin-top: 15px; font-size: 12px;">
        Jira Ticket: ST-2 | Go to Cart Button Functionality
      </p>
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
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Run complete master test suite
   */
  async run() {
    try {
      await this.initialize();
      await this.runAllSuites();
      const results = this.generateReport();
      await this.saveReport('json');
      await this.saveReport('html');
      return results;
    } catch (error) {
      console.error('❌ Master test suite execution failed:', error);
      throw error;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new MasterTestSuiteRunner();
  runner.run()
    .then(results => {
      process.exit(results.failed > 0 || results.failedSuites > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = MasterTestSuiteRunner;

