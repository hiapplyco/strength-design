/**
 * Shared Design Tokens for Strength.Design
 * Consistent design system across web and mobile platforms
 * Aligned with web's src/lib/design-tokens.ts
 */

import { Platform } from 'react-native';

export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#F97316', // Energetic orange (matches web)
    light: '#FFB86B',   // Light orange for accents
    dark: '#EA580C',    // Darker orange for emphasis
    50: '#FFF4E6',
    100: '#FFE4CC',
    200: '#FFC899',
    300: '#FFA366',
    400: '#FF7D33',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  
  // Dark Theme Colors (2025 Premium Design)
  background: {
    primary: '#0A0B0D',    // Main background
    secondary: '#1A1B1E',  // Card/surface background
    tertiary: '#252629',   // Elevated surfaces
    overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlays
  },
  
  // Text Colors
  text: {
    primary: '#F8F9FA',    // Primary text
    secondary: '#9CA3AF',  // Secondary/muted text
    tertiary: '#6B7280',   // Disabled/hint text
    inverse: '#0A0B0D',    // Text on light backgrounds
  },
  
  // Semantic Colors
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
    dark: '#059669',
  },
  
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
  },
  
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },
  
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
    dark: '#2563EB',
  },
  
  // Gradient Colors (for special effects)
  gradients: {
    primary: ['#FFB86B', '#FF7E87'],     // Warm gradient
    success: ['#10B981', '#059669'],      // Green gradient
    premium: ['#DAA520', '#FFD700'],      // Gold gradient
    multicolor: ['#4CAF50', '#9C27B0', '#FF1493'], // Signature gradient
  },
  
  // Border Colors
  border: {
    DEFAULT: 'rgba(255, 255, 255, 0.1)',
    light: 'rgba(255, 255, 255, 0.2)',
    dark: 'rgba(0, 0, 0, 0.2)',
  },
};

export const typography = {
  // Font families
  fontFamily: {
    default: 'System',
    mono: 'Courier',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

export const spacing = {
  // Base spacing scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  
  // Component spacing
  component: {
    padding: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32,
    },
    margin: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
  
  // Layout spacing
  layout: {
    containerPadding: 16,
    sectionGap: 24,
    elementGap: 16,
  },
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  none: null,
  sm: Platform.select({
    web: {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
  xl: Platform.select({
    web: {
      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
    },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 16,
    },
  }),
  glow: Platform.select({
    web: {
      boxShadow: `0px 0px 12px ${colors.primary.light}30`,
    },
    ios: {
      shadowColor: colors.primary.light,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 0,
    },
  }),
};

export const animations = {
  // Animation durations
  duration: {
    instant: 0,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  
  // Easing functions (for Animated.timing)
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Spring animations (for Animated.spring)
  spring: {
    default: {
      tension: 50,
      friction: 8,
    },
    bouncy: {
      tension: 100,
      friction: 5,
    },
    stiff: {
      tension: 200,
      friction: 20,
    },
  },
};

// Component-specific styles
export const components = {
  button: {
    primary: {
      backgroundColor: colors.primary.DEFAULT,
      color: colors.text.inverse,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: colors.primary.DEFAULT,
      borderWidth: 1,
      color: colors.primary.DEFAULT,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
  },
  
  card: {
    default: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.md,
    },
    elevated: {
      backgroundColor: colors.background.tertiary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.lg,
    },
    ghost: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.DEFAULT,
    },
  },
  
  input: {
    default: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.DEFAULT,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      color: colors.text.primary,
      fontSize: typography.fontSize.base,
    },
    focused: {
      borderColor: colors.primary.DEFAULT,
    },
    error: {
      borderColor: colors.error.DEFAULT,
    },
  },
};

// Utility function to get gradient colors array
export const getGradientColors = (gradientName) => {
  return colors.gradients[gradientName] || colors.gradients.primary;
};

// Utility function to create consistent styles
export const createStyles = (theme = 'dark') => {
  const isDark = theme === 'dark';
  
  return {
    container: {
      flex: 1,
      backgroundColor: isDark ? colors.background.primary : '#FFFFFF',
    },
    text: {
      color: isDark ? colors.text.primary : colors.text.inverse,
      fontSize: typography.fontSize.base,
      lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    },
    heading: {
      color: isDark ? colors.text.primary : colors.text.inverse,
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.md,
    },
    card: components.card.default,
    button: components.button.primary,
    input: components.input.default,
  };
};

// Export as default for easy importing
export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components,
  getGradientColors,
  createStyles,
};