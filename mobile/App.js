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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Workouts':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Generator':
              iconName = focused ? 'sparkles' : 'sparkles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? '#000000' : '#1C1C1E',
          borderTopColor: '#2C2C2E',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
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
    // Initialize performance monitoring and background queue
    const initializeServices = async () => {
      try {
        console.log('Initializing performance monitoring...');
        await performanceMonitor.initialize();

        console.log('Initializing background queue...');
        await backgroundQueue.initialize();

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
    // You could return a loading screen here
    return null;
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
 * Main App Component
 */
export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#000000"
        />
        <RootStack />
      </NavigationContainer>
    </ThemeProvider>
  );
}
