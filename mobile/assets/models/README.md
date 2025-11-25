# MoveNet Thunder TensorFlow Lite Model

## Overview

This directory contains the **MoveNet Thunder** pose estimation model in TensorFlow Lite format. MoveNet is Google's fast and accurate pose estimation model designed for mobile and edge devices.

## Model Information

- **Model Name**: MoveNet Single Pose - Thunder
- **Format**: TensorFlow Lite (.tflite)
- **Quantization**: Float16
- **Version**: 4
- **Source**: [TensorFlow Hub](https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4)
- **File**: `movenet_thunder.tflite`

## Model Specifications

### Input
- **Type**: RGB Image (3-channel)
- **Size**: 256 x 256 pixels
- **Range**: Normalized to [0.0, 1.0] or [-1.0, 1.0] depending on preprocessing
- **Format**: TensorFlow Lite expects input as float32 tensor

### Output
- **Type**: Float32 tensor
- **Shape**: [1, 17, 3]
- **Format**: 17 keypoints with 3 values per keypoint:
  - `y`: Vertical position (0.0 to 1.0, normalized to input height)
  - `x`: Horizontal position (0.0 to 1.0, normalized to input width)
  - `confidence`: Detection confidence score (0.0 to 1.0)

## Keypoint Mapping

The model outputs 17 keypoints representing major joints in the human body:

| Index | Body Part | Notes |
|-------|-----------|-------|
| 0 | Nose | Center of face |
| 1 | Left Eye | Left eye (from person's perspective) |
| 2 | Right Eye | Right eye |
| 3 | Left Ear | Left ear |
| 4 | Right Ear | Right ear |
| 5 | Left Shoulder | Left shoulder joint |
| 6 | Right Shoulder | Right shoulder joint |
| 7 | Left Elbow | Left elbow joint |
| 8 | Right Elbow | Right elbow joint |
| 9 | Left Wrist | Left wrist/hand |
| 10 | Right Wrist | Right wrist/hand |
| 11 | Left Hip | Left hip joint |
| 12 | Right Hip | Right hip joint |
| 13 | Left Knee | Left knee joint |
| 14 | Right Knee | Right knee joint |
| 15 | Left Ankle | Left ankle joint |
| 16 | Right Ankle | Right ankle joint |

## Keypoint Skeleton Connections

For visualization, keypoints are typically connected in the following order:

- Nose → Left Eye → Left Ear
- Nose → Right Eye → Right Ear
- Left Shoulder ↔ Right Shoulder
- Left Shoulder → Left Elbow → Left Wrist
- Right Shoulder → Right Elbow → Right Wrist
- Left Hip ↔ Right Hip
- Left Hip → Left Knee → Left Ankle
- Right Hip → Right Knee → Right Ankle
- Shoulders → Hips (connection)

## Model Characteristics

### Advantages (Thunder Variant)
- **High Speed**: Optimized for real-time performance on mobile devices
- **Good Accuracy**: Maintains decent accuracy despite small model size (~4MB)
- **Float16 Quantization**: Reduced memory footprint while maintaining precision
- **Single-Person Detection**: Focuses on detecting one person per frame

### Limitations
- Single person detection only (not designed for multiple people)
- Confidence scores can be noisy; use thresholding for reliability
- Performance varies with image quality and lighting conditions
- Requires well-framed poses for optimal accuracy

## Performance Metrics

- **Model Size**: ~4 MB (Float16 quantized)
- **Inference Time**: ~50-100ms on modern mobile devices
- **Target Devices**: iOS, Android, web
- **Batch Size**: 1

## Flutter Integration

### Adding to Your Project

1. Ensure `pubspec.yaml` includes the asset:
```yaml
flutter:
  assets:
    - assets/models/
```

2. Import the `tflite_flutter` package (already included in this project):
```dart
import 'package:tflite_flutter/tflite_flutter.dart';
```

3. Load the model:
```dart
final interpreter = await Interpreter.fromAsset('assets/models/movenet_thunder.tflite');
```

4. Run inference:
```dart
// Prepare input image (256x256 normalized)
List<List<List<List<double>>>> input = [imageData];

// Run inference
final output = [List(1*17*3).reshape([1, 17, 3]).cast<double>()];
interpreter.run(input, output);

// Output: [[[y0, x0, conf0], [y1, x1, conf1], ..., [y16, x16, conf16]]]
```

### Example Usage Pattern

```dart
// Load model
final interpreter = await Interpreter.fromAsset('assets/models/movenet_thunder.tflite');

// Process image frame
final input = preprocessImage(imageBytes, 256, 256);

// Run inference
final output = [List(1*17*3).cast<double>()];
interpreter.run(input, output);

// Extract keypoints
final keypoints = parseKeypoints(output);

// Filter by confidence threshold
final confidenceThreshold = 0.5;
final validKeypoints = keypoints.where((kp) => kp.confidence > confidenceThreshold).toList();

// Use for pose analysis
analyzeExercisePose(validKeypoints);
```

## Confidence Thresholding

Recommended confidence thresholds:
- **High confidence**: > 0.5 (reliable keypoints)
- **Medium confidence**: 0.3-0.5 (use with caution)
- **Low confidence**: < 0.3 (likely unreliable)

For accurate exercise analysis, use only keypoints with confidence > 0.5.

## Preprocessing Requirements

1. **Image Resizing**: Resize input image to 256x256 pixels
2. **Normalization**: Normalize pixel values:
   - Option A: Divide by 255.0 for [0, 1] range
   - Option B: Apply mean subtraction and std normalization
3. **Color Space**: Ensure RGB format (not BGR)
4. **Data Type**: Convert to float32

## Output Interpretation

The output tensor [1, 17, 3] should be interpreted as:
- First dimension (1): Batch size
- Second dimension (17): Number of keypoints
- Third dimension (3): [y, x, confidence] coordinates

Example parsing:
```dart
final rawOutput = output[0]; // Shape: [17, 3]
for (int i = 0; i < 17; i++) {
  double y = rawOutput[i][0];
  double x = rawOutput[i][1];
  double confidence = rawOutput[i][2];

  // Denormalize coordinates if needed
  int pixelX = (x * imageWidth).toInt();
  int pixelY = (y * imageHeight).toInt();
}
```

## Download Instructions

If the model file is missing, use the provided download script:

```bash
cd assets/models
chmod +x .download-instructions.sh
./.download-instructions.sh
```

Or manually download from:
https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/float16/4

## Alternatives

### Lightning Variant
For even faster inference (but lower accuracy):
- https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/float16/4

### Int8 Quantization
For devices with very limited resources:
- https://tfhub.dev/google/lite-model/movenet/singlepose/thunder/tflite/int8/4

## References

- [MoveNet on TensorFlow Hub](https://tfhub.dev/google/lite-model/movenet)
- [MediaPipe Pose Documentation](https://mediapipe.dev/solutions/pose)
- [TensorFlow Lite Model Interpreter](https://pub.dev/packages/tflite_flutter)
- [Google AI Edge - MoveNet](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_detector)

## License

This model is provided by Google and is subject to the TensorFlow Hub Model License. See https://tfhub.dev/terms for details.

## Notes

- This model is optimized for single-person pose detection
- For best results, ensure the person is relatively centered in the frame
- Confidence scores reflect the model's certainty about each keypoint location
- Frame rate and lighting significantly impact detection quality
