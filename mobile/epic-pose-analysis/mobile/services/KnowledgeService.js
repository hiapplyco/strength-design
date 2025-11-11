import { httpsCallable, getFunctions } from 'firebase/functions';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Knowledge Service
 * 
 * Provides access to the fitness knowledge base for the mobile app.
 * Integrates with Firebase Functions for search and Firebase Firestore for direct access.
 * 
 * Features:
 * - Search knowledge base with filters and ranking
 * - Get knowledge statistics and insights
 * - Cache results for better performance
 * - Offline support with local caching
 */
class KnowledgeService {
  constructor() {
    this.functions = getFunctions();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Initialize callable functions
    this.searchKnowledgeFunction = httpsCallable(this.functions, 'searchKnowledge');
    this.getKnowledgeStatsFunction = httpsCallable(this.functions, 'getKnowledgeStats');
    
    // Vector search functions
    this.semanticSearchFunction = httpsCallable(this.functions, 'semanticSearch');
    this.findSimilarContentFunction = httpsCallable(this.functions, 'findSimilarContent');
    this.generateEmbeddingsFunction = httpsCallable(this.functions, 'generateEmbeddings');
    this.batchProcessEmbeddingsFunction = httpsCallable(this.functions, 'batchProcessEmbeddings');
    this.getEmbeddingStatsFunction = httpsCallable(this.functions, 'getEmbeddingProcessingStats');
    
    console.log('🧠 KnowledgeService initialized');
  }

  /**
   * Search the knowledge base
   */
  async searchKnowledge(params = {}) {
    const {
      query = '',
      filters = {},
      limit = 20,
      offset = 0,
      sort = 'relevance',
      useCache = true
    } = params;

    try {
      // Create cache key
      const cacheKey = this.createCacheKey('search', { query, filters, limit, offset, sort });
      
      // Check cache first
      if (useCache && this.isCacheValid(cacheKey)) {
        console.log('📋 Returning cached search results');
        return this.cache.get(cacheKey).data;
      }

      console.log('🔍 Searching knowledge base', { query, filters, limit });

      // Call Firebase Function
      const result = await this.searchKnowledgeFunction({
        query,
        filters,
        limit,
        offset,
        sort
      });

      const searchResults = {
        results: result.data.results || [],
        total: result.data.total || 0,
        query: result.data.query,
        filters: result.data.filters,
        processing_time: result.data.processing_time || 0,
        suggestions: result.data.suggestions || [],
        cached_at: new Date().toISOString()
      };

      // Cache the results
      if (useCache) {
        this.cache.set(cacheKey, {
          data: searchResults,
          timestamp: Date.now()
        });
      }

      console.log(`✅ Found ${searchResults.results.length} knowledge items`);
      return searchResults;

    } catch (error) {
      console.error('❌ Knowledge search failed:', error);
      
      // Fallback to local search if available
      if (query) {
        return this.fallbackLocalSearch(query, filters, limit);
      }
      
      throw new Error(`Knowledge search failed: ${error.message}`);
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeStats(options = {}) {
    const {
      include_details = false,
      date_range = null,
      useCache = true
    } = options;

    try {
      const cacheKey = this.createCacheKey('stats', { include_details, date_range });
      
      if (useCache && this.isCacheValid(cacheKey)) {
        console.log('📊 Returning cached knowledge stats');
        return this.cache.get(cacheKey).data;
      }

      console.log('📊 Fetching knowledge statistics');

      const result = await this.getKnowledgeStatsFunction({
        include_details,
        date_range
      });

      const stats = {
        ...result.data,
        cached_at: new Date().toISOString()
      };

      // Cache the stats
      if (useCache) {
        this.cache.set(cacheKey, {
          data: stats,
          timestamp: Date.now()
        });
      }

      return stats;

    } catch (error) {
      console.error('❌ Failed to get knowledge stats:', error);
      throw new Error(`Knowledge stats failed: ${error.message}`);
    }
  }

  /**
   * Get knowledge by content type
   */
  async getKnowledgeByType(contentType, limitCount = 10) {
    try {
      const cacheKey = this.createCacheKey('by_type', { contentType, limitCount });
      
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }

      console.log(`📚 Fetching ${contentType} knowledge items`);

      // Direct Firestore query for better performance
      const knowledgeRef = collection(db, 'knowledge');
      const q = query(
        knowledgeRef,
        where('content_type', '==', contentType),
        orderBy('quality_score', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
      }));

      // Cache the results
      this.cache.set(cacheKey, {
        data: items,
        timestamp: Date.now()
      });

      console.log(`✅ Retrieved ${items.length} ${contentType} items`);
      return items;

    } catch (error) {
      console.error(`❌ Failed to get ${contentType} knowledge:`, error);
      return [];
    }
  }

