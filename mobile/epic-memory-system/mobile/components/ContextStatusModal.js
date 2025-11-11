import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import { GlassContainer } from './GlassmorphismComponents';
import sessionContextManager from '../services/sessionContextManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * ContextStatusModal Component
 * 
 * A detailed modal that shows the full context status when tapping the global statusline.
 * Displays comprehensive information about exercises, workouts, biometrics, and provides
 * quick actions to update context.
 * 
 * Features:
 * - Full context breakdown with counts and percentages
 * - Biometric data indicators
 * - Quick navigation to context update screens
 * - Real-time updates from session context manager
 * - Glassmorphism design with smooth animations
 */
export default function ContextStatusModal({ 
  visible, 
  onClose, 
  onNavigate,
  title = "Context Status",
  subtitle = "Your current session context"
}) {
  const theme = useTheme();
  const scrollViewRef = useRef(null);
  const [contextSummary, setContextSummary] = useState(null);
  const [biometricData, setBiometricData] = useState({});
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load context summary when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadContextData();
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Pulse animation for important stats
  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible]);

  const loadContextData = async () => {
    try {
      setLoading(true);
      await sessionContextManager.initialize();
      const summary = await sessionContextManager.getSummary();
      const fullContext = await sessionContextManager.getFullContext();
      
      setContextSummary(summary);
      setBiometricData(fullContext.biometrics || {});
    } catch (error) {
      console.error('Error loading context data:', error);
      setContextSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation with error handling
  const handleNavigation = (screen) => {
    try {
      onClose();
      if (onNavigate && typeof onNavigate === 'function') {
        onNavigate(screen);
      }
    } catch (error) {
      console.error('Navigation error in ContextStatusModal:', error);
      onClose();
    }
  };

  const handleClose = () => {
    try {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    } catch (error) {
      console.error('Error closing ContextStatusModal:', error);
      onClose();
    }
  };

  // Theme-aware styles
  const styles = themedStyles(({ theme, isDarkMode, spacing, typography }) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing?.md || 20,
    },
    modalContainer: {
      width: Math.min(screenWidth - 40, 400),
      maxHeight: screenHeight * 0.85,
      borderRadius: 24,
      overflow: 'hidden',
    },
    scrollContainer: {
      maxHeight: screenHeight * 0.75,
    },
    contentContainer: {
      padding: spacing?.lg || 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing?.lg || 24,
    },
    closeButton: {
      position: 'absolute',
      top: spacing?.sm || 12,
      right: spacing?.sm || 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    title: {
      fontSize: typography?.fontSize?.xl || 24,
      fontWeight: typography?.fontWeight?.bold || '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing?.xs || 4,
    },
    subtitle: {
      fontSize: typography?.fontSize?.sm || 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    
    // Context Overview Section
    overviewSection: {
      marginBottom: spacing?.lg || 24,
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing?.md || 16,
      justifyContent: 'space-between',
    },
    overviewCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: isDarkMode 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 16,
      padding: spacing?.md || 16,
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      alignItems: 'center',
    },
    overviewCardActive: {
      backgroundColor: isDarkMode 
        ? 'rgba(76, 175, 80, 0.15)' 
        : 'rgba(76, 175, 80, 0.1)',
      borderColor: isDarkMode
        ? 'rgba(76, 175, 80, 0.3)'
        : 'rgba(76, 175, 80, 0.2)',
    },
    overviewIcon: {
      fontSize: 24,
      marginBottom: spacing?.xs || 8,
    },
    overviewCount: {
      fontSize: typography?.fontSize?.xl || 20,
      fontWeight: typography?.fontWeight?.bold || '700',
      color: theme.text,
      marginBottom: 2,
    },
    overviewCountActive: {
      color: isDarkMode ? '#4CAF50' : '#388E3C',
    },
    overviewLabel: {
      fontSize: typography?.fontSize?.xs || 12,
      color: theme.textTertiary,
      textAlign: 'center',
    },
    
    // Progress Section
    progressSection: {
      marginBottom: spacing?.lg || 24,
      padding: spacing?.md || 16,
      backgroundColor: isDarkMode 
        ? 'rgba(255, 107, 53, 0.08)' 
        : 'rgba(255, 107, 53, 0.05)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 107, 53, 0.2)'
        : 'rgba(255, 107, 53, 0.1)',
    },
    progressTitle: {
      fontSize: typography?.fontSize?.md || 16,
      fontWeight: typography?.fontWeight?.semibold || '600',
      color: theme.text,
      marginBottom: spacing?.sm || 12,
      textAlign: 'center',
    },
    progressBarContainer: {
      height: 12,
      backgroundColor: isDarkMode 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: spacing?.sm || 12,
    },
    progressBar: {
      height: '100%',
      borderRadius: 6,
      flexDirection: 'row',
    },
    progressText: {
      fontSize: typography?.fontSize?.sm || 14,
      color: '#FF6B35',
      textAlign: 'center',
      fontWeight: typography?.fontWeight?.semibold || '600',
    },
    
    // Biometrics Section
    biometricsSection: {
      marginBottom: spacing?.lg || 24,
    },
    sectionTitle: {
      fontSize: typography?.fontSize?.lg || 18,
      fontWeight: typography?.fontWeight?.semibold || '600',
      color: theme.text,
      marginBottom: spacing?.md || 16,
    },
    biometricsList: {
      gap: spacing?.sm || 12,
    },
    biometricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing?.sm || 12,
      backgroundColor: isDarkMode 
        ? 'rgba(33, 150, 243, 0.1)' 
        : 'rgba(33, 150, 243, 0.05)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(33, 150, 243, 0.2)'
        : 'rgba(33, 150, 243, 0.1)',
    },
    biometricIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#2196F3',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing?.sm || 12,
    },
    biometricContent: {
      flex: 1,
    },
    biometricLabel: {
      fontSize: typography?.fontSize?.sm || 14,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    biometricValue: {
      fontSize: typography?.fontSize?.md || 16,
      fontWeight: typography?.fontWeight?.semibold || '600',
      color: theme.text,
    },
    
    // Quick Actions Section
    actionsSection: {
      gap: spacing?.sm || 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing?.md || 16,
      backgroundColor: isDarkMode 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    actionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode 
        ? 'rgba(76, 175, 80, 0.2)' 
        : 'rgba(76, 175, 80, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing?.md || 16,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: typography?.fontSize?.md || 16,
      fontWeight: typography?.fontWeight?.semibold || '600',
      color: theme.text,
      marginBottom: 2,
    },
    actionDescription: {
      fontSize: typography?.fontSize?.xs || 12,
      color: theme.textTertiary,
    },
    chevronIcon: {
      marginLeft: spacing?.sm || 12,
    },
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <GlassContainer 
          variant="modal" 
          style={styles.modalContainer}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="close" 
              size={20} 
              color={theme.theme.textSecondary} 
            />
          </TouchableOpacity>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: theme.theme.textSecondary }}>Loading context...</Text>
              </View>
            ) : (
              <>
                {/* Context Overview Grid */}
                <View style={styles.overviewSection}>
                  <Text style={styles.sectionTitle}>Session Overview</Text>
                  <View style={styles.overviewGrid}>
                    {contextSummary?.items?.map((item, index) => {
                      const hasData = (item.count !== undefined && item.count > 0) || 
                                     (item.hasData !== undefined && item.hasData);
                      const displayCount = item.count !== undefined ? item.count : (hasData ? '✓' : '0');
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.overviewCard, hasData && styles.overviewCardActive]}
                          onPress={() => {
                            const screenMap = {
                              'exercises': 'Search',
                              'nutrition': 'Search',
                              'programs': 'Workouts',
                              'biometrics': 'Profile',
                              'preferences': 'Profile',
                              'goals': 'Profile'
                            };
                            const screen = screenMap[item.type] || 'Profile';
                            handleNavigation(screen);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.overviewIcon}>{item.icon}</Text>
                          <Animated.Text style={[
                            styles.overviewCount, 
                            hasData && styles.overviewCountActive,
                            hasData && { opacity: pulseAnim }
                          ]}>
                            {displayCount}
                          </Animated.Text>
                          <Text style={styles.overviewLabel}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Progress Section */}
                {contextSummary && (
                  <View style={styles.progressSection}>
                    <Text style={styles.progressTitle}>Context Completion</Text>
                    <View style={styles.progressBarContainer}>
                      <Animated.View style={[
                        styles.progressBar,
                        {
                          width: `${contextSummary.completionPercentage}%`,
                          backgroundColor: '#FF6B35',
                          opacity: pulseAnim.interpolate({
                            inputRange: [0.4, 1],
                            outputRange: [0.8, 1],
                          }),
                        }
                      ]} />
                    </View>
                    <Text style={styles.progressText}>
                      {contextSummary.completionPercentage}% Complete
                    </Text>
                  </View>
                )}

                {/* Biometrics Section */}
                {Object.keys(biometricData).length > 0 && (
                  <View style={styles.biometricsSection}>
                    <Text style={styles.sectionTitle}>Health Data</Text>
                    <View style={styles.biometricsList}>
                      {Object.entries(biometricData).map(([key, value]) => {
                        if (key === 'lastUpdated' || key === 'source') return null;
                        
                        const icons = {
                          height: 'resize',
                          weight: 'fitness',
                          age: 'time',
                          fitnessLevel: 'trophy',
                          bodyFat: 'analytics',
                        };
                        
                        return (
                          <View key={key} style={styles.biometricItem}>
                            <View style={styles.biometricIcon}>
                              <Ionicons 
                                name={icons[key] || 'information-circle'} 
                                size={18} 
                                color="#FFFFFF" 
                              />
                            </View>
                            <View style={styles.biometricContent}>
                              <Text style={styles.biometricLabel}>
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                              </Text>
                              <Text style={styles.biometricValue}>{value}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.actionsSection}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleNavigation('Search')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="search" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Add Exercises</Text>
                      <Text style={styles.actionDescription}>Browse 800+ exercises to find your favorites</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.theme.textTertiary} style={styles.chevronIcon} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleNavigation('Profile')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="person" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Update Profile</Text>
                      <Text style={styles.actionDescription}>Set your fitness level, goals, and preferences</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.theme.textTertiary} style={styles.chevronIcon} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleNavigation('Generator')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="sparkles" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Generate Workout</Text>
                      <Text style={styles.actionDescription}>Create AI-powered personalized workouts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.theme.textTertiary} style={styles.chevronIcon} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </GlassContainer>
      </Animated.View>
    </Modal>
  );
}

// Default props
ContextStatusModal.defaultProps = {
  visible: false,
  onClose: () => {},
  onNavigate: () => {},
  title: "Context Status",
  subtitle: "Your current session context",
};