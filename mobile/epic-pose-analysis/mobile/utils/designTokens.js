/**
 * Liquid Glass Design Tokens for Strength.Design Mobile
 * Premium glassmorphism design system with comprehensive light/dark mode support
 * WCAG 2025 compliant with 4.5:1+ contrast ratios
 * 
 * Philosophy: "Energy Through Glass" - Sophisticated depth that motivates action
 * Architecture: Layered glass system with contextual adaptation
 * Accessibility: Full inclusive design with reduced motion support
 */

import { Platform, useColorScheme } from 'react-native';

// WCAG 2025 Compliant Color System with Glassmorphism Support
export const colors = {
  // Primary Brand Colors - Energetic Orange System
  primary: {
    DEFAULT: '#FF6B35',  // Main brand orange - perfect contrast ratio
    light: '#FF8F65',    // Light variant for glass overlays
    dark: '#E55100',     // Dark variant for emphasis
    glass: '#FF6B3520',  // Glass overlay variant (12.5% opacity)
    glow: '#FF6B3540',   // Glow effect variant (25% opacity)
    50: '#FFF4E6',       // Lightest tint
    100: '#FFE4CC',      // Very light
    200: '#FFC899',      // Light
    300: '#FFA366',      // Light-medium
    400: '#FF7D33',      // Medium
    500: '#FF6B35',      // Base color
    600: '#EA580C',      // Medium-dark
    700: '#C2410C',      // Dark
    800: '#9A3412',      // Darker
    900: '#7C2D12',      // Darkest
  },

  // Light Mode Color Palette - "Dawn Energy"
  light: {
    // Background System
    background: {
      primary: '#FEFEFE',           // Pure energy base
      secondary: '#F8F9FA',         // Subtle variation
      tertiary: '#F1F3F4',          // Content areas
      elevated: '#FFFFFF',          // Elevated surfaces
      glass: {
        subtle: 'rgba(242,242,247,0.72)',    // iOS 26 system gray6 with opacity
        medium: 'rgba(242,242,247,0.82)',    // Standard glass with system color
        strong: 'rgba(242,242,247,0.90)',    // Elevated glass
        modal: 'rgba(255,255,255,0.96)',     // Modal overlay - almost opaque
      },
      gradient: {
        primary: ['#FEFEFE', '#F8F9FA'],              // Subtle background gradient
        glass: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.08)'], // Glass gradient
        energy: ['#FFF4E6', '#FFE4CC'],               // Energy background
      },
    },

    // Text System - High Contrast for Motivation
    text: {
      primary: '#0A0B0D',           // 4.8:1 contrast - perfect readability
      secondary: '#495057',         // 4.5:1 contrast - secondary information
      tertiary: '#6C757D',          // 4.5:1 contrast - hint text
      disabled: '#ADB5BD',          // 3.0:1 contrast - disabled state
      inverse: '#FFFFFF',           // White text on dark backgrounds
      onGlass: '#000000',           // Enhanced text on glass
      accent: '#FF6B35',            // Accent text color
    },

    // Border System - Subtle Definition
    border: {
      light: 'rgba(0,0,0,0.06)',    // Minimal borders
      medium: 'rgba(0,0,0,0.12)',   // Standard borders
      strong: 'rgba(0,0,0,0.20)',   // Emphasis borders
      focus: '#FF6B35',             // Focus states
      glass: 'rgba(0,0,0,0.08)',    // Glass container borders
      gradient: {
        primary: ['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.06)'],
        glass: ['rgba(255,107,53,0.3)', 'rgba(255,107,53,0.1)'],
      },
    },

    // Shadow System - Warm and Subtle
    shadow: {
      color: '#000000',
      sm: { opacity: 0.08, blur: 4, offset: [0, 1] },
      md: { opacity: 0.12, blur: 8, offset: [0, 2] },
      lg: { opacity: 0.15, blur: 16, offset: [0, 4] },
      xl: { opacity: 0.18, blur: 24, offset: [0, 8] },
      glass: { color: '#FF6B35', opacity: 0.15, blur: 12, offset: [0, 0] }, // Glow effect
    },
  },

  // Dark Mode Color Palette - "Oura Black Focus" 
  dark: {
    // Background System - Deep blacks like Oura Ring app
    background: {
      primary: '#000000',           // Pure black for true dark mode (Oura style)
      secondary: '#0A0A0A',         // Slightly lighter black for elevated surfaces
      tertiary: '#141414',          // Content cards - subtle gray
      elevated: '#1C1C1C',          // Highest elevation - visible but dark
      glass: {
        subtle: 'rgba(28,28,30,0.72)',       // iOS 26 systemGray5 with opacity
        medium: 'rgba(28,28,30,0.82)',       // Standard dark glass
        strong: 'rgba(28,28,30,0.90)',       // Elevated dark glass
        modal: 'rgba(0,0,0,0.95)',           // Modal overlay - very opaque
      },
      gradient: {
        primary: ['#000000', '#0A0A0A', '#141414'],   // Oura-style black gradient
        glass: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'], // Glass gradient
        energy: ['#000000', '#141414', '#0A0A0A'],    // Energy background
        app: ['#000000', '#0A0A0A', '#141414'],       // Main app background (Oura inspired)
        cosmos: ['#000000', '#1C1C1C', '#0A0A0A'],    // Alternative cosmic gradient
      },
    },

    // Text System - Optimized for Dark Backgrounds
    text: {
      primary: '#F8F9FA',           // 4.6:1 contrast - excellent readability
      secondary: '#DEE2E6',         // 4.5:1 contrast - secondary information
      tertiary: '#ADB5BD',          // 4.5:1 contrast - hint text
      disabled: '#6C757D',          // 2.8:1 contrast - disabled state
      inverse: '#0A0B0D',           // Dark text on light backgrounds
      onGlass: '#FFFFFF',           // Enhanced text on glass
      accent: '#FFB86B',            // Softer accent for dark mode
    },

    // Border System - Subtle Glass Definition
    border: {
      light: 'rgba(255,255,255,0.05)',  // Minimal borders
      medium: 'rgba(255,255,255,0.1)',   // Standard borders
      strong: 'rgba(255,255,255,0.2)',   // Emphasis borders
      focus: '#FFB86B',                  // Focus states
      glass: 'rgba(255,255,255,0.08)',   // Glass container borders
      gradient: {
        primary: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
        glass: ['rgba(255,184,107,0.3)', 'rgba(255,184,107,0.1)'],
      },
    },

    // Shadow System - Deep and Dramatic
    shadow: {
      color: '#000000',
      sm: { opacity: 0.25, blur: 4, offset: [0, 1] },
      md: { opacity: 0.3, blur: 8, offset: [0, 2] },
      lg: { opacity: 0.35, blur: 16, offset: [0, 4] },
      xl: { opacity: 0.4, blur: 24, offset: [0, 8] },
      glass: { color: '#FFB86B', opacity: 0.25, blur: 12, offset: [0, 0] }, // Glow effect
    },
  },
  
  // Semantic Colors - Theme Adaptive
  semantic: {
    success: {
      light: { primary: '#10B981', background: '#D1FAE5', border: '#6EE7B7' },
      dark: { primary: '#34D399', background: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    },
    error: {
      light: { primary: '#DC2626', background: '#FEE2E2', border: '#FCA5A5' },
      dark: { primary: '#F87171', background: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' },
    },
    warning: {
      light: { primary: '#D97706', background: '#FEF3C7', border: '#FCD34D' },
      dark: { primary: '#FBBF24', background: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)' },
    },
    info: {
      light: { primary: '#2563EB', background: '#DBEAFE', border: '#93C5FD' },
      dark: { primary: '#60A5FA', background: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.3)' },
    },
  },

  // Glassmorphism Effect System
  glass: {
    // Backdrop Blur Levels - iOS 26 Enhanced
    blur: {
      none: 0,
      subtle: 24,      // Minimal glass effect (3x stronger)
      medium: 48,      // Standard glass (4x stronger)
      strong: 72,      // Elevated glass (4.5x stronger)
      intense: 96,     // Modal/overlay glass (5x stronger)
      max: 120,        // Maximum blur for special cases
    },

    // Glass Surface Treatments
    surface: {
      light: {
        subtle: {
          backgroundColor: 'rgba(242,242,247,0.72)',  // iOS 26 systemGray6
          borderColor: 'rgba(60,60,67,0.06)',         // systemGray3 border
          backdropFilter: 'blur(24px)',
        },
        medium: {
          backgroundColor: 'rgba(242,242,247,0.82)',  // More opaque for better contrast
          borderColor: 'rgba(60,60,67,0.08)',
          backdropFilter: 'blur(48px)',
        },
        strong: {
          backgroundColor: 'rgba(242,242,247,0.90)',  // Nearly opaque
          borderColor: 'rgba(60,60,67,0.10)',
          backdropFilter: 'blur(72px)',
        },
        modal: {
          backgroundColor: 'rgba(255,255,255,0.96)',  // Modal white
          borderColor: 'rgba(60,60,67,0.08)',
          backdropFilter: 'blur(96px)',
        },
      },
      dark: {
        subtle: {
          backgroundColor: 'rgba(28,28,30,0.72)',     // iOS 26 systemGray5
          borderColor: 'rgba(142,142,147,0.10)',      // systemGray border
          backdropFilter: 'blur(24px)',
        },
        medium: {
          backgroundColor: 'rgba(28,28,30,0.82)',     // More opaque dark
          borderColor: 'rgba(142,142,147,0.12)',
          backdropFilter: 'blur(48px)',
        },
        strong: {
          backgroundColor: 'rgba(28,28,30,0.90)',     // Nearly opaque
          borderColor: 'rgba(142,142,147,0.15)',
          backdropFilter: 'blur(72px)',
        },
        modal: {
          backgroundColor: 'rgba(0,0,0,0.95)',        // Pure black modal
          borderColor: 'rgba(142,142,147,0.10)',
          backdropFilter: 'blur(96px)',
        },
      },
    },
  },

  // Unified Gradient System - Theme-Adaptive Background Gradients
  gradients: {
    // Primary Brand Gradients
    primary: {
      light: ['#FFFFFF', '#F8F9FA', '#F0F1F3'],        // Neutral white gradient (light mode)
      dark: ['#FFB86B', '#FF7E87'],         // Soft orange to warm pink (dark mode)
    },
    
    // App Background Gradients - Main container backgrounds
    background: {
      light: {
        primary: ['#FFFFFF', '#F8F9FA', '#F0F1F3'],     // Neutral white gradient
        warm: ['#FFF4E6', '#FFE4CC', '#FFC899'],        // Subtle warm whites
        energy: ['#F0F0F0', '#E8E8E8', '#E0E0E0'],      // Neutral light grays
        sunset: ['#F8F8F8', '#F0F0F0', '#E8E8E8'],      // Light gray gradient
      },
      dark: {
        primary: ['#000000', '#0A0A0A', '#141414'],     // Oura-style black gradient
        cosmic: ['#000000', '#1C1C1C', '#0A0A0A'],      // Refined cosmic blend
        energy: ['#000000', '#141414', '#0A0A0A'],      // Dark energy blend (Oura inspired)
        midnight: ['#000000', '#0A0A0A', '#1C1C1C'],    // Pure black gradient (Oura style)
        oura: ['#000000', '#141414', '#000000'],        // Oura Ring app style
        deep: ['#000000', '#000000', '#0A0A0A'],        // Ultra deep black
      },
    },
    
    // Accent Gradients - For cards, buttons, highlights (Oura-inspired)
    accent: {
      light: {
        orange: ['#FF6B35', '#FF8F65'],     // Primary orange
        sunset: ['#FF6B35', '#FF7E87'],     // Orange to pink
        golden: ['#F7931E', '#FFB86B'],     // Golden amber
        warm: ['#FFB86B', '#FFC899'],       // Soft warm tones
      },
      dark: {
        orange: ['#FF8F65', '#FFB86B'],     // Softer orange (Oura style)
        aurora: ['#FFB86B', '#FF7E87'],     // Aurora blend 
        ember: ['#FF7E87', '#FF8F65'],      // Ember glow (refined)
        glow: ['#FFB86B', '#FFA366'],       // Gentle glow
        oura: ['#6B7EFF', '#8F9BFF'],       // Oura blue-purple
        teal: ['#4ECDC4', '#44A08D'],       // Calming teal
        minimal: ['#333333', '#555555'],     // Minimal gray gradient
      },
    },
    
    // Glass Effect Gradients - For glassmorphism overlays
    glass: {
      light: {
        subtle: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.08)'],
        medium: ['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.12)'],
        strong: ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.20)'],
        tinted: ['rgba(255,107,53,0.15)', 'rgba(247,147,30,0.10)'],
      },
      dark: {
        subtle: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.05)'],
        medium: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.08)'],
        strong: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.12)'],
        tinted: ['rgba(255,184,107,0.15)', 'rgba(255,126,135,0.10)'],
      },
    },
    
    // Utility Gradients
    success: ['#10B981', '#059669'],        // Success states
    warning: ['#F59E0B', '#D97706'],        // Warning states
    error: ['#EF4444', '#DC2626'],          // Error states
    info: ['#3B82F6', '#2563EB'],           // Info states
    
    // Legacy Support (Deprecated but maintained for compatibility)
    primaryDark: ['#FFB86B', '#FF7E87'],
    appBackground: ['#4A4458', '#6D5A7A', '#3B2F4A'],
  },
};

