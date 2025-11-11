/**
 * Program Search Service
 * Integrates with Firebase Functions and Perplexity API for fitness program search
 * NO FALLBACKS - Live API only
 */

import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';

class ProgramSearchService {
  constructor() {
    this.cache = new Map();
    this.searchHistory = [];
    this.recentSearches = [];
    this.savedPrograms = new Map();
    this.maxCacheSize = 50;
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    
    // Initialize Firebase Functions
    this.searchProgramsFunction = httpsCallable(functions, 'searchPrograms');
  }

  /**
   * Search fitness programs using Firebase Function with Perplexity API
   * NO FALLBACK - Will throw error if API fails
   */
  async searchPrograms(query, options = {}) {
    try {
      const {
        searchType = 'general',
        focus = [],
        difficulty,
        duration,
        equipment = []
      } = options;

      // Check cache first
      const cacheKey = `search_${query}_${JSON.stringify(options)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('🔄 Returning cached program search results');
        return cached;
      }

      console.log('🔍 Searching programs:', { query, options });

      // Call the real Firebase Function - NO FALLBACK
      const result = await this.searchProgramsFunction({ 
        query, 
        searchType, 
        focus, 
        difficulty, 
        duration, 
        equipment 
      });
      
      const results = result.data;
      console.log('✅ Firebase Function response:', results);
      
      // Enrich program data to ensure comprehensive information
      if (results.programs && Array.isArray(results.programs)) {
        results.programs = results.programs.map(program => ({
          // Basic program info
          name: program.name || 'Unknown Program',
          creator: program.creator || program.source || 'Unknown',
          description: program.description || program.overview || program.methodology || '',
          
          // Program characteristics
          focus: Array.isArray(program.focus) ? program.focus : (program.focus ? [program.focus] : ['General Fitness']),
          difficulty: program.difficulty || program.experienceLevel || 'Beginner',
          duration: program.duration || 'Variable',
          popularity: program.popularity || program.credibilityScore || 85,
          source: program.source || 'Perplexity Search',
          
          // Detailed program structure
          exercises: program.exercises || program.workouts || program.structure || [],
          equipment: Array.isArray(program.equipment) ? program.equipment : (program.equipment ? [program.equipment] : ['Basic gym equipment']),
          schedule: program.schedule || program.frequency || '3-4 days per week',
          
          // Program methodology and principles
          methodology: program.methodology || program.approach || program.principles || '',
          goals: Array.isArray(program.goals) ? program.goals : (program.goals ? [program.goals] : program.focus || ['General Fitness']),
          principles: program.principles || program.keyPoints || [],
          
          // Additional context
          overview: program.overview || program.description || '',
          structure: program.structure || program.workouts || program.exercises || [],
          experienceLevel: program.experienceLevel || program.difficulty || 'Beginner',
          
          // Keep original data as well
          ...program,
          
          // Metadata
          enrichedAt: new Date().toISOString(),
          searchQuery: query,
          searchOptions: options
        }));
        
        console.log('📋 Enriched program data:', results.programs.map(p => ({
          name: p.name,
          hasExercises: Array.isArray(p.exercises) && p.exercises.length > 0,
          hasStructure: Array.isArray(p.structure) && p.structure.length > 0,
          hasMethodology: Boolean(p.methodology),
          equipmentCount: Array.isArray(p.equipment) ? p.equipment.length : 0,
          goalsCount: Array.isArray(p.goals) ? p.goals.length : 0
        })));
      }
      
      // Cache results
      this.setCache(cacheKey, results);

      // Add to search history
      this.addToSearchHistory(query, results.programs.length);

      console.log(`✅ Found ${results.programs.length} enriched programs for "${query}"`);
      return results;

    } catch (error) {
      console.error('❌ Program search failed:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'failed-precondition') {
        throw new Error('Program search is not configured. Please contact support.');
      } else if (error.code === 'unauthenticated') {
        throw new Error('Authentication error. Please try again or contact support.');
      } else if (error.code === 'resource-exhausted') {
        throw new Error('Too many searches. Please wait a moment and try again.');
      } else if (error.code === 'unavailable') {
        throw new Error('Search service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Search failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Save a program for later reference with comprehensive data
   */
  saveProgram(program, context = {}) {
    const savedData = {
      program: {
        // Ensure all program data is preserved and enriched
        ...program,
        // Validate and ensure key fields exist
        name: program.name || 'Unknown Program',
        description: program.description || program.overview || '',
        exercises: program.exercises || program.structure || [],
        methodology: program.methodology || '',
        equipment: program.equipment || [],
        goals: program.goals || program.focus || [],
        difficulty: program.difficulty || program.experienceLevel || 'Beginner',
        duration: program.duration || 'Variable',
        principles: program.principles || [],
        schedule: program.schedule || program.frequency || '3-4 days per week'
      },
      savedAt: new Date().toISOString(),
      context: {
        source: context.source || 'search',
        searchQuery: context.searchQuery || '',
        userAction: context.userAction || 'manual-save',
        ...context
      },
      notes: context.notes || '',
      customizations: context.customizations || {},
      // Add comprehensive program analysis
      analysis: {
        hasExercises: Array.isArray(program.exercises) && program.exercises.length > 0,
        hasStructure: Array.isArray(program.structure) && program.structure.length > 0,
        hasMethodology: Boolean(program.methodology),
        equipmentCount: Array.isArray(program.equipment) ? program.equipment.length : 0,
        goalsCount: Array.isArray(program.goals) ? program.goals.length : 0,
        hasPrinciples: Array.isArray(program.principles) && program.principles.length > 0
      }
    };

    this.savedPrograms.set(program.name, savedData);
    console.log(`💾 Program saved with comprehensive data: ${program.name}`, savedData.analysis);
    return savedData;
  }

  /**
   * Remove saved program
   */
  removeSavedProgram(programName) {
    const removed = this.savedPrograms.delete(programName);
    if (removed) {
      console.log(`🗑️ Program removed: ${programName}`);
    }
    return removed;
  }

  /**
   * Get all saved programs
   */
  getSavedPrograms() {
    return Array.from(this.savedPrograms.values());
  }

  /**
   * Check if program is saved
   */
  isProgramSaved(programName) {
    return this.savedPrograms.has(programName);
  }

  /**
   * Get popular program suggestions
   */
  getPopularPrograms() {
    return [
      'Starting Strength',
      'StrongLifts 5x5',
      '5/3/1 for beginners',
      'Push Pull Legs',
      'Upper Lower Split',
      'Full Body Workout',
      'PHUL',
      'Bodyweight training'
    ];
  }

  /**
   * Get program categories for filtering
   */
  getProgramCategories() {
    return [
      'Strength Training',
      'Muscle Building',
      'Powerlifting',
      'Bodybuilding',
      'General Fitness',
      'Home Workouts',
      'Bodyweight Training',
      'Beginner Programs',
      'Intermediate Programs',
      'Advanced Programs'
    ];
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query, resultCount) {
    const historyEntry = {
      query: query.trim().toLowerCase(),
      resultCount,
      timestamp: new Date().toISOString()
    };

    // Remove duplicates
    this.searchHistory = this.searchHistory.filter(entry => entry.query !== historyEntry.query);
    
    // Add to front
    this.searchHistory.unshift(historyEntry);
    
    // Keep only last 30 searches
    if (this.searchHistory.length > 30) {
      this.searchHistory = this.searchHistory.slice(0, 30);
    }

    // Update recent searches (last 8 unique)
    this.recentSearches = this.searchHistory.slice(0, 8);
  }

  /**
   * Get search suggestions based on history and popular terms
   */
  getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return this.getPopularPrograms().slice(0, 6);
    }

    const lowerQuery = query.toLowerCase();
    const suggestions = [];

    // From search history
    const historyMatches = this.searchHistory
      .filter(entry => entry.query.includes(lowerQuery))
      .slice(0, 3)
      .map(entry => entry.query);

    suggestions.push(...historyMatches);

    // From popular programs
    const popularMatches = this.getPopularPrograms()
      .filter(program => program.toLowerCase().includes(lowerQuery))
      .slice(0, 3);

    suggestions.push(...popularMatches);

    return [...new Set(suggestions)].slice(0, 6);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Program search cache cleared');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      searchHistoryCount: this.searchHistory.length,
      savedProgramsCount: this.savedPrograms.size,
      recentSearchesCount: this.recentSearches.length,
      lastActivity: this.searchHistory[0]?.timestamp || null
    };
  }

  /**
   * Export saved programs
   */
  exportSavedPrograms() {
    return {
      savedPrograms: Array.from(this.savedPrograms.values()),
      searchHistory: this.searchHistory.slice(0, 10),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import saved programs
   */
  importSavedPrograms(data) {
    try {
      if (data.savedPrograms) {
        data.savedPrograms.forEach(saved => {
          this.savedPrograms.set(saved.program.name, saved);
        });
      }
      
      console.log('📥 Saved programs imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import saved programs:', error);
      return false;
    }
  }
}

// Create singleton instance
export const programSearchService = new ProgramSearchService();

export default programSearchService;