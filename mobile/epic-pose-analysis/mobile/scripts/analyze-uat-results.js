/**
 * UAT Results Analyzer
 *
 * Analyzes User Acceptance Testing feedback and generates comprehensive report
 *
 * Usage:
 *   node scripts/analyze-uat-results.js path/to/uat-responses.csv
 *
 * Input: CSV export from Google Forms responses
 * Output: Comprehensive UAT Summary Report
 */

const fs = require('fs');
const path = require('path');

class UATResultsAnalyzer {
  constructor(responsesPath) {
    this.responsesPath = responsesPath;
    this.responses = [];
    this.summary = {
      participants: {
        total: 0,
        completed: 0,
        dropouts: 0,
        devices: { ios: 0, android: 0 },
        segments: {}
      },
      scenarios: {},
      satisfaction: {
        averageRating: 0,
        nps: { promoters: 0, passives: 0, detractors: 0, score: 0 },
        usageIntent: {}
      },
      usability: {
        completionRates: {},
        timeToFirstAnalysis: [],
        processingTimes: []
      },
      feedback: {
        topLoved: [],
        topImprove: [],
        featureRequests: [],
        bugs: []
      },
      performance: {
        byDeviceTier: {}
      }
    };
  }

  /**
   * Main analysis workflow
   */
  analyze() {
    console.log('🔍 UAT Results Analyzer\n');
    console.log('=' .repeat(60));

    this.loadResponses();
    this.analyzeParticipants();
    this.analyzeScenarios();
    this.analyzeSatisfaction();
    this.analyzeUsability();
    this.analyzeFeedback();
    this.analyzePerformance();
    this.identifyIssues();
    this.generateReport();
    this.saveReport();

    console.log('\n✅ Analysis complete!');
  }

  /**
   * Load CSV responses
   */
  loadResponses() {
    console.log('\n📄 Loading responses...');

    if (!fs.existsSync(this.responsesPath)) {
      throw new Error(`Responses file not found: ${this.responsesPath}`);
    }

    const csvData = fs.readFileSync(this.responsesPath, 'utf-8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',').map(v => v.trim());
      const response = {};

      headers.forEach((header, index) => {
        response[header] = values[index];
      });

      this.responses.push(response);
    }

    console.log(`  Loaded ${this.responses.length} responses`);
  }

  /**
   * Analyze participant demographics and completion
   */
  analyzeParticipants() {
    console.log('\n👥 Analyzing participants...');

    const uniqueParticipants = new Set();
    const deviceCounts = { ios: 0, android: 0 };

    this.responses.forEach(response => {
      uniqueParticipants.add(response['Participant ID']);

      const device = response['Device']?.toLowerCase() || '';
      if (device.includes('iphone') || device.includes('ios')) {
        deviceCounts.ios++;
      } else if (device.includes('android') || device.includes('samsung') || device.includes('pixel')) {
        deviceCounts.android++;
      }
    });

    this.summary.participants.total = uniqueParticipants.size;
    this.summary.participants.devices = deviceCounts;

    console.log(`  Total participants: ${this.summary.participants.total}`);
    console.log(`  iOS devices: ${deviceCounts.ios}`);
    console.log(`  Android devices: ${deviceCounts.android}`);
  }