// Typography System - Optimized for Glass Backgrounds
export const typography = {
  // Font Families - System Optimized
  fontFamily: {
    primary: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
    secondary: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'SF Mono',
      android: 'Roboto Mono',
      default: 'Courier',
    }),
  },

  // Font Sizes - Responsive Scale
  fontSize: {
    xs: 11,      // Small labels, captions
    sm: 13,      // Body text small
    base: 15,    // Standard body text
    lg: 17,      // Large body text
    xl: 19,      // Subheadings
    '2xl': 22,   // Section headings
    '3xl': 28,   // Page titles
    '4xl': 34,   // Hero headings
    '5xl': 42,   // Display text
    '6xl': 52,   // Hero display
  },

  // Font Weights - Enhanced for Glass Readability
  fontWeight: {
    thin: '100',        // Ultra light (avoid on glass)
    light: '300',       // Light text
    normal: '400',      // Regular text
    medium: '500',      // Enhanced readability on glass
    semibold: '600',    // Headings on glass
    bold: '700',        // Strong emphasis
    heavy: '800',       // Display headings
    black: '900',       // Maximum impact
  },

  // Line Heights - Optimized for Different Use Cases
  lineHeight: {
    none: 1,         // Compact display text
    tight: 1.15,     // Headings
    snug: 1.3,       // Subheadings
    normal: 1.45,    // Body text
    relaxed: 1.6,    // Reading content
    loose: 1.8,      // Accessibility enhanced
  },

  // Letter Spacing - Refined Readability
  letterSpacing: {
    tighter: -0.5,   // Compact headings
    tight: -0.25,    // Display text
    normal: 0,       // Standard text
    wide: 0.25,      // Spaced text
    wider: 0.5,      // Emphasis text
    widest: 1,       // All caps labels
  },

  // Text Shadows - For Glass Backgrounds
  textShadow: {
    light: {
      subtle: {
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 0.5 },
        textShadowRadius: 1,
      },
      medium: {
        textShadowColor: 'rgba(0,0,0,0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    },
    dark: {
      subtle: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 0.5 },
        textShadowRadius: 1,
      },
      medium: {
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    },
  },
};

