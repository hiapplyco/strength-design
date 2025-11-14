/**
 * Strength.Design Mobile App
 * Main entry point and navigation configuration
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider } from './contexts/ThemeContext';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Performance monitoring
import performanceMonitor from './services/performanceMonitor';
import backgroundQueue from './services/backgroundQueue';

// UX Components
import StrengthDesignLoader from './components/visualizations/StrengthDesignLoader';

// Session management
import sessionContextManager from './services/sessionContextManager';

// Navigation components
import CustomNeonTabBar from './components/navigation/CustomNeonTabBar';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import WorkoutsScreen from './screens/WorkoutsScreen';
import ProfileScreen from './screens/ProfileScreen';
import CleanExerciseLibraryScreen from './screens/CleanExerciseLibraryScreen';
import RealAIWorkoutGenerator from './screens/RealAIWorkoutGenerator';
import PoseAnalysisUploadScreen from './screens/PoseAnalysisUploadScreen';
import PoseAnalysisProcessingScreen from './screens/PoseAnalysisProcessingScreen';
import PoseAnalysisResultsScreen from './screens/PoseAnalysisResultsScreen';
import PoseProgressScreen from './screens/PoseProgressScreen';
import WorkoutResultsScreen from './screens/WorkoutResultsScreen';
import PoseAnalysisLiveScreen from './screens/PoseAnalysisLiveScreen';

// Ignore specific warnings for better development experience
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * Main Tab Navigator
 * Bottom tabs for primary app sections
 */
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomNeonTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ title: 'Workouts' }}
      />
      <Tab.Screen
        name="Search"
        component={CleanExerciseLibraryScreen}
        options={{ title: 'Search' }}
      />
      <Tab.Screen
        name="Generator"
        component={RealAIWorkoutGenerator}
        options={{ title: 'AI Coach' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Stack Navigator
 * Handles auth flow and nested navigation
 */
function RootStack() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize performance monitoring, background queue, and session tracking
    const initializeServices = async () => {
      try {
        console.log('Initializing performance monitoring...');
        await performanceMonitor.initialize();

        console.log('Initializing background queue...');
        await backgroundQueue.initialize();

        console.log('Initializing session context manager...');
        await sessionContextManager.initialize();

        console.log('Services initialized successfully');
      } catch (error) {
        console.error('Service initialization failed:', error);
      }
    };

    initializeServices();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    // Beautiful animated loading screen
    return (
      <StrengthDesignLoader
        duration={3500}
        colors={['#FF6B35', '#00F0FF', '#00FF88', '#FFD700']}
        animationType="spiral"
        pattern="strengthLogo"
        intensity={1.0}
        size={300}
        isVisible={true}
      />
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000000' },
        presentation: 'card',
      }}
    >
      {user ? (
        // Authenticated Stack
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="PoseAnalysisUpload"
            component={PoseAnalysisUploadScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="PoseAnalysisLive"
            component={PoseAnalysisLiveScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="PoseAnalysisProcessing"
            component={PoseAnalysisProcessingScreen}
          />
          <Stack.Screen
            name="PoseAnalysisResults"
            component={PoseAnalysisResultsScreen}
          />
          <Stack.Screen
            name="PoseProgress"
            component={PoseProgressScreen}
          />
          <Stack.Screen
            name="WorkoutResults"
            component={WorkoutResultsScreen}
          />
        </>
      ) : (
        // Unauthenticated Stack
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
      )}
    </Stack.Navigator>
  );
}

/**
 * Get current route name from navigation state
 */
function getCurrentRouteName(state) {
  if (!state || !state.routes) return null;
  const route = state.routes[state.index];

  // If nested navigator, recursively get the current route
  if (route.state) {
    return getCurrentRouteName(route.state);
  }

  return route.name;
}

/**
 * Main App Component
 */
export default function App() {
  const navigationRef = React.useRef(null);
  const routeNameRef = React.useRef(null);

  return (
    <ThemeProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          // Save initial route name
          const currentRouteName = getCurrentRouteName(navigationRef.current?.getRootState());
          routeNameRef.current = currentRouteName;

          // Track initial screen
          if (currentRouteName) {
            sessionContextManager.trackScreenVisit(currentRouteName);
          }
        }}
        onStateChange={async () => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = getCurrentRouteName(navigationRef.current?.getRootState());

          if (previousRouteName !== currentRouteName && currentRouteName) {
            // Track screen visit
            await sessionContextManager.trackScreenVisit(currentRouteName);
            console.log(`📊 Navigated to: ${currentRouteName}`);
          }

          // Save current route name for next change
          routeNameRef.current = currentRouteName;
        }}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#000000"
        />
        <RootStack />
      </NavigationContainer>
    </ThemeProvider>
  );
}
