import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Utility functions for embedding operations
 * 
 * Provides common functionality for:
 * - Vector operations (similarity, distance)
 * - Batch processing helpers
 * - Performance optimization
 * - Cache management
 * - Index management
 */

export interface VectorStats {
  dimensions: number;
  magnitude: number;
  mean: number;
  std: number;
}

export interface SimilarityResult {
  id: string;
  similarity: number;
  distance?: number;
}

export interface EmbeddingIndex {
  id: string;
  embedding: number[];
  metadata: {
    content_type: string;
    quality_score: number;
    tags: string[];
    created_at: string;
  };
}

/**
 * Vector similarity calculations
 */
export class VectorUtils {
  
  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  static euclideanDistance(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vector dimensions must match');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Calculate dot product between two vectors
   */
  static dotProduct(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vector dimensions must match');
    }

    let product = 0;
    for (let i = 0; i < vectorA.length; i++) {
      product += vectorA[i] * vectorB[i];
    }

    return product;
  }

  /**
   * Calculate vector magnitude (L2 norm)
   */
  static magnitude(vector: number[]): number {
    let sum = 0;
    for (const value of vector) {
      sum += value * value;
    }
    return Math.sqrt(sum);
  }

  /**
   * Normalize vector to unit length
   */
  static normalize(vector: number[]): number[] {
    const mag = this.magnitude(vector);
    if (mag === 0) {
      return vector.slice(); // Return copy of zero vector
    }
    return vector.map(value => value / mag);
  }

  /**
   * Calculate vector statistics
   */
  static getVectorStats(vector: number[]): VectorStats {
    const dimensions = vector.length;
    const magnitude = this.magnitude(vector);
    const mean = vector.reduce((sum, val) => sum + val, 0) / dimensions;
    
    const variance = vector.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dimensions;
    const std = Math.sqrt(variance);

    return { dimensions, magnitude, mean, std };
  }

  /**
   * Find top-k most similar vectors using linear search
   */
  static findTopSimilar(
    queryVector: number[],
    candidateVectors: EmbeddingIndex[],
    k: number = 10,
    minSimilarity: number = 0.5
  ): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    for (const candidate of candidateVectors) {
      try {
        const similarity = this.cosineSimilarity(queryVector, candidate.embedding);
        
        if (similarity >= minSimilarity) {
          results.push({
            id: candidate.id,
            similarity,
            distance: 1 - similarity // Convert similarity to distance
          });
        }
      } catch (error) {
        logger.warn(`Failed to calculate similarity for ${candidate.id}`, { error });
      }
    }

    // Sort by similarity (highest first) and return top-k
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }
}

/**
 * Batch processing utilities for embeddings
 */
export class BatchProcessor {
  private static readonly DEFAULT_BATCH_SIZE = 10;
  private static readonly DEFAULT_DELAY_MS = 1000;

  /**
   * Process items in batches with rate limiting
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
      batchSize?: number;
      delayMs?: number;
      onProgress?: (processed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      delayMs = this.DEFAULT_DELAY_MS,
      onProgress
    } = options;

    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(item => 
        processor(item).catch(error => {
          logger.error('Batch item processing failed', { error: error.message });
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      
      // Filter out null results (failed items)
      const validResults = batchResults.filter(result => result !== null) as R[];
      results.push(...validResults);

      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, items.length), items.length);
      }

      // Rate limiting delay between batches
      if (i + batchSize < items.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Process embeddings in chunks for memory efficiency
   */
  static async processEmbeddingsInChunks<T>(
    embeddings: EmbeddingIndex[],
    queryVector: number[],
    processor: (chunk: EmbeddingIndex[], query: number[]) => Promise<T[]>,
    chunkSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < embeddings.length; i += chunkSize) {
      const chunk = embeddings.slice(i, i + chunkSize);
      
      try {
        const chunkResults = await processor(chunk, queryVector);
        results.push(...chunkResults);
      } catch (error) {
        logger.error(`Chunk processing failed for chunk ${i}-${i + chunkSize}`, { error });
      }
    }

