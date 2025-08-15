import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SearchProvider } from './contexts/SearchContext';
import { SafeIcon } from './services/IconService';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreenSafe';
import EnhancedAIWorkoutChat from './screens/EnhancedAIWorkoutChat';
import WorkoutsScreen from './screens/WorkoutsScreen';
import StreamingChatScreen from './screens/StreamingChatScreen';
import CleanExerciseLibraryScreen from './screens/CleanExerciseLibraryScreen';
import UnifiedSearchScreen from './screens/UnifiedSearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import healthService from './services/healthService';

// Simple navigation implementation for web compatibility
function AuthenticatedApp() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [healthInitialized, setHealthInitialized] = useState(false);

  useEffect(() => {
    // Initialize health service on app start
    initializeHealthService();
  }, []);

  const initializeHealthService = async () => {
    try {
      const result = await healthService.initialize();
      if (result.success) {
        console.log('Health service initialized successfully');
        setHealthInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize health service:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen navigation={{ navigate: setCurrentScreen }} />;
      case 'Generator':
        // Enhanced AI Chat with context awareness, streaming animations, and real Gemini 2.5 Flash
        return <EnhancedAIWorkoutChat navigation={{ goBack: () => setCurrentScreen('Home'), navigate: setCurrentScreen }} />;
      case 'Workouts':
        return <WorkoutsScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: setCurrentScreen }} />;
      case 'Exercises':
        return <CleanExerciseLibraryScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: setCurrentScreen }} />;
      case 'Search':
        return <UnifiedSearchScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: setCurrentScreen }} />;
      case 'Profile':
        // Use the new comprehensive ProfileScreen
        return <ProfileScreen navigation={{ navigate: setCurrentScreen, replace: (screen) => setCurrentScreen(screen) }} />;
      default:
        return <HomeScreen navigation={{ navigate: setCurrentScreen }} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        {['Home', 'Generator', 'Search', 'Workouts', 'Profile'].map((tab) => {
          const icons = {
            Home: currentScreen === 'Home' ? 'home' : 'home-outline',
            Generator: currentScreen === 'Generator' ? 'chatbubbles' : 'chatbubbles-outline',
            Search: currentScreen === 'Search' ? 'search' : 'search-outline',
            Workouts: currentScreen === 'Workouts' ? 'calendar' : 'calendar-outline',
            Profile: currentScreen === 'Profile' ? 'person' : 'person-outline',
          };
          
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setCurrentScreen(tab)}
            >
              <SafeIcon 
                name={icons[tab]} 
                size={24} 
                color={currentScreen === tab ? '#FF6B35' : '#888'} 
              />
              <Text style={[
                styles.tabLabel,
                currentScreen === tab && styles.tabLabelActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function AppWithTheme() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      console.log('Auth state changed:', user?.email);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={() => console.log('Login successful')} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <AppWithTheme />
      </SearchProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    color: '#888',
  },
  tabLabelActive: {
    color: '#FF6B35',
  },
  placeholderScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: 'white',
    marginTop: 20,
  },
  signOutButton: {
    marginTop: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});