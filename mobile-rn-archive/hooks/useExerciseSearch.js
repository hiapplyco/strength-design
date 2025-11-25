import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, functions } from '../firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const RECENT_SEARCHES_KEY = 'recentExerciseSearches';
const MAX_RECENT_SEARCHES = 10;

export const useExerciseSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTime, setSearchTime] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const [searchSummary, setSearchSummary] = useState('');
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [highlightTerms, setHighlightTerms] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [sortOption, setSortOption] = useState('relevance');
  const [localExercises, setLocalExercises] = useState([]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    loadLocalExercises();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const loadLocalExercises = async () => {
    try {
      // Try to load from Firestore
      const exercisesRef = collection(db, 'exercises');
      const q = query(exercisesRef, limit(100));
      const snapshot = await getDocs(q);
      const exerciseData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocalExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises from Firestore:', error);
      // Fallback to empty array
      setLocalExercises([]);
    }
  };

  const saveRecentSearch = async (query) => {
    try {
      const updatedSearches = [query, ...recentSearches.filter(s => s !== query)]
        .slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim() && !selectedCategory && !selectedEquipment) {
      setExercises([]);
      setHasActiveSearch(false);
      setSearchSummary('');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasActiveSearch(true);
    const startTime = Date.now();

    try {
      // Save to recent searches
      if (query.trim()) {
        await saveRecentSearch(query.trim());
      }

      // Filter local exercises
      let filteredExercises = [...localExercises];

      // Apply text search
      if (query.trim()) {
        const searchTerms = query.toLowerCase().split(' ');
        filteredExercises = filteredExercises.filter(exercise => {
          const searchableText = `${exercise.name} ${exercise.category} ${exercise.equipment || ''} ${exercise.muscleGroups?.join(' ') || ''}`.toLowerCase();
          return searchTerms.every(term => searchableText.includes(term));
        });
      }

      // Apply category filter
      if (selectedCategory) {
        filteredExercises = filteredExercises.filter(
          exercise => exercise.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      // Apply equipment filter
      if (selectedEquipment) {
        filteredExercises = filteredExercises.filter(
          exercise => exercise.equipment?.toLowerCase() === selectedEquipment.toLowerCase()
        );
      }

      // Apply sorting
      if (sortOption === 'alphabetical') {
        filteredExercises.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'category') {
        filteredExercises.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      }

      const endTime = Date.now();
      setSearchTime((endTime - startTime) / 1000);
      setResultCount(filteredExercises.length);
      setExercises(filteredExercises);
      setHighlightTerms(query.trim() ? query.split(' ') : []);

      // Generate search summary
      const summaryParts = [];
      if (query.trim()) summaryParts.push(`"${query}"`);
      if (selectedCategory) summaryParts.push(`category: ${selectedCategory}`);
      if (selectedEquipment) summaryParts.push(`equipment: ${selectedEquipment}`);
      setSearchSummary(`Found ${filteredExercises.length} exercises${summaryParts.length > 0 ? ' for ' + summaryParts.join(', ') : ''}`);

    } catch (error) {
      console.error('Search error:', error);
      setError(error.message);
      setExercises([]);
      setSearchSummary('Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedEquipment, sortOption, localExercises]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setExercises([]);
    setHasActiveSearch(false);
    setSearchSummary('');
    setHighlightTerms([]);
    setSelectedCategory(null);
    setSelectedEquipment(null);
    setSortOption('relevance');
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }, []);

  const setSuggestionFromQuery = useCallback((query) => {
    if (!query) {
      setShowSuggestions(false);
      return;
    }

    // Generate simple suggestions based on query
    const suggestions = [
      `${query} for beginners`,
      `${query} at home`,
      `${query} with dumbbells`,
      `${query} for strength`
    ].filter(s => s.toLowerCase() !== query.toLowerCase());

    setSearchSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [handleSearch]);

  return {
    // State
    searchQuery,
    exercises,
    isLoading,
    error,
    searchTime,
    resultCount,
    searchSummary,
    hasActiveSearch,
    highlightTerms,
    searchSuggestions,
    showSuggestions,
    recentSearches,
    selectedCategory,
    selectedEquipment,
    sortOption,

    // Actions
    setSearchQuery,
    handleSearch,
    clearSearch,
    clearRecentSearches,
    handleSuggestionSelect,
    setSuggestionFromQuery,
    setSelectedCategory,
    setSelectedEquipment,
    setSortOption,
    setShowSuggestions
  };
};

export default useExerciseSearch;