/**
 * Form Data Summarizer for AI Context
 * Efficiently summarizes form analysis data for AI consumption with token optimization
 * Issue #16 - Stream A: Form Context Builder & Data Integration
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Token optimization constants
const TOKEN_LIMITS = {
  GEMINI_2_5_FLASH: {
    input: 1000000,    // 1M tokens
    output: 8192,      // 8K tokens
    context_window: 1000000
  },
  // Reserved tokens for AI response and system prompts
  RESERVED_TOKENS: 2000,
  // Target token usage for form context (conservative)
  TARGET_FORM_CONTEXT: 1500
};

// Form data importance weights for summarization
const IMPORTANCE_WEIGHTS = {
  // Critical for AI coaching
  overallScore: 1.0,
  criticalErrors: 1.0,
  improvements: 1.0,
  
  // Important for context
  formScores: 0.8,
  movementPhases: 0.7,
  timing: 0.6,
  
  // Contextual information
  confidence: 0.5,
  warnings: 0.4,
  
  // Detailed data (can be heavily compressed)
  jointAngles: 0.3,
  framesCoverage: 0.2
};

/**
 * Summarize form analysis data for AI context
 * Optimizes data for token efficiency while preserving coaching value
 */
export const summarizeFormData = onCall(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      const { analysisData, options = {} } = request.data;
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      if (!analysisData) {
        throw new HttpsError("invalid-argument", "Analysis data is required");
      }

      logger.info("Starting form data summarization", { 
        userId, 
        exerciseType: analysisData.exerciseType,
        options 
      });

      const {
        targetTokens = TOKEN_LIMITS.TARGET_FORM_CONTEXT,
        includeDetails = true,
        compressionLevel = 'balanced' // 'minimal', 'balanced', 'detailed'
      } = options;

      // Apply compression based on level
      let summary;
      switch (compressionLevel) {
        case 'minimal':
          summary = createMinimalSummary(analysisData);
          break;
        case 'detailed':
          summary = createDetailedSummary(analysisData);
          break;
        default:
          summary = createBalancedSummary(analysisData, targetTokens);
      }

      // Estimate token usage
      const estimatedTokens = estimateTokenCount(JSON.stringify(summary));
      
      // If over target, apply additional compression
      if (estimatedTokens > targetTokens) {
        logger.warn(`Summary exceeds target tokens: ${estimatedTokens} > ${targetTokens}`, {
          exerciseType: analysisData.exerciseType
        });
        summary = applyAdditionalCompression(summary, targetTokens);
      }

      const finalTokens = estimateTokenCount(JSON.stringify(summary));

      logger.info("Form data summarization completed", {
        userId,
        exerciseType: analysisData.exerciseType,
        originalSize: JSON.stringify(analysisData).length,
        summarySize: JSON.stringify(summary).length,
        estimatedTokens: finalTokens,
        compressionRatio: (JSON.stringify(summary).length / JSON.stringify(analysisData).length).toFixed(3)
      });

      return {
        success: true,
        summary,
        metadata: {
          exerciseType: analysisData.exerciseType,
          analysisId: analysisData.id,
          summarizedAt: new Date().toISOString(),
          compressionLevel,
          estimatedTokens: finalTokens,
          targetTokens,
          compressionRatio: (JSON.stringify(summary).length / JSON.stringify(analysisData).length).toFixed(3)
        }
      };

    } catch (error) {
      logger.error("Form data summarization failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Summarization failed: ${error.message}`);
    }
  }
);

/**
 * Create minimal summary for token-constrained contexts
 */
function createMinimalSummary(analysisData) {
  return {
    exerciseType: analysisData.exerciseType,
    score: analysisData.analysis?.overallScore || 0,
    errors: (analysisData.analysis?.criticalErrors || []).slice(0, 3).map(error => ({
      type: error.type,
      severity: error.severity,
      description: truncateText(error.description, 100)
    })),
    improvements: (analysisData.analysis?.improvements || []).slice(0, 2).map(imp => ({
      category: imp.category,
      priority: imp.priority,
      suggestion: truncateText(imp.suggestion, 100)
    })),
    confidence: Math.round((analysisData.confidenceMetrics?.analysisReliability || 0) * 100),
    timestamp: new Date().toISOString()
  };
}

