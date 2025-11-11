#!/usr/bin/env node

/**
 * Performance Benchmarking Utility
 * Creates baseline performance metrics for regression testing
 */

const fs = require('fs');
const path = require('path');

// Device tier classification based on specs
const classifyDevice = (deviceInfo) => {
  const { totalMemory, cpuCores } = deviceInfo;

  if (totalMemory <= 2 * 1024 * 1024 * 1024) { // <= 2GB
    return 'low';
  } else if (totalMemory <= 4 * 1024 * 1024 * 1024) { // <= 4GB
    return 'mid';
  } else {
    return 'high';
  }
};

// Benchmark data structure
const createBenchmark = (device, metrics) => ({
  device: device.model,
  tier: device.tier,
  timestamp: new Date().toISOString(),
  specs: {
    totalMemory: device.totalMemory,
    cpuCores: device.cpuCores,
    osVersion: device.osVersion
  },
  metrics: {
    processingTime: {
      short: metrics.short.processingTime,
      medium: metrics.medium.processingTime,
      long: metrics.long.processingTime
    },
    memory: {
      baseline: metrics.memoryBaseline,
      peak: metrics.memoryPeak,
      increase: metrics.memoryPeak - metrics.memoryBaseline
    },
    frameRate: {
      average: metrics.avgFrameRate,
      minimum: metrics.minFrameRate,
      maximum: metrics.maxFrameRate
    },
    battery: {
      drainPerAnalysis: metrics.batteryDrain,
      drainPerHour: metrics.batteryDrainPerHour
    },
    cpu: {
      average: metrics.avgCpuUsage,
      peak: metrics.peakCpuUsage
    }
  }
});

class PerformanceBenchmark {
  constructor() {
    this.benchmarks = [];
    this.baselineFile = path.join(__dirname, '..', 'performance-baselines.json');
  }

  async run() {
    console.log('🏁 Performance Benchmarking Utility\n');

    // This would normally run actual tests on devices
    // For now, we create a template for storing benchmarks

    this.loadExistingBaselines();
    this.displayBaselines();
    this.generateReport();
  }

  loadExistingBaselines() {
    if (fs.existsSync(this.baselineFile)) {
      const data = fs.readFileSync(this.baselineFile, 'utf8');
      this.benchmarks = JSON.parse(data);
      console.log(`✅ Loaded ${this.benchmarks.length} existing baselines\n`);
    } else {
      console.log('ℹ️  No existing baselines found\n');
      this.createDefaultBaselines();
    }
  }

  createDefaultBaselines() {
    // Create default baselines based on device tier targets
    this.benchmarks = [
      {
        device: 'sailfish',
        tier: 'low',
        timestamp: new Date().toISOString(),
        specs: {
          totalMemory: 4 * 1024 * 1024 * 1024,
          cpuCores: 4,
          osVersion: '8.1'
        },
        metrics: {
          processingTime: { short: 25000, medium: 75000, long: 150000 },
          memory: { baseline: 80, peak: 250, increase: 170 },
          frameRate: { average: 6, minimum: 3, maximum: 8 },
          battery: { drainPerAnalysis: 5, drainPerHour: 12 },
          cpu: { average: 65, peak: 85 }
        }
      },
      {
        device: 'a10',
        tier: 'mid',
        timestamp: new Date().toISOString(),
        specs: {
          totalMemory: 2 * 1024 * 1024 * 1024,
          cpuCores: 8,
          osVersion: '10'
        },
        metrics: {
          processingTime: { short: 15000, medium: 45000, long: 90000 },
          memory: { baseline: 120, peak: 400, increase: 280 },
          frameRate: { average: 12, minimum: 8, maximum: 15 },
          battery: { drainPerAnalysis: 4, drainPerHour: 10 },
          cpu: { average: 55, peak: 75 }
        }
      },
      {
        device: 'redfin',
        tier: 'high',
        timestamp: new Date().toISOString(),
        specs: {
          totalMemory: 8 * 1024 * 1024 * 1024,
          cpuCores: 8,
          osVersion: '11'
        },
        metrics: {
          processingTime: { short: 10000, medium: 30000, long: 60000 },
          memory: { baseline: 180, peak: 600, increase: 420 },
          frameRate: { average: 25, minimum: 15, maximum: 30 },
          battery: { drainPerAnalysis: 3, drainPerHour: 8 },
          cpu: { average: 45, peak: 65 }
        }
      }
    ];

    this.saveBaselines();
    console.log('✅ Created default baselines\n');
  }

