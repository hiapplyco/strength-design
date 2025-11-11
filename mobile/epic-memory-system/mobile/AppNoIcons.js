import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import LoginScreen from './screens/SimpleLoginScreen';
import HomeScreen from './screens/HomeScreen';
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
        return <EnhancedAIWorkoutChat navigation={{ navigate: setCurrentScreen }} />;
      case 'Workouts':
        return <WorkoutsScreen navigation={{ navigate: setCurrentScreen }} />;
      case 'Exercises':
        return <CleanExerciseLibraryScreen navigation={{ navigate: setCurrentScreen }} />;
      case 'Search':
        return <UnifiedSearchScreen navigation={{ navigate: setCurrentScreen }} />;
      case 'Profile':
        return <ProfileScreen navigation={{ navigate: setCurrentScreen }} />;
      case 'Chat':
        return <StreamingChatScreen navigation={{ navigate: setCurrentScreen }} />;
      default:
        return <HomeScreen navigation={{ navigate: setCurrentScreen }} />;
    }
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0C' : '#FFFFFF' }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: isDark ? '#1A1A1C' : '#FFFFFF',
        borderBottomColor: isDark ? '#2A2A2C' : '#E5E5E5' 
      }]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Strength.Design
        </Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={[styles.signOutText, { color: isDark ? '#FF6B6B' : '#FF4444' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { 
        backgroundColor: isDark ? '#1A1A1C' : '#FFFFFF',
        borderTopColor: isDark ? '#2A2A2C' : '#E5E5E5' 
      }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Home')}>
          <Text style={[styles.navText, currentScreen === 'Home' && styles.navTextActive]}>
            🏠 Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Generator')}>
          <Text style={[styles.navText, currentScreen === 'Generator' && styles.navTextActive]}>
            🤖 AI
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Workouts')}>
          <Text style={[styles.navText, currentScreen === 'Workouts' && styles.navTextActive]}>
            💪 Workouts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Search')}>
          <Text style={[styles.navText, currentScreen === 'Search' && styles.navTextActive]}>
            🔍 Search
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('Profile')}>
          <Text style={[styles.navText, currentScreen === 'Profile' && styles.navTextActive]}>
            👤 Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppWithTheme() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email);
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Strength.Design...</Text>
      </View>
    );
  }

  return user ? <AuthenticatedApp /> : <LoginScreen onLogin={setUser} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithTheme />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    paddingBottom: 30,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  navTextActive: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
});