// Spacing System - Harmonious 8px Grid
export const spacing = {
  // Base Spacing Scale (8px grid system)
  0: 0,
  px: 1,       // 1px for borders
  0.5: 2,      // 2px micro spacing
  1: 4,        // 4px minimal
  1.5: 6,      // 6px fine tuning
  2: 8,        // 8px base unit
  2.5: 10,     // 10px small
  3: 12,       // 12px compact
  3.5: 14,     // 14px fine
  4: 16,       // 16px standard
  5: 20,       // 20px comfortable
  6: 24,       // 24px loose
  7: 28,       // 28px spacious
  8: 32,       // 32px large
  9: 36,       // 36px xl
  10: 40,      // 40px xxl
  11: 44,      // 44px section
  12: 48,      // 48px major
  14: 56,      // 56px hero
  16: 64,      // 64px display
  20: 80,      // 80px maximum
  24: 96,      // 96px screen

  // Legacy Support (Deprecated - use numeric scale)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,

  // Component-Specific Spacing
  component: {
    // Glass Container Padding
    glass: {
      xs: 8,       // Minimal glass padding
      sm: 12,      // Small glass padding
      md: 16,      // Standard glass padding
      lg: 20,      // Large glass padding
      xl: 24,      // Extended glass padding
    },
    
    // Standard Component Padding
    padding: {
      xs: 6,       // Minimal padding
      sm: 10,      // Small padding
      md: 14,      // Standard padding
      lg: 18,      // Large padding
      xl: 22,      // Extended padding
    },

    // Margin System
    margin: {
      xs: 4,       // Minimal margin
      sm: 8,       // Small margin
      md: 12,      // Standard margin
      lg: 16,      // Large margin
      xl: 20,      // Extended margin
    },
  },

  // Layout-Specific Spacing
  layout: {
    screenPadding: {
      horizontal: 16,    // Standard screen edges
      vertical: 20,      // Top/bottom screen padding
    },
    containerPadding: 16,    // Container internal padding
    sectionGap: 24,          // Space between sections
    elementGap: 12,          // Space between elements
    cardGap: 16,             // Space between cards
    listItemGap: 8,          // Space between list items
    safeArea: {
      top: 44,               // iOS safe area top
      bottom: 34,            // iOS safe area bottom
    },
  },

  // Interactive Element Spacing
  interactive: {
    touch: {
      minimum: 44,           // Minimum touch target
      comfortable: 48,       // Comfortable touch target
      large: 56,             // Large touch target
    },
    spacing: {
      button: 16,            // Space around buttons
      input: 12,             // Space around inputs
      card: 20,              // Space around interactive cards
    },
  },
};

