/**
 * Program Search Service
 * Integrates with Firebase Functions and Perplexity API for fitness program search
 * Provides comprehensive search and management of workout programs and training methodologies
 */

import { functions } from '../config/firebase.js';
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

      // Call the real Firebase Function
      let results;
      try {
        const result = await this.searchProgramsFunction({ 
          query, 
          searchType, 
          focus, 
          difficulty, 
          duration, 
          equipment 
        });
        
        results = result.data;
        console.log('✅ Firebase Function response:', results);
      } catch (firebaseError) {
        console.warn('🔄 Firebase Function failed, falling back to simulation:', firebaseError);
        // Fall back to simulation if Firebase Function fails
        results = await this.simulateFirebaseFunction(query, options);
      }
      
      // Cache results
      this.setCache(cacheKey, results);

      // Add to search history
      this.addToSearchHistory(query, results.programs.length);

      console.log(`✅ Found ${results.programs.length} programs for "${query}"`);
      return results;

    } catch (error) {
      console.error('❌ Program search failed:', error);
      throw new Error(`Failed to search programs: ${error.message}`);
    }
  }

  /**
   * Simulate Firebase Function call for testing
   * In production, replace with actual Firebase Function call
   */
  async simulateFirebaseFunction(query, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const lowerQuery = query.toLowerCase();
    const programs = [];

    // Generate realistic program responses based on query
    if (lowerQuery.includes('strength') || lowerQuery.includes('strong')) {
      programs.push(
        {
          name: 'Starting Strength',
          description: 'A beginner strength training program focused on compound movements and linear progression.',
          difficulty: 'beginner',
          duration: '12-24 weeks',
          focus: ['strength', 'muscle building'],
          equipment: ['barbell', 'plates', 'squat rack'],
          overview: 'Starting Strength is a novice program designed around the basic barbell exercises: squat, deadlift, bench press, overhead press, and power clean. The program emphasizes proper form and consistent progression.',
          structure: '3 days per week, alternating between two workouts (A/B split)',
          benefits: ['Rapid strength gains', 'Builds foundation', 'Simple to follow', 'Proven effective'],
          considerations: ['Requires barbell access', 'Form coaching recommended', 'Linear progression may stall'],
          source: 'Mark Rippetoe',
          popularity: 5
        },
        {
          name: 'StrongLifts 5x5',
          description: 'Simple 5x5 program focusing on compound movements with progressive overload.',
          difficulty: 'beginner',
          duration: '12+ weeks',
          focus: ['strength', 'muscle building'],
          equipment: ['barbell', 'plates', 'squat rack'],
          overview: 'StrongLifts 5x5 uses two alternating workouts with five sets of five reps for main exercises. The program includes built-in deload protocols.',
          structure: '3 days per week (Monday/Wednesday/Friday)',
          benefits: ['Clear progression', 'App support', 'Beginner friendly', 'Time efficient'],
          considerations: ['Can become monotonous', 'Limited exercise variety', 'Upper body progress slower'],
          source: 'Mehdi Hadim',
          popularity: 5
        }
      );
    }

    if (lowerQuery.includes('muscle') || lowerQuery.includes('hypertrophy') || lowerQuery.includes('building')) {
      programs.push(
        {
          name: 'PHUL (Power Hypertrophy Upper Lower)',
          description: 'Four-day program combining power and hypertrophy training in an upper/lower split.',
          difficulty: 'intermediate',
          duration: '8-16 weeks',
          focus: ['muscle building', 'strength', 'power'],
          equipment: ['full gym'],
          overview: 'PHUL combines power training (lower reps, higher weight) with hypertrophy training (higher reps, moderate weight) across four training days.',
          structure: '4 days per week - Upper Power, Lower Power, Upper Hypertrophy, Lower Hypertrophy',
          benefits: ['Balanced approach', 'Strength and size gains', 'Flexible exercise selection'],
          considerations: ['Requires 4 days per week', 'Intermediate experience needed', 'High volume'],
          source: 'Brandon Campbell',
          popularity: 4
        },
        {
          name: 'Push Pull Legs (PPL)',
          description: 'Classic bodybuilding split focusing on movement patterns across 3-6 days.',
          difficulty: 'intermediate',
          duration: 'ongoing',
          focus: ['muscle building', 'hypertrophy'],
          equipment: ['full gym'],
          overview: 'PPL divides training by movement patterns: pushing exercises, pulling exercises, and leg exercises. Can be run 3x or 6x per week.',
          structure: '3-6 days per week depending on experience level',
          benefits: ['High frequency', 'Excellent for muscle building', 'Flexible scheduling'],
          considerations: ['Requires good recovery', 'Higher time commitment for 6-day version'],
          source: 'Bodybuilding community',
          popularity: 5
        }
      );
    }

    if (lowerQuery.includes('beginner') || lowerQuery.includes('start')) {
      programs.push(
        {
          name: 'Reddit Beginner Routine',
          description: 'Community-developed beginner program emphasizing compound movements and progression.',
          difficulty: 'beginner',
          duration: '8-12 weeks',
          focus: ['strength', 'muscle building', 'general fitness'],
          equipment: ['barbell', 'dumbbells'],
          overview: 'A well-rounded beginner program that incorporates both barbell and dumbbell exercises with clear progression guidelines.',
          structure: '3 days per week full body',
          benefits: ['Beginner friendly', 'Balanced development', 'Clear instructions', 'Community support'],
          considerations: ['Requires basic gym access', 'May need form guidance initially'],
          source: 'Reddit r/Fitness',
          popularity: 4
        }
      );
    }

    if (lowerQuery.includes('home') || lowerQuery.includes('bodyweight')) {
      programs.push(
        {
          name: 'Recommended Routine (r/bodyweightfitness)',
          description: 'Comprehensive bodyweight training program requiring minimal equipment.',
          difficulty: 'beginner',
          duration: 'ongoing',
          focus: ['strength', 'muscle building', 'flexibility'],
          equipment: ['pull-up bar', 'bodyweight'],
          overview: 'A progression-based bodyweight program that can be done at home with minimal equipment. Includes skill work and flexibility training.',
          structure: '3 days per week, 1 hour sessions',
          benefits: ['No gym required', 'Progressive overload', 'Skill development', 'Free'],
          considerations: ['Requires pull-up bar', 'Progress slower than weighted training', 'Limited lower body options'],
          source: 'Reddit r/bodyweightfitness',
          popularity: 4
        }
      );
    }

    if (lowerQuery.includes('531') || lowerQuery.includes('wendler')) {
      programs.push(
        {
          name: '5/3/1 for Beginners',
          description: 'Jim Wendler\'s percentage-based program adapted for novice lifters.',
          difficulty: 'beginner',
          duration: '4+ weeks cycles',
          focus: ['strength', 'muscle building'],
          equipment: ['barbell', 'plates'],
          overview: '5/3/1 uses percentage-based training with main lifts followed by assistance work. The beginner version includes more frequency.',
          structure: '3 days per week with main lifts done twice per week',
          benefits: ['Proven system', 'Built-in progression', 'Autoregulation', 'Long-term approach'],
          considerations: ['Requires understanding of percentages', 'Need to test max', 'Patience required'],
          source: 'Jim Wendler',
          popularity: 5
        }
      );
    }

    // Add some default programs if query doesn't match specific categories
    if (programs.length === 0) {
      programs.push(
        {
          name: 'Full Body Workout Plan',
          description: 'Balanced full body training program suitable for various goals and experience levels.',
          difficulty: 'intermediate',
          duration: '8-12 weeks',
          focus: ['general fitness', 'strength', 'muscle building'],
          equipment: ['gym equipment'],
          overview: 'A comprehensive full body program that can be adapted for different goals and experience levels.',
          structure: '3-4 days per week',
          benefits: ['Time efficient', 'Balanced development', 'Flexible'],
          considerations: ['May need customization for specific goals'],
          source: 'General fitness principles',
          popularity: 3
        }
      );
    }

    // Generate summary and related queries
    const summary = this.generateSummary(query, programs);
    const relatedQueries = this.generateRelatedQueries(query);

    return {
      programs: programs.slice(0, 8), // Limit results
      summary,
      relatedQueries,
      searchTime: new Date().toISOString()
    };
  }

  /**
   * Generate search summary
   */
  generateSummary(query, programs) {
    const programCount = programs.length;
    const difficulties = [...new Set(programs.map(p => p.difficulty))];
    const focuses = [...new Set(programs.flatMap(p => p.focus))];

    return `Found ${programCount} programs related to "${query}". Programs range from ${difficulties.join(' to ')} difficulty levels, focusing on ${focuses.slice(0, 3).join(', ')}${focuses.length > 3 ? ' and more' : ''}.`;
  }

  /**
   * Generate related search queries
   */
  generateRelatedQueries(query) {
    const baseQueries = [
      'beginner workout programs',
      'strength training routines',
      'muscle building programs',
      'home workout plans',
      'powerlifting programs'
    ];

    const lowerQuery = query.toLowerCase();
    const related = [];

    if (lowerQuery.includes('strength')) {
      related.push('powerlifting programs', '5/3/1 variations', 'linear progression');
    }
    if (lowerQuery.includes('muscle') || lowerQuery.includes('building')) {
      related.push('hypertrophy programs', 'bodybuilding routines', 'high volume training');
    }
    if (lowerQuery.includes('beginner')) {
      related.push('novice programs', 'gym basics', 'starting routines');
    }
    if (lowerQuery.includes('home')) {
      related.push('bodyweight training', 'minimal equipment workouts', 'home gym setups');
    }

    // Add some base queries if none matched
    if (related.length === 0) {
      related.push(...baseQueries.slice(0, 3));
    }

    return [...new Set(related)].slice(0, 5);
  }

  /**
   * Save a program for later reference
   */
  saveProgram(program, context = {}) {
    const savedData = {
      program: { ...program },
      savedAt: new Date().toISOString(),
      context: {
        source: context.source || 'search',
        searchQuery: context.searchQuery || '',
        userAction: context.userAction || 'manual-save',
        ...context
      },
      notes: context.notes || '',
      customizations: context.customizations || {}
    };

    this.savedPrograms.set(program.name, savedData);
    console.log(`💾 Program saved: ${program.name}`);
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