/**
 * Example Usage of Search Components
 *
 * This example shows how to integrate SearchSuggestions, SearchFilters,
 * and SearchResults with the useExerciseSearch hook
 */

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useExerciseSearch } from '../hooks/useExerciseSearch';
import GlassSearchInput from './GlassSearchInput';
import SearchSuggestions from './SearchSuggestions';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import { useTheme } from '../contexts/ThemeContext';

export default function ExampleSearchScreen() {
  const { colors } = useTheme();
  const {
    // Search state
    searchQuery,
    exercises,
    isLoading,
    error,
    searchSummary,
    highlightTerms,

    // Suggestions
    searchSuggestions,
    showSuggestions,
    recentSearches,

    // Filters
    selectedCategory,
    selectedEquipment,
    sortOption,

    // Actions
    setSearchQuery,
    handleSearch,
    clearSearch,
    handleSuggestionSelect,
    clearRecentSearches,
    setSelectedCategory,
    setSelectedEquipment,
    setSortOption,
    setShowSuggestions,
    setSuggestionFromQuery,
  } = useExerciseSearch();

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.trim()) {
      setSuggestionFromQuery(text);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    setShowSuggestions(false);
    handleSearch();
  };

  // Handle exercise press
  const handleExercisePress = (exercise) => {
    console.log('Exercise selected:', exercise);
    // Navigate to exercise detail screen or show modal
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedEquipment(null);
    setSortOption('relevance');
  };

  // Check if any filters are active
  const hasActiveFilters = selectedCategory || selectedEquipment || sortOption !== 'relevance';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <GlassSearchInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          onSubmit={handleSearchSubmit}
          onClear={clearSearch}
          placeholder="Search exercises..."
        />
      </View>

      {/* Search Suggestions - Shows when typing */}
      {(showSuggestions || (!searchQuery && recentSearches.length > 0)) && (
        <View style={styles.suggestionsContainer}>
          <SearchSuggestions
            searchSuggestions={searchSuggestions}
            recentSearches={recentSearches}
            showSuggestions={showSuggestions}
            onSuggestionSelect={handleSuggestionSelect}
            onClearRecent={clearRecentSearches}
          />
        </View>
      )}

      {/* Search Filters - Shows when not typing suggestions */}
      {!showSuggestions && (
        <SearchFilters
          selectedCategory={selectedCategory}
          selectedEquipment={selectedEquipment}
          sortOption={sortOption}
          onCategorySelect={setSelectedCategory}
          onEquipmentSelect={setSelectedEquipment}
          onSortChange={setSortOption}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        <SearchResults
          exercises={exercises}
          isLoading={isLoading}
          error={error}
          highlightTerms={highlightTerms}
          onExercisePress={handleExercisePress}
          searchSummary={searchSummary}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
  },
  resultsContainer: {
    flex: 1,
  },
});