/**
 * Create balanced summary optimized for AI coaching context
 */
function createBalancedSummary(analysisData, targetTokens) {
  const summary = {
    // Core metrics (always included)
    exerciseType: analysisData.exerciseType,
    analysisId: analysisData.id,
    overallScore: analysisData.analysis?.overallScore || 0,
    
    // Form-specific scores
    formScores: compressFormScores(analysisData.analysis),
    
    // Critical feedback
    errors: compressCriticalErrors(analysisData.analysis?.criticalErrors || []),
    improvements: compressImprovements(analysisData.analysis?.improvements || []),
    
    // Movement analysis
    phases: compressMovementPhases(analysisData.analysis?.keyPhases || []),
    timing: compressTiming(analysisData.analysis?.timing),
    
    // Quality metrics
    confidence: {
      analysis: Math.round((analysisData.confidenceMetrics?.analysisReliability || 0) * 100),
      coverage: Math.round((analysisData.confidenceMetrics?.framesCoverage || 0) * 100),
      avgLandmark: Math.round((analysisData.confidenceMetrics?.averageLandmarkConfidence || 0) * 100)
    },
    
    // Context
    warnings: (analysisData.warnings || []).slice(0, 3),
    processedFrames: analysisData.framesProcessed || 0,
    processingTime: analysisData.processingTime || 0,
    
    // Timestamp for context
    analyzedAt: new Date().toISOString()
  };

  return summary;
}

/**
 * Create detailed summary for comprehensive analysis
 */
function createDetailedSummary(analysisData) {
  return {
    ...createBalancedSummary(analysisData),
    
    // Additional details
    jointAngles: compressJointAngles(analysisData.analysis?.jointAngles || []),
    movementPattern: compressMovementPattern(analysisData.analysis?.movementPattern),
    
    // Exercise-specific details
    exerciseSpecific: extractExerciseSpecificMetrics(analysisData.analysis),
    
    // Full error details
    allErrors: analysisData.analysis?.criticalErrors || [],
    allImprovements: analysisData.analysis?.improvements || [],
    
    // Quality indicators
    qualityIndicators: analysisData.confidenceMetrics?.qualityIndicators || {},
    
    // Video metadata
    videoMetadata: {
      duration: analysisData.videoDuration,
      framesProcessed: analysisData.framesProcessed,
      framesCoverage: analysisData.confidenceMetrics?.framesCoverage
    }
  };
}

/**
 * Compression helper functions
 */

function compressFormScores(analysis) {
  if (!analysis) return {};
  
  const scores = {};
  
  // Extract exercise-specific scores based on type
  if (analysis.depth?.depthScore !== undefined) scores.depth = analysis.depth.depthScore;
  if (analysis.kneeAlignment?.kneeTrackingScore !== undefined) scores.kneeAlignment = analysis.kneeAlignment.kneeTrackingScore;
  if (analysis.spinalAlignment?.alignmentScore !== undefined) scores.spinalAlignment = analysis.spinalAlignment.alignmentScore;
  if (analysis.balanceAnalysis?.stabilityScore !== undefined) scores.balance = analysis.balanceAnalysis.stabilityScore;
  if (analysis.timing?.tempoScore !== undefined) scores.timing = analysis.timing.tempoScore;
  
  // Add any other form scores
  if (analysis.formScores) {
    Object.assign(scores, analysis.formScores);
  }
  
  return scores;
}

function compressCriticalErrors(errors) {
  return errors.slice(0, 5).map(error => ({
    type: error.type,
    severity: error.severity,
    description: truncateText(error.description, 150),
    correction: truncateText(error.correction, 150),
    timeRange: error.timeRange ? [error.timeRange[0], error.timeRange[1]] : null
  }));
}

function compressImprovements(improvements) {
  return improvements.slice(0, 4).map(imp => ({
    category: imp.category,
    priority: imp.priority,
    suggestion: truncateText(imp.suggestion, 200),
    expectedImprovement: truncateText(imp.expectedImprovement, 150)
  }));
}

function compressMovementPhases(phases) {
  if (!Array.isArray(phases)) return [];
  
  return phases.map(phase => ({
    type: phase.type,
    duration: phase.duration,
    startFrame: phase.startFrame,
    endFrame: phase.endFrame
  }));
}

