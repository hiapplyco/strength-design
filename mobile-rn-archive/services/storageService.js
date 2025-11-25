import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Service for persisting user preferences and search data
 * 
 * Features:
 * - Recent searches tracking
 * - Popular searches analytics
 * - User preferences storage
 * - Search filter presets
 * - Performance optimization with batching
 */
class StorageService {
  constructor() {
    this.keys = {
      RECENT_SEARCHES: '@exercise_library/recent_searches',
      POPULAR_SEARCHES: '@exercise_library/popular_searches',
      USER_PREFERENCES: '@exercise_library/user_preferences',
      FILTER_PRESETS: '@exercise_library/filter_presets',
      SEARCH_ANALYTICS: '@exercise_library/search_analytics'
    };
    
    this.maxRecentSearches = 20;
    this.maxPopularSearches = 50;
  }
  
  /**
   * Generic storage helpers
   */
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }
  
  async getItem(key, defaultValue = null) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return defaultValue;
    }
  }
  
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }
  
  /**
   * Recent Searches Management
   */
  async getRecentSearches() {
    const searches = await this.getItem(this.keys.RECENT_SEARCHES, []);
    
    // Sort by timestamp (most recent first)
    return searches
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(search => search.query)
      .slice(0, this.maxRecentSearches);
  }
  
  async saveRecentSearch(query) {
    if (!query || query.trim().length === 0) return;
    
    const trimmedQuery = query.trim().toLowerCase();
    const searches = await this.getItem(this.keys.RECENT_SEARCHES, []);
    
    // Remove existing entry if it exists
    const filtered = searches.filter(search => 
      search.query.toLowerCase() !== trimmedQuery
    );
    
    // Add new search at the beginning
    const updated = [
      {
        query: query.trim(),
        timestamp: new Date().toISOString(),
        count: 1
      },
      ...filtered
    ].slice(0, this.maxRecentSearches);
    
    await this.setItem(this.keys.RECENT_SEARCHES, updated);
    
    // Update search analytics
    await this.updateSearchAnalytics(query.trim());
  }
  
  async clearRecentSearches() {
    await this.removeItem(this.keys.RECENT_SEARCHES);
  }
  
  /**
   * Popular Searches Management
   */
  async getPopularSearches() {
    const analytics = await this.getItem(this.keys.SEARCH_ANALYTICS, {});
    
    // Convert to array and sort by count
    const searches = Object.entries(analytics)
      .map(([query, data]) => ({
        query,
        count: data.count,
        lastUsed: data.lastUsed
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, this.maxPopularSearches)
      .map(item => item.query);
    
    return searches;
  }
  
  async updateSearchAnalytics(query) {
    const analytics = await this.getItem(this.keys.SEARCH_ANALYTICS, {});
    const normalizedQuery = query.toLowerCase().trim();
    
    if (analytics[normalizedQuery]) {
      analytics[normalizedQuery].count += 1;
      analytics[normalizedQuery].lastUsed = new Date().toISOString();
    } else {
      analytics[normalizedQuery] = {
        originalQuery: query,
        count: 1,
        firstUsed: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };
    }
    
    await this.setItem(this.keys.SEARCH_ANALYTICS, analytics);
  }
  
  /**
   * User Preferences Management
   */
  async getUserPreferences() {
    return await this.getItem(this.keys.USER_PREFERENCES, {
      searchDebounceMs: 300,
      maxSearchResults: 200,
      enableFuzzySearch: true,
      enableSearchSuggestions: true,
      saveSearchHistory: true,
      defaultSortBy: 'relevance', // relevance, name, category, difficulty
      theme: 'dark',
      showSearchTime: true,
      enableHapticFeedback: true,
      autoSelectFirstSuggestion: false
    });
  }
  
  async saveUserPreferences(preferences) {
    const current = await this.getUserPreferences();
    const updated = { ...current, ...preferences };
    await this.setItem(this.keys.USER_PREFERENCES, updated);
  }
  
  async resetUserPreferences() {
    await this.removeItem(this.keys.USER_PREFERENCES);
  }
  
  /**
   * Custom Filter Presets Management
   */
  async getCustomFilterPresets() {
    return await this.getItem(this.keys.FILTER_PRESETS, []);
  }
  
  async saveCustomFilterPreset(preset) {
    if (!preset.name || !preset.filters) {
      throw new Error('Preset must have name and filters');
    }
    
    const presets = await this.getCustomFilterPresets();
    const existing = presets.findIndex(p => p.name === preset.name);
    
    const newPreset = {
      id: preset.id || `custom_${Date.now()}`,
      name: preset.name,
      description: preset.description || '',
      filters: preset.filters,
      searchQuery: preset.searchQuery || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      useCount: preset.useCount || 0
    };
    
    if (existing >= 0) {
      // Update existing preset
      presets[existing] = {
        ...presets[existing],
        ...newPreset,
        createdAt: presets[existing].createdAt // Keep original creation date
      };
    } else {
      // Add new preset
      presets.push(newPreset);
    }
    
    await this.setItem(this.keys.FILTER_PRESETS, presets);
    return newPreset;
  }
  
  async deleteCustomFilterPreset(presetId) {
    const presets = await this.getCustomFilterPresets();
    const filtered = presets.filter(p => p.id !== presetId);
    await this.setItem(this.keys.FILTER_PRESETS, filtered);
  }
  
  async incrementPresetUsage(presetId) {
    const presets = await this.getCustomFilterPresets();
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
      preset.useCount = (preset.useCount || 0) + 1;
      preset.lastUsed = new Date().toISOString();
      await this.setItem(this.keys.FILTER_PRESETS, presets);
    }
  }
  
  /**
   * Data Export/Import for backup
   */
  async exportUserData() {
    try {
      const data = {
        recentSearches: await this.getItem(this.keys.RECENT_SEARCHES, []),
        searchAnalytics: await this.getItem(this.keys.SEARCH_ANALYTICS, {}),
        userPreferences: await this.getItem(this.keys.USER_PREFERENCES, {}),
        customPresets: await this.getItem(this.keys.FILTER_PRESETS, []),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return data;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }
  
  async importUserData(data) {
    try {
      if (!data || !data.version) {
        throw new Error('Invalid data format');
      }
      
      // Import each data type if present
      if (data.recentSearches) {
        await this.setItem(this.keys.RECENT_SEARCHES, data.recentSearches);
      }
      
      if (data.searchAnalytics) {
        await this.setItem(this.keys.SEARCH_ANALYTICS, data.searchAnalytics);
      }
      
      if (data.userPreferences) {
        await this.setItem(this.keys.USER_PREFERENCES, data.userPreferences);
      }
      
      if (data.customPresets) {
        await this.setItem(this.keys.FILTER_PRESETS, data.customPresets);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      throw error;
    }
  }
  
  /**
   * Data Cleanup and Maintenance
   */
  async cleanupOldData() {
    try {
      // Clean up old recent searches (older than 30 days)
      const recentSearches = await this.getItem(this.keys.RECENT_SEARCHES, []);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredRecent = recentSearches.filter(search => 
        new Date(search.timestamp) > thirtyDaysAgo
      );
      
      if (filteredRecent.length !== recentSearches.length) {
        await this.setItem(this.keys.RECENT_SEARCHES, filteredRecent);
      }
      
      // Clean up search analytics (remove entries with count < 2 and older than 60 days)
      const analytics = await this.getItem(this.keys.SEARCH_ANALYTICS, {});
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const cleanedAnalytics = {};
      Object.entries(analytics).forEach(([query, data]) => {
        const lastUsed = new Date(data.lastUsed);
        if (data.count >= 2 || lastUsed > sixtyDaysAgo) {
          cleanedAnalytics[query] = data;
        }
      });
      
      if (Object.keys(cleanedAnalytics).length !== Object.keys(analytics).length) {
        await this.setItem(this.keys.SEARCH_ANALYTICS, cleanedAnalytics);
      }
      
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }
  
  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('@exercise_library/'));
      
      const stats = {
        totalKeys: appKeys.length,
        recentSearchesCount: 0,
        analyticsEntries: 0,
        customPresets: 0,
        estimatedSize: 0
      };
      
      // Get detailed counts
      const recentSearches = await this.getItem(this.keys.RECENT_SEARCHES, []);
      stats.recentSearchesCount = recentSearches.length;
      
      const analytics = await this.getItem(this.keys.SEARCH_ANALYTICS, {});
      stats.analyticsEntries = Object.keys(analytics).length;
      
      const presets = await this.getItem(this.keys.FILTER_PRESETS, []);
      stats.customPresets = presets.length;
      
      // Estimate storage size (rough calculation)
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          stats.estimatedSize += value.length;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }
  
  /**
   * Clear all app data
   */
  async clearAllData() {
    try {
      const keys = Object.values(this.keys);
      await Promise.all(keys.map(key => this.removeItem(key)));
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();