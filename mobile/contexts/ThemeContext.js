import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
  dark: {
    // Primary colors
    primary: '#FFB86B',
    primaryDark: '#FF7E87',
    secondary: '#4CAF50',
    accent: '#9C27B0',
    
    // Background colors
    background: '#0A0A0C',
    surface: '#1C1C1E',
    card: '#2C2C3E',
    elevated: '#3C3C4E',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    textInverse: '#000000',
    
    // Border colors
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    borderFocus: '#FFB86B',
    
    // Status colors
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#FF5252',
    info: '#2196F3',
    
    // Component specific
    inputBackground: '#1C1C1E',
    inputBorder: 'rgba(255, 255, 255, 0.2)',
    buttonPrimary: ['#FF7E87', '#FFB86B'],
    buttonSecondary: '#2C2C3E',
    tabBarBackground: '#1A1A1E',
    tabBarActive: '#FFB86B',
    tabBarInactive: '#666666',
    
    // Shadows (iOS)
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    
    // Elevation (Android)
    elevation: 8,
  },
  
  light: {
    // Primary colors
    primary: '#FF6B35',
    primaryDark: '#E55100',
    secondary: '#4CAF50',
    accent: '#9C27B0',
    
    // Background colors
    background: '#FFFFFF',
    surface: '#F5F5F5',
    card: '#FFFFFF',
    elevated: '#FAFAFA',
    
    // Text colors
    text: '#000000',
    textSecondary: '#606060',
    textTertiary: '#909090',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: 'rgba(0, 0, 0, 0.12)',
    borderLight: 'rgba(0, 0, 0, 0.06)',
    borderFocus: '#FF6B35',
    
    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Component specific
    inputBackground: '#FFFFFF',
    inputBorder: 'rgba(0, 0, 0, 0.2)',
    buttonPrimary: ['#FF6B35', '#FF8F65'],
    buttonSecondary: '#E0E0E0',
    tabBarBackground: '#FFFFFF',
    tabBarActive: '#FF6B35',
    tabBarInactive: '#909090',
    
    // Shadows (iOS)
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    
    // Elevation (Android)
    elevation: 4,
  }
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

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

  const changeTheme = (mode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
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

  const value = {
    theme: getActiveTheme(),
    themeMode,
    isDarkMode: isDarkMode(),
    changeTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
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

// Helper function to get themed styles
export const themedStyles = (styles) => {
  const { theme } = useTheme();
  return typeof styles === 'function' ? styles(theme) : styles;
};