// Import the full exercises database
import exercisesData from '../assets/wrkout-exercises-full.json';

/**
 * Advanced Search Service
 * 
 * Features:
 * - Search operators (AND, OR, NOT)
 * - Fuzzy/typo-tolerant searching
 * - Multi-field search capabilities
 * - Result caching and optimization
 * - Search suggestions and auto-complete
 * - Filter presets and combinations
 */
class SearchService {
  constructor() {
    // Load exercises from local JSON
    this.exercisesDatabase = exercisesData || [];
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    console.log(`📚 Loaded ${this.exercisesDatabase.length} exercises from local database`);
    
    // Popular search terms and categories
    this.popularTerms = [
      'bench press', 'squat', 'deadlift', 'bicep curl', 'push up',
      'plank', 'cardio', 'abs', 'legs', 'arms', 'chest', 'back'
    ];
    
    // Search operators
    this.operators = {
      AND: ['AND', '&', '+'],
      OR: ['OR', '|'],
      NOT: ['NOT', '!', '-']
    };
    
    // Filter presets
    this.filterPresets = {
      'home-workout': {
        name: 'Home Workout',
        description: 'Bodyweight exercises you can do at home',
        filters: {
          equipment: ['bodyweight', 'none'],
          categories: [],
          muscles: [],
          difficulty: [],
          saved: false
        }
      },
      'gym-essentials': {
        name: 'Gym Essentials',
        description: 'Core gym exercises with equipment',
        filters: {
          equipment: ['barbell', 'dumbbell', 'machine'],
          categories: ['strength'],
          muscles: [],
          difficulty: [],
          saved: false
        }
      },
      'beginner-friendly': {
        name: 'Beginner Friendly',
        description: 'Easy exercises for beginners',
        filters: {
          equipment: [],
          categories: [],
          muscles: [],
          difficulty: ['beginner'],
          saved: false
        }
      },
      'cardio-blast': {
        name: 'Cardio Blast',
        description: 'High-intensity cardio exercises',
        filters: {
          equipment: [],
          categories: ['cardio', 'plyometrics'],
          muscles: [],
          difficulty: [],
          saved: false
        }
      },
      'upper-body': {
        name: 'Upper Body',
        description: 'Focus on upper body muscles',
        filters: {
          equipment: [],
          categories: [],
          muscles: ['chest', 'shoulders', 'biceps', 'triceps', 'back'],
          difficulty: [],
          saved: false
        }
      },
      'lower-body': {
        name: 'Lower Body',
        description: 'Focus on lower body muscles',
        filters: {
          equipment: [],
          categories: [],
          muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
          difficulty: [],
          saved: false
        }
      }
    };
  }
  
  /**
   * Parse search query for operators and terms
   */
  parseSearchQuery(query) {
    if (!query || typeof query !== 'string') {
      return { terms: [], operators: [], cleanQuery: '' };
    }
    
    const tokens = query.trim().split(/\s+/);
    const terms = [];
    const operators = [];
    let cleanQuery = '';
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].toUpperCase();
      
