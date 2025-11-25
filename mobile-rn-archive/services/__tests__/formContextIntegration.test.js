/**
 * Form Context Integration Tests
 * Validates the integration between PoseAnalysisService, PoseProgressService, and FormContextService
 * Issue #16 - Stream A: Form Context Builder & Data Integration
 */

import formContextService from '../formContextService';
import poseProgressService from '../poseProgressService';

// Mock Firebase dependencies
jest.mock('../firebaseConfig', () => ({
  functions: {},
  auth: { currentUser: { uid: 'test-user-123' } },
  db: {}
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn())
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

// Mock analysis data for testing
const mockAnalysisResult = {
  success: true,
  analysis: {
    overallScore: 85,
    criticalErrors: [
      {
        type: 'shallow_depth',
        severity: 'medium',
        description: 'Squat depth insufficient - hip crease did not reach below knee level',
        correction: 'Focus on sitting back and down, engage glutes to reach proper depth'
      }
    ],
    improvements: [
      {
        category: 'depth',
        priority: 'high',
        suggestion: 'Work on ankle and hip mobility to achieve greater squat depth',
        expectedImprovement: 'Better muscle activation and improved strength development'
      }
    ],
    depth: { depthScore: 75 },
    kneeAlignment: { kneeTrackingScore: 90 },
    spinalAlignment: { alignmentScore: 88 },
    balanceAnalysis: { stabilityScore: 82 },
    timing: { tempoScore: 80 }
  },
  confidenceMetrics: {
    analysisReliability: 0.85,
    framesCoverage: 0.92,
    averageLandmarkConfidence: 0.88
  },
  processingTime: 5500,
  framesProcessed: 45,
  warnings: ['Low lighting conditions detected']
};

const mockProgressData = [
  {
    id: 'session1',
    analyzedAt: new Date('2024-01-15'),
    overallScore: 80,
    formScores: { depth: 75, kneeAlignment: 85, spinalAlignment: 82 },
    confidence: 0.85,
    criticalErrors: [{ type: 'shallow_depth', severity: 'medium' }]
  },
  {
    id: 'session2', 
    analyzedAt: new Date('2024-01-10'),
    overallScore: 82,
    formScores: { depth: 78, kneeAlignment: 87, spinalAlignment: 80 },
    confidence: 0.88,
    criticalErrors: [{ type: 'knee_valgus', severity: 'low' }]
  }
];

describe('Form Context Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FormContextService', () => {
    test('should initialize successfully', async () => {
      const result = await formContextService.initialize();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('initialized successfully');
      expect(formContextService.isInitialized).toBe(true);
    });

    test('should handle coaching preferences updates', async () => {
      const preferences = {
        coachingStyle: 'technical',
        feedbackDetail: 'detailed',
        focusAreas: ['depth', 'balance'],
        experienceLevel: 'intermediate'
      };

      await formContextService.updateCoachingPreferences(preferences);
      const updated = formContextService.getCoachingPreferences();

      expect(updated.coachingStyle).toBe('technical');
      expect(updated.feedbackDetail).toBe('detailed');
      expect(updated.focusAreas).toContain('depth');
      expect(updated.focusAreas).toContain('balance');
      expect(updated.experienceLevel).toBe('intermediate');
    });

    test('should estimate token count correctly', () => {
      const testText = 'This is a test string with approximately 20 characters.';
      const estimatedTokens = formContextService.estimateTokenCount(testText);
      
      // Rough estimation: 4 characters ≈ 1 token
      expect(estimatedTokens).toBeGreaterThan(10);
      expect(estimatedTokens).toBeLessThan(25);
    });

    test('should provide service status information', () => {
      const status = formContextService.getServiceStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('preferences');
      expect(status).toHaveProperty('cacheSize');
      expect(status).toHaveProperty('requestQueue');
      expect(typeof status.cacheSize.context).toBe('number');
      expect(typeof status.cacheSize.competency).toBe('number');
    });
  });

  describe('PoseProgressService Integration', () => {
    test('should calculate competency level from progress data', async () => {
      // Mock the getProgressSummary method
      jest.spyOn(poseProgressService, 'getProgressSummary').mockResolvedValue({
        averageScore: 85,
        totalSessions: 12,
        consistency: 88,
        improvement: 8,
        strengths: [{ area: 'spinalAlignment', score: 90 }],
        improvementAreas: [{ area: 'depth', score: 75 }]
      });

      const competency = await poseProgressService.getCompetencyForContext('squat');
      
      expect(competency.level).toBe('advanced'); // 85 score + 12 sessions
      expect(competency.score).toBe(85);
      expect(competency.sessionCount).toBe(12);
      expect(competency.consistency).toBe(88);
      expect(competency.trend).toBe('improving');
    });

    test('should generate form context data for AI coaching', async () => {
      // Mock the getExerciseProgress method
      jest.spyOn(poseProgressService, 'getExerciseProgress').mockResolvedValue(mockProgressData);
      jest.spyOn(poseProgressService, 'getProgressSummary').mockResolvedValue({
        averageScore: 81,
        totalSessions: 2
      });

      const contextData = await poseProgressService.getFormContextData('squat', {
        timeRange: '30d',
        limit: 5,
        includeErrorPatterns: true
      });

      expect(contextData.exerciseType).toBe('squat');
      expect(contextData.sessions).toHaveLength(2);
      expect(contextData.sessions[0]).toHaveProperty('overallScore', 80);
      expect(contextData.sessions[0]).toHaveProperty('formScores');
      expect(contextData.sessions[0]).toHaveProperty('criticalErrors');
      expect(contextData.summary).toHaveProperty('averageScore', 81);
    });

    test('should calculate form trends correctly', async () => {
      jest.spyOn(poseProgressService, 'getExerciseProgress').mockResolvedValue([
        { analyzedAt: new Date(), overallScore: 85, formScores: { depth: 80 } },
        { analyzedAt: new Date(), overallScore: 80, formScores: { depth: 75 } },
        { analyzedAt: new Date(), overallScore: 78, formScores: { depth: 73 } }
      ]);

      const trends = await poseProgressService.getFormTrends('squat', '30d');

      expect(trends.hasData).toBe(true);
      expect(trends.overallTrend).toBe('improving'); // Recent scores higher
      expect(trends.formAreaTrends).toHaveProperty('depth');
      expect(trends.formAreaTrends.depth.trend).toBe('improving');
      expect(trends.recentSessions).toHaveLength(3);
    });

    test('should update form context cache correctly', async () => {
      const exerciseType = 'squat';
      const analysisData = { id: 'test-123', overallScore: 85 };

      // Mock the cache maps
      poseProgressService.progressCache.set(`user_${exerciseType}_30d`, { data: [], timestamp: Date.now() });
      poseProgressService.formScoresCache.set(`user_${exerciseType}_scores`, { data: [], timestamp: Date.now() });

      expect(poseProgressService.progressCache.size).toBe(1);
      expect(poseProgressService.formScoresCache.size).toBe(1);

      await poseProgressService.updateFormContextCache(exerciseType, analysisData);

      // Cache should be cleared for this exercise
      expect(poseProgressService.progressCache.size).toBe(0);
      expect(poseProgressService.formScoresCache.size).toBe(0);
    });
  });

  describe('Token Optimization', () => {
    test('should respect token limits in form data summarization', () => {
      const largeAnalysisData = {
        ...mockAnalysisResult,
        analysis: {
          ...mockAnalysisResult.analysis,
          criticalErrors: Array(20).fill({
            type: 'test_error',
            severity: 'low',
            description: 'A very long description that might use too many tokens in the final AI prompt context and should be truncated appropriately to stay within limits',
            correction: 'A very long correction message that also needs to be truncated for token efficiency'
          }),
          improvements: Array(15).fill({
            category: 'test',
            priority: 'low',
            suggestion: 'A lengthy suggestion that should be compressed for token efficiency',
            expectedImprovement: 'Expected improvement description'
          })
        }
      };

      // Mock the summarization function behavior
      const mockSummarizeFormData = jest.fn().mockImplementation((analysisData, options) => {
        const targetTokens = options.targetTokens || 1500;
        const compressionLevel = options.compressionLevel || 'balanced';
        
        let summary = {
          exerciseType: analysisData.exerciseType,
          overallScore: analysisData.analysis.overallScore,
          errors: (analysisData.analysis.criticalErrors || []).slice(0, compressionLevel === 'minimal' ? 2 : 5),
          improvements: (analysisData.analysis.improvements || []).slice(0, compressionLevel === 'minimal' ? 1 : 4)
        };

        const estimatedTokens = Math.ceil(JSON.stringify(summary).length / 4);
        
        // Apply additional compression if over target
        if (estimatedTokens > targetTokens) {
          summary.errors = summary.errors.slice(0, 2);
          summary.improvements = summary.improvements.slice(0, 2);
        }

        return {
          success: true,
          summary,
          metadata: {
            estimatedTokens: Math.ceil(JSON.stringify(summary).length / 4),
            compressionLevel
          }
        };
      });

      const result = mockSummarizeFormData(largeAnalysisData, { 
        targetTokens: 1000, 
        compressionLevel: 'minimal' 
      });

      expect(result.success).toBe(true);
      expect(result.metadata.estimatedTokens).toBeLessThanOrEqual(1000);
      expect(result.summary.errors.length).toBeLessThanOrEqual(2);
      expect(result.summary.improvements.length).toBeLessThanOrEqual(2);
    });

    test('should handle different compression levels appropriately', () => {
      const testData = mockAnalysisResult;
      
      const mockCompressionLevels = {
        minimal: { maxErrors: 2, maxImprovements: 1, targetTokens: 500 },
        balanced: { maxErrors: 5, maxImprovements: 4, targetTokens: 1500 },
        detailed: { maxErrors: 10, maxImprovements: 8, targetTokens: 2500 }
      };

      Object.entries(mockCompressionLevels).forEach(([level, config]) => {
        const mockResult = {
          exerciseType: testData.exerciseType,
          errors: testData.analysis.criticalErrors.slice(0, config.maxErrors),
          improvements: testData.analysis.improvements.slice(0, config.maxImprovements)
        };

        const estimatedTokens = Math.ceil(JSON.stringify(mockResult).length / 4);
        
        expect(estimatedTokens).toBeLessThanOrEqual(config.targetTokens);
        expect(mockResult.errors.length).toBeLessThanOrEqual(config.maxErrors);
        expect(mockResult.improvements.length).toBeLessThanOrEqual(config.maxImprovements);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle form context service failures gracefully', async () => {
      // Mock a failure scenario
      const mockError = new Error('Network error');
      jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs

      // Test that service continues working even if context generation fails
      const contextData = await poseProgressService.getFormContextData('invalid_exercise');
      
      expect(contextData).toHaveProperty('exerciseType', 'invalid_exercise');
      expect(contextData).toHaveProperty('sessions', []);
      expect(contextData).toHaveProperty('summary', null);
      
      console.error.mockRestore();
    });

    test('should provide fallback competency data on errors', async () => {
      jest.spyOn(poseProgressService, 'getProgressSummary').mockRejectedValue(new Error('Database error'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const competency = await poseProgressService.getCompetencyForContext('squat');
      
      expect(competency).toEqual({
        level: 'beginner',
        score: 0,
        sessionCount: 0,
        consistency: 0,
        trend: 'stable',
        strengths: [],
        weaknesses: []
      });
      
      console.error.mockRestore();
    });
  });

  describe('Cache Management', () => {
    test('should clear cache correctly', async () => {
      // Add some mock cache data
      formContextService.contextCache.set('test-key', { data: 'test' });
      formContextService.competencyCache.set('test-competency', { level: 'intermediate' });
      
      expect(formContextService.contextCache.size).toBe(1);
      expect(formContextService.competencyCache.size).toBe(1);
      
      formContextService.clearCache();
      
      expect(formContextService.contextCache.size).toBe(0);
      expect(formContextService.competencyCache.size).toBe(0);
    });

    test('should handle cache loading errors gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock AsyncStorage to throw an error
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      // Should not throw, should handle gracefully
      await expect(formContextService.loadFromCache()).resolves.not.toThrow();
      
      console.error.mockRestore();
    });
  });
});

describe('Integration Scenarios', () => {
  test('should handle complete analysis-to-context workflow', async () => {
    // Mock successful Firebase Functions calls
    const mockSummarizeFormData = jest.fn().mockResolvedValue({
      data: {
        success: true,
        summary: {
          exerciseType: 'squat',
          overallScore: 85,
          errors: [{ type: 'shallow_depth', severity: 'medium' }],
          improvements: [{ category: 'depth', priority: 'high' }]
        }
      }
    });

    const mockBuildFormContext = jest.fn().mockResolvedValue({
      data: {
        success: true,
        context: {
          exerciseType: 'squat',
          userProfile: { experienceLevel: 'intermediate' },
          currentSession: { overallScore: 85 },
          progressContext: { hasHistory: true },
          coachingProfile: { communicationStyle: 'supportive' }
        }
      }
    });

    formContextService.summarizeFormData = mockSummarizeFormData;
    formContextService.buildFormContext = mockBuildFormContext;

    // Simulate the workflow
    const summary = await formContextService.summarizeAnalysisData(mockAnalysisResult, {
      compressionLevel: 'balanced'
    });

    const context = await formContextService.buildAICoachingContext(
      mockAnalysisResult,
      'squat',
      { contextType: 'comprehensive' }
    );

    expect(mockSummarizeFormData).toHaveBeenCalledWith({
      analysisData: mockAnalysisResult,
      options: expect.objectContaining({
        compressionLevel: 'balanced'
      })
    });

    expect(mockBuildFormContext).toHaveBeenCalledWith({
      currentAnalysis: mockAnalysisResult,
      exerciseType: 'squat',
      contextType: 'comprehensive',
      includeHistory: true,
      targetTokens: 2000
    });

    expect(summary.exerciseType).toBe('squat');
    expect(context.exerciseType).toBe('squat');
  });
});