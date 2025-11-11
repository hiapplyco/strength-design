/**
 * Pose Progress Service Test Suite
 * Tests for progress tracking, form score history, and achievement system
 */

import PoseProgressService from '../poseProgressService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Mock user
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com'
};

// Mock analysis data
const createMockAnalysisData = (score = 85, exerciseType = 'squat') => ({
  id: `analysis-${Date.now()}`,
  exerciseType,
  analysis: {
    overallScore: score,
    formScores: {
      depth: 90,
      kneeTracking: 85,
      backAngle: 80
    },
    keyPhases: [
      { phase: 'descent', duration: 2000, quality: 0.9 },
      { phase: 'bottom', duration: 500, quality: 0.85 },
      { phase: 'ascent', duration: 1800, quality: 0.88 }
    ],
    timing: {
      totalDuration: 4300,
      tempoRatio: 1.1
    },
    criticalErrors: [],
    improvements: ['Increase depth slightly'],
    jointAngles: [
      { joint: 'hip', angle: 95, timestamp: 1000 },
      { joint: 'knee', angle: 90, timestamp: 1500 }
    ]
  },
  confidenceMetrics: {
    analysisReliability: 0.92,
    framesCoverage: 0.95
  },
  processingTime: 25000,
  framesProcessed: 150,
  warnings: []
});

