/**
 * Jest Setup File
 * Configure global test environment, mocks, and utilities
 */

// Silence console warnings in tests unless needed
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
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

// Mock Expo modules
jest.mock('expo-device', () => ({
  modelName: 'iPhone 13',
  osName: 'iOS',
  osVersion: '17.0',
  totalMemory: 4294967296, // 4GB
  deviceYearClass: 2021,
}));

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

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024 })),
  readAsStringAsync: jest.fn(() => Promise.resolve('mock file content')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted', canAskAgain: true, expires: 'never', granted: true })
    ),
    getCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted', canAskAgain: true, expires: 'never', granted: true })
    ),
  },
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, expires: 'never', granted: true })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'file:///mock/video.mp4', duration: 60000, width: 1920, height: 1080 }]
    })
  ),
  MediaTypeOptions: {
    Videos: 'Videos',
    Images: 'Images',
    All: 'All',
  },
}));

jest.mock('expo-av', () => ({
  Video: jest.fn(() => null),
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
  ResizeMode: {
    CONTAIN: 'contain',
    COVER: 'cover',
    STRETCH: 'stretch',
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

// Global test utilities
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

// Set test timeout
jest.setTimeout(30000);
