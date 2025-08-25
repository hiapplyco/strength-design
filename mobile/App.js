import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeLinearGradient } from './components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ThemeProvider, useTheme, themedStyles } from './contexts/ThemeContext';
import { UserContextProvider } from './contexts/UserContextProvider';
import useUserContext from './hooks/useUserContext';
import ContextModal from './components/ContextModal';
import { colors } from './utils/designTokens';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import EnhancedAIWorkoutChat from './screens/EnhancedAIWorkoutChat';
import WorkoutsScreen from './screens/WorkoutsScreen';
import StreamingChatScreen from './screens/StreamingChatScreen';
import CleanExerciseLibraryScreen from './screens/CleanExerciseLibraryScreen';
import UnifiedSearchScreen from './screens/UnifiedSearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import { SearchProvider } from './contexts/SearchContext';
import MockupWorkoutScreen from './screens/MockupWorkoutScreen';
import WorkoutResultsScreen from './screens/WorkoutResultsScreen';
import PoseAnalysisUploadScreen from './screens/PoseAnalysisUploadScreen';
import PoseAnalysisProcessingScreen from './screens/PoseAnalysisProcessingScreen';
import PoseAnalysisResultsScreen from './screens/PoseAnalysisResultsScreen';
import healthService from './services/healthService';
import sessionContextManager from './services/sessionContextManager';
import { TransitionProvider } from './components/animations';
import StrengthDesignLoader from './components/visualizations/StrengthDesignLoader';
import AnimationManager from './utils/AnimationManager';