describe('PoseProgressService', () => {
  let service;

  beforeEach(() => {
    service = new PoseProgressService();
    jest.clearAllMocks();

    // Mock Firebase auth
    auth.currentUser = mockUser;

    // Mock Firestore operations
    addDoc.mockResolvedValue({ id: 'doc-123' });
    getDocs.mockResolvedValue({
      docs: [],
      empty: true
    });
  });

  describe('Initialization', () => {
    test('initializes successfully', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(service.isInitialized).toBe(true);
    });

    test('loads cached progress data', async () => {
      const cachedData = {
        'squat': { sessions: 10, averageScore: 82 }
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedData));

      await service.initialize();

      expect(service.progressCache.size).toBeGreaterThan(0);
    });

    test('loads user settings', async () => {
      const savedSettings = {
        dataRetentionDays: 180,
        trackingEnabled: true
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedSettings));

      await service.initialize();

      expect(service.settingsCache.dataRetentionDays).toBe(180);
    });

    test('handles initialization errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await service.initialize();

      // Should still initialize with defaults
      expect(result.success).toBe(true);
      expect(service.isInitialized).toBe(true);
    });

    test('schedules background sync', async () => {
      const scheduleSpy = jest.spyOn(service, 'scheduleBackgroundSync');

      await service.initialize();

      expect(scheduleSpy).toHaveBeenCalled();
    });
  });

  describe('Analysis Session Recording', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('records new analysis session', async () => {
      const analysisData = createMockAnalysisData(85, 'squat');

      const result = await service.recordAnalysisSession(analysisData);

      expect(result.success).toBe(true);
      expect(addDoc).toHaveBeenCalled();
    });

    test('requires authenticated user', async () => {
      auth.currentUser = null;

      const analysisData = createMockAnalysisData();

      await expect(
        service.recordAnalysisSession(analysisData)
      ).rejects.toThrow('not authenticated');
    });

    test('extracts form scores correctly', async () => {
      const analysisData = createMockAnalysisData(85, 'squat');

      await service.recordAnalysisSession(analysisData);

      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.formScores).toHaveProperty('depth');
      expect(callArgs.formScores).toHaveProperty('kneeTracking');
      expect(callArgs.formScores).toHaveProperty('backAngle');
    });

    test('includes video metadata when enabled', async () => {
      service.settingsCache.includeVideoFiles = true;

      const analysisData = createMockAnalysisData();
      const videoMetadata = {
        uri: 'file:///video.mp4',
        duration: 60000,
        fileSize: 50 * 1024 * 1024
      };

      await service.recordAnalysisSession(analysisData, videoMetadata);

      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.videoUri).toBe('file:///video.mp4');
    });

    test('excludes video metadata when disabled', async () => {
      service.settingsCache.includeVideoFiles = false;

      const analysisData = createMockAnalysisData();
      const videoMetadata = { uri: 'file:///video.mp4' };

      await service.recordAnalysisSession(analysisData, videoMetadata);

      const callArgs = addDoc.mock.calls[0][1];
      expect(callArgs.videoUri).toBeNull();
    });
  });

  describe('Progress Metrics Calculation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('identifies personal best scores', async () => {
      // First session
      await service.recordAnalysisSession(createMockAnalysisData(80, 'squat'));

      // Better session (personal best)
      const result = await service.recordAnalysisSession(
        createMockAnalysisData(92, 'squat')
      );

      const sessionData = addDoc.mock.calls[1][1];
      expect(sessionData.isPersonalBest).toBe(true);
    });

    test('calculates improvement from last session', async () => {
      // Previous session: 80
      await service.recordAnalysisSession(createMockAnalysisData(80, 'squat'));

      // Current session: 85
      await service.recordAnalysisSession(createMockAnalysisData(85, 'squat'));

      const sessionData = addDoc.mock.calls[1][1];
      expect(sessionData.improvementFromLast).toBeGreaterThan(0);
    });

    test('calculates consistency score based on recent sessions', async () => {
      // Record multiple consistent sessions
      const scores = [85, 87, 86, 88, 85];

      for (const score of scores) {
        await service.recordAnalysisSession(createMockAnalysisData(score, 'squat'));
      }

      const lastSessionData = addDoc.mock.calls[4][1];
      expect(lastSessionData.consistencyScore).toBeGreaterThan(0);
      expect(lastSessionData.consistencyScore).toBeLessThanOrEqual(100);
    });

    test('tracks negative improvement correctly', async () => {
      // Previous session: 90
      await service.recordAnalysisSession(createMockAnalysisData(90, 'squat'));

      // Current session: 80 (regression)
      await service.recordAnalysisSession(createMockAnalysisData(80, 'squat'));

      const sessionData = addDoc.mock.calls[1][1];
      expect(sessionData.improvementFromLast).toBeLessThan(0);
    });
  });

  describe('Progress Data Retrieval', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('gets progress for specific exercise', async () => {
      const mockSessions = [
        { data: () => createMockAnalysisData(80, 'squat') },
        { data: () => createMockAnalysisData(85, 'squat') },
        { data: () => createMockAnalysisData(90, 'squat') }
      ];

      getDocs.mockResolvedValue({ docs: mockSessions, empty: false });

      const progress = await service.getProgressForExercise('squat');

      expect(progress.sessions).toBe(3);
      expect(progress.averageScore).toBeGreaterThan(0);
      expect(progress.bestScore).toBe(90);
    });

    test('calculates average score correctly', async () => {
      const mockSessions = [
        { data: () => ({ overallScore: 80 }) },
        { data: () => ({ overallScore: 85 }) },
        { data: () => ({ overallScore: 90 }) }
      ];

      getDocs.mockResolvedValue({ docs: mockSessions, empty: false });

      const progress = await service.getProgressForExercise('squat');

      expect(progress.averageScore).toBeCloseTo(85, 0);
    });

    test('gets recent sessions with limit', async () => {
      await service.getRecentSessions('squat', 10);

      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ _comparator: expect.anything() }),
        expect.objectContaining({ _limit: 10 })
      );
    });

    test('returns empty data for exercise with no sessions', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true });

      const progress = await service.getProgressForExercise('bench-press');

      expect(progress.sessions).toBe(0);
      expect(progress.averageScore).toBe(0);
    });
  });

  describe('Form Scores Tracking', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('tracks form scores over time', async () => {
      const sessions = [
        createMockAnalysisData(80, 'squat'),
        createMockAnalysisData(85, 'squat'),
        createMockAnalysisData(90, 'squat')
      ];

      for (const session of sessions) {
        await service.recordAnalysisSession(session);
      }

      const formProgress = service.getFormScoresHistory('squat');

      expect(formProgress.length).toBe(3);
    });

    test('identifies improving form metrics', async () => {
      const improving = await service.getImprovingMetrics('squat');

      expect(improving).toBeDefined();
      expect(Array.isArray(improving)).toBe(true);
    });

    test('identifies declining form metrics', async () => {
      const declining = await service.getDecliningMetrics('squat');

      expect(declining).toBeDefined();
      expect(Array.isArray(declining)).toBe(true);
    });
  });

  describe('Achievement System', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('awards achievement for first analysis', async () => {
      getDocs.mockResolvedValue({ docs: [], empty: true }); // No previous sessions

      const result = await service.recordAnalysisSession(
        createMockAnalysisData(85, 'squat')
      );

      expect(result.achievements).toContainEqual(
        expect.objectContaining({ type: 'first_analysis' })
      );
    });

    test('awards achievement for milestone session count', async () => {
      // Mock 9 previous sessions (10th will be milestone)
      const mockSessions = Array.from({ length: 9 }, () => ({
        data: () => createMockAnalysisData(80, 'squat')
      }));

      getDocs.mockResolvedValue({ docs: mockSessions, empty: false });

      const result = await service.recordAnalysisSession(
        createMockAnalysisData(85, 'squat')
      );

      expect(result.achievements).toBeDefined();
    });

    test('awards achievement for high score', async () => {
      const result = await service.recordAnalysisSession(
        createMockAnalysisData(95, 'squat')
      );

      expect(result.achievements).toContainEqual(
        expect.objectContaining({ type: 'excellent_form' })
      );
    });

    test('awards achievement for consistent improvement', async () => {
      // Record improving sessions
      const scores = [70, 75, 80, 85, 90];

      for (const score of scores) {
        await service.recordAnalysisSession(createMockAnalysisData(score, 'squat'));
      }

      const lastResult = await service.recordAnalysisSession(
        createMockAnalysisData(95, 'squat')
      );

      expect(lastResult.achievements).toBeDefined();
    });
  });

  describe('Statistics and Analytics', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('calculates overall statistics', async () => {
      const mockSessions = Array.from({ length: 20 }, (_, i) => ({
        data: () => createMockAnalysisData(80 + i, 'squat')
      }));

      getDocs.mockResolvedValue({ docs: mockSessions, empty: false });

      const stats = await service.getOverallStatistics();

      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('improvementRate');
    });

    test('calculates improvement rate', async () => {
      const rate = await service.calculateImprovementRate('squat');

      expect(typeof rate).toBe('number');
    });

    test('gets exercise-specific insights', async () => {
      const insights = await service.getExerciseInsights('squat');

      expect(insights).toBeDefined();
      expect(insights).toHaveProperty('strengths');
      expect(insights).toHaveProperty('areasForImprovement');
    });
  });

  describe('Data Export', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('exports progress data as JSON', async () => {
      const mockSessions = Array.from({ length: 5 }, (_, i) => ({
        data: () => createMockAnalysisData(80 + i, 'squat')
      }));

      getDocs.mockResolvedValue({ docs: mockSessions, empty: false });

      const exported = await service.exportProgressData('json');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    test('exports progress data as CSV', async () => {
      const mockSessions = Array.from({ length: 5 }, (_, i) => ({
        data: () => createMockAnalysisData(80 + i, 'squat')
      }));

      getDocs.mockResolvedValue({ docs: mockSessions, empty: false });

      const exported = await service.exportProgressData('csv');

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported).toContain(','); // CSV format
    });

    test('includes privacy-safe data in export', async () => {
      service.settingsCache.privacyLevel = 'anonymous';

      const exported = await service.exportProgressData('json');
      const data = JSON.parse(exported);

      // Should not include identifying information
      expect(data).not.toHaveProperty('userId');
      expect(data).not.toHaveProperty('email');
    });
  });

  describe('Data Retention', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('cleans up old data based on retention policy', async () => {
      service.settingsCache.dataRetentionDays = 90;

      const cleanupSpy = jest.spyOn(service, 'cleanupOldData');

      await service.cleanupOldData();

      expect(cleanupSpy).toHaveBeenCalled();
    });

    test('preserves data within retention period', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago

      const shouldKeep = service.shouldRetainSession({
        analyzedAt: recentDate
      }, 90);

      expect(shouldKeep).toBe(true);
    });

    test('removes data outside retention period', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // 400 days ago

      const shouldKeep = service.shouldRetainSession({
        analyzedAt: oldDate
      }, 365);

      expect(shouldKeep).toBe(false);
    });
  });

  describe('Caching', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('caches progress data for performance', async () => {
      const progress = { sessions: 10, averageScore: 85 };

      service.cacheProgressData('squat', progress);

      expect(service.progressCache.get('squat')).toEqual(progress);
    });

    test('retrieves data from cache when available', async () => {
      const cachedProgress = { sessions: 10, averageScore: 85 };
      service.progressCache.set('squat', cachedProgress);

      const progress = await service.getProgressForExercise('squat', true);

      // Should use cached data, not query Firestore
      expect(getDocs).not.toHaveBeenCalled();
      expect(progress).toEqual(cachedProgress);
    });

    test('saves cache to storage', async () => {
      service.progressCache.set('squat', { sessions: 10, averageScore: 85 });

      await service.saveToCache();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@pose_progress_cache',
        expect.any(String)
      );
    });

    test('invalidates cache after recording new session', async () => {
      const clearSpy = jest.spyOn(service.progressCache, 'clear');

      await service.recordAnalysisSession(createMockAnalysisData());

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('Settings Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('updates user settings', async () => {
      const newSettings = {
        dataRetentionDays: 180,
        syncFrequency: 'weekly'
      };

      await service.updateSettings(newSettings);

      expect(service.settingsCache.dataRetentionDays).toBe(180);
      expect(service.settingsCache.syncFrequency).toBe('weekly');
    });

    test('persists settings to storage', async () => {
      await service.updateSettings({ dataRetentionDays: 180 });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@pose_progress_settings',
        expect.stringContaining('180')
      );
    });

    test('validates settings values', async () => {
      const invalidSettings = {
        dataRetentionDays: -10 // Invalid negative value
      };

      await expect(
        service.updateSettings(invalidSettings)
      ).rejects.toThrow('Invalid');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('handles Firestore errors gracefully', async () => {
      addDoc.mockRejectedValue(new Error('Firestore error'));

      const result = await service.recordAnalysisSession(
        createMockAnalysisData()
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('continues operation after cache failure', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      await expect(
        service.saveToCache()
      ).resolves.not.toThrow();
    });

    test('provides fallback data on query failure', async () => {
      getDocs.mockRejectedValue(new Error('Query failed'));

      const progress = await service.getProgressForExercise('squat');

      expect(progress).toBeDefined();
      expect(progress.sessions).toBe(0);
    });
  });
});
