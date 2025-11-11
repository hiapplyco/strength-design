/**
 * Search Analytics & Suggestions Service
 *
 * Tracks search patterns and provides intelligent suggestions:
 * - Recent searches (last 20 with timestamps)
 * - Popular search terms (frequency tracking)
 * - Search analytics (count, first/last used)
 * - Auto-cleanup of old data
 *
 * Based on mobile/services/storageService.js patterns
 * Uses IndexedDB for persistence
 */

// ============================================================================
// Types
// ============================================================================

export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
  filters?: {
    categories?: string[];
    equipment?: string[];
    muscles?: string[];
    difficulty?: string;
  };
}

export interface SearchAnalytics {
  [queryLowercase: string]: {
    originalQuery: string;
    count: number;
    firstUsed: number;
    lastUsed: number;
  };
}

export interface PopularSearch {
  query: string;
  count: number;
}

// ============================================================================
// IndexedDB Helpers
// ============================================================================

const DB_NAME = 'strengthDesignSearch';
const DB_VERSION = 1;
const STORE_NAME_HISTORY = 'searchHistory';
const STORE_NAME_ANALYTICS = 'searchAnalytics';

class IndexedDBHelper {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAME_HISTORY)) {
          const historyStore = db.createObjectStore(STORE_NAME_HISTORY, {
            keyPath: 'id',
            autoIncrement: true
          });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('query', 'query', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAME_ANALYTICS)) {
          db.createObjectStore(STORE_NAME_ANALYTICS, { keyPath: 'queryKey' });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Get object from store
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Get all objects from store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('IndexedDB getAll error:', error);
      return [];
    }
  }

  /**
   * Put object in store
   */
  async put(storeName: string, value: any): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('IndexedDB put error:', error);
    }
  }

  /**
   * Delete object from store
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
    }
  }

  /**
   * Clear entire store
   */
  async clear(storeName: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }
}

// ============================================================================
// Search Analytics Service
// ============================================================================

class SearchAnalyticsService {
  private db = new IndexedDBHelper();
  private readonly MAX_HISTORY = 20;
  private readonly HISTORY_TTL_DAYS = 30;
  private readonly ANALYTICS_MIN_COUNT = 2;
  private readonly ANALYTICS_TTL_DAYS = 60;

  /**
   * Add search to history
   */
  async addSearchToHistory(entry: Omit<SearchHistoryEntry, 'timestamp'>): Promise<void> {
    const historyEntry: SearchHistoryEntry = {
      ...entry,
      timestamp: Date.now()
    };

    await this.db.put(STORE_NAME_HISTORY, historyEntry);

    // Cleanup old entries
    await this.cleanupHistory();

    // Update analytics
    await this.updateAnalytics(entry.query);
  }

  /**
   * Get recent searches
   */
  async getRecentSearches(limit: number = 10): Promise<SearchHistoryEntry[]> {
    const history = await this.db.getAll<SearchHistoryEntry>(STORE_NAME_HISTORY);

    // Sort by timestamp (newest first)
    const sorted = history.sort((a, b) => b.timestamp - a.timestamp);

    // Remove duplicates (keep most recent)
    const seen = new Set<string>();
    const unique = sorted.filter(entry => {
      const key = entry.query.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.slice(0, limit);
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
    const analyticsArray = await this.db.getAll<{
      queryKey: string;
      originalQuery: string;
      count: number;
      firstUsed: number;
      lastUsed: number;
    }>(STORE_NAME_ANALYTICS);

    // Sort by count (highest first)
    const sorted = analyticsArray
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted.map(item => ({
      query: item.originalQuery,
      count: item.count
    }));
  }

  /**
   * Update analytics for a search
   */
  private async updateAnalytics(query: string): Promise<void> {
    const queryKey = query.toLowerCase();
    const existing = await this.db.get<{
      queryKey: string;
      originalQuery: string;
      count: number;
      firstUsed: number;
      lastUsed: number;
    }>(STORE_NAME_ANALYTICS, queryKey);

    if (existing) {
      // Update existing entry
      await this.db.put(STORE_NAME_ANALYTICS, {
        ...existing,
        count: existing.count + 1,
        lastUsed: Date.now()
      });
    } else {
      // Create new entry
      await this.db.put(STORE_NAME_ANALYTICS, {
        queryKey,
        originalQuery: query,
        count: 1,
        firstUsed: Date.now(),
        lastUsed: Date.now()
      });
    }

    // Cleanup old analytics
    await this.cleanupAnalytics();
  }

  /**
   * Cleanup old history entries
   */
  private async cleanupHistory(): Promise<void> {
    const history = await this.db.getAll<SearchHistoryEntry & { id: number }>(STORE_NAME_HISTORY);
    const cutoffTime = Date.now() - this.HISTORY_TTL_DAYS * 24 * 60 * 60 * 1000;

    // Remove entries older than TTL
    const toDelete = history.filter(entry => entry.timestamp < cutoffTime);
    for (const entry of toDelete) {
      await this.db.delete(STORE_NAME_HISTORY, entry.id);
    }

    // Keep only MAX_HISTORY most recent
    if (history.length > this.MAX_HISTORY) {
      const sorted = history.sort((a, b) => b.timestamp - a.timestamp);
      const toRemove = sorted.slice(this.MAX_HISTORY);
      for (const entry of toRemove) {
        await this.db.delete(STORE_NAME_HISTORY, entry.id);
      }
    }
  }

  /**
   * Cleanup old analytics entries
   */
  private async cleanupAnalytics(): Promise<void> {
    const analyticsArray = await this.db.getAll<{
      queryKey: string;
      originalQuery: string;
      count: number;
      firstUsed: number;
      lastUsed: number;
    }>(STORE_NAME_ANALYTICS);

    const cutoffTime = Date.now() - this.ANALYTICS_TTL_DAYS * 24 * 60 * 60 * 1000;

    // Remove entries with low count and old timestamp
    for (const entry of analyticsArray) {
      if (entry.count < this.ANALYTICS_MIN_COUNT && entry.lastUsed < cutoffTime) {
        await this.db.delete(STORE_NAME_ANALYTICS, entry.queryKey);
      }
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await this.db.clear(STORE_NAME_HISTORY);
  }

  /**
   * Clear all analytics
   */
  async clearAnalytics(): Promise<void> {
    await this.db.clear(STORE_NAME_ANALYTICS);
  }

  /**
   * Clear everything
   */
  async clearAll(): Promise<void> {
    await this.clearHistory();
    await this.clearAnalytics();
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    if (!partialQuery) return [];

    const query = partialQuery.toLowerCase();
    const recent = await this.getRecentSearches(20);
    const popular = await this.getPopularSearches(20);

    // Combine and deduplicate
    const allQueries = [
      ...recent.map(r => r.query),
      ...popular.map(p => p.query)
    ];

    const unique = Array.from(new Set(allQueries));

    // Filter matches
    const matches = unique.filter(q =>
      q.toLowerCase().includes(query) || query.includes(q.toLowerCase())
    );

    return matches.slice(0, limit);
  }
}

// Export singleton instance
export const searchAnalyticsService = new SearchAnalyticsService();

// Export class for testing
export { SearchAnalyticsService };
