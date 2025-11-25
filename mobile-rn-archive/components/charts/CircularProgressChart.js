import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

const CircularProgressChart = ({
  progress = 0,
  size = 120,
  strokeWidth = 10,
  color,
  label = '',
  showPercentage = true,
  children
}) => {
  const theme = useTheme();
  const defaultColor = color || theme?.colors?.primary || '#FF6B35';

  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    svgContainer: {
      transform: [{ rotate: '-90deg' }],
    },
    contentContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentage: {
      fontSize: size * 0.25,
      fontWeight: '700',
      color: theme.colors.text,
    },
    label: {
      fontSize: size * 0.12,
      color: theme.colors.secondary,
      marginTop: 4,
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svgContainer}>
        <G>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.border}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.2}
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={defaultColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      <View style={styles.contentContainer}>
        {children || (
          <>
            {showPercentage && (
              <Text style={styles.percentage}>{Math.round(progressValue)}%</Text>
            )}
            {label && <Text style={styles.label}>{label}</Text>}
          </>
        )}
      </View>
    </View>
  );
};

export default CircularProgressChart;