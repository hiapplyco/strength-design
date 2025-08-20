import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeLinearGradient, OuraBackgroundGradient } from './components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { ThemeProvider, useTheme, themedStyles } from './contexts/ThemeContext';
import { UserContextProvider } from './contexts/UserContextProvider';
import useUserContext from './hooks/useUserContext';
import ContextModal from './components/ContextModal';
import { colors, animations, theme } from './utils/designTokens';
import { GlassContainer } from './components/GlassmorphismComponents';
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
import healthService from './services/healthService';
import sessionContextManager from './services/sessionContextManager';

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
      
      {/* Clean Tab Bar */}
      <View style={[tabBarStyles, { 
        flexDirection: 'row',
        backgroundColor: theme.isDarkMode ? '#1A1A1A' : '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: theme.isDarkMode ? '#333' : '#E0E0E0',
      }]}>
        {['Home', 'Workouts', 'Search', 'Profile', 'Generator'].map((tab) => {
          const icons = {
            Home: currentScreen === 'Home' ? 'home' : 'home-outline',
            Generator: currentScreen === 'Generator' ? 'sparkles' : 'sparkles-outline',
            Search: currentScreen === 'Search' ? 'search' : 'search-outline',
            Workouts: currentScreen === 'Workouts' ? 'calendar' : 'calendar-outline',
            Profile: currentScreen === 'Profile' ? 'person' : 'person-outline',
          };
          
          const isActive = currentScreen === tab;
          const activeColor = '#4CAF50';  // Green for active
          const inactiveColor = theme.isDarkMode ? '#888' : '#666';
          
          return (
            <TouchableOpacity
              key={tab}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                paddingTop: 12,
              }}
              onPress={() => handleNavigation(tab)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={icons[tab]} 
                size={24} 
                color={isActive ? activeColor : inactiveColor}
                style={{ marginBottom: 4 }}
              />
              <Text 
                style={{
                  fontSize: 11,
                  color: isActive ? activeColor : inactiveColor,
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {tab}
              </Text>
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      console.log('🔥 Auth state changed:', user?.email);
    });

    return unsubscribe;
  }, []);

  // Theme-aware loading screen styles with unified gradients
  const loadingStyles = themedStyles(({ theme: themeObj, typography, isDarkMode }) => {
    const currentThemeMode = isDarkMode ? 'dark' : 'light';
    const gradientColors = colors.gradients.background[currentThemeMode]?.primary || 
                          (isDarkMode ? colors.gradients.background.dark.primary : colors.gradients.background.light.primary);
      
    return {
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      text: {
        color: themeObj.text,
        marginTop: 16,
        fontSize: typography?.fontSize?.lg || 17,
        fontWeight: typography?.fontWeight?.medium || '500',
        textAlign: 'center',
      },
      gradientColors,
    };
  });

  // Show theme-aware loading screen
  if (loading || theme.isLoading) {
    return (
      <SafeLinearGradient
        colors={loadingStyles.gradientColors}
        fallbackColors={theme.isDarkMode ? ['#000000', '#0A0A0A', '#141414'] : ['#FFFFFF', '#F8F9FA', '#F0F1F3']}
        style={[styles.container, loadingStyles.container]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
      >
        <GlassContainer 
          variant="medium" 
          style={{ 
            padding: 32, 
            alignItems: 'center',
            minWidth: 200,
          }}
        >
          <ActivityIndicator 
            size="large" 
            color={theme.theme?.primary || '#FF6B35'} 
          />
          <Text style={loadingStyles.text}>Loading...</Text>
          {theme.isTransitioning && (
            <Text style={[loadingStyles.text, { fontSize: 12, marginTop: 8 }]}>Switching theme...</Text>
          )}
        </GlassContainer>
      </SafeLinearGradient>
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
      <UserContextProvider>
        <AppWithTheme />
      </UserContextProvider>
    </ThemeProvider>
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