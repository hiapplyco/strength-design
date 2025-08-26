# VideoCaptureComponent - API Documentation

## Overview

The `VideoCaptureComponent` is the core video recording interface for pose analysis in the Strength.Design mobile app. It provides a comprehensive solution for capturing and uploading exercise videos with built-in framing guidance, quality optimization, and production-ready error handling.

## Component Interface

### Props

```typescript
interface VideoCaptureComponentProps {
  // Visibility Control
  visible: boolean;                    // Controls component visibility
  onClose: () => void;                // Close handler
  
  // Video Callbacks
  onVideoRecorded: (videoUri: string, metadata: VideoMetadata) => void;
  onVideoUploaded: (videoUri: string, metadata: VideoMetadata) => void;
  onError: (error: Error) => void;
  
  // Exercise Configuration
  selectedExercise?: ExerciseObject;   // Exercise details for framing guidance
  
  // Recording Settings
  maxDuration?: number;                // Maximum recording duration in seconds (default: 30)
  videoQuality?: 'analysis' | 'high' | 'basic';  // Video quality preset (default: 'analysis')
  
  // UI Options
  showFramingGuides?: boolean;         // Show exercise-specific framing overlays (default: true)
  enableHaptics?: boolean;             // Enable haptic feedback (default: true)
}
```

### Video Metadata Object

```typescript
interface VideoMetadata {
  duration: number;                    // Video duration in seconds
  fileSize: number;                    // File size in bytes
  exercise: string;                    // Exercise name
  timestamp: string;                   // ISO timestamp of recording
  quality: string;                     // Quality preset used
  cameraType?: 'back' | 'front';      // Camera used (recording only)
  source?: 'recording' | 'gallery';   // Source of video
  width?: number;                      // Video width (gallery uploads only)
  height?: number;                     // Video height (gallery uploads only)
}
```

### Exercise Object Format

```typescript
interface ExerciseObject {
  name: string;                        // Exercise name (used for framing configuration)
  // ... other exercise properties
}
```

## Usage Examples

### Basic Implementation

```jsx
import VideoCaptureComponent from '../components/pose/VideoCaptureComponent';

function PoseAnalysisScreen() {
  const [showVideoCapture, setShowVideoCapture] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const handleVideoRecorded = (videoUri, metadata) => {
    console.log('Video recorded:', { videoUri, metadata });
    // Process recorded video
    setShowVideoCapture(false);
  };

  const handleVideoUploaded = (videoUri, metadata) => {
    console.log('Video uploaded:', { videoUri, metadata });
    // Process uploaded video
    setShowVideoCapture(false);
  };

  const handleError = (error) => {
    console.error('Video capture error:', error);
    Alert.alert('Error', error.message);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Your main UI */}
      
      <VideoCaptureComponent
        visible={showVideoCapture}
        selectedExercise={selectedExercise}
        onVideoRecorded={handleVideoRecorded}
        onVideoUploaded={handleVideoUploaded}
        onError={handleError}
        onClose={() => setShowVideoCapture(false)}
      />
    </View>
  );
}
```

### Advanced Configuration

```jsx
<VideoCaptureComponent
  visible={showVideoCapture}
  selectedExercise={{
    name: 'squat',  // Triggers squat-specific framing guides
    // ... other exercise properties
  }}
  maxDuration={45}              // 45 second limit
  videoQuality="high"           // Higher quality for detailed analysis
  showFramingGuides={true}      // Show framing overlays
  enableHaptics={true}          // Haptic feedback on
  onVideoRecorded={handleVideoRecorded}
  onVideoUploaded={handleVideoUploaded}
  onError={handleError}
  onClose={() => setShowVideoCapture(false)}
/>
```

## Exercise-Specific Framing

The component automatically configures framing guides based on the `selectedExercise.name`. Supported exercises:

