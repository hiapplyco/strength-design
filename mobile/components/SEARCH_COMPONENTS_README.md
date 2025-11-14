# Search Components Integration Guide

This guide explains how to use the three search components with the `useExerciseSearch` hook.

## Components Created

### 1. SearchSuggestions.js
Displays search suggestions as the user types and shows recent search history.

**Props:**
- `searchSuggestions` (array): Array of suggestion strings
- `recentSearches` (array): Array of recent search strings
- `showSuggestions` (boolean): Whether to show suggestions
- `onSuggestionSelect` (function): Called when a suggestion is tapped
- `onClearRecent` (function): Called when "Clear" is tapped

**Features:**
- Shows contextual suggestions based on user input
- Displays recent search history when input is empty
- Tap any suggestion to execute that search
- Clear button to remove all recent searches

### 2. SearchFilters.js
Provides filter chips and sorting options for refining search results.

**Props:**
- `selectedCategory` (string|null): Currently selected category
- `selectedEquipment` (string|null): Currently selected equipment
- `sortOption` (string): Current sort option ('relevance', 'alphabetical', 'category')
- `onCategorySelect` (function): Called when category is selected/deselected
- `onEquipmentSelect` (function): Called when equipment is selected/deselected
- `onSortChange` (function): Called when sort option changes
- `onClearFilters` (function): Called when "Clear All" is tapped
- `hasActiveFilters` (boolean): Whether any filters are active

**Features:**
- Horizontal scrolling filter chips for categories and equipment
- Toggle selection on/off by tapping chips
- Three sort options with icons
- "Clear All" button when filters are active
- Visual indication of selected filters

### 3. SearchResults.js
Displays the list of exercise results with highlighting and details.

**Props:**
- `exercises` (array): Array of exercise objects
- `isLoading` (boolean): Whether search is in progress
- `error` (string|null): Error message if search failed
- `highlightTerms` (array): Array of terms to highlight in results
- `onExercisePress` (function): Called when an exercise card is tapped
- `searchSummary` (string): Summary text to display above results

**Features:**
- Highlights search terms in exercise names
- Shows category, equipment, and muscle group badges
- Loading state with spinner
- Error state with helpful message
- Empty state when no results
- Optimized FlatList with virtualization
- Touch feedback on cards

## Integration Example

```javascript
import { useExerciseSearch } from '../hooks/useExerciseSearch';
import SearchSuggestions from '../components/SearchSuggestions';
import SearchFilters from '../components/SearchFilters';
import SearchResults from '../components/SearchResults';

function MyScreen() {
  const {
    searchQuery,
    exercises,
    isLoading,
    error,
    searchSummary,
    highlightTerms,
    searchSuggestions,
    showSuggestions,
    recentSearches,
    selectedCategory,
    selectedEquipment,
    sortOption,
    setSearchQuery,
    handleSearch,
    handleSuggestionSelect,
    clearRecentSearches,
    setSelectedCategory,
    setSelectedEquipment,
    setSortOption,
  } = useExerciseSearch();

  return (
    <View>
      {/* Search input */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearch}
      />

      {/* Show suggestions when typing */}
      {showSuggestions && (
        <SearchSuggestions
          searchSuggestions={searchSuggestions}
          recentSearches={recentSearches}
          showSuggestions={showSuggestions}
          onSuggestionSelect={handleSuggestionSelect}
          onClearRecent={clearRecentSearches}
        />
      )}

      {/* Show filters when not typing */}
      {!showSuggestions && (
        <SearchFilters
          selectedCategory={selectedCategory}
          selectedEquipment={selectedEquipment}
          sortOption={sortOption}
          onCategorySelect={setSelectedCategory}
          onEquipmentSelect={setSelectedEquipment}
          onSortChange={setSortOption}
          onClearFilters={() => {
            setSelectedCategory(null);
            setSelectedEquipment(null);
          }}
          hasActiveFilters={!!(selectedCategory || selectedEquipment)}
        />
      )}

      {/* Show results */}
      <SearchResults
        exercises={exercises}
        isLoading={isLoading}
        error={error}
        highlightTerms={highlightTerms}
        onExercisePress={(exercise) => {
          // Handle exercise selection
        }}
        searchSummary={searchSummary}
      />
    </View>
  );
}
```

## Theme Integration

All components use the `ThemeContext` to adapt to dark/light mode:
- Colors automatically adjust based on theme
- Shadows and borders theme-aware
- Primary and secondary accent colors from theme

## Data Structure

### Exercise Object
```javascript
{
  id: 'string',
  name: 'string',
  category: 'string',
  equipment: 'string',
  muscleGroups: ['string'],
  description: 'string' // optional
}
```

## Performance Notes

- `SearchResults` uses FlatList with virtualization for optimal performance
- `SearchFilters` uses horizontal ScrollViews for smooth scrolling
- All components use React Native's built-in optimization features
- TouchableOpacity provides native-like touch feedback

## Customization

### Adding More Categories/Equipment
Edit the arrays in `SearchFilters.js`:
```javascript
const CATEGORIES = ['Category1', 'Category2', ...];
const EQUIPMENT = ['Equipment1', 'Equipment2', ...];
```

### Changing Sort Options
Edit the `SORT_OPTIONS` array in `SearchFilters.js`:
```javascript
const SORT_OPTIONS = [
  { value: 'custom', label: 'Custom', icon: 'icon-name' },
  ...
];
```

### Styling
All styles are defined in component-local StyleSheet objects and can be customized by editing the respective files.

## Full Example

See `SearchComponents.example.js` for a complete working example of all three components integrated together.