function compressTiming(timing) {
  if (!timing) return {};
  
  return {
    totalDuration: timing.totalDuration,
    tempoScore: timing.tempoScore,
    rhythmConsistency: timing.rhythmConsistency,
    phases: timing.phaseTimings ? Object.keys(timing.phaseTimings).reduce((acc, key) => {
      acc[key] = timing.phaseTimings[key];
      return acc;
    }, {}) : {}
  };
}

function compressJointAngles(jointAnglesSequence) {
  if (!Array.isArray(jointAnglesSequence) || jointAnglesSequence.length === 0) {
    return {};
  }

  // Sample key frames instead of all frames
  const sampleSize = Math.min(10, jointAnglesSequence.length);
  const step = Math.floor(jointAnglesSequence.length / sampleSize);
  const samples = [];
  
  for (let i = 0; i < jointAnglesSequence.length; i += step) {
    samples.push(jointAnglesSequence[i]);
  }

  // Calculate ranges for key joints
  const jointSummary = {};
  const keyJoints = ['leftKnee', 'rightKnee', 'leftHip', 'rightHip', 'spinalAlignment'];
  
  keyJoints.forEach(joint => {
    const values = samples.map(frame => frame[joint]).filter(val => typeof val === 'number' && !isNaN(val));
    if (values.length > 0) {
      jointSummary[joint] = {
        min: Math.round(Math.min(...values)),
        max: Math.round(Math.max(...values)),
        avg: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
      };
    }
  });

  return jointSummary;
}

function compressMovementPattern(movementPattern) {
  if (!movementPattern) return {};
  
  return {
    consistency: movementPattern.consistency,
    smoothness: movementPattern.smoothness,
    phases: movementPattern.phases?.length || 0,
    tempo: movementPattern.tempo ? {
      total: movementPattern.tempo.totalDuration,
      descent: movementPattern.tempo.descendDuration,
      ascent: movementPattern.tempo.ascentDuration
    } : {}
  };
}

function extractExerciseSpecificMetrics(analysis) {
  if (!analysis) return {};
  
  const metrics = {};
  
  // Squat-specific
  if (analysis.depth) {
    metrics.depth = {
      maxDepth: analysis.depth.maxDepth,
      reachedParallel: analysis.depth.reachedParallel,
      belowParallel: analysis.depth.belowParallel,
      consistency: analysis.depth.consistency
    };
  }
  
  if (analysis.kneeAlignment) {
    metrics.kneeAlignment = {
      valgusCollapse: analysis.kneeAlignment.valgusCollapse,
      maxInwardDeviation: analysis.kneeAlignment.maxInwardDeviation,
      consistencyScore: analysis.kneeAlignment.consistencyScore
    };
  }
  
  if (analysis.spinalAlignment) {
    metrics.spinalAlignment = {
      neutralSpine: analysis.spinalAlignment.neutralSpine,
      forwardLean: analysis.spinalAlignment.forwardLean,
      lateralDeviation: analysis.spinalAlignment.lateralDeviation
    };
  }
  
  if (analysis.balanceAnalysis) {
    metrics.balance = {
      weightDistribution: analysis.balanceAnalysis.weightDistribution,
      stabilityScore: analysis.balanceAnalysis.stabilityScore,
      sway: analysis.balanceAnalysis.sway
    };
  }
  
  return metrics;
}

/**
 * Apply additional compression when over token limit
 */
function applyAdditionalCompression(summary, targetTokens) {
  const compressed = { ...summary };
  
  // Reduce error descriptions
  if (compressed.errors) {
    compressed.errors = compressed.errors.slice(0, 3).map(error => ({
      ...error,
      description: truncateText(error.description, 80),
      correction: truncateText(error.correction, 80)
    }));
  }
  
  // Reduce improvements
  if (compressed.improvements) {
    compressed.improvements = compressed.improvements.slice(0, 2).map(imp => ({
      ...imp,
      suggestion: truncateText(imp.suggestion, 120),
      expectedImprovement: truncateText(imp.expectedImprovement, 80)
    }));
  }
  
  // Remove detailed joint angles if present
  delete compressed.jointAngles;
  delete compressed.movementPattern;
  delete compressed.exerciseSpecific;
  
  // Reduce warnings
  if (compressed.warnings) {
    compressed.warnings = compressed.warnings.slice(0, 2);
  }
  
  return compressed;
}