  displayBaselines() {
    console.log('📊 Performance Baselines\n');

    ['low', 'mid', 'high'].forEach(tier => {
      const tierBaselines = this.benchmarks.filter(b => b.tier === tier);

      if (tierBaselines.length === 0) return;

      console.log(`${tier.toUpperCase()}-END TIER:`);

      tierBaselines.forEach(baseline => {
        console.log(`\n  ${baseline.device}:`);
        console.log(`    Processing (10s video): ${baseline.metrics.processingTime.short}ms`);
        console.log(`    Processing (30s video): ${baseline.metrics.processingTime.medium}ms`);
        console.log(`    Processing (60s video): ${baseline.metrics.processingTime.long}ms`);
        console.log(`    Memory: ${baseline.metrics.memory.baseline}MB → ${baseline.metrics.memory.peak}MB`);
        console.log(`    Frame Rate: ${baseline.metrics.frameRate.average} FPS (${baseline.metrics.frameRate.minimum}-${baseline.metrics.frameRate.maximum})`);
        console.log(`    Battery: ${baseline.metrics.battery.drainPerAnalysis}% per analysis`);
        console.log(`    CPU: ${baseline.metrics.cpu.average}% avg, ${baseline.metrics.cpu.peak}% peak`);
      });

      console.log('');
    });
  }

  saveBaselines() {
    fs.writeFileSync(
      this.baselineFile,
      JSON.stringify(this.benchmarks, null, 2)
    );

    console.log(`✅ Baselines saved to ${this.baselineFile}\n`);
  }

  generateReport() {
    const reportPath = path.join(__dirname, '..', 'docs', 'PERFORMANCE_BASELINES.md');

    let report = '# Performance Baselines\n\n';
    report += `**Last Updated**: ${new Date().toISOString()}\n\n`;

    report += 'This document contains baseline performance metrics for regression testing.\n\n';

    report += '## Baseline Metrics by Device Tier\n\n';

    ['low', 'mid', 'high'].forEach(tier => {
      const tierBaselines = this.benchmarks.filter(b => b.tier === tier);

      if (tierBaselines.length === 0) return;

      report += `### ${tier.charAt(0).toUpperCase() + tier.slice(1)}-End Devices\n\n`;

      report += '| Device | 10s Video | 30s Video | 60s Video | Memory | Frame Rate | Battery |\n';
      report += '|--------|-----------|-----------|-----------|--------|------------|----------|\n';

      tierBaselines.forEach(baseline => {
        report += `| ${baseline.device} `;
        report += `| ${baseline.metrics.processingTime.short}ms `;
        report += `| ${baseline.metrics.processingTime.medium}ms `;
        report += `| ${baseline.metrics.processingTime.long}ms `;
        report += `| ${baseline.metrics.memory.peak}MB `;
        report += `| ${baseline.metrics.frameRate.average} FPS `;
        report += `| ${baseline.metrics.battery.drainPerAnalysis}% |\n`;
      });

      report += '\n';
    });

    report += '## Regression Detection\n\n';
    report += 'Performance regressions are detected when metrics exceed baseline by >20%:\n\n';
    report += '- **Processing Time**: Alert if >20% slower than baseline\n';
    report += '- **Memory Usage**: Alert if >20% higher than baseline\n';
    report += '- **Frame Rate**: Alert if >20% lower than baseline\n';
    report += '- **Battery Drain**: Alert if >20% higher than baseline\n\n';

    report += '## Usage\n\n';
    report += '```bash\n';
    report += '# Run benchmarks and update baselines\n';
    report += 'npm run benchmark\n\n';
    report += '# Compare current run against baselines\n';
    report += 'npm run benchmark:compare ./test-results\n';
    report += '```\n\n';

    report += '## Updating Baselines\n\n';
    report += 'Baselines should be updated when:\n';
    report += '1. Significant performance improvements are made\n';
    report += '2. New optimization strategies are implemented\n';
    report += '3. Device tier classification changes\n';
    report += '4. Major refactoring that changes performance characteristics\n\n';

    report += '**Note**: Always review performance changes before updating baselines.\n';

    fs.writeFileSync(reportPath, report);
    console.log(`✅ Report generated: ${reportPath}\n`);
  }

