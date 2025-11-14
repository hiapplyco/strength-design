import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const PoseUploadCard = ({
  title = 'Upload Video',
  description,
  onPress,
  isLoading = false,
  icon = 'cloud-upload',
  disabled = false,
  children
}) => {
  const theme = useTheme();

  // Defensive: ensure colors are available
  const primaryColor = theme?.colors?.primary || '#FF6B35';
  const textColor = theme?.colors?.text || '#FFFFFF';
  const secondaryColor = theme?.colors?.secondary || '#8E8E93';
  const cardColor = theme?.colors?.card || '#1C1C1E';
  const borderColor = theme?.colors?.border || '#38383A';

  const styles = StyleSheet.create({
    container: {
      backgroundColor: cardColor,
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: borderColor + '30',
    },
    pressable: {
      opacity: disabled ? 0.5 : 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: description ? 12 : 0,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: primaryColor + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    icon: {
      color: primaryColor,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: textColor,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: secondaryColor,
      lineHeight: 20,
    },
    childrenContainer: {
      marginTop: 16,
    },
  });

  const content = (
    <View style={[styles.container, styles.pressable]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={primaryColor} />
          ) : (
            <Ionicons name={icon} size={24} style={styles.icon} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      </View>
      {children && (
        <View style={styles.childrenContainer}>
          {children}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled || isLoading}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default PoseUploadCard;