- **squat**: Side angle, full body view
- **deadlift**: Side angle, bar path visibility
- **benchPress**: Side view, range of motion
- **pullUp**: Front/side view, full extension
- **default**: Generic exercise framing

### Adding New Exercise Configurations

To add support for new exercises, update the `EXERCISE_FRAMING_CONFIGS` object in the component:

```javascript
const EXERCISE_FRAMING_CONFIGS = {
  // ... existing configs
  bicepCurl: {
    guidanceText: 'Side view showing arm movement',
    framingGuides: [
      { type: 'horizontal', position: 0.1, label: 'Hand level (up)' },
      { type: 'horizontal', position: 0.7, label: 'Hand level (down)' },
      { type: 'vertical', position: 0.5, label: 'Body center' }
    ],
    optimalDistance: '4-6 feet away',
    cameraAngle: 'side view',
    lightingTips: 'Ensure arms and weights are well lit'
  },
};
```

## Video Quality Presets

| Quality | Resolution | FPS | Description | File Size |
|---------|------------|-----|-------------|-----------|
| `analysis` | 720p | 30 | Optimized for pose analysis | ~20-40MB/min |
| `high` | 1080p | 60 | High quality recording | ~50-80MB/min |
| `basic` | 480p | 30 | Basic quality, smaller files | ~10-20MB/min |

## Error Handling

The component provides comprehensive error handling with user-friendly messages:

```javascript
const handleError = (error) => {
  // Error types you can handle:
  switch (error.message) {
    case 'Camera permission denied':
      // Handle permission error
      break;
    case 'Video file too large':
      // Handle file size error
      break;
    case 'Unsupported video format':
      // Handle format error
      break;
    default:
      // Handle generic error
      console.error('Video capture error:', error);
  }
};
```

## Dependencies

Ensure these packages are installed:

```json
{
  "expo-camera": "~16.1.11",
  "expo-media-library": "~17.1.7",
  "expo-image-picker": "^16.1.4",
  "expo-av": "~15.1.7",
  "expo-file-system": "~18.1.11",
  "expo-haptics": "~14.1.4",
  "expo-blur": "~14.1.5"
}
```

## Permissions Required

The component automatically requests these permissions:

- **Camera**: For video recording
- **Microphone**: For audio recording
- **Media Library**: For saving videos
- **Photo Library**: For gallery access

## Performance Considerations

1. **Memory Management**: The component automatically cleans up timers and resources
2. **File Size**: Videos are optimized for analysis while maintaining quality
3. **Battery Usage**: Recording automatically stops at the maximum duration
4. **Storage**: Users are warned about large file sizes

## Integration with Analysis Pipeline

After capturing a video, you can process it for pose analysis:

```javascript
const handleVideoRecorded = async (videoUri, metadata) => {
  try {
    // Your pose analysis integration here
    const analysisResult = await analyzePose(videoUri, {
      exercise: metadata.exercise,
      duration: metadata.duration,
      quality: metadata.quality,
    });
    
    // Handle analysis results
    console.log('Analysis complete:', analysisResult);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

## Accessibility Features

The component includes comprehensive accessibility support:

- Screen reader labels for all interactive elements
- Keyboard navigation support
- High contrast mode compatibility
- Reduced motion support for users with vestibular disorders

## Testing

The component can be tested with mock exercises:

```javascript
const mockExercise = {
  name: 'squat',
  // ... other properties
};

// Test with different configurations
<VideoCaptureComponent
  visible={true}
  selectedExercise={mockExercise}
  onVideoRecorded={(uri, meta) => console.log('Test recorded:', uri)}
  onVideoUploaded={(uri, meta) => console.log('Test uploaded:', uri)}
  onError={(err) => console.log('Test error:', err)}
  onClose={() => console.log('Test closed')}
/>
```

This component provides a production-ready foundation for video capture in pose analysis workflows. It handles the complexity of camera integration, file management, and user experience, allowing other components to focus on pose analysis logic.