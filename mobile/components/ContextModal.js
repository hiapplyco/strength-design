import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, themedStyles } from '../contexts/ThemeContext';
import { GlassContainer } from './GlassmorphismComponents';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * ContextModal Component
 * 
 * A beautiful modal that shows when users click "Generator" without having provided context.
 * Explains the benefits of providing context and guides users to relevant screens.
 * 
 * Features:
 * - Production-ready error handling
 * - Glassmorphism design with theme awareness
 * - Accessibility support
 * - Smooth animations
 * - Clear call-to-action buttons
 */
export default function ContextModal({ 
  visible, 
  onClose, 
  onNavigate,
  title = "Enhance Your Workout Experience",
  subtitle = "Tell us about yourself to get personalized workouts"
}) {
  const theme = useTheme();
  
  // Production error handling
  const handleNavigation = (screen) => {
    try {
      onClose();
      if (onNavigate && typeof onNavigate === 'function') {
        onNavigate(screen);
      }
    } catch (error) {
      console.error('Navigation error in ContextModal:', error);
      // Fallback - just close modal if navigation fails
      onClose();
    }
  };

  const handleClose = () => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing ContextModal:', error);
    }
  };

  // Theme-aware styles
  const styles = themedStyles(({ theme, isDarkMode, spacing, typography, glass }) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing?.md || 20,
    },
    modalContainer: {
      width: Math.min(screenWidth - 40, 400),
      maxHeight: screenHeight * 0.8,
      borderRadius: 24,
      overflow: 'hidden',
    },
    scrollContainer: {
      maxHeight: screenHeight * 0.7,
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDarkMode 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      // Beautiful tinted glassmorphism - emerald green glass
      backgroundColor: isDarkMode 
        ? 'rgba(16, 185, 129, 0.25)'  // Emerald green with 25% opacity for dark mode
        : 'rgba(76, 175, 80, 0.35)',   // Softer green with 35% opacity for light mode
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(52, 211, 153, 0.3)'   // Lighter green border for dark mode
        : 'rgba(134, 239, 172, 0.4)', // Soft green border for light mode
      // Glass effect with colored shadow
      shadowColor: isDarkMode ? '#10B981' : '#4CAF50',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 8,
      // Add glass blur effect
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing?.md || 16,
    },
    title: {
      fontSize: typography?.fontSize?.xl || 24,
      fontWeight: typography?.fontWeight?.bold || '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing?.sm || 8,
      lineHeight: 30,
    },
    subtitle: {
      fontSize: typography?.fontSize?.md || 16,
      fontWeight: typography?.fontWeight?.medium || '500',
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    benefitsContainer: {
      marginBottom: spacing?.xl || 32,
    },
    sectionTitle: {
      fontSize: typography?.fontSize?.lg || 18,
      fontWeight: typography?.fontWeight?.semibold || '600',
      color: theme.text,
      marginBottom: spacing?.md || 16,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing?.md || 16,
      paddingLeft: spacing?.xs || 4,
    },
    benefitIcon: {
      marginRight: spacing?.sm || 12,
      marginTop: 2,
    },
    benefitText: {
      flex: 1,
      fontSize: typography?.fontSize?.sm || 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    actionsContainer: {
      gap: spacing?.sm || 12,
    },
    actionButton: {
      borderRadius: 16,
      padding: spacing?.md || 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
    },
    primaryButton: {
      // Emerald green tinted glass
      backgroundColor: isDarkMode 
        ? 'rgba(16, 185, 129, 0.85)'  // Emerald with high opacity for dark mode
        : 'rgba(76, 175, 80, 0.90)',   // Green with high opacity for light mode
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(52, 211, 153, 0.4)'   // Lighter green border
        : 'rgba(134, 239, 172, 0.5)', // Soft green border
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    secondaryButton: {
      // Blue tinted glass
      backgroundColor: isDarkMode 
        ? 'rgba(33, 150, 243, 0.25)'  // Blue with lower opacity
        : 'rgba(33, 150, 243, 0.20)', // Light blue tint
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(100, 181, 246, 0.4)'
        : 'rgba(144, 202, 249, 0.5)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
    skipButton: {
      // Subtle grey tinted glass
      backgroundColor: isDarkMode 
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    },
    buttonText: {
      fontSize: typography?.fontSize?.md || 16,
      fontWeight: typography?.fontWeight?.semibold || '600',
      textAlign: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
    },
    secondaryButtonText: {
      color: theme.text,
    },
    skipButtonText: {
      color: theme.textTertiary,
    },
    buttonDescription: {
      fontSize: typography?.fontSize?.xs || 12,
      color: theme.textTertiary,
      textAlign: 'center',
      marginTop: 4,
    },
  }));

  const benefits = [
    {
      icon: 'fitness',
      text: 'Get workouts tailored to your fitness level and goals',
      color: '#4CAF50',  // Green tinted glass
    },
    {
      icon: 'time',
      text: 'Save time with exercises that fit your schedule',
      color: '#2196F3',  // Blue tinted glass
    },
    {
      icon: 'heart',
      text: 'Focus on muscle groups and movements you enjoy',
      color: '#E91E63',  // Pink tinted glass
    },
    {
      icon: 'trending-up',
      text: 'Track progress with personalized recommendations',
      color: '#FF9800',  // Amber tinted glass
    },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
      accessibilityLabel="Context Setup Modal"
      accessible
    >
      <View style={styles.modalOverlay}>
        <GlassContainer 
          variant="modal" 
          style={styles.modalContainer}
          accessible
          accessibilityRole="dialog"
          accessibilityLabel={title}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close modal"
            accessibilityRole="button"
          >
            <Ionicons 
              name="close" 
              size={18} 
              color={theme.theme.textSecondary} 
            />
          </TouchableOpacity>

          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="sparkles" 
                  size={36} 
                  color={theme.isDarkMode ? '#A7F3D0' : '#FFFFFF'}  // Light color on tinted glass
                />
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.sectionTitle}>Why provide context?</Text>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, {
                    // Add tinted glass background to each icon
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: benefit.color 
                      ? `${benefit.color}20`  // 12.5% opacity of the benefit color
                      : 'rgba(76, 175, 80, 0.15)',  // Default green tint
                    justifyContent: 'center',
                    alignItems: 'center',
                  }]}>
                    <Ionicons 
                      name={benefit.icon} 
                      size={20} 
                      color={benefit.color || '#4CAF50'} 
                    />
                  </View>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {/* Primary Action - Set Up Profile */}
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleNavigation('Profile')}
                activeOpacity={0.8}
                accessibilityLabel="Set up profile to get personalized workouts"
                accessibilityRole="button"
                accessibilityHint="Navigate to profile screen to add your fitness information"
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Set Up Profile
                </Text>
                <Text style={[styles.buttonDescription, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                  Add your fitness level and goals
                </Text>
              </TouchableOpacity>

              {/* Secondary Action - Explore Exercises */}
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleNavigation('Search')}
                activeOpacity={0.8}
                accessibilityLabel="Explore exercises to discover preferences"
                accessibilityRole="button"
                accessibilityHint="Navigate to search screen to explore available exercises"
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Explore Exercises
                </Text>
                <Text style={styles.buttonDescription}>
                  Discover what you like
                </Text>
              </TouchableOpacity>

              {/* Skip Action */}
              <TouchableOpacity
                style={[styles.actionButton, styles.skipButton]}
                onPress={() => handleNavigation('Generator')}
                activeOpacity={0.8}
                accessibilityLabel="Skip setup and continue to workout generator"
                accessibilityRole="button"
                accessibilityHint="Skip profile setup and go directly to workout generation"
              >
                <Text style={[styles.buttonText, styles.skipButtonText]}>
                  Skip for Now
                </Text>
                <Text style={styles.buttonDescription}>
                  Generate generic workouts
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </GlassContainer>
      </View>
    </Modal>
  );
}

// Production-ready PropTypes for development validation
ContextModal.defaultProps = {
  visible: false,
  onClose: () => {},
  onNavigate: () => {},
  title: "Enhance Your Workout Experience",
  subtitle: "Tell us about yourself to get personalized workouts",
};