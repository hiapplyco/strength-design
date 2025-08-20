/**
 * Session Context Manager
 * 
 * Comprehensive session-based context tracking system for the Strength.Design mobile app.
 * This service tracks all context gathered during a user session across different screens
 * and provides a unified interface for adding, retrieving, and managing session context.
 * 
 * Features:
 * - Persistent session storage that survives navigation
 * - Context expiration and automatic cleanup
 * - Type-safe context management
 * - Session analytics and insights
 * - Performance optimized with lazy loading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class SessionContextManager {
  constructor() {
    this.sessionId = null;
    this.sessionContext = {
      exercises: [],
      nutrition: [],
      programs: [],
      biometrics: {},
      preferences: {},
      goals: [],
      equipment: [],
      injuries: [],
      schedulePreferences: {},
      searchHistory: [],
      metadata: {
        startTime: null,
        lastUpdated: null,
        screenVisits: {},
        contextSources: {}
      }
    };
    this.listeners = new Set();
    this.initialized = false;
    this.storageKey = 'session_context';
  }

  /**
   * Initialize the session manager
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Generate new session ID or restore existing
      this.sessionId = await this._getOrCreateSessionId();
      
      // Load existing session context if available
      await this._loadSessionContext();
      
      // Initialize metadata
      if (!this.sessionContext.metadata.startTime) {
        this.sessionContext.metadata.startTime = Date.now();
      }
      this.sessionContext.metadata.lastUpdated = Date.now();
      
      this.initialized = true;
      
      // Save initial state
      await this._saveSessionContext();
      
      console.log('📊 SessionContextManager initialized:', {
        sessionId: this.sessionId,
        hasExistingContext: Object.keys(this.sessionContext).some(key => 
          key !== 'metadata' && Array.isArray(this.sessionContext[key]) ? 
          this.sessionContext[key].length > 0 : 
          Object.keys(this.sessionContext[key] || {}).length > 0
        )
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize SessionContextManager:', error);
      this.initialized = true; // Continue with empty state
    }
  }

  /**
   * Add exercises to session context
   */
  async addExercises(exercises, source = 'unknown') {
    await this._ensureInitialized();
    
    if (!Array.isArray(exercises)) {
      exercises = [exercises];
    }
    
    // Add or update exercises (avoid duplicates by ID)
    exercises.forEach(exercise => {
      const existingIndex = this.sessionContext.exercises.findIndex(
        ex => ex.id === exercise.id
      );
      
      if (existingIndex >= 0) {
        // Update existing exercise
        this.sessionContext.exercises[existingIndex] = {
          ...this.sessionContext.exercises[existingIndex],
          ...exercise,
          lastUpdated: Date.now()
        };
      } else {
        // Add new exercise
        this.sessionContext.exercises.push({
          ...exercise,
          addedAt: Date.now(),
          source
        });
      }
    });
    
    await this._updateContext('exercises', source);
    
    console.log(`✅ Added ${exercises.length} exercises to session context`);
  }

  /**
   * Add nutrition items to session context
   */
  async addNutrition(nutritionItems, source = 'unknown') {
    await this._ensureInitialized();
    
    if (!Array.isArray(nutritionItems)) {
      nutritionItems = [nutritionItems];
    }
    
    // Add or update nutrition items
    nutritionItems.forEach(item => {
      const existingIndex = this.sessionContext.nutrition.findIndex(
        nut => nut.id === item.id
      );
      
      if (existingIndex >= 0) {
        this.sessionContext.nutrition[existingIndex] = {
          ...this.sessionContext.nutrition[existingIndex],
          ...item,
          lastUpdated: Date.now()
        };
      } else {
        this.sessionContext.nutrition.push({
          ...item,
          addedAt: Date.now(),
          source
        });
      }
    });
    
    await this._updateContext('nutrition', source);
    
    console.log(`✅ Added ${nutritionItems.length} nutrition items to session context`);
  }

  /**
   * Add program to session context
   */
  async addProgram(program, source = 'unknown') {
    await this._ensureInitialized();
    
    // Store the selected program (replace existing)
    this.sessionContext.programs = [{
      ...program,
      addedAt: Date.now(),
      source
    }];
    
    await this._updateContext('programs', source);
    
    console.log(`✅ Added program "${program.name}" to session context`);
  }

  /**
   * Update biometric data
   */
  async updateBiometrics(biometrics, source = 'profile') {
    await this._ensureInitialized();
    
    this.sessionContext.biometrics = {
      ...this.sessionContext.biometrics,
      ...biometrics,
      lastUpdated: Date.now(),
      source
    };
    
    await this._updateContext('biometrics', source);
    
    console.log('✅ Updated biometrics in session context');
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences, source = 'profile') {
    await this._ensureInitialized();
    
    this.sessionContext.preferences = {
      ...this.sessionContext.preferences,
      ...preferences,
      lastUpdated: Date.now(),
      source
    };
    
    await this._updateContext('preferences', source);
    
    console.log('✅ Updated preferences in session context');
  }

  /**
   * Add goals to session context
   */
  async addGoals(goals, source = 'profile') {
    await this._ensureInitialized();
    
    if (!Array.isArray(goals)) {
      goals = [goals];
    }
    
    // Merge with existing goals (avoid duplicates)
    goals.forEach(goal => {
      if (!this.sessionContext.goals.some(g => g.id === goal.id || g.name === goal.name)) {
        this.sessionContext.goals.push({
          ...goal,
          addedAt: Date.now(),
          source
        });
      }
    });
    
    await this._updateContext('goals', source);
    
    console.log(`✅ Added ${goals.length} goals to session context`);
  }

  /**
   * Track screen visit for analytics
   */
  async trackScreenVisit(screenName) {
    await this._ensureInitialized();
    
    if (!this.sessionContext.metadata.screenVisits[screenName]) {
      this.sessionContext.metadata.screenVisits[screenName] = {
        count: 0,
        firstVisit: Date.now(),
        lastVisit: Date.now()
      };
    }
    
    this.sessionContext.metadata.screenVisits[screenName].count++;
    this.sessionContext.metadata.screenVisits[screenName].lastVisit = Date.now();
    
    await this._saveSessionContext();
  }

  /**
   * Get full session context
   */
  async getFullContext() {
    await this._ensureInitialized();
    return { ...this.sessionContext };
  }

  /**
   * Get context summary for display
   */
  async getSummary() {
    await this._ensureInitialized();
    
    const exerciseCount = this.sessionContext.exercises.length;
    const nutritionCount = this.sessionContext.nutrition.length;
    const programCount = this.sessionContext.programs.length;
    const hasBiometrics = Object.keys(this.sessionContext.biometrics).length > 0;
    const hasPreferences = Object.keys(this.sessionContext.preferences).length > 0;
    const goalCount = this.sessionContext.goals.length;
    
    const completionItems = [
      { type: 'exercises', count: exerciseCount, icon: '💪', label: 'exercises selected' },
      { type: 'nutrition', count: nutritionCount, icon: '🍽️', label: 'nutrition items selected' },
      { type: 'programs', count: programCount, icon: '📋', label: 'program selected' },
      { type: 'biometrics', hasData: hasBiometrics, icon: '📊', label: 'biometric data added' },
      { type: 'preferences', hasData: hasPreferences, icon: '⚙️', label: 'preferences set' },
      { type: 'goals', count: goalCount, icon: '🎯', label: 'goals defined' }
    ];
    
    const completedCount = completionItems.filter(item => 
      (item.count !== undefined && item.count > 0) || 
      (item.hasData !== undefined && item.hasData)
    ).length;
    
    const totalItems = completionItems.length;
    const completionPercentage = Math.round((completedCount / totalItems) * 100);
    
    return {
      completionPercentage,
      completedCount,
      totalItems,
      items: completionItems,
      hasMinimalContext: exerciseCount > 0 || programCount > 0,
      hasRichContext: completedCount >= 4,
      recommendations: this._generateRecommendations(completionItems),
      sessionDuration: Date.now() - this.sessionContext.metadata.startTime,
      sessionId: this.sessionId
    };
  }

  /**
   * Get context for AI chat generation
   */
  async getAIChatContext() {
    await this._ensureInitialized();
    
    const context = await this.getFullContext();
    const summary = await this.getSummary();
    
    // Build comprehensive context for AI
    let chatContext = '';
    
    if (context.exercises.length > 0) {
      chatContext += `\n## Selected Exercises (${context.exercises.length}):\n`;
      context.exercises.forEach(ex => {
        chatContext += `- ${ex.name} (${ex.category}, targets: ${ex.primary_muscles?.join(', ') || ex.muscleGroups || 'unknown'})\n`;
      });
    }
    
    if (context.nutrition.length > 0) {
      chatContext += `\n## Selected Nutrition (${context.nutrition.length}):\n`;
      context.nutrition.forEach(nut => {
        chatContext += `- ${nut.name}: ${nut.calories || 0} cal, ${nut.protein || 0}g protein\n`;
      });
    }
    
    if (context.programs.length > 0) {
      const program = context.programs[0];
      chatContext += `\n## Selected Program:\n- ${program.name} by ${program.creator || 'Unknown'}\n`;
      if (program.description) chatContext += `- Description: ${program.description}\n`;
    }
    
    if (Object.keys(context.biometrics).length > 0) {
      chatContext += `\n## User Biometrics:\n`;
      Object.entries(context.biometrics).forEach(([key, value]) => {
        if (key !== 'lastUpdated' && key !== 'source') {
          chatContext += `- ${key}: ${value}\n`;
        }
      });
    }
    
    if (Object.keys(context.preferences).length > 0) {
      chatContext += `\n## User Preferences:\n`;
      Object.entries(context.preferences).forEach(([key, value]) => {
        if (key !== 'lastUpdated' && key !== 'source') {
          chatContext += `- ${key}: ${value}\n`;
        }
      });
    }
    
    if (context.goals.length > 0) {
      chatContext += `\n## User Goals:\n`;
      context.goals.forEach(goal => {
        chatContext += `- ${goal.name || goal.title || goal}\n`;
      });
    }
    
    return {
      contextText: chatContext,
      summary,
      fullContext: context
    };
  }

  /**
   * Clear current session
   */
  async clearSession() {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      await AsyncStorage.removeItem('session_id');
      
      // Reset context
      this.sessionContext = {
        exercises: [],
        nutrition: [],
        programs: [],
        biometrics: {},
        preferences: {},
        goals: [],
        equipment: [],
        injuries: [],
        schedulePreferences: {},
        searchHistory: [],
        metadata: {
          startTime: Date.now(),
          lastUpdated: Date.now(),
          screenVisits: {},
          contextSources: {}
        }
      };
      
      // Generate new session ID
      this.sessionId = this._generateSessionId();
      await AsyncStorage.setItem('session_id', this.sessionId);
      
      // Notify listeners
      this._notifyListeners('session_cleared');
      
      console.log('🗑️ Session context cleared');
      
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  /**
   * Add change listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Check if session has enough context for AI generation
   */
  async hasMinimalContext() {
    const summary = await this.getSummary();
    return summary.hasMinimalContext;
  }

  /**
   * Check if session has rich context
   */
  async hasRichContext() {
    const summary = await this.getSummary();
    return summary.hasRichContext;
  }

  // Private methods

  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async _getOrCreateSessionId() {
    try {
      let sessionId = await AsyncStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = this._generateSessionId();
        await AsyncStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      console.error('Failed to get/create session ID:', error);
      return this._generateSessionId();
    }
  }

  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _loadSessionContext() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Check if session is still valid (not older than 24 hours)
        const sessionAge = Date.now() - (parsed.metadata?.startTime || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxAge) {
          this.sessionContext = {
            ...this.sessionContext,
            ...parsed
          };
          console.log('📂 Loaded existing session context');
        } else {
          console.log('⏰ Session expired, starting fresh');
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session context:', error);
    }
  }

  async _saveSessionContext() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.sessionContext));
    } catch (error) {
      console.error('Failed to save session context:', error);
    }
  }

  async _updateContext(type, source) {
    // Update metadata
    this.sessionContext.metadata.lastUpdated = Date.now();
    this.sessionContext.metadata.contextSources[type] = source;
    
    // Save to storage
    await this._saveSessionContext();
    
    // Notify listeners
    this._notifyListeners('context_updated', { type, source });
  }

  _notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in session context listener:', error);
      }
    });
  }

  _generateRecommendations(completionItems) {
    const recommendations = [];
    
    const exercisesItem = completionItems.find(item => item.type === 'exercises');
    const nutritionItem = completionItems.find(item => item.type === 'nutrition');
    const programsItem = completionItems.find(item => item.type === 'programs');
    const biometricsItem = completionItems.find(item => item.type === 'biometrics');
    const preferencesItem = completionItems.find(item => item.type === 'preferences');
    const goalsItem = completionItems.find(item => item.type === 'goals');
    
    if (!exercisesItem || exercisesItem.count === 0) {
      recommendations.push({
        type: 'missing',
        screen: 'Search',
        title: 'Select Some Exercises',
        description: 'Browse our exercise library to find movements you want to include'
      });
    }
    
    if (!programsItem || programsItem.count === 0) {
      recommendations.push({
        type: 'missing',
        screen: 'Workouts',
        title: 'Choose a Program',
        description: 'Select a proven workout program to follow'
      });
    }
    
    if (!biometricsItem || !biometricsItem.hasData) {
      recommendations.push({
        type: 'missing',
        screen: 'Profile',
        title: 'Add Your Stats',
        description: 'Enter your height, weight, and fitness level for better recommendations'
      });
    }
    
    if (!goalsItem || goalsItem.count === 0) {
      recommendations.push({
        type: 'missing',
        screen: 'Profile',
        title: 'Set Your Goals',
        description: 'Define what you want to achieve to get targeted workouts'
      });
    }
    
    if (!nutritionItem || nutritionItem.count === 0) {
      recommendations.push({
        type: 'optional',
        screen: 'Search',
        title: 'Add Nutrition Info',
        description: 'Include foods you like for meal planning suggestions'
      });
    }
    
    if (!preferencesItem || !preferencesItem.hasData) {
      recommendations.push({
        type: 'optional',
        screen: 'Profile',
        title: 'Set Preferences',
        description: 'Configure workout preferences and equipment availability'
      });
    }
    
    return recommendations;
  }
}

// Create singleton instance
const sessionContextManager = new SessionContextManager();

export default sessionContextManager;