      // Check for operators
      if (this.operators.AND.includes(token)) {
        operators.push({ type: 'AND', position: i });
      } else if (this.operators.OR.includes(token)) {
        operators.push({ type: 'OR', position: i });
      } else if (this.operators.NOT.includes(token)) {
        operators.push({ type: 'NOT', position: i });
      } else {
        // Regular search term
        terms.push(tokens[i].toLowerCase());
        cleanQuery += (cleanQuery ? ' ' : '') + tokens[i];
      }
    }
    
    return { terms, operators, cleanQuery };
  }
  
  /**
   * Create cache key for search parameters
   */
  createCacheKey(query, filters = {}) {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    return `${query.toLowerCase().trim()}|${filterString}`;
  }
  
  /**
   * Check if cache entry is still valid
   */
  isCacheValid(cacheEntry) {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }
  
  /**
   * Main search function
   */
  async searchExercises(params) {
    const {
      query = '',
      categories = [],
      equipment = [],
      muscles = [],
      difficulty = [],
      limit = 200
    } = params;
    
    try {
      const searchTerm = query.trim().toLowerCase();
      
      // Filter exercises from local database
      let filteredExercises = this.exercisesDatabase.filter(exercise => {
        // Text search
        if (searchTerm) {
          const matchesQuery = 
            (exercise.name?.toLowerCase().includes(searchTerm)) ||
            (exercise.description?.toLowerCase().includes(searchTerm)) ||
            (exercise.instructions?.some(i => typeof i === 'string' && i.toLowerCase().includes(searchTerm))) ||
            (exercise.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm))) ||
            (exercise.secondary_muscles?.some(m => m.toLowerCase().includes(searchTerm))) ||
            (Array.isArray(exercise.equipment) 
              ? exercise.equipment.some(e => e.toLowerCase().includes(searchTerm))
              : exercise.equipment?.toLowerCase().includes(searchTerm));
          
          if (!matchesQuery) return false;
        }
        
        // Category filter
        if (categories.length > 0) {
          const exerciseCategory = exercise.category?.toLowerCase();
          if (!categories.some(cat => cat.toLowerCase() === exerciseCategory)) {
            return false;
          }
        }
        
        // Equipment filter
        if (equipment.length > 0) {
          const exerciseEquipment = Array.isArray(exercise.equipment) 
            ? exercise.equipment.map(e => e.toLowerCase())
            : [exercise.equipment?.toLowerCase()].filter(Boolean);
          
          if (!equipment.some(eq => 
            exerciseEquipment.some(e => e.includes(eq.toLowerCase()))
          )) {
            return false;
          }
        }
        
        // Muscle filter
        if (muscles.length > 0) {
          const primaryMuscles = exercise.primary_muscles?.map(m => m.toLowerCase()) || [];
          const secondaryMuscles = exercise.secondary_muscles?.map(m => m.toLowerCase()) || [];
          const allMuscles = [...primaryMuscles, ...secondaryMuscles];
          
          if (!muscles.some(muscle => 
            allMuscles.some(m => m.includes(muscle.toLowerCase()))
          )) {
            return false;
          }
        }
        
        // Difficulty filter
        if (difficulty.length > 0) {
          const exerciseDifficulty = exercise.difficulty?.toLowerCase();
          if (!difficulty.some(diff => diff.toLowerCase() === exerciseDifficulty)) {
            return false;
          }
        }
        
        return true;
      });
      
      // Process exercises to add placeholders for missing images
      const processedExercises = filteredExercises.map(ex => ({
        ...ex,
        // Add search score for relevance ranking
        searchScore: this.calculateSearchScore(ex, query),
        images: ex.images && ex.images.length > 0 && !ex.images[0].includes('example.com') 
          ? ex.images 
          : [this.getExercisePlaceholder(ex.category, ex.name)]
      }));
      
      // Sort by search score for better relevance
      processedExercises.sort((a, b) => b.searchScore - a.searchScore);
      
      // Apply limit
      const limitedExercises = processedExercises.slice(0, limit);
      
      console.log(`🔍 Found ${limitedExercises.length} exercises matching query: "${query}"`);
      
      return {
        exercises: limitedExercises,
        total: filteredExercises.length,
        query,
        filters: params
      };
      
    } catch (error) {
      console.error('Search service error:', error);
      // Fallback to empty result instead of throwing
      return {
        exercises: [],
        total: 0,
        query,
        filters: params
      };
    }
  }
  
  /**
   * Calculate search relevance score
   */
  calculateSearchScore(exercise, query) {
    if (!query) return 1;
    
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Exact name match gets highest score
    if (exercise.name && exercise.name.toLowerCase() === queryLower) {
      score += 100;
    }
    
    // Name starts with query
    if (exercise.name && exercise.name.toLowerCase().startsWith(queryLower)) {
      score += 50;
    }
    
    // Name contains query
    if (exercise.name && exercise.name.toLowerCase().includes(queryLower)) {
      score += 25;
    }
    
    // Category match
    if (exercise.category && exercise.category.toLowerCase().includes(queryLower)) {
      score += 20;
    }
    
    // Equipment match (equipment is an array)
    if (exercise.equipment) {
      const equipmentArray = Array.isArray(exercise.equipment) ? exercise.equipment : [exercise.equipment];
      equipmentArray.forEach(equip => {
        if (equip && equip.toLowerCase && equip.toLowerCase().includes(queryLower)) {
          score += 15;
        }
      });
    }
    
    // Muscle groups match
    if (exercise.primaryMuscles) {
      exercise.primaryMuscles.forEach(muscle => {
        if (muscle.toLowerCase().includes(queryLower)) {
          score += 10;
        }
      });
    }
    
    // Instructions contain query
    if (exercise.instructions) {
      const instructionText = exercise.instructions.join(' ').toLowerCase();
      if (instructionText.includes(queryLower)) {
        score += 5;
      }
    }
    
    return score;
  }
  
  /**
   * Apply local filtering for advanced features
   */
  applyLocalFiltering(exercises, searchParams, filters) {
    let filtered = [...exercises];
    
    // Apply multi-category filtering (since Firebase function only supports one)
    if (filters.categories && filters.categories.length > 1) {
      filtered = filtered.filter(ex => 
        filters.categories.includes(ex.category)
      );
    }
    
    // Apply multi-equipment filtering
    if (filters.equipment && filters.equipment.length > 1) {
      filtered = filtered.filter(ex => 
        filters.equipment.includes(ex.equipment)
      );
    }
    
    // Apply multi-difficulty filtering
    if (filters.difficulty && filters.difficulty.length > 1) {
      filtered = filtered.filter(ex => 
        filters.difficulty.includes(ex.difficulty)
      );
    }
    
    // Apply muscle group filtering
    if (filters.muscles && filters.muscles.length > 0) {
      filtered = filtered.filter(ex => {
        const exerciseMuscles = [
          ...(ex.primaryMuscles || []),
          ...(ex.secondaryMuscles || [])
        ].map(m => m.toLowerCase());
        
        return filters.muscles.some(muscle => 
          exerciseMuscles.includes(muscle.toLowerCase())
        );
      });
    }
    
    // Apply search operators (AND, OR, NOT)
    if (searchParams.operators && searchParams.operators.length > 0) {
      filtered = this.applySearchOperators(filtered, searchParams);
    }
    
    // Apply fuzzy matching for typos
    if (searchParams.terms && searchParams.terms.length > 0) {
      filtered = this.applyFuzzyMatching(filtered, searchParams.terms);
    }
    
    return filtered;
  }
  
  /**
   * Apply search operators (AND, OR, NOT)
   */
  applySearchOperators(exercises, searchParams) {
    // For now, implement basic AND logic
    // This can be expanded for more complex operator parsing
    return exercises.filter(exercise => {
      return searchParams.terms.every(term => {
        const searchText = [
          exercise.name,
          exercise.category,
          exercise.equipment,
          ...(exercise.primaryMuscles || []),
          ...(exercise.secondaryMuscles || [])
        ].join(' ').toLowerCase();
        
        return searchText.includes(term.toLowerCase());
      });
    });
  }
  
  /**
   * Apply fuzzy matching for typo tolerance
   */
  applyFuzzyMatching(exercises, terms) {
    return exercises.filter(exercise => {
      return terms.some(term => {
        const exerciseName = exercise.name.toLowerCase();
        
        // Simple fuzzy matching using Levenshtein distance
        if (this.calculateLevenshteinDistance(term, exerciseName) <= 2) {
          return true;
        }
        
        // Check if term is substring of name (for partial matches)
        if (exerciseName.includes(term) || term.includes(exerciseName)) {
          return true;
        }
        
        return false;
      });
    });
  }
  
  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  calculateLevenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Generate search suggestions
   */
  generateSuggestions(query, recentSearches = [], popularSearches = []) {
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Add matching recent searches
    recentSearches.forEach(search => {
      if (search.toLowerCase().includes(queryLower) && search !== query) {
        suggestions.push({
          type: 'recent',
          text: search,
          priority: 10
        });
      }
    });
    
    // Add matching popular searches
    popularSearches.forEach(search => {
      if (search.toLowerCase().includes(queryLower) && search !== query) {
        suggestions.push({
          type: 'popular',
          text: search,
          priority: 8
        });
      }
    });
    
    // Add matching popular terms
    this.popularTerms.forEach(term => {
      if (term.toLowerCase().includes(queryLower) && term !== query) {
        suggestions.push({
          type: 'suggestion',
          text: term,
          priority: 6
        });
      }
    });
    
    // Generate "Did you mean?" suggestions for typos
    if (query.length >= 3) {
      this.popularTerms.forEach(term => {
        const distance = this.calculateLevenshteinDistance(queryLower, term.toLowerCase());
        if (distance <= 2 && distance > 0) {
          suggestions.push({
            type: 'correction',
            text: term,
            original: query,
            priority: 5
          });
        }
      });
    }
    
    // Sort by priority and limit
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8)
      .map(s => s.text);
  }
  
  /**
   * Get filter preset by name
   */
  getFilterPreset(presetName) {
    return this.filterPresets[presetName];
  }
  
  /**
   * Get all available filter presets
   */
  getAllFilterPresets() {
    return Object.entries(this.filterPresets).map(([key, preset]) => ({
      id: key,
      ...preset
    }));
  }
  
  /**
   * Generate exercise placeholder image (matches the existing function)
   */
  getExercisePlaceholder(category, name) {
    const categoryColors = {
      strength: 'FF6B35',
      cardio: '4CAF50',
      stretching: '2196F3',
      plyometrics: 'FF5722',
      powerlifting: '795548',
      olympic: '9C27B0',
      strongman: '795548',
      calisthenics: '9C27B0',
      default: '666666'
    };
    
    const color = categoryColors[category?.toLowerCase()] || categoryColors.default;
    const displayName = name ? name.substring(0, 20) : 'Exercise';
    
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23${color}' opacity='0.05'/%3E%3Crect x='0' y='170' width='300' height='30' fill='%23${color}' opacity='0.1'/%3E%3Cg transform='translate(150, 85)'%3E%3Ccircle r='40' fill='none' stroke='%23${color}' stroke-width='2' opacity='0.3'/%3E%3Cpath d='M-20,-10 L-10,-10 L-10,10 L-20,10 M10,-10 L20,-10 L20,10 L10,10 M-10,-5 L10,-5' stroke='%23${color}' stroke-width='2' fill='none' opacity='0.4'/%3E%3C/g%3E%3Ctext x='150' y='188' text-anchor='middle' fill='%23${color}' font-family='system-ui' font-size='11' font-weight='500' opacity='0.7'%3E${displayName}%3C/text%3E%3C/svg%3E`;
  }
  
  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (error.code === 'functions/not-found' || error.code === 'internal') {
      return 'The exercise database is currently being updated. Please check back in a few minutes.';
    } else if (error.code === 'functions/unauthenticated') {
      return 'Please sign in to access exercises.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Please check your internet connection.';
    } else if (error.message?.includes('CORS')) {
      return 'The exercise service is being deployed. Please try again in a few minutes.';
    } else if (error.message?.includes('Invalid response')) {
      return 'The server returned invalid data. Please try again later.';
    } else {
      return 'The service is temporarily unavailable. Please try again later.';
    }
  }
  
  /**
   * Get all exercises for debugging/fallback
   */
  getAllExercises() {
    return this.exercisesDatabase;
  }
}

// Export singleton instance
export const searchService = new SearchService();