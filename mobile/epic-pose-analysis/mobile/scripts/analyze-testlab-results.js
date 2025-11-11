#!/usr/bin/env node

/**
 * Firebase Test Lab Results Analyzer
 * Parses and analyzes test results from Firebase Test Lab runs
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds by device tier
const THRESHOLDS = {
  low: {
    processingTime: { target: 25000, acceptable: 35000, alert: 45000 },
    memory: { peak: 250, alert: 300 },
    frameRate: { target: 6, minimum: 3 },
    batteryDrain: { target: 5, acceptable: 8, alert: 15 }
  },
  mid: {
    processingTime: { target: 15000, acceptable: 20000, alert: 25000 },
    memory: { peak: 400, alert: 500 },
    frameRate: { target: 12, minimum: 8 },
    batteryDrain: { target: 4, acceptable: 6, alert: 12 }
  },
  high: {
    processingTime: { target: 10000, acceptable: 12000, alert: 15000 },
    memory: { peak: 600, alert: 800 },
    frameRate: { target: 25, minimum: 15 },
    batteryDrain: { target: 3, acceptable: 5, alert: 10 }
  }
};

// Device tier classification
const DEVICE_TIERS = {
  sailfish: 'low',
  j7xelte: 'low',
  a10: 'mid',
  oriole: 'mid',
  blueline: 'high',
  redfin: 'high',
  panther: 'high'
};

class TestLabResultsAnalyzer {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.results = [];
    this.summary = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      byDevice: {},
      byTier: { low: {}, mid: {}, high: {} },
      performanceIssues: [],
      regressions: []
    };
  }

  analyze() {
    console.log('🔍 Analyzing Firebase Test Lab Results...\n');

    this.loadResults();
    this.analyzeTestOutcomes();
    this.analyzePerformanceMetrics();
    this.detectRegressions();
    this.generateReport();
  }

  loadResults() {
    const deviceDirs = fs.readdirSync(this.resultsDir);

    deviceDirs.forEach(deviceDir => {
      const devicePath = path.join(this.resultsDir, deviceDir);
      if (!fs.statSync(devicePath).isDirectory()) return;

      const deviceId = this.extractDeviceId(deviceDir);
      const tier = DEVICE_TIERS[deviceId] || 'unknown';

      const result = {
        device: deviceId,
        tier,
        testOutcomes: this.parseTestOutcomes(devicePath),
        performanceMetrics: this.parsePerformanceMetrics(devicePath),
        logs: this.parseLogs(devicePath),
        screenshots: this.findScreenshots(devicePath),
        video: this.findVideo(devicePath)
      };

      this.results.push(result);
    });

    console.log(`✅ Loaded results from ${this.results.length} devices\n`);
  }

  extractDeviceId(dirname) {
    // Extract device model from directory name
    // Format: "device-model-version-locale-orientation"
    const match = dirname.match(/^([a-z0-9]+)-/);
    return match ? match[1] : 'unknown';
  }

  parseTestOutcomes(devicePath) {
    const testResultsPath = path.join(devicePath, 'test_results.xml');

    if (!fs.existsSync(testResultsPath)) {
      return { passed: 0, failed: 0, skipped: 0, tests: [] };
    }

    const xml = fs.readFileSync(testResultsPath, 'utf8');

    // Parse JUnit XML format
    const passedMatch = xml.match(/tests="(\d+)"/);
    const failedMatch = xml.match(/failures="(\d+)"/);
    const skippedMatch = xml.match(/skipped="(\d+)"/);

    return {
      passed: parseInt(passedMatch?.[1] || '0'),
      failed: parseInt(failedMatch?.[1] || '0'),
      skipped: parseInt(skippedMatch?.[1] || '0'),
      tests: [] // Would parse individual test cases here
    };
  }

  parsePerformanceMetrics(devicePath) {
    const logcatPath = path.join(devicePath, 'logcat.txt');

    if (!fs.existsSync(logcatPath)) {
      return {};
    }

    const logcat = fs.readFileSync(logcatPath, 'utf8');

    // Extract performance metrics from logs
    const metrics = {
      processingTime: this.extractMetric(logcat, /Processing time: (\d+)ms/),
      peakMemory: this.extractMetric(logcat, /Peak memory: (\d+)MB/),
      avgFrameRate: this.extractMetric(logcat, /Frame rate: ([\d.]+) FPS/),
      batteryDrain: this.extractMetric(logcat, /Battery drain: ([\d.]+)%/),
      cpuUsage: this.extractMetric(logcat, /CPU usage: ([\d.]+)%/)
    };

    return metrics;
  }

  extractMetric(text, regex) {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  parseLogs(devicePath) {
    const logcatPath = path.join(devicePath, 'logcat.txt');

    if (!fs.existsSync(logcatPath)) {
      return { errors: [], warnings: [] };
    }

    const logcat = fs.readFileSync(logcatPath, 'utf8');

    const errors = (logcat.match(/E\/.+/g) || []).slice(0, 10); // First 10 errors
    const warnings = (logcat.match(/W\/.+/g) || []).slice(0, 10); // First 10 warnings

    return { errors, warnings };
  }

  findScreenshots(devicePath) {
    const screenshotsPath = path.join(devicePath, 'screenshots');

    if (!fs.existsSync(screenshotsPath)) {
      return [];
    }

    return fs.readdirSync(screenshotsPath)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(screenshotsPath, f));
  }

  findVideo(devicePath) {
    const videoPath = path.join(devicePath, 'video.mp4');
    return fs.existsSync(videoPath) ? videoPath : null;
  }

  analyzeTestOutcomes() {
    console.log('📊 Test Outcomes Analysis\n');

    this.results.forEach(result => {
      const { device, tier, testOutcomes } = result;

      this.summary.totalTests += testOutcomes.passed + testOutcomes.failed + testOutcomes.skipped;
      this.summary.passed += testOutcomes.passed;
      this.summary.failed += testOutcomes.failed;
      this.summary.skipped += testOutcomes.skipped;

      // Track by device
      this.summary.byDevice[device] = testOutcomes;

      // Track by tier
      if (!this.summary.byTier[tier].tests) {
        this.summary.byTier[tier] = { passed: 0, failed: 0, skipped: 0 };
      }
      this.summary.byTier[tier].passed += testOutcomes.passed;
      this.summary.byTier[tier].failed += testOutcomes.failed;
      this.summary.byTier[tier].skipped += testOutcomes.skipped;

      const passRate = (testOutcomes.passed / (testOutcomes.passed + testOutcomes.failed) * 100).toFixed(1);

      console.log(`  ${device} (${tier}): ${testOutcomes.passed}/${testOutcomes.passed + testOutcomes.failed} (${passRate}%)`);
    });

    const overallPassRate = (this.summary.passed / this.summary.totalTests * 100).toFixed(1);

    console.log(`\n  Overall: ${this.summary.passed}/${this.summary.totalTests} (${overallPassRate}%)`);

    if (overallPassRate < 95) {
      console.log(`  ⚠️  Warning: Pass rate below 95% target`);
    }

    console.log('');
  }

  analyzePerformanceMetrics() {
    console.log('⚡ Performance Metrics Analysis\n');

    this.results.forEach(result => {
      const { device, tier, performanceMetrics } = result;
      const thresholds = THRESHOLDS[tier];

      if (!thresholds || !performanceMetrics.processingTime) {
        return;
      }

      console.log(`  ${device} (${tier}):`);

      // Processing time
      if (performanceMetrics.processingTime) {
        const status = this.getPerformanceStatus(
          performanceMetrics.processingTime,
          thresholds.processingTime
        );
        console.log(`    Processing: ${performanceMetrics.processingTime}ms ${status}`);

        if (performanceMetrics.processingTime > thresholds.processingTime.alert) {
          this.summary.performanceIssues.push({
            device,
            tier,
            metric: 'processingTime',
            value: performanceMetrics.processingTime,
            threshold: thresholds.processingTime.alert
          });
        }
      }

      // Memory
      if (performanceMetrics.peakMemory) {
        const status = performanceMetrics.peakMemory > thresholds.memory.alert
          ? '❌'
          : performanceMetrics.peakMemory > thresholds.memory.peak
          ? '⚠️'
          : '✅';
        console.log(`    Memory: ${performanceMetrics.peakMemory}MB ${status}`);

        if (performanceMetrics.peakMemory > thresholds.memory.alert) {
          this.summary.performanceIssues.push({
            device,
            tier,
            metric: 'memory',
            value: performanceMetrics.peakMemory,
            threshold: thresholds.memory.alert
          });
        }
      }

      // Frame rate
      if (performanceMetrics.avgFrameRate) {
        const status = performanceMetrics.avgFrameRate < thresholds.frameRate.minimum
          ? '❌'
          : performanceMetrics.avgFrameRate < thresholds.frameRate.target
          ? '⚠️'
          : '✅';
        console.log(`    Frame Rate: ${performanceMetrics.avgFrameRate} FPS ${status}`);
      }

      // Battery
      if (performanceMetrics.batteryDrain) {
        const status = this.getPerformanceStatus(
          performanceMetrics.batteryDrain,
          thresholds.batteryDrain
        );
        console.log(`    Battery: ${performanceMetrics.batteryDrain}% ${status}`);
      }

      console.log('');
    });
  }

  getPerformanceStatus(value, threshold) {
    if (value <= threshold.target) return '✅';
    if (value <= threshold.acceptable) return '⚠️';
    return '❌';
  }

  detectRegressions() {
    // Compare against baseline (would load from previous run)
    const baseline = this.loadBaseline();

    if (!baseline) {
      console.log('ℹ️  No baseline data available for regression detection\n');
      return;
    }

    console.log('🔬 Regression Detection\n');

    this.results.forEach(result => {
      const { device, performanceMetrics } = result;
      const baselineMetrics = baseline[device];

      if (!baselineMetrics) return;

      const regressionThreshold = 1.2; // 20% regression

      // Check processing time
      if (performanceMetrics.processingTime > baselineMetrics.processingTime * regressionThreshold) {
        const regression = {
          device,
          metric: 'processingTime',
          current: performanceMetrics.processingTime,
          baseline: baselineMetrics.processingTime,
          increase: ((performanceMetrics.processingTime / baselineMetrics.processingTime - 1) * 100).toFixed(1)
        };

        this.summary.regressions.push(regression);

        console.log(`  ⚠️  ${device}: Processing time regression`);
        console.log(`     Current: ${regression.current}ms, Baseline: ${regression.baseline}ms (+${regression.increase}%)`);
      }

      // Check memory
      if (performanceMetrics.peakMemory > baselineMetrics.peakMemory * regressionThreshold) {
        const regression = {
          device,
          metric: 'memory',
          current: performanceMetrics.peakMemory,
          baseline: baselineMetrics.peakMemory,
          increase: ((performanceMetrics.peakMemory / baselineMetrics.peakMemory - 1) * 100).toFixed(1)
        };

        this.summary.regressions.push(regression);

        console.log(`  ⚠️  ${device}: Memory regression`);
        console.log(`     Current: ${regression.current}MB, Baseline: ${regression.baseline}MB (+${regression.increase}%)`);
      }
    });

    if (this.summary.regressions.length === 0) {
      console.log('  ✅ No performance regressions detected');
    }

    console.log('');
  }

  loadBaseline() {
    const baselinePath = path.join(this.resultsDir, '..', 'baseline.json');

    if (!fs.existsSync(baselinePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  }

  generateReport() {
    console.log('📝 Generating Summary Report\n');

    const report = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      deviceResults: this.results.map(r => ({
        device: r.device,
        tier: r.tier,
        testOutcomes: r.testOutcomes,
        performanceMetrics: r.performanceMetrics,
        errors: r.logs.errors.length,
        warnings: r.logs.warnings.length
      }))
    };

    // Save JSON report
    const reportPath = path.join(this.resultsDir, 'analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`  ✅ JSON report saved: ${reportPath}`);

    // Generate markdown report
    const mdReport = this.generateMarkdownReport(report);
    const mdReportPath = path.join(this.resultsDir, 'analysis-report.md');
    fs.writeFileSync(mdReportPath, mdReport);

    console.log(`  ✅ Markdown report saved: ${mdReportPath}`);

    // Print summary
    console.log('\n📋 Summary\n');
    console.log(`  Total Tests: ${this.summary.totalTests}`);
    console.log(`  Passed: ${this.summary.passed} (${(this.summary.passed / this.summary.totalTests * 100).toFixed(1)}%)`);
    console.log(`  Failed: ${this.summary.failed}`);
    console.log(`  Skipped: ${this.summary.skipped}`);
    console.log(`  Performance Issues: ${this.summary.performanceIssues.length}`);
    console.log(`  Regressions: ${this.summary.regressions.length}`);

    // Exit code based on results
    const exitCode = this.summary.failed > 0 || this.summary.performanceIssues.length > 0 ? 1 : 0;

    if (exitCode === 0) {
      console.log('\n✅ All tests passed with acceptable performance!');
    } else {
      console.log('\n❌ Tests failed or performance issues detected');
    }

    process.exit(exitCode);
  }

  generateMarkdownReport(report) {
    let md = '# Firebase Test Lab Results Analysis\n\n';
    md += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;

    md += '## Summary\n\n';
    md += `- **Total Tests**: ${report.summary.totalTests}\n`;
    md += `- **Passed**: ${report.summary.passed} (${(report.summary.passed / report.summary.totalTests * 100).toFixed(1)}%)\n`;
    md += `- **Failed**: ${report.summary.failed}\n`;
    md += `- **Skipped**: ${report.summary.skipped}\n`;
    md += `- **Performance Issues**: ${report.summary.performanceIssues.length}\n`;
    md += `- **Regressions**: ${report.summary.regressions.length}\n\n`;

    md += '## Results by Device Tier\n\n';
    ['low', 'mid', 'high'].forEach(tier => {
      const tierResults = report.summary.byTier[tier];
      if (tierResults.passed || tierResults.failed) {
        const total = tierResults.passed + tierResults.failed;
        const passRate = (tierResults.passed / total * 100).toFixed(1);
        md += `### ${tier.charAt(0).toUpperCase() + tier.slice(1)}-End Devices\n`;
        md += `- Passed: ${tierResults.passed}/${total} (${passRate}%)\n`;
        md += `- Failed: ${tierResults.failed}\n\n`;
      }
    });

    if (report.summary.performanceIssues.length > 0) {
      md += '## Performance Issues\n\n';
      report.summary.performanceIssues.forEach(issue => {
        md += `- **${issue.device}** (${issue.tier}): ${issue.metric} = ${issue.value} (threshold: ${issue.threshold})\n`;
      });
      md += '\n';
    }

    if (report.summary.regressions.length > 0) {
      md += '## Regressions Detected\n\n';
      report.summary.regressions.forEach(reg => {
        md += `- **${reg.device}**: ${reg.metric} increased by ${reg.increase}% (${reg.baseline} → ${reg.current})\n`;
      });
      md += '\n';
    }

    md += '## Device Details\n\n';
    md += '| Device | Tier | Passed | Failed | Processing | Memory | Frame Rate |\n';
    md += '|--------|------|--------|--------|------------|--------|------------|\n';

    report.deviceResults.forEach(r => {
      const total = r.testOutcomes.passed + r.testOutcomes.failed;
      const passRate = total > 0 ? (r.testOutcomes.passed / total * 100).toFixed(0) : 'N/A';

      md += `| ${r.device} | ${r.tier} | ${r.testOutcomes.passed} | ${r.testOutcomes.failed} | `;
      md += `${r.performanceMetrics.processingTime || 'N/A'}ms | `;
      md += `${r.performanceMetrics.peakMemory || 'N/A'}MB | `;
      md += `${r.performanceMetrics.avgFrameRate || 'N/A'} FPS |\n`;
    });

    return md;
  }
}

// Main execution
const resultsDir = process.argv[2] || './test-results';

if (!fs.existsSync(resultsDir)) {
  console.error(`❌ Results directory not found: ${resultsDir}`);
  console.error('Usage: node analyze-testlab-results.js <results-directory>');
  process.exit(1);
}

const analyzer = new TestLabResultsAnalyzer(resultsDir);
analyzer.analyze();
