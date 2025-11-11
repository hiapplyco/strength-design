/**
 * SafeLinearGradient - Error-Safe Gradient Component
 * Provides automatic fallbacks for gradient colors to prevent crashes
 * Oura-inspired design with comprehensive error handling
 */

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SafeLinearGradient Component
 * Wraps expo-linear-gradient with automatic fallbacks and error handling
 */
export const SafeLinearGradient = ({ 
  colors, 
  fallbackColors, 
  type, 
  variant = 'primary',
  children,
  style,
  ...props 
}) => {
  const { isDarkMode, getGradient } = useTheme();
  const currentTheme = isDarkMode ? 'dark' : 'light';
  
  // Determine the colors to use
  const getGradientColors = () => {
    try {
      // If colors are provided directly, validate and use them
      if (colors && Array.isArray(colors) && colors.length >= 2) {
        return colors;
      }
      
      // If type is provided, get colors from theme
      if (type) {
        const themeColors = getGradient(type, variant, currentTheme);
        if (themeColors && Array.isArray(themeColors) && themeColors.length >= 2) {
          return themeColors;
        }
      }
      
      // Use fallback colors if provided
      if (fallbackColors && Array.isArray(fallbackColors) && fallbackColors.length >= 2) {
        return fallbackColors;
      }
      
      // Ultimate fallbacks based on theme - using neutral colors
      const ultimateFallbacks = {
        dark: ['#000000', '#0A0A0A', '#141414'],
        light: ['#FFFFFF', '#F8F9FA', '#F0F1F3']
      };
      
      return ultimateFallbacks[currentTheme];
    } catch (error) {
      console.warn('SafeLinearGradient: Error determining colors:', error);
      
      // Emergency fallback - using neutral colors
      return isDarkMode ? ['#000000', '#0A0A0A', '#141414'] : ['#FFFFFF', '#F8F9FA', '#F0F1F3'];
    }
  };

  const finalColors = getGradientColors();

  return (
    <LinearGradient
      colors={finalColors}
      style={style}
      {...props}
    >
      {children}
    </LinearGradient>
  );
};

/**
 * Pre-configured gradient variants for common use cases
 */

// Oura-style background gradients
export const OuraBackgroundGradient = ({ children, style, ...props }) => (
  <SafeLinearGradient
    type="background"
    variant="oura"
    fallbackColors={['#000000', '#0A0A0A', '#141414']}
    style={style}
    {...props}
  >
    {children}
  </SafeLinearGradient>
);

// Primary action gradients
export const PrimaryGradient = ({ children, style, ...props }) => (
  <SafeLinearGradient
    type="accent"
    variant="aurora"
    fallbackColors={['#E0E0E0', '#F0F0F0']}
    style={style}
    {...props}
  >
    {children}
  </SafeLinearGradient>
);

// Success state gradients
export const SuccessGradient = ({ children, style, ...props }) => (
  <SafeLinearGradient
    type="success"
    fallbackColors={['#4CAF50', '#45B049']}
    style={style}
    {...props}
  >
    {children}
  </SafeLinearGradient>
);

// Minimal/subtle gradients for Oura-like aesthetics
export const MinimalGradient = ({ children, style, ...props }) => {
  const { isDarkMode } = useTheme();
  
  const colors = isDarkMode 
    ? ['#000000', '#0A0A0A'] 
    : ['#F8F9FA', '#FFFFFF'];
    
  return (
    <SafeLinearGradient
      colors={colors}
      style={style}
      {...props}
    >
      {children}
    </SafeLinearGradient>
  );
};

// Glass effect gradients
export const GlassGradient = ({ intensity = 'medium', children, style, ...props }) => {
  const { isDarkMode } = useTheme();
  
  const glassColors = {
    dark: {
      subtle: ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'],
      medium: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
      strong: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)'],
    },
    light: {
      subtle: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.08)'],
      medium: ['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.12)'],
      strong: ['rgba(255,255,255,0.30)', 'rgba(255,255,255,0.20)'],
    }
  };
  
  const theme = isDarkMode ? 'dark' : 'light';
  const colors = glassColors[theme][intensity] || glassColors[theme].medium;
  
  return (
    <SafeLinearGradient
      colors={colors}
      style={style}
      {...props}
    >
      {children}
    </SafeLinearGradient>
  );
};

export default SafeLinearGradient;