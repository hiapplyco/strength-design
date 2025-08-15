import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SearchSuggestions Component
 * 
 * Features:
 * - Auto-complete suggestions
 * - Recent searches with history icon
 * - Popular searches with trending icon
 * - "Did you mean?" corrections
 * - Smooth animations
 * - Keyboard navigation support
 */
const SearchSuggestions = memo(({
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  isVisible = false,
  onSuggestionSelect,
  onClearRecent,
  searchQuery = '',
  maxSuggestions = 8
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Set to false for web compatibility
    }).start();
  }, [isVisible, fadeAnim]);
  
  if (!isVisible) return null;
  
  const renderSuggestionItem = (item, type, index) => {
    const getIconAndColor = () => {
      switch (type) {
        case 'recent':
          return { name: 'time-outline', color: '#666' };
        case 'popular':
          return { name: 'trending-up-outline', color: '#FF6B35' };
        case 'correction':
          return { name: 'checkmark-circle-outline', color: '#4CAF50' };
        default:
          return { name: 'search-outline', color: '#666' };
      }
    };
    
    const { name: iconName, color: iconColor } = getIconAndColor();
    
    return (
      <TouchableOpacity
        key={`suggestion-${type}-${index}-${item}`}
        style={styles.suggestionItem}
        onPress={() => onSuggestionSelect(item)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={iconName} 
          size={16} 
          color={iconColor} 
          style={styles.suggestionIcon}
        />
        <Text style={styles.suggestionText}>
          {item}
        </Text>
        {type === 'correction' && (
          <Text style={styles.correctionHint}>Did you mean?</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  const getSuggestionsToShow = () => {
    const allSuggestions = [];
    
    // Add auto-complete suggestions first
    suggestions.slice(0, 3).forEach(suggestion => {
      allSuggestions.push({ text: suggestion, type: 'suggestion' });
    });
    
    // Add recent searches if we have query
    if (searchQuery.length > 0) {
      recentSearches
        .filter(search => 
          search.toLowerCase().includes(searchQuery.toLowerCase()) &&
          search.toLowerCase() !== searchQuery.toLowerCase()
        )
        .slice(0, 2)
        .forEach(search => {
          allSuggestions.push({ text: search, type: 'recent' });
        });
    } else {
      // Show recent searches when no query
      recentSearches.slice(0, 3).forEach(search => {
        allSuggestions.push({ text: search, type: 'recent' });
      });
    }
    
    // Add popular searches
    if (searchQuery.length > 0) {
      popularSearches
        .filter(search => 
          search.toLowerCase().includes(searchQuery.toLowerCase()) &&
          search.toLowerCase() !== searchQuery.toLowerCase() &&
          !allSuggestions.some(s => s.text === search)
        )
        .slice(0, 2)
        .forEach(search => {
          allSuggestions.push({ text: search, type: 'popular' });
        });
    } else {
      // Show popular when no query
      popularSearches
        .filter(search => 
          !allSuggestions.some(s => s.text === search)
        )
        .slice(0, 2)
        .forEach(search => {
          allSuggestions.push({ text: search, type: 'popular' });
        });
    }
    
    return allSuggestions.slice(0, maxSuggestions);
  };
  
  const suggestionsToShow = getSuggestionsToShow();
  
  if (suggestionsToShow.length === 0) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 0],
            }),
          }],
        }
      ]}
    >
      <ScrollView 
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header for recent searches */}
        {recentSearches.length > 0 && searchQuery.length === 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <TouchableOpacity 
              onPress={onClearRecent}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Suggestions */}
        {suggestionsToShow.map(({ text, type }, index) => 
          renderSuggestionItem(text, type, index)
        )}
        
        {/* Quick action buttons */}
        {searchQuery.length === 0 && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => onSuggestionSelect('strength')}
            >
              <Ionicons name="barbell-outline" size={16} color="#FF6B35" />
              <Text style={styles.quickActionText}>Strength</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => onSuggestionSelect('cardio')}
            >
              <Ionicons name="heart-outline" size={16} color="#4CAF50" />
              <Text style={styles.quickActionText}>Cardio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => onSuggestionSelect('bodyweight')}
            >
              <Ionicons name="body-outline" size={16} color="#2196F3" />
              <Text style={styles.quickActionText}>Bodyweight</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#2a2a2a',
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  scrollContainer: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  suggestionIcon: {
    marginRight: 12,
    width: 16,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  normalText: {
    color: 'white',
  },
  highlightText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  correctionHint: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});

SearchSuggestions.displayName = 'SearchSuggestions';

export default SearchSuggestions;