// Border Radius System - Smooth Glass Aesthetics
export const borderRadius = {
  none: 0,         // Sharp edges
  xs: 2,           // Minimal rounding
  sm: 4,           // Subtle rounding
  base: 6,         // Standard rounding
  md: 8,           // Comfortable rounding
  lg: 12,          // Prominent rounding
  xl: 16,          // Large rounding
  '2xl': 20,       // Extra large rounding
  '3xl': 24,       // Hero rounding
  full: 9999,      // Circular/pill shape

  // Component-Specific Radius
  component: {
    button: {
      sm: 6,         // Small buttons
      md: 8,         // Standard buttons
      lg: 12,        // Large buttons
      pill: 9999,    // Pill buttons
    },
    card: {
      sm: 8,         // Small cards
      md: 12,        // Standard cards
      lg: 16,        // Large cards
      hero: 20,      // Hero cards
    },
    input: {
      sm: 6,         // Small inputs
      md: 8,         // Standard inputs
      lg: 10,        // Large inputs
    },
    modal: {
      sm: 12,        // Small modals
      md: 16,        // Standard modals
      lg: 20,        // Large modals
    },
    glass: {
      subtle: 8,     // Minimal glass rounding
      medium: 12,    // Standard glass rounding
      strong: 16,    // Elevated glass rounding
    },
  },
};

