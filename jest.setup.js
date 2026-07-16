/* global jest */
/**
 * Jest Setup File
 *
 * Global test configuration and mocks for production-grade testing.
 * Includes comprehensive mocks for all external dependencies.
 */

// Platform mock - define BEFORE any React Native imports
const mockPlatformSelect = jest.fn((obj) => obj.ios || obj.default || {});

const mockPlatform = {
  OS: 'ios',
  select: mockPlatformSelect,
  Version: 17,
  isPad: false,
  isTVOS: false,
  isTV: false,
  constants: {
    reactNativeVersion: { major: 0, minor: 81, patch: 0 },
  },
};

// Mock Platform module directly FIRST
jest.mock('react-native/Libraries/Utilities/Platform', () => mockPlatform, { virtual: true });

// Mock Dimensions for responsive utilities
jest.mock('react-native/Libraries/Utilities/Dimensions', () => {
  const dimensionsMock = {
    get: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 2 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  };
  return {
    ...dimensionsMock,
    default: dimensionsMock,
  };
});

// Testing-library matchers are auto-registered in v13+

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      firebaseapikey: 'test-firebase-api-key',
      firebaseauthdomain: 'test-project.firebaseapp.com',
      firebaseprojectid: 'test-project',
      firebasestoragebucket: 'test-project.appspot.com',
      firebasemessagingsenderid: '1234567890',
      firebaseappid: '1:1234567890:web:testappid',
      apiurl: 'https://api.test.local',
      env: 'test',
    },
  },
  manifest2: {
    extra: {
      firebaseapikey: 'test-firebase-api-key',
      firebaseauthdomain: 'test-project.firebaseapp.com',
      firebaseprojectid: 'test-project',
      firebasestoragebucket: 'test-project.appspot.com',
      firebasemessagingsenderid: '1234567890',
      firebaseappid: '1:1234567890:web:testappid',
      apiurl: 'https://api.test.local',
      env: 'test',
    },
  },
  default: {
    expoConfig: {
      extra: {
        firebaseapikey: 'test-firebase-api-key',
        firebaseauthdomain: 'test-project.firebaseapp.com',
        firebaseprojectid: 'test-project',
        firebasestoragebucket: 'test-project.appspot.com',
        firebasemessagingsenderid: '1234567890',
        firebaseappid: '1:1234567890:web:testappid',
        apiurl: 'https://api.test.local',
        env: 'test',
      },
    },
  },
}));

jest.mock('expo-device', () => ({
  deviceName: 'Test Device',
  modelName: 'Test Model',
  osName: 'iOS',
  osVersion: '17.0',
  platformApiLevel: null,
  brand: 'Apple',
  manufacturer: 'Apple',
  isDevice: true,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: false, uri: 'test-uri' })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ cancelled: false, uri: 'test-uri' })),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock Firebase Analytics
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(() => ({})),
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  updateProfile: jest.fn(),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => false,
      data: () => null,
    }),
  ),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [],
      empty: true,
      size: 0,
      forEach: jest.fn(),
    }),
  ),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  startAfter: jest.fn(),
  increment: jest.fn((value) => value),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  })),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://example.com/avatar.png')),
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  wrap: (component) => component,
  Severity: {
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      canGoBack: jest.fn(() => true),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock Bottom Tabs utilities that require navigation context
jest.mock('@react-navigation/bottom-tabs', () => {
  const actualTabs = jest.requireActual('@react-navigation/bottom-tabs');
  return {
    ...actualTabs,
    useBottomTabBarHeight: () => 0,
  };
});

// Mock React Native Worklets (required by Reanimated v4)
jest.mock('react-native-worklets', () => ({
  __esModule: true,
  WorkletsModule: {},
  RuntimeKind: { ReactNative: 'ReactNative' },
  getRuntimeKind: () => 'ReactNative',
  isShareableRef: () => false,
  isWorkletFunction: () => false,
  shareableMappingCache: new Map(),
  serializableMappingCache: new Map(),
  getStaticFeatureFlag: () => false,
  setDynamicFeatureFlag: () => {},
  isSynchronizable: () => false,
  makeShareable: (value) => value,
  makeShareableCloneOnUIRecursive: (value) => value,
  makeShareableCloneRecursive: (value) => value,
  createSerializable: (value) => value,
  createSynchronizable: (value) => value,
  createWorkletRuntime: () => ({}),
  runOnRuntime: (fn) => fn,
  scheduleOnRuntime: (fn) => fn,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  runOnUIAsync:
    (fn) =>
    async (...args) =>
      fn(...args),
  scheduleOnUI: (fn) => fn,
  executeOnUIRuntimeSync: (fn) => fn,
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');

  // GestureDetector mock that renders children
  const GestureDetector = ({ children }) => children;

  // Gesture mock
  const Gesture = {
    Tap: () => ({
      onBegin: jest.fn().mockReturnThis(),
      onStart: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
    Pan: () => ({
      onBegin: jest.fn().mockReturnThis(),
      onStart: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
    LongPress: () => ({
      onBegin: jest.fn().mockReturnThis(),
      onStart: jest.fn().mockReturnThis(),
      onFinalize: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  };

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
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((x) => x),
    Directions: {},
    GestureDetector,
    Gesture,
  };
});

// Suppress console warnings in tests (but keep errors)
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Global test timeout
jest.setTimeout(10000);
