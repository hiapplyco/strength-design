# LocalPoseAnalyzer Service

## Overview

The `LocalPoseAnalyzer` service wraps `PoseDetectionService` to provide real-time rep counting and form analysis for exercise tracking. It processes frame streams through pose detection, tracks exercise repetitions, detects form errors, and outputs enriched `PoseMetrics` for coaching feedback.

## Files

- `local_pose_analyzer.dart` - Main service implementation (503 lines)
- `local_pose_analyzer.example.dart` - Comprehensive usage examples
- `LOCAL_POSE_ANALYZER_README.md` - This file

## Features

### 1. Rep Counting
- Automatic detection of exercise phases (up/down/hold)
- Full cycle tracking (none → up → down → complete)
- Phase transition monitoring
- Rep completion detection

### 2. Form Error Detection
Implements heuristic-based checking for common exercise mistakes:

- **Knee Valgus**: Detects knees caving inward during squats
- **Excessive Elbow Flare**: Monitors elbow positioning during presses
- **Hip Alignment**: Checks for level hips during exercises
- **Back Angle**: Detects excessive forward lean or back arching

### 3. Form Scoring
- Calculates overall form score (0-100) based on detected errors
- Severity-based point deductions:
  - Dangerous errors: -25 points
  - Moderate errors: -15 points
  - Minor errors: -5 points

### 4. Exercise Phase Detection
Determines current phase based on joint angles and movement velocity:
- **Up Phase**: Lifting/contracting movement
- **Down Phase**: Lowering/extending movement
- **Hold Phase**: Maintained position
- **Set Completed**: Rep just finished
- **Rest**: Between reps/sets
- **None**: No movement detected

## Architecture

```
FrameData Stream
    ↓
PoseDetectionService
    ↓
PoseAnalysisResult (angles + landmarks)
    ↓
LocalPoseAnalyzer
    ├─ Phase Detection
    ├─ Rep Counting
    ├─ Form Error Detection
    └─ Form Scoring
    ↓
PoseMetrics (enriched with rep count + form analysis)
```

## Usage

### Basic Setup

```dart
// Initialize services
final poseDetectionService = PoseDetectionService();
await poseDetectionService.initialize();

// Create analyzer for specific exercise
final analyzer = LocalPoseAnalyzer(
  poseDetectionService: poseDetectionService,
  exerciseType: 'bicep_curl',
);

// Start analyzing frames
final metricsStream = analyzer.analyzeFrames(frameStream);

// Listen to metrics
await for (final metrics in metricsStream) {
  print('Rep: ${metrics.repCount}');
  print('Phase: ${metrics.currentPhase.displayName}');
  print('Form Score: ${metrics.formScore}');
}

// Clean up
analyzer.dispose();
poseDetectionService.dispose();
```

### Resetting Between Sets

```dart
// After completing a set
final set1Reps = analyzer.currentRepCount;

// Reset for next set
analyzer.reset();

// Continue analyzing frames for next set
```

### Supported Exercise Types

The analyzer adapts its phase detection logic based on exercise type:

- `bicep_curl` - Monitors elbow angle
- `squat` - Monitors knee angle
- `shoulder_press` / `overhead_press` - Monitors shoulder angle
- `bench_press` - Monitors elbow angle
- `deadlift` - Monitors hip angle

Default: Falls back to elbow angle for unknown exercises

## Implementation Details

### Rep Counting Logic

Tracks state machine transitions:
1. Detect up phase (normalized position > 0.7)
2. Detect down phase (normalized position < 0.3) after up phase
3. Count rep when returning to start position (none) after up→down cycle
4. Mark as `setCompleted` briefly, then reset to `none`

### Phase Detection

Uses key joint angles normalized to 0-1 range:
- 0.0 = fully extended position
- 1.0 = fully contracted position

Detects movement velocity to distinguish between:
- Active movement (velocity > threshold)
- Hold positions (velocity < threshold, contracted)
- Rest positions (velocity < threshold, extended)

### Form Error Heuristics

#### Knee Valgus
- Calculates knee width vs hip width ratio
- Flags if knees < 85% of hip width
- Severity: Dangerous (potential injury risk)

#### Elbow Flare
- Checks elbow angle during pressing movements
- Flags if angle > 110° (should be 85-95°)
- Severity: Moderate (reduces efficiency)

#### Hip Alignment
- Compares left/right hip Y coordinates
- Flags if difference > 5% of frame height
- Severity: Moderate (imbalance risk)

#### Back Angle
- Calculates back angle relative to vertical
- For squats/deadlifts:
  - Flags excessive extension (< 10°)
  - Flags excessive forward lean (> 60°)
- Severity: Dangerous for extension, Moderate for lean

## Configuration

### Thresholds

Adjustable constants in the class:
```dart
static const double _upPhaseThreshold = 0.7;      // 70% of full range
static const double _downPhaseThreshold = 0.3;    // 30% of full range
static const double _movementVelocityThreshold = 0.05;  // Min velocity
```

These can be customized per exercise by extending the class or modifying the constants.

## Testing Recommendations

1. **Unit Tests**
   - Test phase detection with known angles
   - Test rep counter state transitions
   - Test form error detection edge cases

2. **Integration Tests**
   - Test with recorded exercise videos
   - Validate rep counts against manual counts
   - Check form error accuracy with known good/bad form

3. **Performance Tests**
   - Measure frame processing latency
   - Monitor memory usage during long sessions
   - Test on low-end devices

## Future Enhancements

Potential improvements based on PRD requirements:

1. **Machine Learning Integration**
   - Replace heuristic form checking with ML models
   - Train on labeled exercise form datasets
   - Improve accuracy and reduce false positives

2. **Exercise-Specific Tuning**
   - Configurable thresholds per exercise type
   - Custom phase detection logic per exercise
   - Exercise-specific form checks

3. **Advanced Rep Counting**
   - Partial rep detection
   - Time under tension tracking
   - Tempo/cadence analysis

4. **Form Feedback Enhancements**
   - Real-time correction suggestions
   - Progressive form difficulty scaling
   - Historical form trend analysis

## Dependencies

- `PoseDetectionService` - Provides pose detection from frames
- `FrameData` - Frame data structure
- `PoseMetrics` - Output metrics entity
- `ExercisePhase` - Exercise phase enum
- `FormError` - Form error entity
- `MoveNetKeypoint` & `MoveNetLandmark` - Pose landmark types

## Performance Notes

- All heavy computation happens in `PoseDetectionService` isolates
- `LocalPoseAnalyzer` performs lightweight heuristic checks on main thread
- Form error detection is O(1) per frame
- Rep counting maintains minimal state (5 variables)

## Example Files

See `local_pose_analyzer.example.dart` for detailed examples:
1. Basic usage with camera frames
2. Widget integration for live workout tracking
3. Video file analysis
4. Custom exercise configuration
5. Multiple set tracking with reset

## Related Documentation

- [Pose Analysis PRD](../../../../.claude/prds/pose-analysis.md)
- [PoseDetectionService](pose_detection_service.dart)
- [MoveNet Setup Guide](../../../MOVENET_SETUP.md)

## Contributing

When modifying this service:
1. Maintain comprehensive documentation
2. Add tests for new features
3. Update examples if API changes
4. Profile performance impact
5. Keep heuristics tunable via constants

---

**Created**: 2025-11-12
**Author**: Claude Code
**Version**: 1.0.0
