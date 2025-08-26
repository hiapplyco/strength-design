# Dynamic Pose Analysis Implementation Document

## Using Google ML Kit Pose Detection for Exercise & Sports Analysis

### Executive Summary

This document outlines the implementation of dynamic pose analysis for the Strength.Design mobile app using Google ML Kit's Pose Detection API. The system will analyze uploaded videos of exercises (squats, deadlifts, push-ups) and sports movements (baseball pitch, tennis serve) to provide form feedback and performance insights.

### Technical Overview

#### Core Technology: Google ML Kit Pose Detection

- **33-point skeletal tracking** with full-body landmark detection
- **Real-time processing** at 30-45 fps on modern devices
- **On-device processing** - no internet required, privacy-focused
- **Cross-platform support** - Android & iOS
- **Experimental Z-coordinate** for basic depth analysis

#### Pose Landmarks Detected

```javascript
const POSE_LANDMARKS = {
  // Facial landmarks
  NOSE: 0, LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  
  // Upper body
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  
  // Lower body
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32
};
```

### Implementation Architecture

#### 1. Video Processing Pipeline

```javascript
// Video Processing Flow
const videoPoseAnalysis = {
  input: "Video file (MP4, MOV, etc.)",
  processing: [
    "Frame extraction from video",
    "ML Kit pose detection per frame",
    "Landmark tracking across frames", 
    "Movement pattern analysis",
    "Form assessment algorithms"
  ],
  output: "Pose analysis report with feedback"
};
```

#### 2. Core Components

##### A. Video Frame Processor

```typescript
interface VideoFrameProcessor {
  extractFrames(videoUri: string): Promise<ImageFrame[]>;
  processFrameSequence(frames: ImageFrame[]): Promise<PoseSequence>;
  detectPose(frame: ImageFrame): Promise<PoseLandmarks>;
}

interface PoseLandmarks {
  landmarks: Array<{
    x: number;
    y: number; 
    z?: number; // Experimental
    inFrameLikelihood: number; // 0.0-1.0 confidence
  }>;
  timestamp: number;
  frameIndex: number;
}
```

##### B. Movement Analysis Engine

```typescript
interface MovementAnalyzer {
  analyzeExercise(poseSequence: PoseSequence, exerciseType: ExerciseType): ExerciseAnalysis;
  analyzeSport(poseSequence: PoseSequence, sportType: SportType): SportAnalysis;
  calculateAngles(landmarks: PoseLandmarks): JointAngles;
  trackMovementPattern(sequence: PoseSequence): MovementPattern;
}

enum ExerciseType {
  SQUAT = 'squat',
  DEADLIFT = 'deadlift',
  PUSH_UP = 'pushup',
  BENCH_PRESS = 'bench_press',
  OVERHEAD_PRESS = 'overhead_press'
}

enum SportType {
  BASEBALL_PITCH = 'baseball_pitch',
  TENNIS_SERVE = 'tennis_serve',
  GOLF_SWING = 'golf_swing',
  BASKETBALL_SHOT = 'basketball_shot'
}
```

##### C. Form Analysis Algorithms

```typescript
interface FormAnalysis {
  overallScore: number; // 0-100
  criticalErrors: FormError[];
  improvements: FormSuggestion[];
  keyPhases: MovementPhase[];
  timing: MovementTiming;
}

interface FormError {
  type: 'knee_cave' | 'forward_lean' | 'heel_rise' | 'elbow_flare';
  severity: 'low' | 'medium' | 'high';
  timeRange: [number, number]; // Start and end timestamps
  description: string;
  correction: string;
}
```

### Exercise-Specific Analysis

#### 1. Squat Analysis

```typescript
class SquatAnalyzer {
  analyzeSquat(poseSequence: PoseSequence): SquatAnalysis {
    return {
      // Depth analysis
      depth: this.calculateSquatDepth(poseSequence),
      // Knee tracking
      kneeAlignment: this.checkKneeAlignment(poseSequence),
      // Back angle
      spinalAlignment: this.analyzeSpinalAlignment(poseSequence),
      // Weight distribution
      balanceAnalysis: this.analyzeBalance(poseSequence),
      // Movement phases
      phases: this.identifySquatPhases(poseSequence)
    };
  }
  
  private calculateSquatDepth(sequence: PoseSequence): DepthAnalysis {
    // Calculate hip-knee angle at lowest point
    // Determine if squat reaches parallel or below
  }
  
  private checkKneeAlignment(sequence: PoseSequence): KneeAlignment {
    // Track knee position relative to toes
    // Detect knee cave (valgus collapse)
  }
}
```

#### 2. Baseball Pitch Analysis

```typescript
class PitchAnalyzer {
  analyzePitch(poseSequence: PoseSequence): PitchAnalysis {
    return {
      // Pitching phases
      windup: this.analyzeWindup(poseSequence),
      stride: this.analyzeStride(poseSequence),
      armCocking: this.analyzeArmCocking(poseSequence),
      acceleration: this.analyzeAcceleration(poseSequence),
      followThrough: this.analyzeFollowThrough(poseSequence),
      
      // Mechanics
      shoulderHipSeparation: this.calculateSeparation(poseSequence),
      armSlot: this.calculateArmSlot(poseSequence),
      balance: this.analyzeBalance(poseSequence)
    };
  }
}
```