    return results;
  }
}

/**
 * Embedding cache management
 */
export class EmbeddingCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get cached embedding result
   */
  static get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache entry
   */
  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Generate cache key for search parameters
   */
  static generateSearchKey(query: string, filters: any, options: any): string {
    const keyData = {
      query: query.toLowerCase().trim(),
      filters: this.normalizeFilters(filters),
      options: this.normalizeOptions(options)
    };
    return JSON.stringify(keyData);
  }

  /**
   * Clear expired cache entries
   */
  static cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    logger.info('Cache cleanup completed', { 
      expired_entries: expiredKeys.length,
      remaining_entries: this.cache.size 
    });
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getStats(): { size: number; hit_rate: number } {
    return {
      size: this.cache.size,
      hit_rate: 0 // TODO: Implement hit rate tracking
    };
  }

  private static normalizeFilters(filters: any): any {
    if (!filters) return {};
    
    // Sort arrays to ensure consistent cache keys
    const normalized = { ...filters };
    if (normalized.content_type) {
      normalized.content_type = [...normalized.content_type].sort();
    }
    if (normalized.tags) {
      normalized.tags = [...normalized.tags].sort();
    }
    
    return normalized;
  }

  private static normalizeOptions(options: any): any {
    if (!options) return {};
    
    // Pick only relevant options for caching
    return {
      limit: options.limit || 20,
      similarity_threshold: options.similarity_threshold || 0.5,
      hybrid_search: options.hybrid_search !== false
    };
  }
}

/**
 * Firestore index management for embeddings
 */
export class EmbeddingIndexManager {
  
  /**
   * Create composite indexes for embedding queries
   */
  static async ensureIndexes(db: any): Promise<void> {
    try {
      logger.info('Ensuring embedding indexes exist');
      
      // Note: Firestore indexes must be created via firebase CLI or console
      // This function documents the required indexes
      
      const requiredIndexes = [
        {
          collection: 'knowledge_embeddings',
          fields: [
            { field: 'content_type', order: 'ASCENDING' },
            { field: 'quality_score', order: 'DESCENDING' }
          ]
        },
        {
          collection: 'knowledge_embeddings',
          fields: [
            { field: 'source', order: 'ASCENDING' },
            { field: 'created_at', order: 'DESCENDING' }
          ]
        },
        {
          collection: 'knowledge_embeddings',
          fields: [
            { field: 'tags', order: 'ASCENDING' },
            { field: 'quality_score', order: 'DESCENDING' }
          ]
        }
      ];

      logger.info('Required Firestore indexes for embeddings', { indexes: requiredIndexes });
      
    } catch (error) {
      logger.error('Failed to ensure embedding indexes', { error });
    }
  }

  /**
   * Get embedding statistics from Firestore
   */
  static async getEmbeddingStats(db: any): Promise<any> {
    try {
      const embeddingsCollection = db.collection('knowledge_embeddings');
      
      // Get total count
      const countSnapshot = await embeddingsCollection.count().get();
      const totalEmbeddings = countSnapshot.data().count;

      // Get embeddings by content type
      const contentTypeStats: Record<string, number> = {};
      const contentTypes = ['exercise', 'routine', 'nutrition', 'guide', 'science', 'discussion'];
      
      for (const contentType of contentTypes) {
        const typeSnapshot = await embeddingsCollection
          .where('content_type', '==', contentType)
          .count()
          .get();
        contentTypeStats[contentType] = typeSnapshot.data().count;
      }

      // Get recent embeddings
      const recentSnapshot = await embeddingsCollection
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();

      const lastUpdated = recentSnapshot.empty 
        ? null 
        : recentSnapshot.docs[0].data().created_at?.toDate?.()?.toISOString();

      return {
        total_embeddings: totalEmbeddings,
        content_type_distribution: contentTypeStats,
        last_updated: lastUpdated,
        dimensions: 768, // Gemini text-embedding-004 dimensions
        model_version: 'text-embedding-004'
      };

    } catch (error) {
      logger.error('Failed to get embedding stats', { error });
      throw error;
    }
  }