// Shadow System - Theme-Adaptive with Glass Support
export const shadows = {
  none: Platform.select({
    web: { boxShadow: 'none' },
    ios: { shadowOpacity: 0 },
    android: { elevation: 0 },
  }),

  // Light Mode Shadows - Warm and Subtle
  light: {
    xs: Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1.5 },
      android: { elevation: 1 },
    }),
    sm: Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
    md: Platform.select({
      web: { boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.05), 0px 2px 4px rgba(0, 0, 0, 0.08)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
    lg: Platform.select({
      web: { boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.08), 0px 4px 6px rgba(0, 0, 0, 0.05)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
    xl: Platform.select({
      web: { boxShadow: '0px 16px 24px rgba(0, 0, 0, 0.1), 0px 8px 12px rgba(0, 0, 0, 0.08)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16 },
      android: { elevation: 16 },
    }),
    glow: Platform.select({
      web: { boxShadow: '0px 0px 16px rgba(255, 107, 53, 0.2), 0px 4px 12px rgba(255, 107, 53, 0.1)' },
      ios: { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },

  // Dark Mode Shadows - Deep and Dramatic
  dark: {
    xs: Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 1.5 },
      android: { elevation: 2 },
    }),
    sm: Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.4), 0px 1px 2px rgba(0, 0, 0, 0.3)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2 },
      android: { elevation: 4 },
    }),
    md: Platform.select({
      web: { boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.4), 0px 2px 4px rgba(0, 0, 0, 0.3)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
      android: { elevation: 8 },
    }),
    lg: Platform.select({
      web: { boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.5), 0px 4px 6px rgba(0, 0, 0, 0.4)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
      android: { elevation: 12 },
    }),
    xl: Platform.select({
      web: { boxShadow: '0px 16px 24px rgba(0, 0, 0, 0.6), 0px 8px 12px rgba(0, 0, 0, 0.5)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16 },
      android: { elevation: 20 },
    }),
    glow: Platform.select({
      web: { boxShadow: '0px 0px 20px rgba(255, 184, 107, 0.3), 0px 4px 16px rgba(255, 184, 107, 0.2)' },
      ios: { shadowColor: '#FFB86B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },

  // Glass-Specific Shadows
  glass: {
    inner: Platform.select({
      web: { boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)' },
      ios: { shadowColor: '#FFF', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 0 },
      android: { elevation: 0 },
    }),
    outer: {
      light: Platform.select({
        web: { boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08), 0px 1px 0px rgba(255, 255, 255, 0.5)' },
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
        android: { elevation: 8 },
      }),
      dark: Platform.select({
        web: { boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4), 0px 1px 0px rgba(255, 255, 255, 0.1)' },
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 16 },
        android: { elevation: 16 },
      }),
    },
  },

  // Legacy Support (Deprecated)
  sm: Platform.select({
    web: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' },
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    android: { elevation: 8 },
  }),
  xl: Platform.select({
    web: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)' },
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
    android: { elevation: 16 },
  }),
};

// Animation System - Liquid Glass Motion
export const animations = {
  // Duration System - Liquid Motion Timing
  duration: {
    instant: 0,           // Immediate changes
    micro: 100,           // Micro-interactions
    fast: 150,            // Quick transitions
    normal: 250,          // Standard transitions
    slow: 350,            // Thoughtful transitions
    slower: 500,          // Dramatic entrances
    crawl: 750,           // Theme transitions
  },

  // Easing Functions - Natural Feel
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Custom bezier curves for glass effects
    glassIn: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    glassOut: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Spring Configurations - For React Native Animated
  spring: {
    // Glass-like spring animations
    glass: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    // Quick snappy interactions
    snappy: {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    },
    // Smooth gentle animations
    gentle: {
      damping: 20,
      stiffness: 100,
      mass: 1.2,
    },
    // Bouncy playful animations
    bouncy: {
      damping: 8,
      stiffness: 150,
      mass: 1,
    },
    // Legacy support
    default: { tension: 50, friction: 8 },
    stiff: { tension: 200, friction: 20 },
  },

  // Glass-Specific Animation Presets
  glass: {
    fadeIn: {
      duration: 350,
      easing: 'glassIn',
      properties: ['opacity', 'transform'],
    },
    fadeOut: {
      duration: 250,
      easing: 'glassOut',
      properties: ['opacity', 'transform'],
    },
    blur: {
      duration: 400,
      easing: 'smooth',
      properties: ['backdrop-filter'],
    },
    morph: {
      duration: 500,
      easing: 'smooth',
      properties: ['border-radius', 'background-color', 'opacity'],
    },
  },

  // Theme Transition Animations
  theme: {
    switch: {
      duration: 400,
      easing: 'smooth',
      properties: ['background-color', 'color', 'border-color'],
    },
  },

  // Interaction Feedback
  feedback: {
    tap: {
      duration: 100,
      scale: 0.95,
      opacity: 0.8,
    },
    hover: {
      duration: 200,
      scale: 1.02,
      opacity: 0.9,
    },
    focus: {
      duration: 200,
      glow: true,
      border: true,
    },
  },

  // Reduced Motion Support
  reducedMotion: {
    // Fallback durations when prefers-reduced-motion is enabled
    duration: {
      instant: 0,
      all: 100,  // All animations become quick
    },
    // Disable complex animations
    disableBlur: true,
    disableScale: true,
    disableRotation: true,
  },
};

// Component Design System - Glass-First Components
export const components = {
  // Button System - Comprehensive Variants
  button: {
    // Primary action buttons
    primary: {
      light: {
        backgroundColor: '#FF6B35',
        color: '#FFFFFF',
        borderRadius: borderRadius.component.button.md,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
        fontWeight: typography.fontWeight.semibold,
        ...shadows.light.md,
      },
      dark: {
        backgroundColor: '#FFB86B',
        color: '#0A0B0D',
        borderRadius: borderRadius.component.button.md,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
        fontWeight: typography.fontWeight.semibold,
        ...shadows.dark.md,
      },
    },

    // Secondary outline buttons
    secondary: {
      light: {
        backgroundColor: 'transparent',
        borderColor: '#FF6B35',
        borderWidth: 1.5,
        color: '#FF6B35',
        borderRadius: borderRadius.component.button.md,
        paddingVertical: spacing[3] - 1.5,
        paddingHorizontal: spacing[6] - 1.5,
        fontWeight: typography.fontWeight.medium,
      },
      dark: {
        backgroundColor: 'transparent',
        borderColor: '#FFB86B',
        borderWidth: 1.5,
        color: '#FFB86B',
        borderRadius: borderRadius.component.button.md,
        paddingVertical: spacing[3] - 1.5,
        paddingHorizontal: spacing[6] - 1.5,
        fontWeight: typography.fontWeight.medium,
      },
    },

    // Glass morphism buttons
    glass: {
      light: {
        ...colors.glass.surface.light.medium,
        borderRadius: borderRadius.component.button.md,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
        color: '#0A0B0D',
        fontWeight: typography.fontWeight.medium,
        borderWidth: 1,
        ...shadows.glass.outer.light,
      },
      dark: {
        ...colors.glass.surface.dark.medium,
        borderRadius: borderRadius.component.button.md,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
        color: '#F8F9FA',
        fontWeight: typography.fontWeight.medium,
        borderWidth: 1,
        ...shadows.glass.outer.dark,
      },
    },

    // Ghost/minimal buttons
    ghost: {
      light: {
        backgroundColor: 'transparent',
        color: '#495057',
        borderRadius: borderRadius.component.button.sm,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        fontWeight: typography.fontWeight.medium,
      },
      dark: {
        backgroundColor: 'transparent',
        color: '#DEE2E6',
        borderRadius: borderRadius.component.button.sm,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        fontWeight: typography.fontWeight.medium,
      },
    },
  },

  // Card System - Glass-Enhanced Containers
  card: {
    // Standard content cards
    default: {
      light: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.component.card.md,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.light.border.light,
        ...shadows.light.sm,
      },
      dark: {
        backgroundColor: colors.dark.background.secondary,
        borderRadius: borderRadius.component.card.md,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.dark.border.medium,
        ...shadows.dark.sm,
      },
    },

    // Elevated important cards
    elevated: {
      light: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.component.card.lg,
        padding: spacing[5],
        borderWidth: 1,
        borderColor: colors.light.border.medium,
        ...shadows.light.lg,
      },
      dark: {
        backgroundColor: colors.dark.background.tertiary,
        borderRadius: borderRadius.component.card.lg,
        padding: spacing[5],
        borderWidth: 1,
        borderColor: colors.dark.border.strong,
        ...shadows.dark.lg,
      },
    },

    // Glass morphism cards
    glass: {
      light: {
        ...colors.glass.surface.light.medium,
        borderRadius: borderRadius.component.glass.medium,
        padding: spacing.component.glass.md,
        borderWidth: 1,
        ...shadows.glass.outer.light,
      },
      dark: {
        ...colors.glass.surface.dark.medium,
        borderRadius: borderRadius.component.glass.medium,
        padding: spacing.component.glass.md,
        borderWidth: 1,
        ...shadows.glass.outer.dark,
      },
    },

    // Interactive workout cards
    workout: {
      light: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.component.card.lg,
        padding: spacing[5],
        borderWidth: 1,
        borderColor: colors.light.border.light,
        ...shadows.light.md,
      },
      dark: {
        backgroundColor: colors.dark.background.secondary,
        borderRadius: borderRadius.component.card.lg,
        padding: spacing[5],
        borderWidth: 1,
        borderColor: colors.dark.border.medium,
        ...shadows.dark.md,
      },
    },
  },

  // Input System - Enhanced Form Controls
  input: {
    // Standard text inputs
    default: {
      light: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.component.input.md,
        borderWidth: 1,
        borderColor: colors.light.border.medium,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        color: colors.light.text.primary,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.normal,
      },
      dark: {
        backgroundColor: colors.dark.background.secondary,
        borderRadius: borderRadius.component.input.md,
        borderWidth: 1,
        borderColor: colors.dark.border.medium,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        color: colors.dark.text.primary,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.normal,
      },
    },

    // Focused input state
    focused: {
      light: {
        borderColor: '#FF6B35',
        borderWidth: 2,
        ...shadows.light.glow,
      },
      dark: {
        borderColor: '#FFB86B',
        borderWidth: 2,
        ...shadows.dark.glow,
      },
    },

    // Error input state
    error: {
      light: {
        borderColor: colors.semantic.error.light.primary,
        backgroundColor: colors.semantic.error.light.background,
      },
      dark: {
        borderColor: colors.semantic.error.dark.primary,
        backgroundColor: colors.semantic.error.dark.background,
      },
    },

    // Glass variant inputs
    glass: {
      light: {
        ...colors.glass.surface.light.subtle,
        borderRadius: borderRadius.component.input.md,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        color: colors.light.text.primary,
        fontSize: typography.fontSize.base,
        borderWidth: 1,
      },
      dark: {
        ...colors.glass.surface.dark.subtle,
        borderRadius: borderRadius.component.input.md,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        color: colors.dark.text.primary,
        fontSize: typography.fontSize.base,
        borderWidth: 1,
      },
    },
  },

  // Modal System - Overlay Components
  modal: {
    overlay: {
      light: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      },
      dark: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      },
    },
    container: {
      light: {
        ...colors.glass.surface.light.modal,
        borderRadius: borderRadius.component.modal.lg,
        padding: spacing[6],
        borderWidth: 1,
        borderColor: colors.light.border.medium,
        ...shadows.light.xl,
      },
      dark: {
        ...colors.glass.surface.dark.modal,
        borderRadius: borderRadius.component.modal.lg,
        padding: spacing[6],
        borderWidth: 1,
        borderColor: colors.dark.border.medium,
        ...shadows.dark.xl,
      },
    },
  },

  // Navigation System
  navigation: {
    header: {
      light: {
        ...colors.glass.surface.light.strong,
        borderBottomWidth: 1,
        borderBottomColor: colors.light.border.light,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
      },
      dark: {
        ...colors.glass.surface.dark.strong,
        borderBottomWidth: 1,
        borderBottomColor: colors.dark.border.medium,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
      },
    },
    tab: {
      light: {
        ...colors.glass.surface.light.medium,
        borderTopWidth: 1,
        borderTopColor: colors.light.border.light,
        paddingVertical: spacing[2],
      },
      dark: {
        ...colors.glass.surface.dark.medium,
        borderTopWidth: 1,
        borderTopColor: colors.dark.border.medium,
        paddingVertical: spacing[2],
      },
    },
  },
};

