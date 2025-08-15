import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useColorScheme, Animated, Easing, AccessibilityInfo, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, animations, theme as designTheme } from '../utils/designTokens';

const ThemeContext = createContext();

/**
 * Enhanced Theme System with Glassmorphism Support
 * Provides comprehensive light/dark mode theming with smooth transitions
 * and accessibility features.
 */

// Theme configuration with glassmorphism enhancements
export const themes = {
  light: {
    // Core brand colors
    primary: colors.primary.DEFAULT,
    primaryLight: colors.primary.light,
    primaryDark: colors.primary.dark,
    primaryGlass: colors.primary.glass,
    primaryGlow: colors.primary.glow,
    
    // Background system from design tokens
    background: colors.light.background.primary,
    backgroundSecondary: colors.light.background.secondary,
    backgroundTertiary: colors.light.background.tertiary,
    backgroundElevated: colors.light.background.elevated,
    
    // Glass background variants
    backgroundGlass: {
      subtle: colors.light.background.glass.subtle,
      medium: colors.light.background.glass.medium,
      strong: colors.light.background.glass.strong,
      modal: colors.light.background.glass.modal,
    },
    
    // Background gradients
    backgroundGradient: {
      primary: colors.light.background.gradient.primary,
      glass: colors.light.background.gradient.glass,
      energy: colors.light.background.gradient.energy,
    },
    
    // Text system
    text: colors.light.text.primary,
    textSecondary: colors.light.text.secondary,
    textTertiary: colors.light.text.tertiary,
    textDisabled: colors.light.text.disabled,
    textInverse: colors.light.text.inverse,
    textOnGlass: colors.light.text.onGlass,
    textAccent: colors.light.text.accent,
    
    // Border system
    border: colors.light.border.medium,
    borderLight: colors.light.border.light,
    borderStrong: colors.light.border.strong,
    borderFocus: colors.light.border.focus,
    borderGlass: colors.light.border.glass,
    
    // Semantic colors
    success: colors.semantic.success.light.primary,
    successBackground: colors.semantic.success.light.background,
    successBorder: colors.semantic.success.light.border,
    
    error: colors.semantic.error.light.primary,
    errorBackground: colors.semantic.error.light.background,
    errorBorder: colors.semantic.error.light.border,
    
    warning: colors.semantic.warning.light.primary,
    warningBackground: colors.semantic.warning.light.background,
    warningBorder: colors.semantic.warning.light.border,
    
    info: colors.semantic.info.light.primary,
    infoBackground: colors.semantic.info.light.background,
    infoBorder: colors.semantic.info.light.border,
    
    // Shadow configuration
    shadowColor: colors.light.shadow.color,
    shadowConfig: colors.light.shadow,
    
    // Glass effects
    glassEffects: colors.glass.surface.light,
    
    // Legacy compatibility
    surface: colors.light.background.secondary,
    card: colors.light.background.elevated,
    elevated: colors.light.background.elevated,
    accent: colors.primary.DEFAULT,
  },
  
  dark: {
    // Core brand colors (adjusted for dark mode)
    primary: colors.primary.DEFAULT,
    primaryLight: '#FFB86B', // Softer for dark backgrounds
    primaryDark: colors.primary.dark,
    primaryGlass: colors.primary.glass,
    primaryGlow: colors.primary.glow,
    
    // Background system from design tokens
    background: colors.dark.background.primary,
    backgroundSecondary: colors.dark.background.secondary,
    backgroundTertiary: colors.dark.background.tertiary,
    backgroundElevated: colors.dark.background.elevated,
    
    // Glass background variants
    backgroundGlass: {
      subtle: colors.dark.background.glass.subtle,
      medium: colors.dark.background.glass.medium,
      strong: colors.dark.background.glass.strong,
      modal: colors.dark.background.glass.modal,
    },
    
    // Background gradients
    backgroundGradient: {
      primary: colors.dark.background.gradient.primary,
      glass: colors.dark.background.gradient.glass,
      energy: colors.dark.background.gradient.energy,
      app: colors.dark.background.gradient.app, // For main app background
    },
    
    // Text system
    text: colors.dark.text.primary,
    textSecondary: colors.dark.text.secondary,
    textTertiary: colors.dark.text.tertiary,
    textDisabled: colors.dark.text.disabled,
    textInverse: colors.dark.text.inverse,
    textOnGlass: colors.dark.text.onGlass,
    textAccent: colors.dark.text.accent,
    
    // Border system
    border: colors.dark.border.medium,
    borderLight: colors.dark.border.light,
    borderStrong: colors.dark.border.strong,
    borderFocus: colors.dark.border.focus,
    borderGlass: colors.dark.border.glass,
    
    // Semantic colors
    success: colors.semantic.success.dark.primary,
    successBackground: colors.semantic.success.dark.background,
    successBorder: colors.semantic.success.dark.border,
    
    error: colors.semantic.error.dark.primary,
    errorBackground: colors.semantic.error.dark.background,
    errorBorder: colors.semantic.error.dark.border,
    
    warning: colors.semantic.warning.dark.primary,
    warningBackground: colors.semantic.warning.dark.background,
    warningBorder: colors.semantic.warning.dark.border,
    
    info: colors.semantic.info.dark.primary,
    infoBackground: colors.semantic.info.dark.background,
    infoBorder: colors.semantic.info.dark.border,
    
    // Shadow configuration
    shadowColor: colors.dark.shadow.color,
    shadowConfig: colors.dark.shadow,
    
    // Glass effects
    glassEffects: colors.glass.surface.dark,
    
    // Legacy compatibility
    surface: colors.dark.background.secondary,
    card: colors.dark.background.tertiary,
    elevated: colors.dark.background.elevated,
    accent: '#FFB86B', // Softer accent for dark mode
  }
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const transitionProgress = useRef(new Animated.Value(1)).current;
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    loadThemePreference();
    checkReducedMotionPreference();
    
    // Listen for app state changes to sync system theme
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      appStateSubscription?.remove();
    };
  }, []);
  
  // Re-check system theme when app comes to foreground
  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, refresh system theme
      if (themeMode === 'system') {
        // This will trigger a re-render with updated system theme
        setThemeMode('system');
      }
    }
    appStateRef.current = nextAppState;
  };
  
  // Check for reduced motion preference
  const checkReducedMotionPreference = async () => {
    try {
      // Only check on native platforms, not web
      if (Platform.OS !== 'web' && AccessibilityInfo.isReducedMotionEnabled) {
        const isReducedMotionEnabled = await AccessibilityInfo.isReducedMotionEnabled();
        setReducedMotion(isReducedMotionEnabled);
      } else {
        setReducedMotion(false);
      }
    } catch (error) {
      console.warn('Could not check reduced motion preference:', error);
      setReducedMotion(false);
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const changeTheme = async (mode, animated = true) => {
    if (mode === themeMode) return; // No change needed
    
    // Save preference immediately
    await saveThemePreference(mode);
    
    // Handle theme transition with animation
    if (animated && !reducedMotion) {
      setIsTransitioning(true);
      
      // Fade out
      Animated.timing(transitionProgress, {
        toValue: 0,
        duration: animations.theme.switch.duration / 2,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // Change theme at the midpoint
        setThemeMode(mode);
        
        // Fade in
        Animated.timing(transitionProgress, {
          toValue: 1,
          duration: animations.theme.switch.duration / 2,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setIsTransitioning(false);
        });
      });
    } else {
      // Immediate change (reduced motion or no animation requested)
      setThemeMode(mode);
    }
    
    // Haptic feedback on theme change (if available)
    try {
      const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
      await impactAsync(ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue silently
    }
  };

  const getActiveTheme = () => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? themes.dark : themes.light;
    }
    return themes[themeMode];
  };

  const isDarkMode = () => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  };

  // Enhanced theme utilities
  const getGlassStyle = (intensity = 'medium', customProps = {}) => {
    const activeTheme = getActiveTheme();
    const glassConfig = activeTheme.glassEffects[intensity];
    
    return {
      ...glassConfig,
      ...customProps,
      // Ensure proper layering
      overflow: 'hidden',
    };
  };
  
  const getComponentStyle = (component, variant = 'default') => {
    const currentTheme = isDarkMode() ? 'dark' : 'light';
    return designTheme.getComponentStyle(component, variant, currentTheme);
  };
  
  const getShadowStyle = (size = 'md') => {
    const currentTheme = isDarkMode() ? 'dark' : 'light';
    return designTheme.getShadow(size, currentTheme);
  };
  
  // New gradient utility functions
  const getAppBackgroundGradient = (variant = 'energy') => {
    const currentTheme = isDarkMode() ? 'dark' : 'light';
    return designTheme.getAppBackgroundGradient(currentTheme, variant);
  };
  
  const getGradient = (type = 'background', variant = 'primary') => {
    const currentTheme = isDarkMode() ? 'dark' : 'light';
    return designTheme.getGradient(type, variant, currentTheme);
  };
  
  const value = {
    // Core theme data
    theme: getActiveTheme(),
    themeMode,
    isDarkMode: isDarkMode(),
    isLoading,
    
    // Theme management
    changeTheme,
    
    // Animation state
    isTransitioning,
    transitionProgress,
    reducedMotion,
    
    // Utility functions
    getGlassStyle,
    getComponentStyle,
    getShadowStyle,
    getAppBackgroundGradient,
    getGradient,
    
    // Design tokens access
    colors: isDarkMode() ? colors.dark : colors.light,
    glass: colors.glass,
    spacing: designTheme.spacing || {},
    typography: designTheme.typography || {},
    animations: reducedMotion ? animations.reducedMotion : animations,
    
    // Accessibility
    accessibility: {
      reducedMotion,
      checkReducedMotion: checkReducedMotionPreference,
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View 
        style={[
          { flex: 1 },
          { opacity: transitionProgress }
        ]}
        pointerEvents={isTransitioning ? 'none' : 'auto'}
      >
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Enhanced helper functions with glassmorphism support

/**
 * Create theme-aware styles with full design token support
 * @param {Function|Object} styles - Style function or object
 * @param {Object} options - Additional options
 * @returns {Object} Resolved styles
 */
export const themedStyles = (styles, options = {}) => {
  const context = useTheme();
  const { theme, isDarkMode, colors, glass, spacing, typography, animations } = context;
  
  const styleContext = {
    theme,
    isDarkMode,
    colors,
    glass,
    spacing,
    typography,
    animations,
    ...options,
  };
  
  return typeof styles === 'function' ? styles(styleContext) : styles;
};

/**
 * Create a glass morphism effect with theme awareness
 * @param {string} intensity - 'subtle', 'medium', 'strong', 'modal'
 * @param {Object} customProps - Custom style overrides
 * @returns {Object} Glass effect styles
 */
export const createGlassEffect = (intensity = 'medium', customProps = {}) => {
  const { getGlassStyle } = useTheme();
  return getGlassStyle(intensity, customProps);
};

/**
 * Get component styles with theme awareness
 * @param {string} component - Component name (button, card, input, etc.)
 * @param {string} variant - Variant name (default, primary, glass, etc.)
 * @returns {Object} Component styles
 */
export const useComponentStyle = (component, variant = 'default') => {
  const { getComponentStyle } = useTheme();
  return getComponentStyle(component, variant);
};

/**
 * Get shadow styles with theme awareness
 * @param {string} size - Shadow size (xs, sm, md, lg, xl)
 * @returns {Object} Shadow styles
 */
export const useShadowStyle = (size = 'md') => {
  const { getShadowStyle } = useTheme();
  return getShadowStyle(size);
};

/**
 * Create animated theme transition wrapper
 * @param {React.Component} Component - Component to wrap
 * @param {Object} animationConfig - Animation configuration
 * @returns {React.Component} Wrapped component with theme transitions
 */
export const withThemeTransition = (Component, animationConfig = {}) => {
  return React.forwardRef((props, ref) => {
    const { isTransitioning, transitionProgress, reducedMotion } = useTheme();
    
    const defaultConfig = {
      duration: animations.theme.switch.duration,
      useNativeDriver: true,
      ...animationConfig,
    };
    
    if (reducedMotion) {
      return <Component {...props} ref={ref} />;
    }
    
    return (
      <Animated.View
        style={[
          { opacity: transitionProgress },
          props.style,
        ]}
        pointerEvents={isTransitioning ? 'none' : 'auto'}
      >
        <Component {...props} ref={ref} />
      </Animated.View>
    );
  });
};