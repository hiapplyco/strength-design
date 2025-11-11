import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import sessionContextManager from '../services/sessionContextManager';
import ContextStatusModal from './ContextStatusModal';
import healthService from '../services/healthService';

const { width: screenWidth } = Dimensions.get('window');

/**
 * GlobalContextStatusLine Component
 * 
 * A persistent statusline that appears at the top of every screen, showing key context metrics.
 * Positioned just below the safe area/notch on iOS and status bar on Android.
 * 
 * Features:
 * - Always visible exercise and workout counts (even when 0)
 * - Context completion percentage
 * - Selected biometric indicators
 * - Tappable to open detailed ContextStatusModal
 * - Glassmorphism design with smooth animations
 * - Safe area aware positioning for notch/Dynamic Island
 * - Real-time updates from session context manager
 */
export default function GlobalContextStatusLine({ navigation, style }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [contextSummary, setContextSummary] = useState(null);
  const [biometricData, setBiometricData] = useState({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnimations = useRef({}).current;

  useEffect(() => {
    loadContextData();
    
    // Set up polling for context changes
    const interval = setInterval(loadContextData, 3000);
    
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation for the percentage
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      clearInterval(interval);
      pulse.stop();
    };
  }, []);

  const loadContextData = async () => {
    try {
      await sessionContextManager.initialize();
      const summary = await sessionContextManager.getSummary();
      const fullContext = await sessionContextManager.getFullContext();
      
      // Animate count changes
      if (contextSummary) {
        animateCountChanges(contextSummary, summary);
      }
      
      // Enhanced biometric data with health integration
      const enhancedBiometrics = {
        ...fullContext.biometrics,
        // Add computed metrics for display
        completenessScore: summary.biometricData?.completeness || 0,
        hasHealthIntegration: summary.biometricData?.hasHealthIntegration || false,
        isHealthConnected: summary.biometricData?.isHealthConnected || false,
        lastHealthSync: summary.biometricData?.lastHealthSync
      };
      
      setContextSummary(summary);
      setBiometricData(enhancedBiometrics);
      setIsLoading(false);
      
      // Log enhanced context for debugging
      console.log('📊 Enhanced context loaded for statusline:', {
        biometricCompleteness: enhancedBiometrics.completenessScore,
        hasHealthData: enhancedBiometrics.hasHealthIntegration,
        isHealthConnected: enhancedBiometrics.isHealthConnected,
        totalContextItems: summary.completedCount
      });
    } catch (error) {
      console.error('Error loading context data for statusline:', error);
      setIsLoading(false);
    }
  };

  const animateCountChanges = (oldSummary, newSummary) => {
    if (!oldSummary?.items || !newSummary?.items) return;

    oldSummary.items.forEach((oldItem, index) => {
      const newItem = newSummary.items[index];
      if (!newItem) return;

      const oldCount = oldItem.count || 0;
      const newCount = newItem.count || 0;
      
      if (oldCount !== newCount) {
        // Create or update animation for this item
        const key = `${index}_${oldItem.type}`;
        if (!countAnimations[key]) {
          countAnimations[key] = new Animated.Value(0);
        }
        
        // Quick bounce animation
        Animated.sequence([
          Animated.timing(countAnimations[key], {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(countAnimations[key], {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });
  };

  const handlePress = () => {
    setShowDetailModal(true);
  };

  const handleNavigate = (screen) => {
    if (navigation && navigation.navigate) {
      navigation.navigate(screen);
    }
  };

  // Get safe area styling for proper spacing
  const getSafeAreaStyle = () => {
    return {
      paddingTop: insets.top + 4,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    };
  };

  // Get key metrics for display with enhanced biometric tracking
  const getDisplayMetrics = () => {
    if (!contextSummary) {
      return {
        exercises: 0,
        workouts: 0,
        percentage: 0,
        biometricsCount: 0,
        healthStatus: 'disconnected',
        biometricQuality: 'none'
      };
    }

    const exerciseItem = contextSummary.items?.find(item => item.type === 'exercises');
    const workoutItem = contextSummary.items?.find(item => item.type === 'programs');
    const biometricItem = contextSummary.items?.find(item => item.type === 'biometrics');
    
    // Calculate biometric quality
    const biometricQuality = biometricItem?.completeness 
      ? biometricItem.completeness > 80 ? 'excellent' 
        : biometricItem.completeness > 60 ? 'good'
        : biometricItem.completeness > 30 ? 'basic'
        : 'minimal'
      : 'none';
    
    // Determine health status
    const healthStatus = contextSummary.biometricData?.isHealthConnected 
      ? 'connected' 
      : contextSummary.biometricData?.hasHealthIntegration 
      ? 'available' 
      : 'disconnected';
    
    return {
      exercises: exerciseItem?.count || 0,
      workouts: workoutItem?.count || 0,
      percentage: contextSummary.completionPercentage || 0,
      biometricsCount: Object.keys(biometricData).filter(key => 
        !['lastUpdated', 'source', 'hasBasicMetrics', 'hasHealthData', 'hasAdvancedMetrics'].includes(key)
      ).length,
      biometricCompleteness: biometricItem?.completeness || 0,
      healthStatus,
      biometricQuality,
      hasHealthData: Boolean(biometricData.healthData),
      healthScore: biometricData.healthData?.healthScore || 0
    };
  };

  const metrics = getDisplayMetrics();

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          getSafeAreaStyle(),
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
          style,
        ]}
      >
        <TouchableOpacity
          style={styles.touchableContainer}
          onPress={handlePress}
          activeOpacity={0.8}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <BlurView
            intensity={isDarkMode ? 60 : 80}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.content}>
            {/* Exercise Count */}
            <View style={styles.metric}>
              <Text style={styles.metricEmoji}>💪</Text>
              <Animated.Text style={[
                styles.metricCount,
                { 
                  color: metrics.exercises > 0 
                    ? (isDarkMode ? '#4CAF50' : '#388E3C')
                    : (isDarkMode ? '#999' : '#666'),
                  transform: [
                    {
                      scale: countAnimations['0_exercises'] 
                        ? countAnimations['0_exercises'].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          })
                        : 1,
                    }
                  ],
                }
              ]}>
                {isLoading ? '...' : metrics.exercises}
              </Animated.Text>
              <Text style={styles.metricLabel}>Exercises</Text>
            </View>

            {/* Separator */}
            <View style={[styles.separator, {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]} />

            {/* Workout Count */}
            <View style={styles.metric}>
              <Text style={styles.metricEmoji}>📋</Text>
              <Animated.Text style={[
                styles.metricCount,
                { 
                  color: metrics.workouts > 0 
                    ? (isDarkMode ? '#4CAF50' : '#388E3C')
                    : (isDarkMode ? '#999' : '#666'),
                  transform: [
                    {
                      scale: countAnimations['2_programs'] 
                        ? countAnimations['2_programs'].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          })
                        : 1,
                    }
                  ],
                }
              ]}>
                {isLoading ? '...' : metrics.workouts}
              </Animated.Text>
              <Text style={styles.metricLabel}>Workouts</Text>
            </View>


            {/* Tap Indicator */}
            <View style={styles.tapIndicator}>
              <Ionicons 
                name="chevron-down" 
                size={12} 
                color={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'} 
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Detail Modal */}
      <ContextStatusModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onNavigate={handleNavigate}
        title="Context Status"
        subtitle="Your current session overview"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 999,
  },
  touchableContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  metricEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  metricCount: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(153, 153, 153, 0.8)',
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 20,
    marginHorizontal: 8,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  percentageIcon: {
    marginRight: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  biometricsCount: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  tapIndicator: {
    marginLeft: 8,
    opacity: 0.6,
  },
  biometricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    marginRight: 4,
  },
  biometricPercentage: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  healthScore: {
    fontSize: 9,
    fontWeight: '500',
    marginLeft: 2,
  },
});