  /**
   * Clean up orphaned embeddings (embeddings without corresponding knowledge documents)
   */
  static async cleanupOrphanedEmbeddings(db: any): Promise<{ deleted: number }> {
    try {
      logger.info('Starting orphaned embeddings cleanup');

      const embeddingsCollection = db.collection('knowledge_embeddings');
      const knowledgeCollection = db.collection('knowledge');

      // Get all embedding document IDs
      const embeddingsSnapshot = await embeddingsCollection.select().get();
      const embeddingIds = embeddingsSnapshot.docs.map(doc => doc.id);

      let deletedCount = 0;
      const batchSize = 10;

      for (let i = 0; i < embeddingIds.length; i += batchSize) {
        const batch = embeddingIds.slice(i, i + batchSize);
        
        for (const embeddingId of batch) {
          try {
            // Check if corresponding knowledge document exists
            const knowledgeDoc = await knowledgeCollection.doc(embeddingId).get();
            
            if (!knowledgeDoc.exists) {
              // Delete orphaned embedding
              await embeddingsCollection.doc(embeddingId).delete();
              deletedCount++;
              logger.info(`Deleted orphaned embedding: ${embeddingId}`);
            }
          } catch (error) {
            logger.warn(`Failed to check/delete embedding ${embeddingId}`, { error });
          }
        }

        // Small delay between batches
        if (i + batchSize < embeddingIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info('Orphaned embeddings cleanup completed', { deleted: deletedCount });
      return { deleted: deletedCount };

    } catch (error) {
      logger.error('Orphaned embeddings cleanup failed', { error });
      throw error;
    }
  }
}

/**
 * Embedding quality and validation utilities
 */
export class EmbeddingQuality {
  
  /**
   * Validate embedding vector
   */
  static validateEmbedding(embedding: number[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if embedding exists and is array
    if (!embedding || !Array.isArray(embedding)) {
      issues.push('Embedding is not a valid array');
      return { valid: false, issues };
    }

    // Check dimensions (Gemini text-embedding-004 should be 768 dimensions)
    if (embedding.length !== 768) {
      issues.push(`Unexpected embedding dimensions: ${embedding.length}, expected 768`);
    }

    // Check for invalid values
    const hasNaN = embedding.some(val => isNaN(val));
    if (hasNaN) {
      issues.push('Embedding contains NaN values');
    }

    const hasInfinite = embedding.some(val => !isFinite(val));
    if (hasInfinite) {
      issues.push('Embedding contains infinite values');
    }

    // Check if embedding is all zeros (might indicate generation failure)
    const isAllZeros = embedding.every(val => val === 0);
    if (isAllZeros) {
      issues.push('Embedding is all zeros');
    }

    // Check magnitude (should be reasonable for normalized embeddings)
    const magnitude = VectorUtils.magnitude(embedding);
    if (magnitude < 0.1 || magnitude > 10) {
      issues.push(`Unusual embedding magnitude: ${magnitude}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Calculate embedding quality score
   */
  static calculateQualityScore(embedding: number[]): number {
    const validation = this.validateEmbedding(embedding);
    
    if (!validation.valid) {
      return 0;
    }

    let score = 1.0;

    // Penalty for unusual magnitude
    const magnitude = VectorUtils.magnitude(embedding);
    if (magnitude < 0.5 || magnitude > 2.0) {
      score *= 0.8;
    }

    // Check distribution of values
    const stats = VectorUtils.getVectorStats(embedding);
    
    // Penalty for very low standard deviation (might indicate poor embedding)
    if (stats.std < 0.01) {
      score *= 0.6;
    }

    // Penalty for extreme mean
    if (Math.abs(stats.mean) > 0.5) {
      score *= 0.9;
    }

    return Math.max(0, Math.min(1, score));
  }
}