  /**
   * Analyze scenario completion and ratings
   */
  analyzeScenarios() {
    console.log('\n📋 Analyzing scenarios...');

    const scenarioNames = [
      'First-Time User Onboarding',
      'Video Recording Workflow',
      'Video Upload Workflow',
      'Analysis Processing',
      'Results Display and Understanding',
      'Progress Tracking',
      'Export and Sharing',
      'Error Handling',
      'Premium Features',
      'Cross-Exercise Testing'
    ];

    scenarioNames.forEach((scenario, index) => {
      const scenarioNum = index + 1;
      const scenarioResponses = this.responses.filter(r =>
        r['Scenario']?.includes(`Scenario ${scenarioNum}`)
      );

      if (scenarioResponses.length === 0) return;

      // Calculate completion rate
      const completed = scenarioResponses.filter(r =>
        r['Were you able to complete this scenario?']?.includes('Yes')
      ).length;

      // Calculate average rating
      const ratings = scenarioResponses
        .map(r => parseInt(r['Overall experience for this scenario']))
        .filter(r => !isNaN(r));

      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;

      this.summary.scenarios[scenario] = {
        responses: scenarioResponses.length,
        completed,
        completionRate: ((completed / scenarioResponses.length) * 100).toFixed(1),
        averageRating: avgRating,
        ratings: {
          5: ratings.filter(r => r === 5).length,
          4: ratings.filter(r => r === 4).length,
          3: ratings.filter(r => r === 3).length,
          2: ratings.filter(r => r === 2).length,
          1: ratings.filter(r => r === 1).length
        }
      };

      console.log(`  ${scenario}:`);
      console.log(`    Completion: ${this.summary.scenarios[scenario].completionRate}%`);
      console.log(`    Avg Rating: ${avgRating}/5.0`);
    });
  }

  /**
   * Analyze overall satisfaction and NPS
   */
  analyzeSatisfaction() {
    console.log('\n😊 Analyzing satisfaction...');

    // Overall ratings from final survey
    const finalSurvey = this.responses.filter(r => r['Survey Type'] === 'Final');

    if (finalSurvey.length > 0) {
      // Calculate average overall rating
      const overallRatings = finalSurvey
        .map(r => parseInt(r['Overall experience rating']))
        .filter(r => !isNaN(r));

      this.summary.satisfaction.averageRating = overallRatings.length > 0
        ? (overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length).toFixed(1)
        : 0;

      // Calculate NPS
      const npsScores = finalSurvey
        .map(r => parseInt(r['How likely are you to recommend']))
        .filter(r => !isNaN(r));

      const promoters = npsScores.filter(s => s >= 9).length;
      const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
      const detractors = npsScores.filter(s => s <= 6).length;

      const npsScore = ((promoters - detractors) / npsScores.length * 100).toFixed(0);

      this.summary.satisfaction.nps = {
        promoters,
        passives,
        detractors,
        score: npsScore
      };

      console.log(`  Average Rating: ${this.summary.satisfaction.averageRating}/5.0`);
      console.log(`  NPS Score: ${npsScore}`);
      console.log(`    Promoters: ${promoters} (${(promoters/npsScores.length*100).toFixed(0)}%)`);
      console.log(`    Passives: ${passives} (${(passives/npsScores.length*100).toFixed(0)}%)`);
      console.log(`    Detractors: ${detractors} (${(detractors/npsScores.length*100).toFixed(0)}%)`);
    }
  }

