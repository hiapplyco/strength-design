/**
 * SquatAnalyzer Test Suite
 * Tests for squat form analysis algorithms
 */

import SquatAnalyzer from '../analyzers/SquatAnalyzer';
import {
  createMockSquatLandmarks,
  createMockLandmarkSequence
} from './testHelpers';

describe('SquatAnalyzer', () => {
  let analyzer: SquatAnalyzer;

  beforeEach(() => {
    analyzer = new SquatAnalyzer();
  });

  describe('Depth Analysis', () => {
    test('correctly identifies parallel depth squat', () => {
      const landmarks = createMockSquatLandmarks({ depth: 'parallel' });

      const result = analyzer.analyze([landmarks]);

      expect(result.depth).toBe('parallel');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'depth'
        })
      );
    });

    test('correctly identifies shallow squat', () => {
      const landmarks = createMockSquatLandmarks({ depth: 'shallow' });

      const result = analyzer.analyze([landmarks]);

      expect(result.depth).toBe('shallow');
      expect(result.score).toBeLessThan(80);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'depth',
          severity: 'high'
        })
      );
    });

    test('correctly identifies deep squat', () => {
      const landmarks = createMockSquatLandmarks({ depth: 'deep' });

      const result = analyzer.analyze([landmarks]);

      expect(result.depth).toBe('deep');
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'depth'
        })
      );
    });

    test('calculates hip-to-knee angle correctly', () => {
      const landmarks = createMockSquatLandmarks({ depth: 'parallel' });

      const result = analyzer.analyze([landmarks]);

      expect(result.angles.hip).toBeDefined();
      expect(result.angles.hip).toBeGreaterThan(0);
      expect(result.angles.hip).toBeLessThan(180);
    });
  });

  describe('Knee Tracking', () => {
    test('detects good knee tracking', () => {
      const landmarks = createMockSquatLandmarks({ kneeValgus: false });

      const result = analyzer.analyze([landmarks]);

      expect(result.kneeTracking).toBe('good');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'knees'
        })
      );
    });

    test('detects knee valgus (knees caving in)', () => {
      const landmarks = createMockSquatLandmarks({ kneeValgus: true });

      const result = analyzer.analyze([landmarks]);

      expect(result.kneeTracking).toBe('valgus');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'knees',
          severity: 'high',
          message: expect.stringContaining('caving')
        })
      );
    });

    test('calculates knee angle correctly', () => {
      const landmarks = createMockSquatLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.angles.knee).toBeDefined();
      expect(result.angles.knee).toBeGreaterThan(0);
      expect(result.angles.knee).toBeLessThan(180);
    });
  });

  describe('Back Angle Analysis', () => {
    test('validates correct back angle', () => {
      const landmarks = createMockSquatLandmarks({ backAngle: 75 });

      const result = analyzer.analyze([landmarks]);

      expect(result.backAngle).toBeCloseTo(75, 5);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'back'
        })
      );
    });

    test('detects too upright back position', () => {
      const landmarks = createMockSquatLandmarks({ backAngle: 85 });

      const result = analyzer.analyze([landmarks]);

      expect(result.backAngle).toBeCloseTo(85, 5);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'back',
          message: expect.stringContaining('upright')
        })
      );
    });

    test('detects excessive forward lean', () => {
      const landmarks = createMockSquatLandmarks({ backAngle: 45 });

      const result = analyzer.analyze([landmarks]);

      expect(result.backAngle).toBeCloseTo(45, 5);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'back',
          severity: 'high',
          message: expect.stringContaining('lean')
        })
      );
    });
  });

  describe('Movement Pattern Analysis', () => {
    test('identifies complete squat rep', () => {
      const sequence = createMockLandmarkSequence('squat', 30);

      const result = analyzer.analyze(sequence);

      expect(result.repCount).toBeGreaterThan(0);
      expect(result.phases).toContainEqual(
        expect.objectContaining({
          name: 'descent'
        })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({
          name: 'bottom'
        })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({
          name: 'ascent'
        })
      );
    });

    test('calculates average rep time', () => {
      const sequence = createMockLandmarkSequence('squat', 60);

      const result = analyzer.analyze(sequence);

      expect(result.avgRepTime).toBeDefined();
      expect(result.avgRepTime).toBeGreaterThan(0);
    });

    test('detects tempo issues (too fast)', () => {
      // Create sequence with very short rep times
      const sequence = createMockLandmarkSequence('squat', 10);

      const result = analyzer.analyze(sequence);

      if (result.repCount > 0 && result.avgRepTime < 2000) {
        expect(result.feedback).toContainEqual(
          expect.objectContaining({
            type: 'suggestion',
            message: expect.stringContaining('slow')
          })
        );
      }
    });
  });

  describe('Scoring Algorithm', () => {
    test('scores perfect squat highly', () => {
      const perfectLandmarks = createMockSquatLandmarks({
        depth: 'parallel',
        kneeValgus: false,
        backAngle: 75
      });

      const result = analyzer.analyze([perfectLandmarks]);

      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    test('penalizes poor depth significantly', () => {
      const shallowLandmarks = createMockSquatLandmarks({
        depth: 'shallow',
        kneeValgus: false,
        backAngle: 75
      });

      const result = analyzer.analyze([shallowLandmarks]);

      expect(result.score).toBeLessThan(70);
    });

    test('penalizes knee valgus', () => {
      const valgusLandmarks = createMockSquatLandmarks({
        depth: 'parallel',
        kneeValgus: true,
        backAngle: 75
      });

      const result = analyzer.analyze([valgusLandmarks]);

      expect(result.score).toBeLessThan(75);
    });

    test('applies multiple penalties correctly', () => {
      const poorLandmarks = createMockSquatLandmarks({
        depth: 'shallow',
        kneeValgus: true,
        backAngle: 45
      });

      const result = analyzer.analyze([poorLandmarks]);

      expect(result.score).toBeLessThan(60);
      expect(result.feedback.length).toBeGreaterThanOrEqual(3);
    });

    test('score is always between 0 and 100', () => {
      const landmarks = createMockSquatLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Feedback Generation', () => {
    test('generates actionable feedback', () => {
      const landmarks = createMockSquatLandmarks({ depth: 'shallow' });

      const result = analyzer.analyze([landmarks]);

      const depthFeedback = result.feedback.find(f => f.area === 'depth');

      expect(depthFeedback).toBeDefined();
      expect(depthFeedback?.message).toBeDefined();
      expect(depthFeedback?.message.length).toBeGreaterThan(0);
      expect(depthFeedback?.suggestion).toBeDefined();
    });

    test('prioritizes critical feedback first', () => {
      const poorLandmarks = createMockSquatLandmarks({
        depth: 'shallow',
        kneeValgus: true,
        backAngle: 45
      });

      const result = analyzer.analyze([poorLandmarks]);

      const highSeverity = result.feedback.filter(f => f.severity === 'high');
      const firstFeedback = result.feedback[0];

      // First feedback should be high severity
      expect(firstFeedback.severity).toBe('high');
    });

    test('provides positive feedback for good form', () => {
      const goodLandmarks = createMockSquatLandmarks({
        depth: 'parallel',
        kneeValgus: false,
        backAngle: 75
      });

      const result = analyzer.analyze([goodLandmarks]);

      const positiveFeedback = result.feedback.filter(f => f.type === 'positive');

      expect(positiveFeedback.length).toBeGreaterThan(0);
    });

    test('limits total feedback items', () => {
      const landmarks = createMockSquatLandmarks();

      const result = analyzer.analyze([landmarks]);

      // Should not overwhelm user with too much feedback
      expect(result.feedback.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Confidence Metrics', () => {
    test('reports high confidence for clear landmarks', () => {
      const landmarks = createMockSquatLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('reports lower confidence for poor visibility', () => {
      const poorLandmarks = createMockSquatLandmarks();
      // Reduce visibility scores
      poorLandmarks.landmarks.forEach(l => {
        l.visibility = 0.5;
      });

      const result = analyzer.analyze([poorLandmarks]);

      expect(result.confidence).toBeLessThan(0.7);
    });

    test('includes confidence in analysis result', () => {
      const landmarks = createMockSquatLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty landmark array', () => {
      expect(() => {
        analyzer.analyze([]);
      }).toThrow('No landmarks');
    });

    test('handles single frame analysis', () => {
      const landmarks = createMockSquatLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    test('handles very long sequences', () => {
      const longSequence = createMockLandmarkSequence('squat', 300);

      const result = analyzer.analyze(longSequence);

      expect(result).toBeDefined();
      expect(result.repCount).toBeGreaterThan(0);
    });

    test('handles incomplete landmark data', () => {
      const landmarks = createMockSquatLandmarks();
      // Remove some landmarks
      landmarks.landmarks = landmarks.landmarks.slice(0, 20);

      expect(() => {
        analyzer.analyze([landmarks]);
      }).toThrow('Incomplete landmarks');
    });
  });
});