// Enhanced authenticated app with theme integration and context awareness
function AuthenticatedApp() {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [healthInitialized, setHealthInitialized] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const theme = useTheme();
  const userContext = useUserContext();

  useEffect(() => {
    // Initialize health service and session manager on app start
    initializeHealthService();
    initializeSessionManager();
  }, []);

  const initializeSessionManager = async () => {
    try {
      await sessionContextManager.initialize();
      console.log('🎯 Session context manager initialized');
    } catch (error) {
      console.error('Failed to initialize session context manager:', error);
    }
  };

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

  // Handle navigation with context awareness
  const handleNavigation = async (screen) => {
    try {
      // Special handling for Generator screen - check session context
      if (screen === 'Generator') {
        const hasMinimalContext = await sessionContextManager.hasMinimalContext();
        
        if (!hasMinimalContext && userContext.needsContextSetup()) {
          userContext.recordContextModalShown();
          setShowContextModal(true);
          return;
        }
        
        userContext.tracking.trackGeneratorUse();
      } else if (screen === 'Search') {
        userContext.tracking.trackSearch('navigation');
      } else if (screen === 'Profile') {
        userContext.tracking.trackProfileView();
      }
      
      // Track screen visit in session manager
      await sessionContextManager.trackScreenVisit(screen);
      
      setCurrentScreen(screen);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback - just navigate normally
      setCurrentScreen(screen);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen navigation={{ navigate: handleNavigation }} />;
      case 'Generator':
        // Enhanced AI Chat with context awareness, streaming animations, and real Gemini 2.5 Flash
        return <EnhancedAIWorkoutChat navigation={{ goBack: () => setCurrentScreen('Home'), navigate: handleNavigation }} />;
      case 'ContextAwareGenerator':
        // Context-aware generator screen (same as Generator but accessed via different route)
        return <EnhancedAIWorkoutChat navigation={{ goBack: () => setCurrentScreen('Home'), navigate: handleNavigation }} />;
      case 'Workouts':
        return <WorkoutsScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: handleNavigation }} />;
      case 'Exercises':
        return <CleanExerciseLibraryScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: handleNavigation }} />;
      case 'Search':
        return (
          <SearchProvider>
            <UnifiedSearchScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: handleNavigation }} />
          </SearchProvider>
        );
      case 'Profile':
        // Use the new comprehensive ProfileScreen
        return <ProfileScreen navigation={{ navigate: handleNavigation, replace: (screen) => setCurrentScreen(screen) }} />;
      case 'MockupWorkout':
        return <MockupWorkoutScreen navigation={{ goBack: () => setCurrentScreen('Workouts'), navigate: handleNavigation }} />;
      case 'WorkoutResults':
        return <WorkoutResultsScreen navigation={{ goBack: () => setCurrentScreen('Workouts'), navigate: handleNavigation }} />;
      case 'WorkoutGenerator':
        return <EnhancedAIWorkoutChat navigation={{ goBack: () => setCurrentScreen('Workouts'), navigate: handleNavigation }} />;
      case 'PoseAnalysisUpload':
        return <PoseAnalysisUploadScreen navigation={{ goBack: () => setCurrentScreen('Home'), navigate: handleNavigation }} />;
      case 'PoseAnalysisProcessing':
        return <PoseAnalysisProcessingScreen navigation={{ goBack: () => setCurrentScreen('PoseAnalysisUpload'), navigate: handleNavigation }} />;
      case 'PoseAnalysisResults':
        return <PoseAnalysisResultsScreen navigation={{ goBack: () => setCurrentScreen('PoseAnalysisUpload'), navigate: handleNavigation, restart: () => setCurrentScreen('PoseAnalysisUpload') }} />;
      default:
        return <HomeScreen navigation={{ navigate: handleNavigation }} />;
    }
  };

  // Unified theme-aware gradient colors using new gradient system
  const currentThemeMode = theme.isDarkMode ? 'dark' : 'light';
  const gradientColors = theme.isDarkMode 
    ? ['#000000', '#0A0A0A', '#141414'] // Pure black gradient for dark mode
    : ['#FFFFFF', '#F8F9FA', '#F0F1F3']; // Neutral light gradient for light mode
    
  const containerStyles = themedStyles(({ theme, isDarkMode }) => ({
    flex: 1,
    backgroundColor: 'transparent',
  }));
  
  // Enhanced tab bar with improved glass effects and smooth transitions
  const tabBarStyles = themedStyles(({ theme, isDarkMode, glass, spacing }) => ({
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.select({ ios: 34, android: 20 }), // Safe area handling
    paddingTop: spacing[3] || 12,
    paddingHorizontal: spacing[2] || 8,
    borderTopWidth: 1,
    borderTopColor: theme.borderGlass || theme.borderLight,
    // Enhanced glass background with subtle gradient
    backgroundColor: isDarkMode 
      ? 'rgba(26, 27, 30, 0.85)' 
      : 'rgba(255, 255, 255, 0.85)',
  }));
  
  const tabItemStyles = themedStyles(({ spacing, borderRadius }) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2] || 8,
    paddingHorizontal: spacing[1] || 4,
    borderRadius: borderRadius?.component?.button?.sm || 8,
    minHeight: 44, // Accessibility minimum touch target
  }));
  
  const tabLabelStyles = themedStyles(({ theme, typography }) => ({
    fontSize: typography?.fontSize?.xs || 11,
    marginTop: 2,
    color: theme.textTertiary,
    fontWeight: typography?.fontWeight?.medium || '500',
    textAlign: 'center',
  }));
  
  const tabLabelActiveStyles = themedStyles(({ theme, typography }) => ({
    color: theme.primary,
    fontWeight: typography?.fontWeight?.semibold || '600',
  }));

  // Enhanced active tab background with glass effect
  const getActiveTabStyle = () => themedStyles(({ theme, isDarkMode }) => ({
    backgroundColor: isDarkMode 
      ? 'rgba(255, 184, 107, 0.08)' // Warm glow for dark mode
      : 'rgba(255, 107, 53, 0.08)',  // Primary glow for light mode
    transform: [{ scale: 1.02 }],
  }));

  return (
    <View style={containerStyles}>
      <SafeLinearGradient
        colors={gradientColors}
        fallbackColors={theme.isDarkMode ? ['#000000', '#0A0A0A', '#141414'] : ['#FFFFFF', '#F8F9FA', '#F0F1F3']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
      >
        <View style={styles.screenContainer}>
          {/* App Logo removed globally */}
          {renderScreen()}
        </View>
      </SafeLinearGradient>
      
      {/* Context Setup Modal */}
      <ContextModal
        visible={showContextModal}
        onClose={() => setShowContextModal(false)}
        onNavigate={(screen) => {
          setShowContextModal(false);
          if (screen === 'Generator') {
            // User chose to skip - record the skip and allow access
            userContext.recordSkip();
          }
          setCurrentScreen(screen);
        }}
      />
      
      {/* Modern Compact Tab Bar with Neon Glow */}
      <View style={{ 
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 65 : 55,
        backgroundColor: theme.isDarkMode ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 0.5,
        borderTopColor: theme.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        paddingBottom: Platform.OS === 'ios' ? 20 : 5,
        paddingTop: 5,
      }}>
        {['Home', 'Programs', 'Generator', 'Search', 'Profile'].map((tab) => {
          const icons = {
            Home: 'home',
            Generator: 'sparkles',
            Search: 'search',
            Programs: 'library',
            Profile: 'person',
          };
          
          // Handle multiple screen names for same tab
          const isActive = 
            (tab === 'Generator' && ['Generator', 'ContextAwareGenerator', 'WorkoutGenerator'].includes(currentScreen)) ||
            (tab === 'Programs' && ['Workouts', 'MockupWorkout', 'WorkoutResults'].includes(currentScreen)) ||
            currentScreen === tab;
          
          // Neon colors for each tab
          const neonColors = {
            Home: '#00F0FF',      // Cyan
            Generator: '#00FF88',  // Green
            Search: '#FF00F0',     // Magenta
            Programs: '#FFD700',   // Gold
            Profile: '#FF6B35',    // Orange
          };
          
          const activeColor = neonColors[tab];
          const inactiveColor = theme.isDarkMode ? '#666' : '#999';
          
          return (
            <TouchableOpacity
              key={tab}
              style={{
                flex: tab === 'Generator' ? 1.2 : 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 4,
              }}
              onPress={() => handleNavigation(tab === 'Programs' ? 'Workouts' : tab)}
              activeOpacity={0.8}
            >
              {/* Neon Glow Effect for Active Tab */}
              {isActive && tab === 'Generator' && (
                <View style={{
                  position: 'absolute',
                  top: -3,
                  width: '90%',
                  height: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#00FF88',
                    shadowColor: '#00FF88',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 12,
                    elevation: 10,
                  }} />
                  {/* Rainbow gradient overlay */}
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    flexDirection: 'row',
                  }}>
                    <View style={{ flex: 1, backgroundColor: '#FF0000', opacity: 0.8 }} />
                    <View style={{ flex: 1, backgroundColor: '#FF7F00', opacity: 0.8 }} />
                    <View style={{ flex: 1, backgroundColor: '#FFFF00', opacity: 0.8 }} />
                    <View style={{ flex: 1, backgroundColor: '#00FF00', opacity: 0.8 }} />
                    <View style={{ flex: 1, backgroundColor: '#0000FF', opacity: 0.8 }} />
                    <View style={{ flex: 1, backgroundColor: '#4B0082', opacity: 0.8 }} />
                    <View style={{ flex: 1, backgroundColor: '#9400D3', opacity: 0.8 }} />
                  </View>
                </View>
              )}
              {isActive && tab !== 'Generator' && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  width: '80%',
                  height: 2,
                  backgroundColor: activeColor,
                  shadowColor: activeColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 8,
                  elevation: 10,
                }} />
              )}
              
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                transform: tab === 'Generator' ? [{ scale: 1.1 }] : [],
              }}>
                <Ionicons 
                  name={isActive ? icons[tab] : `${icons[tab]}-outline`} 
                  size={tab === 'Generator' ? 26 : 22} 
                  color={isActive && tab === 'Generator' ? '#FFFFFF' : (isActive ? activeColor : inactiveColor)}
                  style={{ 
                    marginBottom: 2,
                    ...(isActive && {
                      shadowColor: activeColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                    })
                  }}
                />
                <Text 
                  style={{
                    fontSize: tab === 'Generator' ? 11 : 10,
                    color: isActive && tab === 'Generator' ? '#FFFFFF' : (isActive ? activeColor : inactiveColor),
                    fontWeight: isActive ? (tab === 'Generator' ? '700' : '600') : '400',
                    ...(isActive && theme.isDarkMode && {
                      textShadowColor: activeColor,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 3,
                    })
                  }}
                >
                  {tab}
                </Text>
              </View>
              
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Enhanced app wrapper with theme loading and transitions
function AppWithTheme() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    // Cleanup animations on unmount
    return () => {
      AnimationManager.stopAll();
    };
  }, []);

  useEffect(() => {
    // Optimized loader timing
    const minLoaderDuration = 3500; // 3.5 seconds for smooth experience
    const startTime = Date.now();
    let timeoutId;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      // Calculate remaining time to meet minimum duration
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(100, minLoaderDuration - elapsedTime);
      
      // Delay hiding loader to ensure smooth transition
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Show StrengthDesignLoader with signature S.D. pixel animation during initial load
  if (loading) {
    return (
      <StrengthDesignLoader 
        duration={4000}
        colors={['#FF6B35', '#00F0FF', '#00FF88', '#FFD700']}
        animationType="spiral"
        pattern="strengthLogo"
        intensity={1.0}
        size={300}
        isVisible={true}
        onComplete={() => {
          // Clean transition
          AnimationManager.stopAll();
        }}
      />
    );
  }

  if (!user) {
    return <LoginScreen onLogin={() => console.log('Login successful')} />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserContextProvider>
          <TransitionProvider>
            <AppWithTheme />
          </TransitionProvider>
        </UserContextProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Enhanced styles with theme integration
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradientBackground: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Legacy styles for backwards compatibility
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  placeholderScreen: {
    flex: 1,
    backgroundColor: 'transparent',
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
  
  // New glassmorphism styles
  glassTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingTop: 10,
  },
});