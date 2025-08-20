/**
 * GlassSearchInput Component
 * Standardized search input with glassmorphism design for consistency across all screens
 * iOS 26 inspired with strong blur and proper light/dark theme support
 */

import React, { memo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { GlassContainer } from './GlassmorphismComponents';

export const GlassSearchInput = memo(({
  value,
  onChangeText,
  placeholder = "Search...",
  onSubmit,
  onClear,
  loading = false,
  autoFocus = false,
  style,
  containerStyle,
  inputStyle,
  showClearButton = true,
  showSearchIcon = true,
  editable = true,
  ...props
}) => {
  const { isDarkMode, theme } = useTheme();
  
  // Ensure proper color contrast
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const placeholderColor = isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const iconColor = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <GlassContainer
      variant="subtle"
      style={[
        styles.container, 
        containerStyle
      ]}
      showShadow={false}
      padding="none"
    >
      <View style={styles.inputWrapper}>
        {showSearchIcon && (
          <Ionicons
            name="search"
            size={20}
            color={iconColor}
            style={styles.searchIcon}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          editable={editable && !loading}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={[
            styles.input,
            {
              color: textColor,
              paddingLeft: showSearchIcon ? 42 : 16,
              paddingRight: (showClearButton && value) || loading ? 42 : 16,
            },
            inputStyle,
          ]}
          {...props}
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color={iconColor}
            style={styles.clearButton}
          />
        ) : (
          showClearButton && value ? (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={iconColor}
              />
            </TouchableOpacity>
          ) : null
        )}
      </View>
    </GlassContainer>
  );
});

GlassSearchInput.displayName = 'GlassSearchInput';

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    width: '100%',
    fontWeight: '500',
  },
  clearButton: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
});

export default GlassSearchInput;