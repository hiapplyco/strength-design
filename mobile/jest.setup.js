import '@testing-library/jest-native/extend-expect';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock ML Kit Pose Detection
jest.mock('@react-native-ml-kit/pose-detection', () => ({
  PoseDetection: jest.fn().mockImplementation(() => ({
    detectPose: jest.fn().mockResolvedValue({
      landmarks: Array.from({ length: 33 }, (_, i) => ({
        x: 0.5 + (Math.random() - 0.5) * 0.1,
        y: 0.3 + (i / 33) * 0.4,
        z: Math.random() * 0.1,
        inFrameLikelihood: 0.8 + Math.random() * 0.2
      }))
    }))
  }))
}));

// Mock Expo modules for pose analysis
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ 
    exists: true, 
    size: 5 * 1024 * 1024, // 5MB
    isDirectory: false 
  }),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
}));

jest.mock('expo-av', () => ({
  Video: {
    createAsync: jest.fn().mockResolvedValue({
      getDurationAsync: jest.fn().mockResolvedValue(10000),
      getStatusAsync: jest.fn().mockResolvedValue({ 
        isLoaded: true,
        durationMillis: 10000,
        positionMillis: 0
      }),
      unloadAsync: jest.fn().mockResolvedValue(undefined)
    })
  },
  ResizeMode: {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch'
  }
}));

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ 
      status: 'granted',
      granted: true 
    }),
    getCameraPermissionsAsync: jest.fn().mockResolvedValue({ 
      status: 'granted',
      granted: true 
    }),
    Constants: {
      Type: { 
        back: 'back', 
        front: 'front' 
      },
      FlashMode: {
        on: 'on',
        off: 'off',
        auto: 'auto'
      }
    }
  }
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{
      uri: 'file://mock-video.mp4',
      type: 'video',
      duration: 10000
    }]
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true
  }),
  MediaTypeOptions: {
    Videos: 'Videos',
    Images: 'Images',
    All: 'All'
  }
}));

jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: jest.fn().mockResolvedValue({
    uri: 'file://mock-thumbnail.jpg',
    width: 1920,
    height: 1080
  })
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/cache',
  exists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({
    size: 1024 * 1024,
    isFile: () => true,
    isDirectory: () => false
  })
}));

// Mock Firebase for pose analysis
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({}),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn().mockReturnValue({}),
  httpsCallable: jest.fn().mockReturnValue(
    jest.fn().mockResolvedValue({
      data: {
        success: true,
        analysis: {
          overallScore: 85,
          criticalErrors: [],
          improvements: []
        }
      }
    })
  ),
}));

// Mock React Native Reanimated for pose analysis animations
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {},
  };
});

// Global test utilities for pose analysis
global.mockVideoUri = 'file://test-video.mp4';
global.mockExerciseType = 'squat';
global.mockPoseLandmarks = Array.from({ length: 33 }, (_, i) => ({
  x: 0.5 + (Math.random() - 0.5) * 0.1,
  y: 0.3 + (i / 33) * 0.4,
  z: Math.random() * 0.1,
  inFrameLikelihood: 0.8 + Math.random() * 0.2
}));

// Performance testing utilities
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([]),
  getEntriesByType: jest.fn().mockReturnValue([]),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Silence console logs during tests unless explicitly testing them
if (process.env.NODE_ENV === 'test') {
  const originalConsole = console;
  console.log = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  
  // Keep error and debug for important test information
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
}

// Setup test timeout for video processing tests
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  
  // Clear any timers that might be set during pose analysis
  jest.clearAllTimers();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});