/**
 * Utility functions
 */

function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Rough token estimation (4 characters ≈ 1 token for English)
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Calculate form competency level for AI coaching
 */
export const calculateFormCompetency = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    try {
      const { progressData, exerciseType } = request.data;
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      if (!progressData || !exerciseType) {
        throw new HttpsError("invalid-argument", "Progress data and exercise type are required");
      }

      logger.info("Calculating form competency level", { 
        userId, 
        exerciseType,
        sessionsCount: progressData.length 
      });

      const competency = calculateCompetencyMetrics(progressData, exerciseType);

      return {
        success: true,
        competency,
        exerciseType,
        calculatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error("Form competency calculation failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Competency calculation failed: ${error.message}`);
    }
  }
);

function calculateCompetencyMetrics(progressData, exerciseType) {
  if (!progressData || progressData.length === 0) {
    return {
      level: 'beginner',
      score: 0,
      confidence: 0,
      sessionCount: 0,
      strengths: [],
      weaknesses: [],
      trend: 'stable'
    };
  }

  const scores = progressData.map(session => session.overallScore || 0);
  const recentScores = scores.slice(0, Math.min(5, scores.length));
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const recentAverage = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;

  // Determine competency level
  let level = 'beginner';
  if (averageScore >= 85 && scores.length >= 10) {
    level = 'advanced';
  } else if (averageScore >= 70 && scores.length >= 5) {
    level = 'intermediate';
  }

  // Calculate consistency (inverse of coefficient of variation)
  const mean = averageScore;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  const consistency = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0;

  // Calculate trend
  let trend = 'stable';
  if (scores.length >= 3) {
    const oldAverage = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
    const improvement = recentAverage - oldAverage;
    if (improvement > 5) trend = 'improving';
    else if (improvement < -5) trend = 'declining';
  }

  // Analyze strengths and weaknesses
  const { strengths, weaknesses } = analyzeFormAreas(progressData);

  return {
    level,
    score: Math.round(averageScore),
    confidence: Math.round(consistency),
    sessionCount: scores.length,
    trend,
    strengths,
    weaknesses,
    metrics: {
      recentAverage: Math.round(recentAverage),
      bestScore: Math.max(...scores),
      consistency: Math.round(consistency),
      improvement: Math.round(recentAverage - (scores.slice(-5).reduce((sum, score) => sum + score, 0) / Math.min(5, scores.length)))
    }
  };
}

function analyzeFormAreas(progressData) {
  const areaScores = {};
  const strengths = [];
  const weaknesses = [];

  // Aggregate form scores across sessions
  progressData.forEach(session => {
    if (session.formScores) {
      Object.entries(session.formScores).forEach(([area, score]) => {
        if (area !== 'overall' && typeof score === 'number') {
          if (!areaScores[area]) areaScores[area] = [];
          areaScores[area].push(score);
        }
      });
    }
  });

  // Calculate averages and identify strengths/weaknesses
  Object.entries(areaScores).forEach(([area, scores]) => {
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const areaData = {
      area: formatAreaName(area),
      score: Math.round(average),
      consistency: calculateAreaConsistency(scores)
    };

    if (average >= 80) {
      strengths.push(areaData);
    } else if (average < 65) {
      weaknesses.push(areaData);
    }
  });

  // Sort by score
  strengths.sort((a, b) => b.score - a.score);
  weaknesses.sort((a, b) => a.score - b.score);

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3)
  };
}

function calculateAreaConsistency(scores) {
  if (scores.length < 2) return 100;
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? Math.max(0, Math.round(100 - (stdDev / mean) * 100)) : 0;
}

function formatAreaName(area) {
  const areaNames = {
    depth: 'Squat Depth',
    kneeAlignment: 'Knee Alignment',
    spinalAlignment: 'Spinal Alignment',
    balance: 'Balance & Stability',
    timing: 'Movement Timing'
  };
  return areaNames[area] || area.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}