// Helper functions for biometric and health status colors and icons
function getBiometricStatusColor(quality, opacity = 1.0) {
  const colors = {
    excellent: `rgba(76, 175, 80, ${opacity})`, // Green
    good: `rgba(33, 150, 243, ${opacity})`,     // Blue  
    basic: `rgba(255, 152, 0, ${opacity})`,    // Orange
    minimal: `rgba(255, 193, 7, ${opacity})`,  // Amber
    none: `rgba(158, 158, 158, ${opacity})`    // Grey
  };
  return colors[quality] || colors.none;
}

function getBiometricIcon(quality) {
  const icons = {
    excellent: 'fitness',
    good: 'analytics',
    basic: 'body',
    minimal: 'person',
    none: 'person-outline'
  };
  return icons[quality] || icons.none;
}

function getHealthStatusColor(status, opacity = 1.0) {
  const colors = {
    connected: `rgba(76, 175, 80, ${opacity})`,  // Green
    available: `rgba(255, 152, 0, ${opacity})`, // Orange
    disconnected: `rgba(158, 158, 158, ${opacity})` // Grey
  };
  return colors[status] || colors.disconnected;
}

function getHealthIcon(status) {
  const icons = {
    connected: 'heart',
    available: 'heart-outline',
    disconnected: 'heart-dislike'
  };
  return icons[status] || icons.disconnected;
}