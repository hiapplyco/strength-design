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
  getApp: jest.fn(),
  getApps: jest.fn().mockReturnValue([]),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
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

// Mock Expo Device
jest.mock('expo-device', () => ({
  modelName: 'iPhone 13',
  osName: 'iOS',
  osVersion: '17.0',
  totalMemory: 4294967296, // 4GB
  deviceYearClass: 2021,
}));

// Mock Expo Battery
jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn(() => Promise.resolve(0.8)),
  getBatteryStateAsync: jest.fn(() => Promise.resolve(2)), // CHARGING
  addBatteryLevelListener: jest.fn(() => ({ remove: jest.fn() })),
  addBatteryStateListener: jest.fn(() => ({ remove: jest.fn() })),
  BatteryState: {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Lucide icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  return new Proxy({}, {
    get: (target, prop) => {
      return React.forwardRef((props, ref) =>
        React.createElement('View', { ...props, ref })
      );
    }
  });
});

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

// Helper functions for creating test fixtures
global.createMockVideoUri = (duration = 60) => {
  return `file:///mock/test-video-${duration}s.mp4`;
};

global.createMockAnalysisResult = (exerciseType = 'squat', score = 85) => {
  return {
    id: 'test-analysis-123',
    exerciseType,
    score,
    feedback: [
      { id: '1', type: 'correction', severity: 'medium', message: 'Depth could be improved' },
      { id: '2', type: 'positive', severity: 'low', message: 'Good knee tracking' }
    ],
    landmarks: [],
    timestamp: new Date().toISOString(),
    processingTimeMs: 25000,
    success: true
  };
};

global.createMockUserProgress = (analysisCount = 5) => {
  return {
    totalAnalyses: analysisCount,
    averageScore: 82,
    improvements: [
      { exercise: 'squat', startScore: 70, currentScore: 85, improvement: 15 }
    ],
    achievements: [
      { id: 'first_analysis', name: 'First Steps', unlockedAt: new Date().toISOString() }
    ]
  };
};

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