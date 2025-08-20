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

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <GlassContainer
      variant="medium"
      style={[
        styles.container, 
        {
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        },
        containerStyle
      ]}
      showShadow={true}
      padding="none"
    >
      <View style={styles.inputWrapper}>
        {showSearchIcon && (
          <Ionicons
            name="search"
            size={20}
            color={isDarkMode ? '#8E8E93' : '#3C3C43'}
            style={styles.searchIcon}
          />
        )}
        
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#8E8E93' : '#C7C7CC'}
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          editable={editable && !loading}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          style={[
            styles.input,
            {
              color: isDarkMode ? '#FFFFFF' : '#000000',
              paddingLeft: showSearchIcon ? 40 : 16,
              paddingRight: (showClearButton && value) || loading ? 40 : 16,
            },
            inputStyle,
          ]}
          {...props}
        />

        {loading ? (
          <ActivityIndicator
            size="small"
            color={isDarkMode ? '#8E8E93' : '#3C3C43'}
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
                color={isDarkMode ? '#8E8E93' : '#C7C7CC'}
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
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    width: '100%',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
});

export default GlassSearchInput;