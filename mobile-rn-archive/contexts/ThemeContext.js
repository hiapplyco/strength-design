/**
 * Theme Context - Global theme management for the mobile app
 *
 * Provides dark/light mode toggling and theme-aware styles
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@strength_design_theme';

// Color palettes
const COLORS = {
  dark: {
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#00FFFF',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceVariant: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#0A84FF',
  },
  light: {
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#0099CC',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceVariant: '#E5E5EA',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#0A84FF',
  },
};

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  const theme = {
    isDarkMode,
    colors,
    toggleTheme,

    // Gradient presets
    gradients: {
      primary: isDarkMode
        ? ['#FF6B35', '#FF8F65']
        : ['#FF6B35', '#FF5722'],
      secondary: isDarkMode
        ? ['#4ECDC4', '#44A4A0']
        : ['#4ECDC4', '#3BB5AF'],
      accent: isDarkMode
        ? ['#00FFFF', '#00D4D4']
        : ['#0099CC', '#007799'],
      background: isDarkMode
        ? ['#000000', '#0A0A0A', '#141414']
        : ['#FFFFFF', '#F8F9FA', '#F0F1F3'],
      surface: isDarkMode
        ? ['#1C1C1E', '#2C2C2E']
        : ['#F2F2F7', '#E5E5EA'],
    },

    // Shadow presets
    shadows: {
      small: isDarkMode ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: isDarkMode ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 4,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
      large: isDarkMode ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
      } : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    },

    // Glass morphism styles
    glass: {
      background: isDarkMode
        ? 'rgba(28, 28, 30, 0.7)'
        : 'rgba(255, 255, 255, 0.7)',
      border: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.1)',
      blur: 20,
    },
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function for themed styles
export function themedStyles(isDarkMode) {
  const colors = isDarkMode ? COLORS.dark : COLORS.light;

  return {
    container: {
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    text: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
    border: {
      borderColor: colors.border,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
    },
  };
}

export default ThemeContext;
