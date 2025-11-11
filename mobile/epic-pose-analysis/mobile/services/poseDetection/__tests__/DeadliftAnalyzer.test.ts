/**
 * DeadliftAnalyzer Test Suite
 * Tests for deadlift form analysis algorithms
 */

import DeadliftAnalyzer from '../analyzers/DeadliftAnalyzer';
import {
  createMockDeadliftLandmarks,
  createMockLandmarkSequence
} from './testHelpers';

describe('DeadliftAnalyzer', () => {
  let analyzer: DeadliftAnalyzer;

  beforeEach(() => {
    analyzer = new DeadliftAnalyzer();
  });

  describe('Hip Hinge Detection', () => {
    test('correctly identifies proper hip hinge pattern', () => {
      const landmarks = createMockDeadliftLandmarks({ hipHinge: true });

      const result = analyzer.analyze([landmarks]);

      expect(result.hipHinge).toBe('proper');
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'hips'
        })
      );
    });

    test('detects squat pattern instead of hip hinge', () => {
      const landmarks = createMockDeadliftLandmarks({ hipHinge: false });

      const result = analyzer.analyze([landmarks]);

      expect(result.hipHinge).toBe('squat_pattern');
      expect(result.score).toBeLessThan(70);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'hips',
          severity: 'high',
          message: expect.stringContaining('hinge')
        })
      );
    });

    test('calculates hip angle correctly', () => {
      const landmarks = createMockDeadliftLandmarks({ hipHinge: true });

      const result = analyzer.analyze([landmarks]);

      expect(result.angles.hip).toBeDefined();
      expect(result.angles.hip).toBeGreaterThan(0);
      expect(result.angles.hip).toBeLessThan(180);
    });
  });

  describe('Back Position Analysis', () => {
    test('validates neutral spine position', () => {
      const landmarks = createMockDeadliftLandmarks({ backRounded: false });

      const result = analyzer.analyze([landmarks]);

      expect(result.spinePosition).toBe('neutral');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'back'
        })
      );
    });

    test('detects rounded back (flexion)', () => {
      const landmarks = createMockDeadliftLandmarks({ backRounded: true });

      const result = analyzer.analyze([landmarks]);

      expect(result.spinePosition).toBe('flexed');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'back',
          severity: 'critical',
          message: expect.stringContaining('rounded')
        })
      );
    });

    test('penalizes rounded back heavily in scoring', () => {
      const neutralBack = createMockDeadliftLandmarks({ backRounded: false });
      const roundedBack = createMockDeadliftLandmarks({ backRounded: true });

      const neutralResult = analyzer.analyze([neutralBack]);
      const roundedResult = analyzer.analyze([roundedBack]);

      expect(neutralResult.score).toBeGreaterThan(roundedResult.score + 20);
    });

    test('calculates back angle correctly', () => {
      const landmarks = createMockDeadliftLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.angles.back).toBeDefined();
      expect(result.angles.back).toBeGreaterThan(0);
      expect(result.angles.back).toBeLessThan(180);
    });
  });

  describe('Bar Path Analysis', () => {
    test('validates straight bar path', () => {
      const landmarks = createMockDeadliftLandmarks({ barPath: 'straight' });

      const result = analyzer.analyze([landmarks]);

      expect(result.barPath).toBe('straight');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'bar_path'
        })
      );
    });

    test('detects bar drifting forward', () => {
      const landmarks = createMockDeadliftLandmarks({ barPath: 'forward' });

      const result = analyzer.analyze([landmarks]);

      expect(result.barPath).toBe('forward');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'bar_path',
          severity: 'medium',
          message: expect.stringContaining('close')
        })
      );
    });
  });

  describe('Lockout Analysis', () => {
    test('identifies complete lockout', () => {
      const sequence = createMockLandmarkSequence('deadlift', 30);

      const result = analyzer.analyze(sequence);

      if (result.repCount > 0) {
        expect(result.lockout).toBe('complete');
        expect(result.feedback).toContainEqual(
          expect.objectContaining({
            type: 'positive',
            area: 'lockout'
          })
        );
      }
    });

    test('detects incomplete lockout', () => {
      const landmarks = createMockDeadliftLandmarks();
      // Adjust landmarks for incomplete lockout
      landmarks.landmarks[23].y = 0.45; // Hips not fully extended

      const result = analyzer.analyze([landmarks]);

      expect(result.lockout).toBe('incomplete');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'lockout',
          message: expect.stringContaining('fully extend')
        })
      );
    });
  });

  describe('Starting Position', () => {
    test('validates proper setup position', () => {
      const landmarks = createMockDeadliftLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.setupPosition).toBeDefined();
      expect(result.setupPosition).toBe('good');
    });

    test('detects hips starting too high', () => {
      const landmarks = createMockDeadliftLandmarks();
      landmarks.landmarks[23].y = 0.35; // Hips too high

      const result = analyzer.analyze([landmarks]);

      expect(result.setupPosition).toBe('hips_high');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          area: 'setup',
          message: expect.stringContaining('lower')
        })
      );
    });

    test('detects hips starting too low', () => {
      const landmarks = createMockDeadliftLandmarks({ hipHinge: false });

      const result = analyzer.analyze([landmarks]);

      expect(result.setupPosition).toBe('hips_low');
    });
  });

  describe('Movement Pattern Analysis', () => {
    test('identifies complete deadlift rep', () => {
      const sequence = createMockLandmarkSequence('deadlift', 30);

      const result = analyzer.analyze(sequence);

      expect(result.repCount).toBeGreaterThan(0);
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'setup' })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'lift' })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'lockout' })
      );
    });

    test('calculates average rep time', () => {
      const sequence = createMockLandmarkSequence('deadlift', 60);

      const result = analyzer.analyze(sequence);

      expect(result.avgRepTime).toBeDefined();
      expect(result.avgRepTime).toBeGreaterThan(0);
    });

    test('detects rushing the lift', () => {
      const sequence = createMockLandmarkSequence('deadlift', 10);

      const result = analyzer.analyze(sequence);

      if (result.repCount > 0 && result.avgRepTime < 2500) {
        expect(result.feedback).toContainEqual(
          expect.objectContaining({
            message: expect.stringContaining('controlled')
          })
        );
      }
    });
  });

  describe('Scoring Algorithm', () => {
    test('scores perfect deadlift highly', () => {
      const perfectLandmarks = createMockDeadliftLandmarks({
        hipHinge: true,
        backRounded: false,
        barPath: 'straight'
      });

      const result = analyzer.analyze([perfectLandmarks]);

      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    test('heavily penalizes rounded back', () => {
      const roundedBackLandmarks = createMockDeadliftLandmarks({
        hipHinge: true,
        backRounded: true,
        barPath: 'straight'
      });

      const result = analyzer.analyze([roundedBackLandmarks]);

      expect(result.score).toBeLessThan(60);
    });

    test('penalizes squat pattern', () => {
      const squatPatternLandmarks = createMockDeadliftLandmarks({
        hipHinge: false,
        backRounded: false,
        barPath: 'straight'
      });

      const result = analyzer.analyze([squatPatternLandmarks]);

      expect(result.score).toBeLessThan(70);
    });

    test('applies multiple penalties correctly', () => {
      const poorLandmarks = createMockDeadliftLandmarks({
        hipHinge: false,
        backRounded: true,
        barPath: 'forward'
      });

      const result = analyzer.analyze([poorLandmarks]);

      expect(result.score).toBeLessThan(50);
      expect(result.feedback.length).toBeGreaterThanOrEqual(3);
    });

    test('score is always between 0 and 100', () => {
      const landmarks = createMockDeadliftLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Feedback Generation', () => {
    test('prioritizes critical safety issues', () => {
      const roundedBackLandmarks = createMockDeadliftLandmarks({
        backRounded: true
      });

      const result = analyzer.analyze([roundedBackLandmarks]);

      const firstFeedback = result.feedback[0];

      expect(firstFeedback.severity).toBe('critical');
      expect(firstFeedback.area).toBe('back');
    });

    test('provides specific, actionable corrections', () => {
      const poorLandmarks = createMockDeadliftLandmarks({
        hipHinge: false,
        backRounded: true
      });

      const result = analyzer.analyze([poorLandmarks]);

      result.feedback.forEach(feedback => {
        expect(feedback.message).toBeDefined();
        expect(feedback.message.length).toBeGreaterThan(10);
        expect(feedback.suggestion).toBeDefined();
      });
    });

    test('provides positive reinforcement for good form', () => {
      const goodLandmarks = createMockDeadliftLandmarks({
        hipHinge: true,
        backRounded: false,
        barPath: 'straight'
      });

      const result = analyzer.analyze([goodLandmarks]);

      const positiveFeedback = result.feedback.filter(f => f.type === 'positive');

      expect(positiveFeedback.length).toBeGreaterThan(0);
    });

    test('limits total feedback items', () => {
      const landmarks = createMockDeadliftLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.feedback.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Confidence Metrics', () => {
    test('reports high confidence for clear landmarks', () => {
      const landmarks = createMockDeadliftLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.confidence).toBeGreaterThan(0.85);
    });

    test('reports lower confidence for occluded landmarks', () => {
      const occludedLandmarks = createMockDeadliftLandmarks();
      occludedLandmarks.landmarks.forEach(l => {
        l.visibility = 0.4;
      });

      const result = analyzer.analyze([occludedLandmarks]);

      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty landmark array', () => {
      expect(() => {
        analyzer.analyze([]);
      }).toThrow('No landmarks');
    });

    test('handles single frame analysis', () => {
      const landmarks = createMockDeadliftLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    test('handles very long sequences', () => {
      const longSequence = createMockLandmarkSequence('deadlift', 300);

      const result = analyzer.analyze(longSequence);

      expect(result).toBeDefined();
      expect(result.repCount).toBeGreaterThan(0);
    });

    test('handles incomplete landmark data', () => {
      const landmarks = createMockDeadliftLandmarks();
      landmarks.landmarks = landmarks.landmarks.slice(0, 20);

      expect(() => {
        analyzer.analyze([landmarks]);
      }).toThrow('Incomplete landmarks');
    });
  });
});