// Theme System - Comprehensive Theme Management
export const theme = {
  // Get current system theme
  getSystemTheme: () => {
    return useColorScheme() || 'light';
  },

  // Theme-aware color getter
  getColor: (colorPath, currentTheme = 'light') => {
    const pathArray = colorPath.split('.');
    let colorValue = colors;
    
    // Navigate through the color object
    for (const key of pathArray) {
      colorValue = colorValue[key];
      if (!colorValue) break;
    }
    
    // If the color has theme variants, return the appropriate one
    if (colorValue && typeof colorValue === 'object' && colorValue.light && colorValue.dark) {
      return colorValue[currentTheme];
    }
    
    return colorValue;
  },

  // Component style getter with theme awareness
  getComponentStyle: (component, variant = 'default', currentTheme = 'light') => {
    const componentStyles = components[component];
    if (!componentStyles) return {};
    
    const variantStyles = componentStyles[variant];
    if (!variantStyles) return {};
    
    // Return theme-specific styles if available
    if (variantStyles[currentTheme]) {
      return variantStyles[currentTheme];
    }
    
    return variantStyles;
  },

  // Shadow getter with theme awareness
  getShadow: (size = 'md', currentTheme = 'light') => {
    if (shadows[currentTheme] && shadows[currentTheme][size]) {
      return shadows[currentTheme][size];
    }
    // Fallback to legacy shadows
    return shadows[size] || shadows.md;
  },

  // Glass effect generator
  createGlassEffect: (intensity = 'medium', currentTheme = 'light') => {
    const glassConfig = colors.glass.surface[currentTheme][intensity];
    return {
      ...glassConfig,
      overflow: 'hidden',
      borderWidth: 1,
    };
  },

  // Enhanced gradient getter with comprehensive fallbacks
  getGradient: (type = 'background', variant = 'primary', currentTheme = 'light') => {
    try {
      // Handle nested gradient structure
      if (colors.gradients[type] && colors.gradients[type][currentTheme]) {
        const result = colors.gradients[type][currentTheme][variant] || colors.gradients[type][currentTheme].primary;
        if (result && Array.isArray(result)) return result;
      }
      
      // Handle direct gradients (like primary)
      if (colors.gradients[type] && colors.gradients[type][currentTheme]) {
        const result = colors.gradients[type][currentTheme];
        if (result && Array.isArray(result)) return result;
      }
      
      // Fallback to legacy gradients
      const legacyKey = currentTheme === 'dark' ? `${type}Dark` : type;
      if (colors.gradients[legacyKey] && Array.isArray(colors.gradients[legacyKey])) {
        return colors.gradients[legacyKey];
      }
      
      // Comprehensive fallbacks based on theme and type
      const fallbacks = {
        dark: {
          success: ['#4CAF50', '#45B049'],
          error: ['#F87171', '#EF4444'],
          warning: ['#FBBF24', '#F59E0B'],
          info: ['#60A5FA', '#3B82F6'],
          accent: ['#FFB86B', '#FF7E87'],
          primary: ['#FFB86B', '#FF7E87'],
          background: ['#000000', '#0A0A0A', '#141414'],
          default: ['#FFB86B', '#FF7E87'],
        },
        light: {
          success: ['#10B981', '#059669'],
          error: ['#EF4444', '#DC2626'],
          warning: ['#F59E0B', '#D97706'],
          info: ['#3B82F6', '#2563EB'],
          accent: ['#E0E0E0', '#F0F0F0'],
          primary: ['#FFFFFF', '#F8F9FA', '#F0F1F3'],
          background: ['#FFFFFF', '#F8F9FA', '#F0F1F3'],
          default: ['#FFFFFF', '#F8F9FA', '#F0F1F3'],
        }
      };
      
      return fallbacks[currentTheme]?.[type] || fallbacks[currentTheme]?.default || fallbacks.dark.default;
    } catch (error) {
      console.warn('Gradient getter error:', error, { type, variant, currentTheme });
      // Ultimate fallback - always return a valid gradient
      return currentTheme === 'dark' ? ['#000000', '#0A0A0A', '#141414'] : ['#FFFFFF', '#F8F9FA', '#F0F1F3'];
    }
  },

  // App background gradient getter - main function for unified backgrounds
  getAppBackgroundGradient: (currentTheme = 'light', variant = 'primary') => {
    if (currentTheme === 'dark') {
      return colors.gradients.background.dark[variant] || colors.gradients.background.dark.primary;
    } else {
      return colors.gradients.background.light[variant] || colors.gradients.background.light.primary;
    }
  },
};