### React Native/Expo Integration

#### 1. Dependencies

```json
{
  "dependencies": {
    "@react-native-ml-kit/pose-detection": "^2.0.0",
    "expo-av": "^14.0.0",
    "expo-media-library": "^16.0.0",
    "react-native-fs": "^2.20.0",
    "react-native-video": "^6.0.0"
  }
}
```

#### 2. Core Implementation

```typescript
import { PoseDetection } from '@react-native-ml-kit/pose-detection';
import { Video } from 'expo-av';

export class PoseAnalysisService {
  private poseDetector: PoseDetection;
  
  constructor() {
    this.poseDetector = new PoseDetection({
      mode: 'accurate', // vs 'fast'
      detectAllPoses: false, // Single person only
      enableTracking: true
    });
  }
  
  async analyzeVideoFile(videoUri: string, exerciseType: ExerciseType): Promise<FormAnalysis> {
    try {
      // 1. Extract video frames
      const frames = await this.extractFramesFromVideo(videoUri);
      
      // 2. Process each frame for pose detection
      const poseSequence: PoseSequence = [];
      
      for (const [index, frame] of frames.entries()) {
        const pose = await this.poseDetector.detectPose(frame.uri);
        if (pose && pose.landmarks.length > 0) {
          poseSequence.push({
            landmarks: pose.landmarks,
            timestamp: frame.timestamp,
            frameIndex: index
          });
        }
      }
      
      // 3. Analyze movement pattern
      const movementAnalyzer = new MovementAnalyzer();
      const analysis = await movementAnalyzer.analyzeExercise(poseSequence, exerciseType);
      
      return analysis;
      
    } catch (error) {
      console.error('Pose analysis failed:', error);
      throw new Error('Failed to analyze video pose');
    }
  }
  
  private async extractFramesFromVideo(videoUri: string): Promise<VideoFrame[]> {
    // Implementation for frame extraction
    // Could use FFmpeg or native video processing
  }
}
```

#### 3. UI Components

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { PoseAnalysisService } from '../services/PoseAnalysisService';

export const PoseAnalysisScreen: React.FC = () => {
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  const analyzeVideo = async (videoUri: string, exerciseType: ExerciseType) => {
    setLoading(true);
    try {
      const poseService = new PoseAnalysisService();
      const result = await poseService.analyzeVideoFile(videoUri, exerciseType);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View>
      {/* Video upload component */}
      {/* Analysis results display */}
      {analysis && <FormFeedbackComponent analysis={analysis} />}
    </View>
  );
};
```

### Analysis Algorithms

#### 1. Angle Calculation

```typescript
function calculateAngle(point1: Landmark, point2: Landmark, point3: Landmark): number {
  const vector1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };
  
  const vector2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y
  };
  
  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  const angle = Math.acos(dot / (mag1 * mag2));
  return angle * (180 / Math.PI);
}

// Example: Calculate knee angle
const kneeAngle = calculateAngle(
  landmarks[POSE_LANDMARKS.LEFT_HIP],
  landmarks[POSE_LANDMARKS.LEFT_KNEE], 
  landmarks[POSE_LANDMARKS.LEFT_ANKLE]
);
```

#### 2. Movement Phase Detection

```typescript
class MovementPhaseDetector {
  detectSquatPhases(poseSequence: PoseSequence): SquatPhase[] {
    const phases: SquatPhase[] = [];
    let currentPhase = 'standing';
    
    for (let i = 0; i < poseSequence.length; i++) {
      const pose = poseSequence[i];
      const hipHeight = (pose.landmarks[POSE_LANDMARKS.LEFT_HIP].y + 
                       pose.landmarks[POSE_LANDMARKS.RIGHT_HIP].y) / 2;
      
      // Detect phase transitions based on hip height changes
      if (currentPhase === 'standing' && this.isDescending(poseSequence, i)) {
        phases.push({ type: 'descent', startFrame: i });
        currentPhase = 'descending';
      } else if (currentPhase === 'descending' && this.isBottomPosition(poseSequence, i)) {
        phases.push({ type: 'bottom', startFrame: i });
        currentPhase = 'bottom';
      } else if (currentPhase === 'bottom' && this.isAscending(poseSequence, i)) {
        phases.push({ type: 'ascent', startFrame: i });
        currentPhase = 'ascending';
      }
    }
    
    return phases;
  }
}
```

### Performance Considerations

#### 1. Optimization Strategies

```typescript
const performanceConfig = {
  // Frame sampling for long videos
  frameSkip: 2, // Process every 2nd frame for 15fps analysis
  
  // Landmark confidence filtering
  confidenceThreshold: 0.7,
  
  // Memory management
  batchSize: 30, // Process frames in batches
  
  // Background processing
  useWorkerThread: true
};
```

#### 2. Error Handling

```typescript
interface AnalysisResult {
  success: boolean;
  analysis?: FormAnalysis;
  errors?: AnalysisError[];
  warnings?: string[];
}