  /**
   * Get high-quality knowledge items
   */
  async getHighQualityKnowledge(limitCount = 20) {
    try {
      const cacheKey = this.createCacheKey('high_quality', { limitCount });
      
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }

      console.log('🌟 Fetching high-quality knowledge items');

      const knowledgeRef = collection(db, 'knowledge');
      const q = query(
        knowledgeRef,
        where('quality_score', '>=', 0.8),
        orderBy('quality_score', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
      }));

      this.cache.set(cacheKey, {
        data: items,
        timestamp: Date.now()
      });

      return items;

    } catch (error) {
      console.error('❌ Failed to get high-quality knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge by tags
   */
  async getKnowledgeByTags(tags, limitCount = 15) {
    try {
      if (!Array.isArray(tags) || tags.length === 0) {
        return [];
      }

      const cacheKey = this.createCacheKey('by_tags', { tags: tags.sort(), limitCount });
      
      if (this.isCacheValid(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }

      console.log('🏷️ Fetching knowledge by tags:', tags);

      const knowledgeRef = collection(db, 'knowledge');
      const q = query(
        knowledgeRef,
        where('tags', 'array-contains-any', tags),
        orderBy('quality_score', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
      }));

      this.cache.set(cacheKey, {
        data: items,
        timestamp: Date.now()
      });

      return items;

    } catch (error) {
      console.error('❌ Failed to get knowledge by tags:', error);
      return [];
    }
  }

  /**
   * Get random knowledge items for discovery
   */
  async getRandomKnowledge(limitCount = 10) {
    try {
      console.log('🎲 Fetching random knowledge items');

      // Get total count first (simplified approach)
      const knowledgeRef = collection(db, 'knowledge');
      const countQuery = query(knowledgeRef, limit(1000)); // Reasonable sample size
      const countSnapshot = await getDocs(countQuery);
      
      if (countSnapshot.empty) {
        return [];
      }

      // Get random subset
      const allDocs = countSnapshot.docs;
      const randomIndices = this.getRandomIndices(allDocs.length, limitCount);
      
      const randomItems = randomIndices.map(index => {
        const doc = allDocs[index];
        return {
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
        };
      });

      return randomItems;

    } catch (error) {
      console.error('❌ Failed to get random knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge suggestions based on user context
   */
  async getKnowledgeSuggestions(context = {}) {
    try {
      const {
        recent_searches = [],
        preferred_content_types = [],
        fitness_goals = [],
        experience_level = 'beginner'
      } = context;

      console.log('💡 Getting personalized knowledge suggestions');

      // Build search filters based on context
      const filters = {};
      
      if (preferred_content_types.length > 0) {
        filters.content_type = preferred_content_types;
      }

      // Get suggestions based on experience level
      let qualityThreshold = 0.6;
      if (experience_level === 'advanced') {
        qualityThreshold = 0.8;
      } else if (experience_level === 'intermediate') {
        qualityThreshold = 0.7;
      }

      filters.min_quality_score = qualityThreshold;

      // Search for relevant content
      const suggestions = await this.searchKnowledge({
        query: fitness_goals.join(' '),
        filters,
        limit: 10,
        sort: 'quality'
      });

      return suggestions.results;

    } catch (error) {
      console.error('❌ Failed to get knowledge suggestions:', error);
      return [];
    }
  }

  /**
   * Fallback local search when cloud function fails
   */
  async fallbackLocalSearch(query, filters = {}, limitCount = 20) {
    try {
      console.log('🔄 Using fallback local search');

      const knowledgeRef = collection(db, 'knowledge');
      let q = query(knowledgeRef);

      // Apply filters
      if (filters.content_type && filters.content_type.length > 0) {
        q = query(q, where('content_type', 'in', filters.content_type));
      }

      if (filters.min_quality_score) {
        q = query(q, where('quality_score', '>=', filters.min_quality_score));
      }

      q = query(q, orderBy('quality_score', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
      }));

      // Simple client-side text filtering
      const queryLower = query.toLowerCase();
      const filteredItems = items.filter(item => {
        const searchText = `${item.title} ${item.content} ${item.tags?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(queryLower);
      });

      return {
        results: filteredItems,
        total: filteredItems.length,
        query,
        filters,
        fallback: true
      };

    } catch (error) {
      console.error('❌ Fallback search failed:', error);
      return {
        results: [],
        total: 0,
        query,
        filters,
        error: error.message
      };
    }
  }

  /**
   * Helper methods
   */
  createCacheKey(operation, params) {
    return `${operation}_${JSON.stringify(params, Object.keys(params).sort())}`;
  }

  isCacheValid(cacheKey) {
    const cached = this.cache.get(cacheKey);
    return cached && (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  getRandomIndices(max, count) {
    const indices = new Set();
    while (indices.size < Math.min(count, max)) {
      indices.add(Math.floor(Math.random() * max));
    }
    return Array.from(indices);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Knowledge cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cached_items: this.cache.size,
      cache_timeout: this.cacheTimeout,
      cache_keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Semantic search using vector embeddings
   */
  async semanticSearch(params = {}) {
    const {
      query = '',
      filters = {},
      limit = 20,
      similarity_threshold = 0.5,
      hybrid_search = true,
      useCache = true
    } = params;

    try {
      // Create cache key
      const cacheKey = this.createCacheKey('semantic_search', { 
        query, filters, limit, similarity_threshold, hybrid_search 
      });
      
      // Check cache first
      if (useCache && this.isCacheValid(cacheKey)) {
        console.log('🔮 Returning cached semantic search results');
        return this.cache.get(cacheKey).data;
      }

      console.log('🔮 Performing semantic search', { query, filters, limit });

      // Call semantic search function
      const result = await this.semanticSearchFunction({
        query,
        filters,
        limit,
        similarity_threshold,
        hybrid_search
      });

      const searchResults = {
        results: result.data.results || [],
        total: result.data.total || 0,
        query: result.data.query,
        filters: result.data.filters,
        processing_time: result.data.processing_time || 0,
        similarity_threshold,
        stats: result.data.stats || {},
        search_type: 'semantic',
        cached_at: new Date().toISOString()
      };

      // Cache the results
      if (useCache) {
        this.cache.set(cacheKey, {
          data: searchResults,
          timestamp: Date.now()
        });
      }

      console.log(`✨ Found ${searchResults.results.length} semantically similar items`);
      return searchResults;

    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      
      // Fallback to regular search
      console.log('🔄 Falling back to keyword search');
      return this.searchKnowledge({ query, filters, limit, sort: 'relevance' });
    }
  }

  /**
   * Find content similar to a specific knowledge item
   */
  async findSimilarContent(contentId, options = {}) {
    const {
      limit = 10,
      min_similarity = 0.6,
      useCache = true
    } = options;

    try {
      const cacheKey = this.createCacheKey('similar_content', { contentId, limit, min_similarity });
      
      if (useCache && this.isCacheValid(cacheKey)) {
        console.log('🔗 Returning cached similar content');
        return this.cache.get(cacheKey).data;
      }

      console.log('🔗 Finding similar content for:', contentId);

      const result = await this.findSimilarContentFunction({
        content_id: contentId,
        limit,
        min_similarity
      });

      const similarContent = {
        reference_content_id: contentId,
        similar_items: result.data.similar_content || [],
        total_found: result.data.total_found || 0,
        cached_at: new Date().toISOString()
      };

      // Cache the results
      if (useCache) {
        this.cache.set(cacheKey, {
          data: similarContent,
          timestamp: Date.now()
        });
      }

      console.log(`🔗 Found ${similarContent.similar_items.length} similar items`);
      return similarContent;

    } catch (error) {
      console.error('❌ Failed to find similar content:', error);
      return {
        reference_content_id: contentId,
        similar_items: [],
        total_found: 0,
        error: error.message
      };
    }
  }

  /**
   * Intelligent search that combines keyword and semantic search
   */
  async intelligentSearch(params = {}) {
    const {
      query = '',
      filters = {},
      limit = 20,
      useCache = true
    } = params;

    try {
      console.log('🧠 Performing intelligent search', { query });

      // For short queries, prefer keyword search
      // For longer, complex queries, prefer semantic search
      const queryWords = query.trim().split(/\s+/);
      const useSemanticSearch = queryWords.length > 2 || query.length > 20;

      let primaryResults, secondaryResults;

      if (useSemanticSearch) {
        // Primary: Semantic search
        primaryResults = await this.semanticSearch({
          query,
          filters,
          limit: Math.ceil(limit * 0.7),
          useCache
        });

        // Secondary: Keyword search for additional context
        secondaryResults = await this.searchKnowledge({
          query,
          filters,
          limit: Math.ceil(limit * 0.3),
          useCache
        });
      } else {
        // Primary: Keyword search
        primaryResults = await this.searchKnowledge({
          query,
          filters,
          limit: Math.ceil(limit * 0.7),
          useCache
        });

        // Secondary: Semantic search for broader context
        secondaryResults = await this.semanticSearch({
          query,
          filters,
          limit: Math.ceil(limit * 0.3),
          similarity_threshold: 0.4, // Lower threshold for broader results
          useCache
        });
      }

      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(
        primaryResults.results,
        secondaryResults.results,
        limit
      );

      return {
        results: combinedResults,
        total: combinedResults.length,
        query,
        filters,
        search_strategy: useSemanticSearch ? 'semantic_primary' : 'keyword_primary',
        primary_results: primaryResults.results.length,
        secondary_results: secondaryResults.results.length,
        processing_time: (primaryResults.processing_time || 0) + (secondaryResults.processing_time || 0),
        cached_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Intelligent search failed:', error);
      
      // Fallback to simple keyword search
      return this.searchKnowledge({ query, filters, limit });
    }
  }

  /**
   * Generate embeddings for new content
   */
  async generateEmbeddings(contentId, text = null) {
    try {
      console.log('🔬 Generating embeddings', { contentId, hasText: !!text });

      const result = await this.generateEmbeddingsFunction({
        content_id: contentId,
        text: text,
        overwrite: false
      });

      console.log('✅ Embeddings generated successfully');
      return result.data;

    } catch (error) {
      console.error('❌ Failed to generate embeddings:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Get embedding processing statistics
   */
  async getEmbeddingStats(options = {}) {
    const { days = 7, useCache = true } = options;

    try {
      const cacheKey = this.createCacheKey('embedding_stats', { days });
      
      if (useCache && this.isCacheValid(cacheKey)) {
        console.log('📊 Returning cached embedding stats');
        return this.cache.get(cacheKey).data;
      }

      console.log('📊 Fetching embedding statistics');

      const result = await this.getEmbeddingStatsFunction({ days });

      const stats = {
        ...result.data,
        cached_at: new Date().toISOString()
      };

      // Cache the stats
      if (useCache) {
        this.cache.set(cacheKey, {
          data: stats,
          timestamp: Date.now()
        });
      }

      return stats;

    } catch (error) {
      console.error('❌ Failed to get embedding stats:', error);
      return {
        overall_stats: {
          total_embeddings: 0,
          model_version: 'unknown'
        },
        recent_processing: {
          total_runs: 0,
          aggregated_stats: {}
        },
        error: error.message
      };
    }
  }

  /**
   * Smart content recommendations based on user context
   */
  async getSmartRecommendations(context = {}) {
    try {
      const {
        recent_searches = [],
        current_workout_type = null,
        fitness_goals = [],
        experience_level = 'beginner',
        content_preferences = []
      } = context;

      console.log('🎯 Getting smart recommendations', { context });

      // Build intelligent query from user context
      const queryParts = [];
      
      if (current_workout_type) {
        queryParts.push(current_workout_type);
      }
      
      if (fitness_goals.length > 0) {
        queryParts.push(...fitness_goals.slice(0, 2)); // Top 2 goals
      }

      // Add recent search terms for personalization
      if (recent_searches.length > 0) {
        const recentTerms = recent_searches
          .slice(0, 3)
          .map(search => search.split(' ')[0]) // First word of each search
          .filter(term => term.length > 3);
        queryParts.push(...recentTerms);
      }

      const smartQuery = queryParts.join(' ');

      // Use semantic search for better understanding of intent
      const recommendations = await this.semanticSearch({
        query: smartQuery || 'fitness training',
        filters: {
          content_type: content_preferences.length > 0 ? content_preferences : undefined,
          min_quality_score: experience_level === 'advanced' ? 0.8 : 0.6
        },
        limit: 15,
        similarity_threshold: 0.4 // Lower threshold for broader recommendations
      });

      // If semantic search doesn't yield enough results, supplement with popular content
      if (recommendations.results.length < 10) {
        const popularContent = await this.getHighQualityKnowledge(10);
        const additionalContent = popularContent.filter(item => 
          !recommendations.results.some(rec => rec.id === item.id)
        );
        
        recommendations.results.push(...additionalContent.slice(0, 10 - recommendations.results.length));
        recommendations.total = recommendations.results.length;
      }

      console.log(`🎯 Generated ${recommendations.results.length} smart recommendations`);

      return {
        ...recommendations,
        recommendation_type: 'smart_contextual',
        user_context: context,
        query_used: smartQuery
      };

    } catch (error) {
      console.error('❌ Failed to get smart recommendations:', error);
      
      // Fallback to high-quality content
      const fallback = await this.getHighQualityKnowledge(15);
      return {
        results: fallback,
        total: fallback.length,
        recommendation_type: 'fallback_quality',
        error: error.message
      };
    }
  }

  /**
   * Combine and deduplicate search results from multiple sources
   */
  combineSearchResults(primaryResults, secondaryResults, limit) {
    const seen = new Set();
    const combined = [];

    // Add primary results first (higher priority)
    for (const item of primaryResults) {
      if (!seen.has(item.id) && combined.length < limit) {
        seen.add(item.id);
        combined.push({
          ...item,
          source_type: 'primary'
        });
      }
    }

    // Add secondary results for additional context
    for (const item of secondaryResults) {
      if (!seen.has(item.id) && combined.length < limit) {
        seen.add(item.id);
        combined.push({
          ...item,
          source_type: 'secondary'
        });
      }
    }

    return combined;
  }

  /**
   * Preload popular content types
   */
  async preloadPopularContent() {
    try {
      console.log('📦 Preloading popular knowledge content');
      
      const popularTypes = ['exercise', 'routine', 'nutrition', 'guide'];
      const promises = popularTypes.map(type => 
        this.getKnowledgeByType(type, 5)
      );

      await Promise.all(promises);
      
      // Also preload high-quality items
      await this.getHighQualityKnowledge(10);
      
      // Preload embedding stats for dashboard
      await this.getEmbeddingStats();
      
      console.log('✅ Popular content preloaded');

    } catch (error) {
      console.warn('⚠️ Failed to preload content:', error.message);
    }
  }
}

// Export singleton instance
export const knowledgeService = new KnowledgeService();

// Export class for testing
export { KnowledgeService };