  /**
   * Analyze usability metrics
   */
  analyzeUsability() {
    console.log('\n🎯 Analyzing usability...');

    // Time to first analysis (from Scenario 1)
    const onboardingResponses = this.responses.filter(r =>
      r['Scenario']?.includes('Scenario 1')
    );

    const timesToFirst = onboardingResponses
      .map(r => r['How long did it take you to find the pose analysis feature?'])
      .filter(t => t);

    const under30s = timesToFirst.filter(t => t.includes('<30 seconds')).length;
    const under60s = timesToFirst.filter(t => t.includes('30-60 seconds')).length;
    const under2m = timesToFirst.filter(t => t.includes('1-2 minutes')).length;
    const over2m = timesToFirst.filter(t => t.includes('>2 minutes')).length;

    this.summary.usability.timeToFirstAnalysis = {
      '<30s': under30s,
      '30-60s': under60s,
      '1-2m': under2m,
      '>2m': over2m,
      successRate: ((under30s + under60s) / timesToFirst.length * 100).toFixed(1)
    };

    // Processing times (from Scenario 4)
    const processingResponses = this.responses.filter(r =>
      r['Scenario']?.includes('Scenario 4')
    );

    const processingTimes = processingResponses
      .map(r => parseInt(r['How long did the analysis take']))
      .filter(t => !isNaN(t));

    if (processingTimes.length > 0) {
      const avgProcessing = (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(1);
      const under15s = processingTimes.filter(t => t <= 15).length;
      const under30s = processingTimes.filter(t => t > 15 && t <= 30).length;
      const over30s = processingTimes.filter(t => t > 30).length;

      this.summary.usability.processingTimes = {
        average: avgProcessing,
        '<15s': under15s,
        '15-30s': under30s,
        '>30s': over30s
      };

      console.log(`  Time to First Analysis:`);
      console.log(`    <30s: ${under30s} (${(under30s/timesToFirst.length*100).toFixed(0)}%)`);
      console.log(`  Processing Time:`);
      console.log(`    Average: ${avgProcessing}s`);
      console.log(`    <15s: ${under15s} (${(under15s/processingTimes.length*100).toFixed(0)}%)`);
    }
  }

  /**
   * Analyze qualitative feedback
   */
  analyzeFeedback() {
    console.log('\n💬 Analyzing feedback...');

    const finalSurvey = this.responses.filter(r => r['Survey Type'] === 'Final');

    // Extract top loved features
    const loved = [];
    finalSurvey.forEach(r => {
      if (r['Top 3 things you LOVED - 1']) loved.push(r['Top 3 things you LOVED - 1']);
      if (r['Top 3 things you LOVED - 2']) loved.push(r['Top 3 things you LOVED - 2']);
      if (r['Top 3 things you LOVED - 3']) loved.push(r['Top 3 things you LOVED - 3']);
    });

    // Extract top improvements
    const improve = [];
    finalSurvey.forEach(r => {
      if (r['Top 3 things to IMPROVE - 1']) improve.push(r['Top 3 things to IMPROVE - 1']);
      if (r['Top 3 things to IMPROVE - 2']) improve.push(r['Top 3 things to IMPROVE - 2']);
      if (r['Top 3 things to IMPROVE - 3']) improve.push(r['Top 3 things to IMPROVE - 3']);
    });

    // Feature requests
    const features = finalSurvey
      .map(r => r['What new features would make this more valuable'])
      .filter(f => f);

    this.summary.feedback = {
      topLoved: this.categorizeText(loved),
      topImprove: this.categorizeText(improve),
      featureRequests: features
    };

    console.log(`  Top Loved: ${loved.length} items`);
    console.log(`  Top Improvements: ${improve.length} items`);
    console.log(`  Feature Requests: ${features.length} items`);
  }

  /**
   * Analyze performance by device tier
   */
  analyzePerformance() {
    console.log('\n⚡ Analyzing performance...');

    const processingResponses = this.responses.filter(r =>
      r['Scenario']?.includes('Scenario 4')
    );

    const byTier = { low: [], mid: [], high: [] };

    processingResponses.forEach(response => {
      const device = response['Device']?.toLowerCase() || '';
      const time = parseInt(response['How long did the analysis take']);

      if (isNaN(time)) return;

      // Classify device tier (simplified)
      let tier = 'mid';
      if (device.includes('iphone 14') || device.includes('pixel 7') || device.includes('s23')) {
        tier = 'high';
      } else if (device.includes('iphone 8') || device.includes('galaxy j') || device.includes('a10')) {
        tier = 'low';
      }

      byTier[tier].push(time);
    });

    Object.keys(byTier).forEach(tier => {
      if (byTier[tier].length === 0) return;

      const times = byTier[tier];
      const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
      const min = Math.min(...times);
      const max = Math.max(...times);

      this.summary.performance.byDeviceTier[tier] = {
        count: times.length,
        average: avg,
        min,
        max
      };

      console.log(`  ${tier.charAt(0).toUpperCase() + tier.slice(1)}-end devices:`);
      console.log(`    Average: ${avg}s (min: ${min}s, max: ${max}s)`);
    });
  }

  /**
   * Identify critical issues and blockers
   */
  identifyIssues() {
    console.log('\n🚨 Identifying issues...');

    const issues = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    // Check for scenarios with low completion rates
    Object.keys(this.summary.scenarios).forEach(scenario => {
      const data = this.summary.scenarios[scenario];
      if (parseFloat(data.completionRate) < 80) {
        issues.high.push({
          type: 'Low Completion Rate',
          scenario,
          metric: `${data.completionRate}% completion`,
          severity: parseFloat(data.completionRate) < 50 ? 'critical' : 'high'
        });
      }
    });

    // Check for scenarios with low ratings
    Object.keys(this.summary.scenarios).forEach(scenario => {
      const data = this.summary.scenarios[scenario];
      if (parseFloat(data.averageRating) < 3.5) {
        issues.high.push({
          type: 'Low Rating',
          scenario,
          metric: `${data.averageRating}/5.0 average`,
          severity: parseFloat(data.averageRating) < 2.5 ? 'critical' : 'high'
        });
      }
    });

    // Check for poor NPS
    if (this.summary.satisfaction.nps.score < 0) {
      issues.critical.push({
        type: 'Negative NPS',
        metric: `NPS: ${this.summary.satisfaction.nps.score}`,
        severity: 'critical'
      });
    }

    this.summary.issues = issues;

    const criticalCount = issues.critical.length;
    const highCount = issues.high.length;

    if (criticalCount > 0) {
      console.log(`  ⛔ ${criticalCount} CRITICAL issues found`);
    }
    if (highCount > 0) {
      console.log(`  🟡 ${highCount} HIGH priority issues found`);
    }
    if (criticalCount === 0 && highCount === 0) {
      console.log(`  ✅ No critical or high-priority issues identified`);
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📝 Generating report...');

    const report = [];

    report.push('# UAT Summary Report');
    report.push('## Pose Analysis Feature\n');
    report.push(`**Analysis Date**: ${new Date().toLocaleDateString()}`);
    report.push(`**Total Participants**: ${this.summary.participants.total}`);
    report.push('');

    // Executive Summary
    report.push('## Executive Summary\n');
    report.push(`**Overall Satisfaction**: ${this.summary.satisfaction.averageRating}/5.0`);
    report.push(`**Net Promoter Score (NPS)**: ${this.summary.satisfaction.nps.score}`);
    report.push(`**Critical Issues**: ${this.summary.issues.critical.length}`);
    report.push(`**High Priority Issues**: ${this.summary.issues.high.length}`);
    report.push('');

    // Recommendation
    const nps = parseInt(this.summary.satisfaction.nps.score);
    const avgRating = parseFloat(this.summary.satisfaction.averageRating);
    const criticalIssues = this.summary.issues.critical.length;

    if (criticalIssues > 0 || nps < 0 || avgRating < 3.0) {
      report.push('**Recommendation**: ❌ **NOT READY for beta launch**');
      report.push('Critical issues must be addressed before proceeding.');
    } else if (nps >= 30 && avgRating >= 4.0) {
      report.push('**Recommendation**: ✅ **READY for beta launch**');
      report.push('Feature meets success criteria with strong user satisfaction.');
    } else {
      report.push('**Recommendation**: ⚠️ **CONDITIONALLY READY**');
      report.push('Address high-priority issues before beta, but core feature is viable.');
    }
    report.push('');

    // Scenario Performance
    report.push('## Scenario Performance\n');
    report.push('| Scenario | Completion Rate | Avg Rating | Status |');
    report.push('|----------|----------------|------------|--------|');

    Object.keys(this.summary.scenarios).forEach(scenario => {
      const data = this.summary.scenarios[scenario];
      const status = parseFloat(data.completionRate) >= 80 && parseFloat(data.averageRating) >= 3.5 ? '✅' : '⚠️';
      report.push(`| ${scenario} | ${data.completionRate}% | ${data.averageRating}/5.0 | ${status} |`);
    });
    report.push('');

    // Issues
    if (this.summary.issues.critical.length > 0) {
      report.push('## Critical Issues (Must Fix)\n');
      this.summary.issues.critical.forEach(issue => {
        report.push(`- **${issue.type}**: ${issue.scenario || ''} - ${issue.metric}`);
      });
      report.push('');
    }

    if (this.summary.issues.high.length > 0) {
      report.push('## High Priority Issues\n');
      this.summary.issues.high.forEach(issue => {
        report.push(`- **${issue.type}**: ${issue.scenario || ''} - ${issue.metric}`);
      });
      report.push('');
    }

    // Top Feedback
    report.push('## Top User Feedback\n');
    report.push('### Most Loved Features\n');
    this.summary.feedback.topLoved.slice(0, 5).forEach((item, i) => {
      report.push(`${i + 1}. ${item.text} (${item.count} mentions)`);
    });
    report.push('');

    report.push('### Top Improvement Areas\n');
    this.summary.feedback.topImprove.slice(0, 5).forEach((item, i) => {
      report.push(`${i + 1}. ${item.text} (${item.count} mentions)`);
    });
    report.push('');

    // Feature Requests
    if (this.summary.feedback.featureRequests.length > 0) {
      report.push('### Feature Requests\n');
      this.summary.feedback.featureRequests.slice(0, 10).forEach(req => {
        report.push(`- ${req}`);
      });
      report.push('');
    }

    // Performance
    report.push('## Performance Metrics\n');
    report.push('### Processing Time by Device Tier\n');
    Object.keys(this.summary.performance.byDeviceTier).forEach(tier => {
      const data = this.summary.performance.byDeviceTier[tier];
      report.push(`**${tier.charAt(0).toUpperCase() + tier.slice(1)}-end**: ${data.average}s average (${data.count} devices)`);
    });
    report.push('');

    // Next Steps
    report.push('## Recommended Next Steps\n');
    if (this.summary.issues.critical.length > 0) {
      report.push('1. **Address Critical Issues**: Fix blocking bugs before beta');
    }
    if (this.summary.issues.high.length > 0) {
      report.push('2. **Address High Priority Issues**: Improve low-rated scenarios');
    }
    report.push('3. **Implement Top Improvements**: Focus on most-requested enhancements');
    report.push('4. **Plan Feature Roadmap**: Prioritize feature requests for future releases');

    if (criticalIssues === 0 && this.summary.issues.high.length === 0) {
      report.push('5. **Proceed to Beta Launch** (Phase 7)');
    }
    report.push('');

    this.report = report.join('\n');
  }

  /**
   * Save report to file
   */
  saveReport() {
    const reportPath = path.join(path.dirname(this.responsesPath), 'UAT_SUMMARY_REPORT.md');
    fs.writeFileSync(reportPath, this.report);

    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  /**
   * Categorize and count text feedback
   */
  categorizeText(items) {
    const counts = {};

    items.forEach(item => {
      const normalized = item.toLowerCase().trim();
      counts[normalized] = (counts[normalized] || 0) + 1;
    });

    return Object.keys(counts)
      .map(text => ({ text, count: counts[text] }))
      .sort((a, b) => b.count - a.count);
  }
}

// CLI execution
if (require.main === module) {
  const responsesPath = process.argv[2];

  if (!responsesPath) {
    console.error('Usage: node analyze-uat-results.js <path-to-responses.csv>');
    process.exit(1);
  }

  const analyzer = new UATResultsAnalyzer(responsesPath);
  analyzer.analyze();
}

module.exports = UATResultsAnalyzer;