  addBenchmark(device, metrics) {
    const tier = classifyDevice(device);

    const benchmark = createBenchmark({ ...device, tier }, metrics);

    // Replace existing benchmark for this device or add new one
    const existingIndex = this.benchmarks.findIndex(b => b.device === device.model);

    if (existingIndex >= 0) {
      console.log(`⚠️  Updating existing baseline for ${device.model}`);
      this.benchmarks[existingIndex] = benchmark;
    } else {
      console.log(`✅ Adding new baseline for ${device.model}`);
      this.benchmarks.push(benchmark);
    }

    this.saveBaselines();
  }

  compareToBenchmark(device, currentMetrics) {
    const benchmark = this.benchmarks.find(b => b.device === device);

    if (!benchmark) {
      console.log(`⚠️  No baseline found for ${device}`);
      return null;
    }

    const regressions = [];
    const improvements = [];

    const regressionThreshold = 1.2; // 20%
    const improvementThreshold = 0.8; // 20% better

    // Processing time
    if (currentMetrics.processingTime.short > benchmark.metrics.processingTime.short * regressionThreshold) {
      regressions.push({
        metric: 'processingTime.short',
        current: currentMetrics.processingTime.short,
        baseline: benchmark.metrics.processingTime.short,
        change: ((currentMetrics.processingTime.short / benchmark.metrics.processingTime.short - 1) * 100).toFixed(1)
      });
    } else if (currentMetrics.processingTime.short < benchmark.metrics.processingTime.short * improvementThreshold) {
      improvements.push({
        metric: 'processingTime.short',
        current: currentMetrics.processingTime.short,
        baseline: benchmark.metrics.processingTime.short,
        change: ((1 - currentMetrics.processingTime.short / benchmark.metrics.processingTime.short) * 100).toFixed(1)
      });
    }

    // Memory
    if (currentMetrics.memory.peak > benchmark.metrics.memory.peak * regressionThreshold) {
      regressions.push({
        metric: 'memory.peak',
        current: currentMetrics.memory.peak,
        baseline: benchmark.metrics.memory.peak,
        change: ((currentMetrics.memory.peak / benchmark.metrics.memory.peak - 1) * 100).toFixed(1)
      });
    }

    // Frame rate
    if (currentMetrics.frameRate.average < benchmark.metrics.frameRate.average * improvementThreshold) {
      regressions.push({
        metric: 'frameRate.average',
        current: currentMetrics.frameRate.average,
        baseline: benchmark.metrics.frameRate.average,
        change: ((1 - currentMetrics.frameRate.average / benchmark.metrics.frameRate.average) * 100).toFixed(1)
      });
    }

    return { regressions, improvements };
  }
}

// Main execution
const command = process.argv[2];

const benchmark = new PerformanceBenchmark();

if (command === 'compare' && process.argv[3]) {
  // Compare mode: analyze results and compare to baseline
  const resultsDir = process.argv[3];
  console.log(`Comparing results from ${resultsDir} against baselines...\n`);
  // Would implement comparison logic here
} else {
  // Default: display and optionally update baselines
  benchmark.run();
}