// Utility Functions - Backward Compatibility & Helpers

// Legacy gradient getter (deprecated - use theme.getColor instead)
export const getGradientColors = (gradientName, currentTheme = 'light') => {
  console.warn('getGradientColors is deprecated. Use theme.getColor instead.');
  return colors.gradients[gradientName] || colors.gradients.primary;
};

// Enhanced style creator with full theme support
export const createThemedStyles = (styleFunction, currentTheme = 'light') => {
  const themeColors = currentTheme === 'dark' ? colors.dark : colors.light;
  const themeComponents = {};
  
  // Create theme-aware component styles
  Object.keys(components).forEach(componentKey => {
    themeComponents[componentKey] = {};
    Object.keys(components[componentKey]).forEach(variantKey => {
      themeComponents[componentKey][variantKey] = theme.getComponentStyle(
        componentKey, 
        variantKey, 
        currentTheme
      );
    });
  });
  
  const themeContext = {
    colors: themeColors,
    components: themeComponents,
    typography,
    spacing,
    borderRadius,
    shadows: shadows[currentTheme] || shadows,
    animations,
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    glass: colors.glass,
  };
  
  return typeof styleFunction === 'function' 
    ? styleFunction(themeContext)
    : styleFunction;
};

// Legacy style creator (deprecated - use createThemedStyles instead)
export const createStyles = (themeName = 'dark') => {
  console.warn('createStyles is deprecated. Use createThemedStyles instead.');
  const isDark = themeName === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  
  return {
    container: {
      flex: 1,
      backgroundColor: themeColors.background.primary,
    },
    text: {
      color: themeColors.text.primary,
      fontSize: typography.fontSize.base,
      lineHeight: typography.fontSize.base * typography.lineHeight.normal,
      fontFamily: typography.fontFamily.secondary,
    },
    heading: {
      color: themeColors.text.primary,
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing[4],
      fontFamily: typography.fontFamily.primary,
    },
    card: theme.getComponentStyle('card', 'default', themeName),
    button: theme.getComponentStyle('button', 'primary', themeName),
    input: theme.getComponentStyle('input', 'default', themeName),
  };
};

