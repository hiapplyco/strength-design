/**
 * Search Context
 * Manages search state and history across the app
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchContext = createContext();

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 20;

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [filters, setFilters] = useState({
    muscleGroup: [],
    equipment: [],
    difficulty: [],
  });

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (history) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const addToHistory = (query) => {
    if (!query || query.trim().length === 0) return;

    const trimmedQuery = query.trim().toLowerCase();

    // Remove if already exists
    const filtered = searchHistory.filter(
      item => item.toLowerCase() !== trimmedQuery
    );

    // Add to beginning
    const newHistory = [query.trim(), ...filtered].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  const clearFilters = () => {
    setFilters({
      muscleGroup: [],
      equipment: [],
      difficulty: [],
    });
  };

  const value = {
    searchQuery,
    setSearchQuery,
    searchHistory,
    addToHistory,
    clearHistory,
    filters,
    updateFilters,
    clearFilters,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (!context) {
    // Return default values if not wrapped in SearchProvider
    return {
      searchQuery: '',
      setSearchQuery: () => {},
      searchHistory: [],
      addToHistory: () => {},
      clearHistory: () => {},
      filters: { muscleGroup: [], equipment: [], difficulty: [] },
      updateFilters: () => {},
      clearFilters: () => {},
    };
  }
  return context;
}

export default SearchContext;
