import React from 'react';
import { Text, View } from 'react-native';

// Safe icon service that handles @expo/vector-icons failures gracefully
class IconService {
  constructor() {
    this.iconsAvailable = false;
    this.Ionicons = null;
    this.initializeIcons();
  }

  initializeIcons() {
    try {
      // Try to import Ionicons
      const { Ionicons } = require('@expo/vector-icons');
      if (Ionicons && typeof Ionicons === 'function') {
        this.Ionicons = Ionicons;
        this.iconsAvailable = true;
        console.log('✅ Ionicons loaded successfully');
      } else {
        throw new Error('Ionicons is not a function');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load Ionicons:', error.message);
      this.iconsAvailable = false;
      this.Ionicons = null;
    }
  }

  // Emoji fallbacks for common icons
  getEmojiIcon(iconName) {
    const emojiMap = {
      // Navigation
      'home': '🏠',
      'home-outline': '🏠',
      'search': '🔍',
      'search-outline': '🔍',
      'person': '👤',
      'person-outline': '👤',
      'calendar': '📅',
      'calendar-outline': '📅',
      'chatbubbles': '💬',
      'chatbubbles-outline': '💬',
      'settings': '⚙️',
      'settings-outline': '⚙️',
      
      // Actions
      'add': '➕',
      'add-outline': '➕',
      'remove': '➖',
      'remove-outline': '➖',
      'close': '❌',
      'close-outline': '❌',
      'checkmark': '✅',
      'checkmark-outline': '✅',
      'heart': '❤️',
      'heart-outline': '🤍',
      'star': '⭐',
      'star-outline': '☆',
      'bookmark': '🔖',
      'bookmark-outline': '🔖',
      
      // Fitness
      'fitness': '💪',
      'fitness-outline': '💪',
      'body': '🏃',
      'body-outline': '🏃',
      'timer': '⏱️',
      'timer-outline': '⏱️',
      'stopwatch': '⏱️',
      'stopwatch-outline': '⏱️',
      'trophy': '🏆',
      'trophy-outline': '🏆',
      
      // Media
      'play': '▶️',
      'play-outline': '▶️',
      'pause': '⏸️',
      'pause-outline': '⏸️',
      'stop': '⏹️',
      'stop-outline': '⏹️',
      'camera': '📷',
      'camera-outline': '📷',
      'image': '🖼️',
      'image-outline': '🖼️',
      
      // Utility
      'library': '📚',
      'library-outline': '📚',
      'document': '📄',
      'document-outline': '📄',
      'folder': '📁',
      'folder-outline': '📁',
      'sparkles': '✨',
      'information': 'ℹ️',
      'information-outline': 'ℹ️',
      'warning': '⚠️',
      'warning-outline': '⚠️',
      'refresh': '🔄',
      'refresh-outline': '🔄',
      
      // Arrows and Navigation
      'arrow-back': '⬅️',
      'arrow-back-outline': '⬅️',
      'arrow-forward': '➡️',
      'arrow-forward-outline': '➡️',
      'arrow-up': '⬆️',
      'arrow-up-outline': '⬆️',
      'arrow-down': '⬇️',
      'arrow-down-outline': '⬇️',
      'chevron-back': '‹',
      'chevron-back-outline': '‹',
      'chevron-forward': '›',
      'chevron-forward-outline': '›',
      'chevron-up': '⌃',
      'chevron-up-outline': '⌃',
      'chevron-down': '⌄',
      'chevron-down-outline': '⌄',
      
      // Social
      'share': '📤',
      'share-outline': '📤',
      'mail': '📧',
      'mail-outline': '📧',
      'chatbox': '💬',
      'chatbox-outline': '💬',
      'call': '📞',
      'call-outline': '📞',
    };

    return emojiMap[iconName] || '❓';
  }

  // Create an icon component that works with or without vector icons
  createIcon(name, size = 24, color = '#000', style = {}) {
    if (this.iconsAvailable && this.Ionicons) {
      return React.createElement(this.Ionicons, {
        name,
        size,
        color,
        style
      });
    } else {
      // Fallback to emoji
      const emoji = this.getEmojiIcon(name);
      return React.createElement(Text, {
        style: [
          {
            fontSize: size * 0.8, // Emojis are usually larger than icons
            color,
            textAlign: 'center',
            lineHeight: size,
          },
          style
        ]
      }, emoji);
    }
  }

  // Check if icons are available
  areIconsAvailable() {
    return this.iconsAvailable;
  }

  // Get the raw Ionicons component (if available)
  getIonicons() {
    return this.Ionicons;
  }
}

// Create singleton instance
const iconService = new IconService();

// Export both the service and a React component
export default iconService;

// Safe Ionicons component that automatically falls back to emoji
export const SafeIcon = ({ name, size = 24, color = '#000', style = {} }) => {
  return iconService.createIcon(name, size, color, style);
};

// Hook to check if vector icons are available
export const useIconsAvailable = () => {
  return iconService.areIconsAvailable();
};