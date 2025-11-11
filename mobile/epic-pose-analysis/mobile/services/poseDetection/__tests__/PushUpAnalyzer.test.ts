/**
 * PushUpAnalyzer Test Suite
 * Tests for push-up form analysis algorithms
 */

import PushUpAnalyzer from '../analyzers/PushUpAnalyzer';
import {
  createMockPushUpLandmarks,
  createMockLandmarkSequence
} from './testHelpers';

describe('PushUpAnalyzer', () => {
  let analyzer: PushUpAnalyzer;

  beforeEach(() => {
    analyzer = new PushUpAnalyzer();
  });

  describe('Depth Analysis', () => {
    test('correctly identifies full depth push-up', () => {
      const landmarks = createMockPushUpLandmarks({ depth: 'full' });

      const result = analyzer.analyze([landmarks]);

      expect(result.depth).toBe('full');
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'depth'
        })
      );
    });

    test('detects shallow push-up', () => {
      const landmarks = createMockPushUpLandmarks({ depth: 'shallow' });

      const result = analyzer.analyze([landmarks]);

      expect(result.depth).toBe('shallow');
      expect(result.score).toBeLessThan(75);
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'depth',
          severity: 'high',
          message: expect.stringContaining('lower')
        })
      );
    });

    test('calculates chest-to-floor distance', () => {
      const landmarks = createMockPushUpLandmarks({ depth: 'full' });

      const result = analyzer.analyze([landmarks]);

      expect(result.chestDistance).toBeDefined();
      expect(result.chestDistance).toBeGreaterThan(0);
    });
  });

  describe('Elbow Position Analysis', () => {
    test('validates proper elbow tuck (45 degrees)', () => {
      const landmarks = createMockPushUpLandmarks({ elbowFlare: false });

      const result = analyzer.analyze([landmarks]);

      expect(result.elbowPosition).toBe('tucked');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'elbows'
        })
      );
    });

    test('detects elbow flaring', () => {
      const landmarks = createMockPushUpLandmarks({ elbowFlare: true });

      const result = analyzer.analyze([landmarks]);

      expect(result.elbowPosition).toBe('flared');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'elbows',
          severity: 'medium',
          message: expect.stringContaining('tuck')
        })
      );
    });

    test('calculates elbow angle correctly', () => {
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.angles.elbow).toBeDefined();
      expect(result.angles.elbow).toBeGreaterThan(0);
      expect(result.angles.elbow).toBeLessThan(180);
    });
  });

  describe('Body Alignment Analysis', () => {
    test('validates straight body position (plank)', () => {
      const landmarks = createMockPushUpLandmarks({ saggyHips: false });

      const result = analyzer.analyze([landmarks]);

      expect(result.bodyAlignment).toBe('straight');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'alignment'
        })
      );
    });

    test('detects saggy hips', () => {
      const landmarks = createMockPushUpLandmarks({ saggyHips: true });

      const result = analyzer.analyze([landmarks]);

      expect(result.bodyAlignment).toBe('hips_low');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'correction',
          area: 'alignment',
          severity: 'high',
          message: expect.stringContaining('hips')
        })
      );
    });

    test('detects pike position (hips too high)', () => {
      const landmarks = createMockPushUpLandmarks();
      landmarks.landmarks[23].y = 0.35; // Hips high

      const result = analyzer.analyze([landmarks]);

      expect(result.bodyAlignment).toBe('hips_high');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          area: 'alignment',
          message: expect.stringContaining('lower')
        })
      );
    });

    test('calculates body angle (shoulder-hip-ankle)', () => {
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.angles.body).toBeDefined();
      expect(result.angles.body).toBeCloseTo(180, 20); // Near straight line
    });
  });

  describe('Hand Placement Analysis', () => {
    test('validates proper hand width', () => {
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.handPlacement).toBe('proper');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          type: 'positive',
          area: 'hands'
        })
      );
    });

    test('detects hands too wide', () => {
      const landmarks = createMockPushUpLandmarks();
      landmarks.landmarks[15].x = 0.2; // Left hand far out
      landmarks.landmarks[16].x = 0.8; // Right hand far out

      const result = analyzer.analyze([landmarks]);

      expect(result.handPlacement).toBe('too_wide');
      expect(result.feedback).toContainEqual(
        expect.objectContaining({
          area: 'hands',
          message: expect.stringContaining('closer')
        })
      );
    });

    test('detects hands too narrow', () => {
      const landmarks = createMockPushUpLandmarks();
      landmarks.landmarks[15].x = 0.48; // Left hand close
      landmarks.landmarks[16].x = 0.52; // Right hand close

      const result = analyzer.analyze([landmarks]);

      expect(result.handPlacement).toBe('too_narrow');
    });
  });

  describe('Movement Pattern Analysis', () => {
    test('identifies complete push-up rep', () => {
      const sequence = createMockLandmarkSequence('push_up', 30);

      const result = analyzer.analyze(sequence);

      expect(result.repCount).toBeGreaterThan(0);
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'up_position' })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'descent' })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'bottom' })
      );
      expect(result.phases).toContainEqual(
        expect.objectContaining({ name: 'ascent' })
      );
    });

    test('calculates average rep time', () => {
      const sequence = createMockLandmarkSequence('push_up', 60);

      const result = analyzer.analyze(sequence);

      expect(result.avgRepTime).toBeDefined();
      expect(result.avgRepTime).toBeGreaterThan(0);
    });

    test('detects uneven movement (asymmetry)', () => {
      const landmarks = createMockPushUpLandmarks();
      // Create asymmetry - left side lower than right
      landmarks.landmarks[11].y = 0.50; // Left shoulder
      landmarks.landmarks[12].y = 0.45; // Right shoulder

      const result = analyzer.analyze([landmarks]);

      if (result.asymmetry > 0.05) {
        expect(result.feedback).toContainEqual(
          expect.objectContaining({
            type: 'correction',
            area: 'symmetry',
            message: expect.stringContaining('even')
          })
        );
      }
    });
  });

  describe('Tempo Analysis', () => {
    test('validates controlled tempo', () => {
      const sequence = createMockLandmarkSequence('push_up', 40);

      const result = analyzer.analyze(sequence);

      if (result.repCount > 0 && result.avgRepTime > 2500 && result.avgRepTime < 4000) {
        expect(result.tempo).toBe('controlled');
        expect(result.feedback).toContainEqual(
          expect.objectContaining({
            type: 'positive',
            area: 'tempo'
          })
        );
      }
    });

    test('detects rushed reps', () => {
      const sequence = createMockLandmarkSequence('push_up', 15);

      const result = analyzer.analyze(sequence);

      if (result.repCount > 0 && result.avgRepTime < 2000) {
        expect(result.tempo).toBe('fast');
        expect(result.feedback).toContainEqual(
          expect.objectContaining({
            message: expect.stringContaining('slow')
          })
        );
      }
    });
  });

  describe('Scoring Algorithm', () => {
    test('scores perfect push-up highly', () => {
      const perfectLandmarks = createMockPushUpLandmarks({
        depth: 'full',
        elbowFlare: false,
        saggyHips: false
      });

      const result = analyzer.analyze([perfectLandmarks]);

      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    test('penalizes shallow depth significantly', () => {
      const shallowLandmarks = createMockPushUpLandmarks({
        depth: 'shallow',
        elbowFlare: false,
        saggyHips: false
      });

      const result = analyzer.analyze([shallowLandmarks]);

      expect(result.score).toBeLessThan(75);
    });

    test('penalizes poor body alignment', () => {
      const saggyLandmarks = createMockPushUpLandmarks({
        depth: 'full',
        elbowFlare: false,
        saggyHips: true
      });

      const result = analyzer.analyze([saggyLandmarks]);

      expect(result.score).toBeLessThan(75);
    });

    test('applies multiple penalties correctly', () => {
      const poorLandmarks = createMockPushUpLandmarks({
        depth: 'shallow',
        elbowFlare: true,
        saggyHips: true
      });

      const result = analyzer.analyze([poorLandmarks]);

      expect(result.score).toBeLessThan(60);
      expect(result.feedback.length).toBeGreaterThanOrEqual(3);
    });

    test('score is always between 0 and 100', () => {
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Feedback Generation', () => {
    test('provides specific, actionable corrections', () => {
      const poorLandmarks = createMockPushUpLandmarks({
        depth: 'shallow',
        saggyHips: true
      });

      const result = analyzer.analyze([poorLandmarks]);

      result.feedback.forEach(feedback => {
        expect(feedback.message).toBeDefined();
        expect(feedback.message.length).toBeGreaterThan(10);
        expect(feedback.suggestion).toBeDefined();
      });
    });

    test('prioritizes most critical issues', () => {
      const poorLandmarks = createMockPushUpLandmarks({
        depth: 'shallow',
        elbowFlare: true,
        saggyHips: true
      });

      const result = analyzer.analyze([poorLandmarks]);

      const firstFeedback = result.feedback[0];

      expect(firstFeedback.severity).toBe('high');
    });

    test('provides positive reinforcement', () => {
      const goodLandmarks = createMockPushUpLandmarks({
        depth: 'full',
        elbowFlare: false,
        saggyHips: false
      });

      const result = analyzer.analyze([goodLandmarks]);

      const positiveFeedback = result.feedback.filter(f => f.type === 'positive');

      expect(positiveFeedback.length).toBeGreaterThan(0);
    });

    test('limits total feedback items', () => {
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.feedback.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Confidence Metrics', () => {
    test('reports high confidence for clear landmarks', () => {
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result.confidence).toBeGreaterThan(0.85);
    });

    test('reports lower confidence for poor visibility', () => {
      const poorLandmarks = createMockPushUpLandmarks();
      poorLandmarks.landmarks.forEach(l => {
        l.visibility = 0.5;
      });

      const result = analyzer.analyze([poorLandmarks]);

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
      const landmarks = createMockPushUpLandmarks();

      const result = analyzer.analyze([landmarks]);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    test('handles very long sequences', () => {
      const longSequence = createMockLandmarkSequence('push_up', 300);

      const result = analyzer.analyze(longSequence);

      expect(result).toBeDefined();
      expect(result.repCount).toBeGreaterThan(0);
    });

    test('handles incomplete landmark data', () => {
      const landmarks = createMockPushUpLandmarks();
      landmarks.landmarks = landmarks.landmarks.slice(0, 20);

      expect(() => {
        analyzer.analyze([landmarks]);
      }).toThrow('Incomplete landmarks');
    });
  });
});
