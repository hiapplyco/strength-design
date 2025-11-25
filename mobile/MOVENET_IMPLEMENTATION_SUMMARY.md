# MoveNet Implementation Summary

## Overview
Successfully reimplemented the PoseDetectionService to use TensorFlow Lite with MoveNet Thunder instead of ML Kit. This provides better control, offline capabilities, and consistent cross-platform behavior.

## Files Created/Modified

### New Files

1. **lib/src/core/services/frame_data.dart**
   - Simple frame data wrapper to replace ML Kit's InputImage
   - Supports RGBA and YUV420 formats
   - Handles rotation metadata for camera orientation

2. **lib/src/core/utils/image_preprocessing.dart**
   - Image preprocessing utilities for MoveNet
   - Resize and normalize to 256x256 RGB (0.0-1.0 range)
   - Two resize algorithms:
     - Nearest-neighbor (fast)
     - Bilinear interpolation (higher quality)
   - YUV420 to RGBA conversion
   - Image rotation (0, 90, 180, 270 degrees)

### Modified Files

3. **lib/src/core/services/pose_detection_service.dart**
   - Complete rewrite using TensorFlow Lite
   - Removed all ML Kit dependencies
   - Changed method signature from `Stream<InputImage>` to `Stream<FrameData>`

4. **lib/src/core/providers/service_providers.dart**
   - Updated localPoseAnalyzerProvider to use new constructor signature
   - Updated comments to reflect TensorFlow Lite instead of ML Kit
   - Commented out poseMetricsStreamProvider (requires frame stream from UI)

5. **lib/src/features/pose_analysis/presentation/screens/live_streaming_screen.dart**
   - Removed ML Kit imports (google_mlkit_commons)
   - Added FrameData import
   - Updated frame conversion to use FrameData instead of InputImage

6. **lib/src/core/services/local_pose_analyzer.example.dart**
   - Fixed FrameData constructor call (removed timestamp parameter)

## Implementation Details

### Model Specifications
- **Model**: MoveNet Thunder (Float16 quantized)
- **Path**: `assets/models/movenet_thunder.tflite`
- **Input**: [1, 256, 256, 3] RGB image (normalized 0-1)
- **Output**: [1, 1, 17, 3] tensor (17 keypoints with y, x, confidence)
- **Confidence Threshold**: 0.5 (configurable via constant)

### Preprocessing Pipeline
1. Convert YUV420 to RGBA (if needed)
2. Handle image rotation (if needed)
3. Resize to 256x256 using nearest-neighbor or bilinear interpolation
4. Normalize pixel values from 0-255 to 0.0-1.0
5. Format as [1, 256, 256, 3] tensor

### Postprocessing Pipeline
1. Extract 17 keypoints from output tensor
2. Map to MoveNetKeypoint enum values
3. Filter by confidence threshold (>= 0.5)
4. Create MoveNetLandmark objects
5. Calculate joint angles
6. Evaluate form score
7. Detect rep phase

### Joint Angle Calculations

Implemented angle calculations for 8 major joints:
- **Elbows** (left & right): shoulder → elbow → wrist
- **Knees** (left & right): hip → knee → ankle
- **Shoulders** (left & right): hip → shoulder → elbow
- **Hips** (left & right): shoulder → hip → knee

**Algorithm**: Uses atan2 for numerical stability
- Calculates vectors from joint to adjacent points
- Computes angle difference between vectors
- Normalizes to 0-180 degrees
- Returns angle in degrees

### Form Evaluation

Current implementation provides basic form scoring:
- Checks joint angles for reasonable ranges
- Penalizes hyperextension (>180°) or extreme flexion (<30°)
- Returns score 0.0-1.0 (average across all detected joints)
- **TODO**: Implement exercise-specific form evaluation

### Rep Phase Detection

Current implementation provides basic rep detection:
- **Down phase**: Joints flexed (<90°)
- **Up phase**: Joints extended (>120°)
- **None**: Intermediate positions
- **TODO**: Implement exercise-specific phase detection with state machine

## Performance Optimizations

1. **Isolate Processing**: Heavy computation runs in isolate to avoid blocking UI
2. **Efficient Resizing**: Nearest-neighbor by default for speed
3. **Confidence Filtering**: Only processes high-confidence keypoints
4. **Format Conversion**: Handles YUV420 efficiently with optimized conversion

## API Changes

### Before (ML Kit)
```dart
Stream<PoseAnalysisResult> analyzeFrames(Stream<InputImage> frames)
```

### After (TensorFlow Lite)
```dart
Stream<PoseAnalysisResult> analyzeFrames(Stream<FrameData> frames)
```

### Creating FrameData
```dart
// From RGBA bytes
final frame = FrameData.fromRgba(
  bytes: rgbaBytes,
  width: 1920,
  height: 1080,
  rotation: 90,
);

// From YUV420 camera frame
final frame = FrameData.fromYuv420(
  bytes: yuvBytes,
  width: 1920,
  height: 1080,
  rotation: 0,
);
```

## Error Handling

- Graceful initialization with helpful error messages
- Continues processing on frame errors (doesn't crash stream)
- Returns null for frames with no confident detections
- Provides debug output for troubleshooting

## Model Loading

The model file should be placed at:
```
assets/models/movenet_thunder.tflite
```

If missing, the service will throw an error with instructions. The model can be downloaded using:
```bash
cd assets/models
./.download-instructions.sh
```

Or manually from: https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4

## Testing Status

- ✅ Static analysis passes (flutter analyze - 0 errors)
- ✅ All dependencies properly imported
- ✅ Provider architecture updated
- ✅ Example code provided
- ⚠️ Runtime testing needed (requires model file)
- ⚠️ Camera integration testing needed

## Next Steps

1. **Download Model**: Place movenet_thunder.tflite in assets/models/
2. **Camera Integration**: Update camera code to provide Stream<FrameData>
3. **Exercise-Specific Logic**: Implement proper form evaluation per exercise type
4. **Rep Counting**: Add state machine for accurate rep counting
5. **Testing**: Test with real camera frames and various exercises
6. **Performance Tuning**: Profile and optimize if needed
7. **Error Recovery**: Add retry logic and better error handling

## Known Limitations

1. **Single Person**: MoveNet only detects one person per frame
2. **Placeholder Logic**: Form evaluation and rep detection need exercise-specific implementations
3. **No Temporal Smoothing**: May benefit from Kalman filter for smooth tracking
4. **Fixed Threshold**: Confidence threshold is hardcoded (could be made configurable)

## Dependencies

Already included in pubspec.yaml:
- `tflite_flutter: ^0.12.1`
- `flutter_isolate: ^2.0.4`
- `camera: ^0.10.5`

## Code Quality

- ✅ No analyzer warnings or errors
- ✅ Comprehensive documentation
- ✅ Type-safe with null safety
- ✅ Follows Flutter/Dart conventions
- ✅ Proper error handling
- ✅ Performance-optimized with isolates

## References

- MoveNet Model: assets/models/README.md
- TensorFlow Lite: https://pub.dev/packages/tflite_flutter
- MoveNet Hub: https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4
