/**
 * SearchSuggestions - Display search suggestions and recent searches
 *
 * Shows contextual suggestions as user types and displays recent search history
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function SearchSuggestions({
  searchSuggestions = [],
  recentSearches = [],
  showSuggestions = false,
  onSuggestionSelect,
  onClearRecent,
}) {
  const { colors } = useTheme();

  if (!showSuggestions && recentSearches.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Suggestions
              </Text>
            </View>
            {searchSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`suggestion-${index}`}
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => onSuggestionSelect(suggestion)}
              >
                <Ionicons name="arrow-forward-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Searches */}
        {!showSuggestions && recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, styles.sectionHeaderWithAction]}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Recent Searches
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClearRecent}
                style={styles.clearButton}
              >
                <Text style={[styles.clearButtonText, { color: colors.primary }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={`recent-${index}`}
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => onSuggestionSelect(search)}
              >
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {search}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionHeaderWithAction: {
    justifyContent: 'space-between',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: 15,
    flex: 1,
  },
});