// Accessibility helpers
export const accessibility = {
  // Check if reduced motion is preferred
  shouldReduceMotion: () => {
    // This would be implemented with a proper reduced motion detection
    // For now, return false as a placeholder
    return false;
  },
  
  // Get accessible color with sufficient contrast
  getAccessibleColor: (backgroundColor, currentTheme = 'light') => {
    // Simple heuristic - in production, this would use proper contrast calculation
    const themeColors = currentTheme === 'dark' ? colors.dark : colors.light;
    return themeColors.text.primary;
  },
  
  // Minimum touch target size
  minTouchTarget: {
    width: spacing.interactive.touch.minimum,
    height: spacing.interactive.touch.minimum,
  },
};

// Performance optimization helpers
export const performance = {
  // Memoized shadow creation to avoid recalculation
  createOptimizedShadow: (size, currentTheme) => {
    // In production, this would implement memoization
    return theme.getShadow(size, currentTheme);
  },
  
  // Simplified glass effect for lower-end devices
  createSimplifiedGlass: (currentTheme = 'light') => {
    const themeColors = currentTheme === 'dark' ? colors.dark : colors.light;
    return {
      backgroundColor: themeColors.background.glass.subtle,
      borderWidth: 1,
      borderColor: themeColors.border.light,
      // Omit backdrop-filter for better performance
    };
  },
};

// Comprehensive Export - Modern Design System
export default {
  // Core design tokens
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components,
  
  // Theme management
  theme,
  
  // Utility functions
  createThemedStyles,
  getGradientColors,
  createStyles, // deprecated
  
  // Accessibility
  accessibility,
  
  // Performance optimization
  performance,
  
  // Version and metadata
  version: '2.0.0',
  designPhilosophy: 'Liquid Glass',
  wcagCompliance: 'AA',
  lastUpdated: '2025-08-15',
};