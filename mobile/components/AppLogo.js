import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const AppLogo = ({ 
  size = 'medium', 
  style, 
  showGlow = true,
  position = 'header', // header, center, corner
  noCircle = false
}) => {
  const { isDarkMode } = useTheme();
  
  const sizeMap = {
    small: { width: 30, height: 30 },
    medium: { width: 40, height: 40 },
    large: { width: 60, height: 60 },
    xlarge: { width: 100, height: 100 },
    xxlarge: { width: 150, height: 150 }
  };
  
  const logoSize = typeof size === 'string' ? sizeMap[size] : { width: size, height: size };
  
  return (
    <View style={[
      styles.container,
      position === 'corner' && styles.cornerPosition,
      style
    ]}>
      {showGlow && !noCircle && (
        <View style={[
          styles.glowEffect,
          logoSize,
          isDarkMode && styles.glowDark
        ]} />
      )}
      <Image
        source={require('../assets/sdlogo.png')}
        style={[
          logoSize,
          styles.logo,
          { resizeMode: 'contain' }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerPosition: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
  },
  logo: {
    zIndex: 2,
  },
  glowEffect: {
    position: 'absolute',
    backgroundColor: 'rgba(76, 255, 80, 0.2)',
    borderRadius: 100,
    transform: [{ scale: 1.2 }],
  },
  glowDark: {
    backgroundColor: 'rgba(76, 255, 80, 0.3)',
  }
});

export default AppLogo;