enum AnalysisErrorType {
  INSUFFICIENT_POSE_DATA = 'insufficient_pose_data',
  LOW_CONFIDENCE_LANDMARKS = 'low_confidence_landmarks',
  INCOMPLETE_MOVEMENT = 'incomplete_movement',
  PROCESSING_TIMEOUT = 'processing_timeout'
}
```

### User Experience Flow

#### 1. Video Upload & Analysis

```text
1. User selects exercise type (squat, deadlift, etc.)
2. User uploads video or records new video
3. System extracts frames and runs pose detection
4. Analysis engine processes movement patterns
5. User receives detailed feedback with visualizations
```

#### 2. Results Presentation

```typescript
interface AnalysisReport {
  overallScore: number;
  keyMetrics: {
    formScore: number;
    consistency: number;
    rangeOfMotion: number;
    timing: number;
  };
  criticalIssues: FormError[];
  recommendations: string[];
  comparisonToIdeal: MovementComparison;
  progressTracking?: ProgressMetrics;
}
```

### Integration with Existing App

#### 1. Navigation Updates

```typescript
// Add to existing navigation structure
const PoseAnalysisStack = createStackNavigator();

function PoseAnalysisNavigator() {
  return (
    <PoseAnalysisStack.Navigator>
      <PoseAnalysisStack.Screen name="PoseUpload" component={PoseUploadScreen} />
      <PoseAnalysisStack.Screen name="PoseAnalysis" component={PoseAnalysisScreen} />
      <PoseAnalysisStack.Screen name="PoseResults" component={PoseResultsScreen} />
    </PoseAnalysisStack.Navigator>
  );
}
```

#### 2. Database Schema Extensions

```sql
-- Pose analysis results table
CREATE TABLE pose_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  video_uri TEXT NOT NULL,
  exercise_type VARCHAR(50) NOT NULL,
  analysis_results JSONB NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pose landmarks table (for detailed analysis)
CREATE TABLE pose_landmarks (
  id UUID PRIMARY KEY,
  analysis_id UUID REFERENCES pose_analyses(id),
  frame_index INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  landmarks JSONB NOT NULL, -- Array of {x, y, z, confidence} objects
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Implementation Timeline

#### Phase 1: Core Foundation (4-6 weeks)

- [ ] ML Kit integration and basic pose detection
- [ ] Video frame extraction pipeline
- [ ] Basic landmark tracking
- [ ] Simple squat analysis algorithm

#### Phase 2: Exercise Analysis (4-6 weeks)

- [ ] Comprehensive squat analysis
- [ ] Deadlift analysis implementation
- [ ] Push-up analysis implementation
- [ ] Form scoring algorithms

#### Phase 3: Sports Analysis (6-8 weeks)

- [ ] Baseball pitch analysis
- [ ] Tennis serve analysis
- [ ] Golf swing analysis
- [ ] Advanced movement pattern recognition

#### Phase 4: UI/UX & Integration (3-4 weeks)

- [ ] Upload and analysis UI components
- [ ] Results visualization
- [ ] Integration with existing app navigation
- [ ] Performance optimization

### Potential Challenges & Mitigations

#### Technical Challenges

1. **Video Processing Performance**
   - *Challenge*: Large video files causing memory issues
   - *Mitigation*: Frame sampling, batch processing, compression

2. **Pose Detection Accuracy**
   - *Challenge*: Poor lighting, occlusion, multiple people
   - *Mitigation*: User guidelines, confidence thresholds, error handling

3. **Movement Complexity**
   - *Challenge*: Different exercise variations and individual differences
   - *Mitigation*: Machine learning refinement, user feedback integration

#### User Experience Challenges

1. **Analysis Time**
   - *Challenge*: Long processing times for video analysis
   - *Mitigation*: Background processing, progress indicators, optimization

2. **Feedback Clarity**
   - *Challenge*: Making technical analysis understandable
   - *Mitigation*: Visual feedback, simple language, progressive disclosure

### Success Metrics

#### Technical Metrics

- Pose detection accuracy > 85%
- Analysis completion time < 30 seconds for 30-second videos
- Memory usage < 200MB during processing
- Crash rate < 1%

#### User Metrics

- User engagement with pose analysis features > 40%
- User satisfaction score > 4.0/5.0
- Repeat usage rate > 60%
- User-reported form improvement > 70%

### Conclusion

This implementation provides a comprehensive foundation for dynamic pose analysis in the Strength.Design app. The Google ML Kit integration offers robust, on-device pose detection capabilities that can be extended with custom analysis algorithms for both exercise and sports movement assessment.

The modular architecture allows for incremental development and testing, starting with basic exercise analysis and expanding to complex sports movements. The focus on performance optimization and user experience ensures the feature will be both technically sound and practically useful for users seeking to improve their form and performance.
