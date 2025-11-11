/**
 * Advanced Exercise Search Hook (V2)
 *
 * Next-generation search hook combining:
 * - Local-first fuzzy search (exerciseSearchService)
 * - Search analytics and suggestions (searchAnalyticsService)
 * - React state management
 *
 * Replaces useEnhancedExerciseSearch with better performance and features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  exerciseSearchService,
  Exercise,
  SearchOptions,
  SearchResult
} from '@/lib/services/exerciseSearchService';
import {
  searchAnalyticsService,
  SearchHistoryEntry,
  PopularSearch
} from '@/lib/services/searchAnalyticsService';

// ============================================================================
// Types
// ============================================================================

export interface UseAdvancedExerciseSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  trackAnalytics?: boolean;
}

export interface UseAdvancedExerciseSearchReturn {
  // Search state
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  total: number;

  // Search methods
  search: (options: SearchOptions) => Promise<void>;
  clearSearch: () => void;

  // Query state
  query: string;
  setQuery: (query: string) => void;

  // Filters
  filters: {
    categories: string[];
    equipment: string[];
    muscles: string[];
    difficulty: string;
  };
  setFilters: (filters: Partial<UseAdvancedExerciseSearchReturn['filters']>) => void;
  clearFilters: () => void;

  // Analytics & suggestions
  recentSearches: SearchHistoryEntry[];
  popularSearches: PopularSearch[];
  suggestions: string[];
  loadSuggestions: (partialQuery: string) => Promise<void>;

  // Cache management
  clearCache: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useAdvancedExerciseSearch(
  options: UseAdvancedExerciseSearchOptions = {}
): UseAdvancedExerciseSearchReturn {
  const {
    debounceMs = 300,
    autoSearch = false,
    trackAnalytics = true
  } = options;

  // Search state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Query and filters
  const [query, setQuery] = useState('');
  const [filters, setFiltersState] = useState({
    categories: [],
    equipment: [],
    muscles: [],
    difficulty: ''
  });

  // Analytics state
  const [recentSearches, setRecentSearches] = useState<SearchHistoryEntry[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Refs for debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  /**
   * Load recent and popular searches on mount
   */
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [recent, popular] = await Promise.all([
          searchAnalyticsService.getRecentSearches(10),
          searchAnalyticsService.getPopularSearches(10)
        ]);
        setRecentSearches(recent);
        setPopularSearches(popular);
      } catch (err) {
        console.error('Error loading search analytics:', err);
      }
    };

    loadAnalytics();
  }, []);

  /**
   * Perform search
   */
  const search = useCallback(async (searchOptions: SearchOptions) => {
    // Cancel any pending searches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const result: SearchResult = await exerciseSearchService.search(searchOptions);

      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setExercises(result.exercises);
      setTotal(result.total);

      // Track in analytics if enabled
      if (trackAnalytics && searchOptions.query) {
        await searchAnalyticsService.addSearchToHistory({
          query: searchOptions.query,
          filters: {
            categories: searchOptions.categories,
            equipment: searchOptions.equipment,
            muscles: searchOptions.muscles,
            difficulty: searchOptions.difficulty
          }
        });

        // Reload recent/popular searches
        const [recent, popular] = await Promise.all([
          searchAnalyticsService.getRecentSearches(10),
          searchAnalyticsService.getPopularSearches(10)
        ]);
        setRecentSearches(recent);
        setPopularSearches(popular);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Search failed');
        console.error('Search error:', err);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [trackAnalytics]);

  /**
   * Auto-search when query or filters change (with debouncing)
   */
  useEffect(() => {
    if (!autoSearch) return;

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Don't search if query is empty and no filters are set
    if (!query && filters.categories.length === 0 && filters.equipment.length === 0 &&
        filters.muscles.length === 0 && !filters.difficulty) {
      setExercises([]);
      setTotal(0);
      return;
    }

    // Debounce search
    debounceTimeoutRef.current = setTimeout(() => {
      search({
        query,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        equipment: filters.equipment.length > 0 ? filters.equipment : undefined,
        muscles: filters.muscles.length > 0 ? filters.muscles : undefined,
        difficulty: filters.difficulty || undefined,
        limit: 50
      });
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, filters, autoSearch, debounceMs, search]);

  /**
   * Load suggestions based on partial query
   */
  const loadSuggestions = useCallback(async (partialQuery: string) => {
    try {
      const results = await searchAnalyticsService.getSuggestions(partialQuery, 5);
      setSuggestions(results);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  /**
   * Set filters with merge
   */
  const setFilters = useCallback((newFilters: Partial<UseAdvancedExerciseSearchReturn['filters']>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFiltersState({
      categories: [],
      equipment: [],
      muscles: [],
      difficulty: ''
    });
  }, []);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setExercises([]);
    setTotal(0);
    setQuery('');
    clearFilters();
    setError(null);
  }, [clearFilters]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    exerciseSearchService.clearCache();
  }, []);

  return {
    // Search state
    exercises,
    isLoading,
    error,
    total,

    // Search methods
    search,
    clearSearch,

    // Query state
    query,
    setQuery,

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Analytics & suggestions
    recentSearches,
    popularSearches,
    suggestions,
    loadSuggestions,

    // Cache management
    clearCache
  };
}
