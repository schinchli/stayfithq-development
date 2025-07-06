#!/usr/bin/env node

/**
 * Test Runner - Execute All Test Suites
 * Runs comprehensive tests for the entire HealthHQ QuackChallenge project
 */

const path = require('path');
const fs = require('fs').promises;

// Test Suites (using correct paths)
const AWSSDKV3TestSuite = require('./unit/test-aws-sdk-v3-services');
const MCPServerTestSuite = require('./unit/test-mcp-server');
const SecurityComplianceTestSuite = require('./unit/test-security-compliance');
const FHIRComplianceTestSuite = require('./unit/test-fhir-compliance');
const ABHAIntegrationTestSuite = require('./unit/test-abha-integration');
const SettingsValidationTestSuite = require('./unit/test-settings-validation');
const WellArchitectedFrameworkTestSuite = require('./unit/test-well-architected-framework');

class TestRunner {
  constructor() {
    this.overallResults = {
      suites: [],
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      wellArchitectedScore: null
    };
  }

  async runAllTests() {
    console.log('🚀 Starting HealthHQ QuackChallenge Comprehensive Test Suite\n');
    console.log('=' .repeat(80));
    console.log('🏥 HEALTHHQ QUACKCHALLENGE - COMPLETE TEST EXECUTION');
    console.log('=' .repeat(80));
    console.log(`📅 Started: ${this.overallResults.startTime.toISOString()}`);
    console.log(`🖥️  Platform: ${process.platform} (Node.js ${process.version})`);
    console.log('=' .repeat(80));
    console.log('');

    try {
      // Run AWS SDK v3 Tests
      await this.runTestSuite('AWS SDK v3 Services', AWSSDKV3TestSuite);
      
      // Run MCP Server Tests
      await this.runTestSuite('MCP Server', MCPServerTestSuite);
      
      // Run Security & Compliance Tests
      await this.runTestSuite('Security & Compliance', SecurityComplianceTestSuite);
      
      // Run FHIR Compliance Tests
      await this.runTestSuite('FHIR Compliance', FHIRComplianceTestSuite);
      
      // Run ABHA Integration Tests
      await this.runTestSuite('ABHA Integration', ABHAIntegrationTestSuite);
      
      // Run Settings Validation Tests
      await this.runTestSuite('Settings Validation', SettingsValidationTestSuite);
      
      // Run AWS Well-Architected Framework Assessment
      await this.runWellArchitectedAssessment();
      
      // Generate comprehensive report
      await this.generateComprehensiveReport();
      
      // Display final results
      this.displayFinalResults();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async runWellArchitectedAssessment() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏗️ RUNNING: AWS WELL-ARCHITECTED FRAMEWORK ASSESSMENT`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    
    try {
      const testSuite = new WellArchitectedFrameworkTestSuite();
      const results = await testSuite.runAllTests();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Store Well-Architected results
      this.overallResults.wellArchitectedScore = results;
      
      // Collect results
      const suiteResults = {
        name: 'AWS Well-Architected Framework',
        status: results.failed === 0 ? 'PASSED' : 'FAILED',
        tests: results.tests.length,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        duration: duration,
        details: results
      };
      
      this.overallResults.suites.push(suiteResults);
      this.overallResults.totalTests += results.tests.length;
      this.overallResults.totalPassed += results.passed;
      this.overallResults.totalFailed += results.failed;
      this.overallResults.totalSkipped += results.skipped;
      
      console.log(`\n✅ Well-Architected Assessment completed in ${duration}ms`);
      
    } catch (error) {
      console.error(`❌ Well-Architected Assessment failed: ${error.message}`);
      
      const suiteResults = {
        name: 'AWS Well-Architected Framework',
        status: 'FAILED',
        tests: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
        error: error.message
      };
      
      this.overallResults.suites.push(suiteResults);
      this.overallResults.totalFailed += 1;
    }
  }

  async runTestSuite(suiteName, TestSuiteClass) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 RUNNING: ${suiteName.toUpperCase()} TEST SUITE`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    
    try {
      const testSuite = new TestSuiteClass();
      await testSuite.runAllTests();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Collect results
      const suiteResults = {
        name: suiteName,
        status: 'COMPLETED',
        duration: duration,
        passed: testSuite.testResults.passed,
        failed: testSuite.testResults.failed,
        skipped: testSuite.testResults.skipped,
        total: testSuite.testResults.tests.length,
        successRate: Math.round((testSuite.testResults.passed / testSuite.testResults.tests.length) * 100)
      };

      this.overallResults.suites.push(suiteResults);
      this.overallResults.totalTests += suiteResults.total;
      this.overallResults.totalPassed += suiteResults.passed;
      this.overallResults.totalFailed += suiteResults.failed;
      this.overallResults.totalSkipped += suiteResults.skipped;

      console.log(`\n✅ ${suiteName} Test Suite completed successfully!`);
      console.log(`📊 Suite Results: ${suiteResults.passed} passed, ${suiteResults.failed} failed, ${suiteResults.skipped} skipped`);
      console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
      
    } catch (error) {
      const suiteResults = {
        name: suiteName,
        status: 'FAILED',
        error: error.message,
        duration: Date.now() - startTime
      };

      this.overallResults.suites.push(suiteResults);
      
      console.error(`❌ ${suiteName} Test Suite failed:`, error.message);
    }
  }

  async generateComprehensiveReport() {
    this.overallResults.endTime = new Date();
    this.overallResults.duration = this.overallResults.endTime - this.overallResults.startTime;

    const report = {
      project: 'HealthHQ QuackChallenge',
      testExecution: {
        timestamp: this.overallResults.startTime.toISOString(),
        duration: this.overallResults.duration,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          awsRegion: process.env.AWS_REGION || 'us-east-1'
        }
      },
      summary: {
        totalSuites: this.overallResults.suites.length,
        totalTests: this.overallResults.totalTests,
        totalPassed: this.overallResults.totalPassed,
        totalFailed: this.overallResults.totalFailed,
        totalSkipped: this.overallResults.totalSkipped,
        overallSuccessRate: this.overallResults.totalTests > 0 ? 
          Math.round((this.overallResults.totalPassed / this.overallResults.totalTests) * 100) : 0
      },
      testSuites: this.overallResults.suites,
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps()
    };

    const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    await this.generateMarkdownReport(report);
    
    console.log(`\n📄 Comprehensive test report generated: ${reportPath}`);
  }

