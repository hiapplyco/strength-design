import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { searchService } from '../services/searchService';
import { storageService } from '../services/storageService';

/**
 * Smart Exercise Search Hook
 * 
 * Features:
 * - Debounced search (300ms)
 * - Result caching
 * - Fuzzy search with typo tolerance
 * - Search operators (AND, OR, NOT)
 * - Multi-field search (name, muscles, equipment, category)
 * - Recent searches tracking
 * - Performance optimization with virtualization
 */
export function useExerciseSearch() {
  // Core search state
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search metadata
  const [searchTime, setSearchTime] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    equipment: [],
    muscles: [],
    difficulty: [],
    saved: false
  });
  
  // UI state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightTerms, setHighlightTerms] = useState([]);
  
  // Refs for performance
  const searchTimeoutRef = useRef(null);
  const searchStartTimeRef = useRef(null);
  const cacheRef = useRef(new Map());
  
  /**
   * Load initial data and user preferences
   */
  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      const [recent, popular] = await Promise.all([
        storageService.getRecentSearches(),
        storageService.getPopularSearches()
      ]);
      
      setRecentSearches(recent);
      setPopularSearches(popular);
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  };
  
  /**
   * Debounced search with caching
   */
  const performSearch = useCallback(async (query, filters = {}) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Don't search empty queries
    if (!query.trim() && Object.values(filters).every(f => 
      Array.isArray(f) ? f.length === 0 : !f
    )) {
      setExercises([]);
      setFilteredExercises([]);
      setResultCount(0);
      setSearchTime(0);
      setHighlightTerms([]);
      return;
    }
    
    // Create cache key
    const cacheKey = searchService.createCacheKey(query, filters);
    
    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setExercises(cached.exercises);
      setFilteredExercises(cached.filtered);
      setResultCount(cached.count);
      setSearchTime(cached.time);
      setHighlightTerms(cached.highlightTerms);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        searchStartTimeRef.current = Date.now();
        
        // Parse search query for operators and terms
        const searchParams = searchService.parseSearchQuery(query);
        setHighlightTerms(searchParams.terms);
        
        // Perform the search
        const results = await searchService.searchExercises({
          query: query.trim(),
          ...filters,
          limit: 500 // Load more for local filtering
        });
        
        // Apply local fuzzy filtering if needed
        const filteredResults = searchService.applyLocalFiltering(
          results.exercises,
          searchParams,
          filters
        );
        
        const searchEndTime = Date.now();
        const searchDuration = searchEndTime - searchStartTimeRef.current;
        
        // Cache results
        const cacheData = {
          exercises: results.exercises,
          filtered: filteredResults,
          count: filteredResults.length,
          time: searchDuration,
          highlightTerms: searchParams.terms,
          timestamp: Date.now()
        };
        
        cacheRef.current.set(cacheKey, cacheData);
        
        // Clean old cache entries (keep last 50)
        if (cacheRef.current.size > 50) {
          const entries = Array.from(cacheRef.current.entries());
          entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
          cacheRef.current.clear();
          entries.slice(0, 50).forEach(([key, value]) => {
            cacheRef.current.set(key, value);
          });
        }
        
        // Update state
        setExercises(results.exercises);
        setFilteredExercises(filteredResults);
        setResultCount(filteredResults.length);
        setSearchTime(searchDuration);
        
        // Save search if it has results
        if (query.trim() && filteredResults.length > 0) {
          await storageService.saveRecentSearch(query.trim());
          const updatedRecent = await storageService.getRecentSearches();
          setRecentSearches(updatedRecent);
        }
        
      } catch (searchError) {
        console.error('Search failed:', searchError);
        setError(searchService.getErrorMessage(searchError));
        setExercises([]);
        setFilteredExercises([]);
        setResultCount(0);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce
    
  }, []);
  
  /**
   * Update search query
   */
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    
    // Generate suggestions
    if (query.length > 0) {
      const suggestions = searchService.generateSuggestions(
        query,
        recentSearches,
        popularSearches
      );
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
    
    // Trigger search
    performSearch(query, activeFilters);
  }, [performSearch, activeFilters, recentSearches, popularSearches]);
  
  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
    performSearch(searchQuery, { ...activeFilters, ...newFilters });
  }, [performSearch, searchQuery, activeFilters]);
  
  /**
   * Add filter value
   */
  const addFilter = useCallback((filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType]) 
        ? [...prev[filterType], value]
        : [value]
    }));
  }, []);
  
  /**
   * Remove filter value
   */
  const removeFilter = useCallback((filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType])
        ? prev[filterType].filter(v => v !== value)
        : []
    }));
  }, []);
  
  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      categories: [],
      equipment: [],
      muscles: [],
      difficulty: [],
      saved: false
    };
    setActiveFilters(clearedFilters);
    performSearch(searchQuery, clearedFilters);
  }, [performSearch, searchQuery]);
  
  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSearchSuggestions([]);
    setHighlightTerms([]);
    clearAllFilters();
  }, [clearAllFilters]);
  
  /**
   * Select suggestion
   */
  const selectSuggestion = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion, activeFilters);
  }, [performSearch, activeFilters]);
  
  /**
   * Apply preset filter
   */
  const applyPreset = useCallback((presetName) => {
    const preset = searchService.getFilterPreset(presetName);
    if (preset) {
      setActiveFilters(preset.filters);
      if (preset.searchQuery) {
        setSearchQuery(preset.searchQuery);
        performSearch(preset.searchQuery, preset.filters);
      } else {
        performSearch(searchQuery, preset.filters);
      }
    }
  }, [performSearch, searchQuery]);
  
  /**
   * Get search results summary
   */
  const searchSummary = useMemo(() => {
    if (!searchQuery && Object.values(activeFilters).every(f => 
      Array.isArray(f) ? f.length === 0 : !f
    )) {
      return null;
    }
    
    let summary = `${resultCount} result${resultCount !== 1 ? 's' : ''}`;
    
    if (searchQuery) {
      summary += ` for "${searchQuery}"`;
    }
    
    const activeFilterCount = Object.values(activeFilters).reduce((count, filter) => {
      return count + (Array.isArray(filter) ? filter.length : (filter ? 1 : 0));
    }, 0);
    
    if (activeFilterCount > 0) {
      summary += ` with ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`;
    }
    
    if (searchTime > 0) {
      summary += ` (${searchTime}ms)`;
    }
    
    return summary;
  }, [searchQuery, activeFilters, resultCount, searchTime]);
  
  /**
   * Check if search has active query or filters
   */
  const hasActiveSearch = useMemo(() => {
    return searchQuery.length > 0 || Object.values(activeFilters).some(f => 
      Array.isArray(f) ? f.length > 0 : f
    );
  }, [searchQuery, activeFilters]);
  
  /**
   * Get active filter count
   */
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count, filter) => {
      return count + (Array.isArray(filter) ? filter.length : (filter ? 1 : 0));
    }, 0);
  }, [activeFilters]);
  
  return {
    // Search state
    searchQuery,
    exercises: filteredExercises,
    isLoading,
    error,
    
    // Search metadata
    searchTime,
    resultCount,
    searchSummary,
    hasActiveSearch,
    highlightTerms,
    
    // Suggestions
    searchSuggestions,
    showSuggestions,
    recentSearches,
    popularSearches,
    
    // Filters
    activeFilters,
    activeFilterCount,
    
    // Actions
    updateSearchQuery,
    updateFilters,
    addFilter,
    removeFilter,
    clearAllFilters,
    clearSearch,
    selectSuggestion,
    applyPreset,
    
    // UI helpers
    setShowSuggestions
  };
}