  async generateMarkdownReport(report) {
    const markdown = `# HealthHQ QuackChallenge - Test Execution Report

## 📊 Test Summary

- **Total Test Suites**: ${report.summary.totalSuites}
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.totalPassed} ✅
- **Failed**: ${report.summary.totalFailed} ❌
- **Skipped**: ${report.summary.totalSkipped} ⏭️
- **Success Rate**: ${report.summary.overallSuccessRate}%
- **Duration**: ${Math.round(report.testExecution.duration / 1000)}s

## 🧪 Test Suite Results

${report.testSuites.map(suite => `
### ${suite.name}
- **Status**: ${suite.status}
- **Tests**: ${suite.total || 0}
- **Passed**: ${suite.passed || 0}
- **Failed**: ${suite.failed || 0}
- **Skipped**: ${suite.skipped || 0}
- **Success Rate**: ${suite.successRate || 0}%
- **Duration**: ${Math.round((suite.duration || 0) / 1000)}s
${suite.error ? `- **Error**: ${suite.error}` : ''}
`).join('')}

## 🔧 Environment

- **Node.js**: ${report.testExecution.environment.nodeVersion}
- **Platform**: ${report.testExecution.environment.platform}
- **Architecture**: ${report.testExecution.environment.architecture}
- **AWS Region**: ${report.testExecution.environment.awsRegion}

## 💡 Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 🚀 Next Steps

${report.nextSteps.map(step => `- ${step}`).join('\n')}

---
*Report generated on: ${report.testExecution.timestamp}*
`;

    const markdownPath = path.join(__dirname, 'TEST_EXECUTION_REPORT.md');
    await fs.writeFile(markdownPath, markdown);
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.overallResults.totalFailed > 0) {
      recommendations.push('Review failed tests and address underlying issues');
      recommendations.push('Check AWS credentials and service availability');
    }
    
    if (this.overallResults.totalSkipped > 0) {
      recommendations.push('Configure AWS credentials to enable skipped tests');
      recommendations.push('Set up OpenSearch instance for integration tests');
    }
    
    const successRate = this.overallResults.totalTests > 0 ? 
      (this.overallResults.totalPassed / this.overallResults.totalTests) * 100 : 0;
    
    if (successRate >= 90) {
      recommendations.push('Excellent test coverage! Consider adding more edge case tests');
    } else if (successRate >= 70) {
      recommendations.push('Good test coverage. Focus on improving failing tests');
    } else {
      recommendations.push('Test coverage needs improvement. Address failing tests');
    }
    
    recommendations.push('Run tests regularly in CI/CD pipeline');
    recommendations.push('Monitor test performance and optimize slow tests');
    
    return recommendations;
  }

  generateNextSteps() {
    const nextSteps = [];
    
    nextSteps.push('Deploy to staging environment for integration testing');
    nextSteps.push('Set up automated testing in GitHub Actions');
    nextSteps.push('Configure monitoring and alerting for production');
    nextSteps.push('Create user acceptance tests');
    nextSteps.push('Document API endpoints and usage examples');
    nextSteps.push('Set up performance benchmarking');
    
    return nextSteps;
  }

  displayFinalResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🏁 FINAL TEST EXECUTION RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Overall Summary:`);
    console.log(`   • Total Test Suites: ${this.overallResults.suites.length}`);
    console.log(`   • Total Tests: ${this.overallResults.totalTests}`);
    console.log(`   • Passed: ${this.overallResults.totalPassed} ✅`);
    console.log(`   • Failed: ${this.overallResults.totalFailed} ❌`);
    console.log(`   • Skipped: ${this.overallResults.totalSkipped} ⏭️`);
    
    const successRate = this.overallResults.totalTests > 0 ? 
      Math.round((this.overallResults.totalPassed / this.overallResults.totalTests) * 100) : 0;
    
    console.log(`   • Success Rate: ${successRate}%`);
    console.log(`   • Duration: ${Math.round(this.overallResults.duration / 1000)}s`);

    console.log(`\n🧪 Test Suite Breakdown:`);
    this.overallResults.suites.forEach(suite => {
      const status = suite.status === 'COMPLETED' ? '✅' : '❌';
      console.log(`   ${status} ${suite.name}: ${suite.passed || 0}/${suite.total || 0} passed (${suite.successRate || 0}%)`);
    });

    if (successRate >= 90) {
      console.log(`\n🎉 EXCELLENT! Your HealthHQ QuackChallenge project is well-tested and ready for production!`);
    } else if (successRate >= 70) {
      console.log(`\n👍 GOOD! Most tests are passing. Address the failing tests for production readiness.`);
    } else {
      console.log(`\n⚠️  NEEDS ATTENTION! Several tests are failing. Review and fix issues before deployment.`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🚀 HealthHQ QuackChallenge Test Execution Complete!');
    console.log('='.repeat(80));
  }
}

// Run all tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;
