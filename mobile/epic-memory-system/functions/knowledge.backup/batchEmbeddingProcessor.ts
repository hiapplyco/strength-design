import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BatchProcessor, EmbeddingCache, EmbeddingIndexManager } from './embeddingUtils';

interface BatchProcessingRequest {
  mode: 'missing' | 'all' | 'outdated' | 'quality_check';
  filters?: {
    content_type?: string[];
    source?: string[];
    min_quality_score?: number;
    created_after?: string;
  };
  batch_size?: number;
  max_items?: number;
  force_overwrite?: boolean;
}

interface BatchProcessingResult {
  total_processed: number;
  successful: number;
  failed: number;
  skipped: number;
  processing_time: number;
  error_details: Array<{ id: string; error: string }>;
  stats: {
    avg_processing_time_per_item: number;
    embeddings_per_second: number;
    quality_distribution: Record<string, number>;
  };
}

/**
 * Batch processing system for generating embeddings at scale
 * 
 * Features:
 * - Process missing embeddings
 * - Update outdated embeddings
 * - Quality check and regeneration
 * - Progress tracking and resumable operations
 * - Rate limiting and error handling
 * - Performance metrics and optimization
 */
export const batchProcessEmbeddings = onCall(
  {
    timeoutSeconds: 540, // 9 minutes
    memory: '2GiB',
    cors: true
  },
  async (request) => {
    try {
      const {
        mode = 'missing',
        filters = {},
        batch_size = 10,
        max_items = 1000,
        force_overwrite = false
      } = request.data as BatchProcessingRequest;

      logger.info('Starting batch embedding processing', {
        mode,
        filters,
        batch_size,
        max_items,
        force_overwrite
      });

      const startTime = Date.now();
      const db = getFirestore();

      // Initialize Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'text-embedding-004'
      });

      // Get items to process based on mode
      const itemsToProcess = await getItemsToProcess(db, mode, filters, max_items);

      if (itemsToProcess.length === 0) {
        return {
          message: 'No items found to process',
          total_processed: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
          processing_time: Date.now() - startTime
        };
      }

      logger.info(`Found ${itemsToProcess.length} items to process`);

      // Process items in batches
      const result = await processBatchWithProgress(
        model,
        db,
        itemsToProcess,
        batch_size,
        force_overwrite
      );

      const totalTime = Date.now() - startTime;

      logger.info('Batch processing completed', {
        ...result,
        total_time: totalTime
      });

      return {
        ...result,
        processing_time: totalTime,
        stats: {
          ...result.stats,
          avg_processing_time_per_item: totalTime / Math.max(result.total_processed, 1),
          embeddings_per_second: result.successful / Math.max(totalTime / 1000, 1)
        }
      };

    } catch (error: any) {
      logger.error('Batch embedding processing failed', { error: error.message });
      throw new HttpsError('internal', `Batch processing failed: ${error.message}`);
    }
  }
);

/**
 * Scheduled function to automatically process missing embeddings
 */
export const scheduledEmbeddingProcessor = onSchedule(
  {
    schedule: '0 2 * * *', // Run daily at 2 AM
    timeZone: 'UTC',
    memory: '2GiB',
    timeoutSeconds: 540
  },
  async () => {
    try {
      logger.info('Starting scheduled embedding processing');

      const db = getFirestore();

      // Check if we have missing embeddings
      const missingCount = await getMissingEmbeddingsCount(db);
      
      if (missingCount === 0) {
        logger.info('No missing embeddings found, skipping scheduled processing');
        return;
      }

      // Process missing embeddings in smaller batches for reliability
      const batchFunction = batchProcessEmbeddings;
      const result = await batchFunction({
        data: {
          mode: 'missing',
          batch_size: 5, // Smaller batches for scheduled processing
          max_items: 100, // Limit for scheduled runs
          force_overwrite: false
        }
      } as any);

      logger.info('Scheduled embedding processing completed', result);

      // Update processing statistics
      await updateProcessingStats(db, result);

    } catch (error: any) {
      logger.error('Scheduled embedding processing failed', { error: error.message });
    }
  }
);

async function getItemsToProcess(
  db: any,
  mode: string,
  filters: any,
  maxItems: number
): Promise<any[]> {
  const knowledgeCollection = db.collection('knowledge');
  let query = knowledgeCollection as any;

  // Apply filters
  if (filters.content_type && filters.content_type.length > 0) {
    query = query.where('content_type', 'in', filters.content_type);
  }

  if (filters.source && filters.source.length > 0) {
    query = query.where('source', 'in', filters.source);
  }

  if (filters.min_quality_score) {
    query = query.where('quality_score', '>=', filters.min_quality_score);
  }

  if (filters.created_after) {
    query = query.where('created_at', '>=', new Date(filters.created_after));
  }

  // Apply mode-specific filters
  switch (mode) {
    case 'missing':
      query = query.where('has_embedding', '!=', true);
      break;
    
    case 'outdated':
      // Find embeddings older than 30 days that might need updating
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query = query
        .where('has_embedding', '==', true)
        .where('embedding_created_at', '<', thirtyDaysAgo);
      break;
    
    case 'quality_check':
      // Find items with embeddings that might have quality issues
      query = query.where('has_embedding', '==', true);
      break;
    
    case 'all':
      // Process all items (typically with force_overwrite = true)
      break;
  }

  // Order by quality score to prioritize higher quality content
  query = query.orderBy('quality_score', 'desc').limit(maxItems);

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function processBatchWithProgress(
  model: any,
  db: any,
  items: any[],
  batchSize: number,
  forceOverwrite: boolean
): Promise<BatchProcessingResult> {
  const result: BatchProcessingResult = {
    total_processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    processing_time: 0,
    error_details: [],
    stats: {
      avg_processing_time_per_item: 0,
      embeddings_per_second: 0,
      quality_distribution: {
        high: 0,     // > 0.8
        medium: 0,   // 0.6 - 0.8
        low: 0       // < 0.6
      }
    }
  };

  const knowledgeCollection = db.collection('knowledge');
  const embeddingsCollection = db.collection('knowledge_embeddings');

  // Process items using BatchProcessor utility
  await BatchProcessor.processBatch(
    items,
    async (item) => {
      const itemStartTime = Date.now();
      
      try {
        result.total_processed++;

        // Check if embedding already exists and we're not forcing overwrite
        if (!forceOverwrite && item.has_embedding) {
          result.skipped++;
          return;
        }

        // Generate embedding
        const embeddingData = await generateSingleEmbedding(model, item);
        
        // Store embedding
        await embeddingsCollection.doc(item.id).set({
          ...embeddingData,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp()
        });

        // Update knowledge document
        await knowledgeCollection.doc(item.id).update({
          has_embedding: true,
          embedding_model: 'text-embedding-004',
          embedding_created_at: FieldValue.serverTimestamp()
        });

        result.successful++;

        // Update quality distribution stats
        const qualityScore = item.quality_score || 0;
        if (qualityScore > 0.8) {
          result.stats.quality_distribution.high++;
        } else if (qualityScore >= 0.6) {
          result.stats.quality_distribution.medium++;
        } else {
          result.stats.quality_distribution.low++;
        }

        const itemTime = Date.now() - itemStartTime;
        logger.debug(`Processed embedding for ${item.id}`, {
          processing_time: itemTime,
          quality_score: qualityScore
        });

      } catch (error: any) {
        result.failed++;
        result.error_details.push({
          id: item.id,
          error: error.message
        });

        logger.error(`Failed to process embedding for ${item.id}`, {
          error: error.message,
          processing_time: Date.now() - itemStartTime
        });
      }
    },
    {
      batchSize,
      delayMs: 1000, // 1 second delay between batches
      onProgress: (processed, total) => {
        logger.info(`Batch progress: ${processed}/${total} items processed`);
      }
    }
  );

  return result;
}

async function generateSingleEmbedding(model: any, knowledgeItem: any): Promise<any> {
  // Create comprehensive text for embedding
  const textParts = [];

  if (knowledgeItem.title) {
    textParts.push(`Title: ${knowledgeItem.title}`);
  }

  if (knowledgeItem.summary) {
    textParts.push(`Summary: ${knowledgeItem.summary}`);
  }

  if (knowledgeItem.content) {
    // Truncate content if too long
    const content = knowledgeItem.content.length > 3000 
      ? knowledgeItem.content.substring(0, 3000) + '...'
      : knowledgeItem.content;
    textParts.push(`Content: ${content}`);
  }

  if (knowledgeItem.tags && Array.isArray(knowledgeItem.tags)) {
    textParts.push(`Tags: ${knowledgeItem.tags.join(', ')}`);
  }

  textParts.push(`Type: ${knowledgeItem.content_type || 'general'}`);
  textParts.push(`Source: ${knowledgeItem.source || 'unknown'}`);

  const textToEmbed = textParts.join('\n\n');

  // Generate embedding
  const result = await model.embedContent(textToEmbed);
  
  if (!result.embedding || !result.embedding.values) {
    throw new Error('Invalid embedding response from Gemini');
  }

  return {
    content_id: knowledgeItem.id,
    embedding: result.embedding.values,
    text_preview: textToEmbed.substring(0, 200),
    text_length: textToEmbed.length,
    model_version: 'text-embedding-004',
    content_type: knowledgeItem.content_type,
    source: knowledgeItem.source,
    quality_score: knowledgeItem.quality_score,
    tags: knowledgeItem.tags || []
  };
}

async function getMissingEmbeddingsCount(db: any): Promise<number> {
  try {
    const knowledgeCollection = db.collection('knowledge');
    const query = knowledgeCollection.where('has_embedding', '!=', true);
    const countSnapshot = await query.count().get();
    return countSnapshot.data().count;
  } catch (error) {
    logger.error('Failed to get missing embeddings count', { error });
    return 0;
  }
}

async function updateProcessingStats(db: any, result: any): Promise<void> {
  try {
    const statsCollection = db.collection('embedding_processing_stats');
    const statsDoc = {
      timestamp: FieldValue.serverTimestamp(),
      processed: result.total_processed,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped,
      processing_time: result.processing_time,
      quality_distribution: result.stats.quality_distribution,
      type: 'scheduled_batch'
    };

    await statsCollection.add(statsDoc);
    logger.info('Processing stats updated', statsDoc);
  } catch (error) {
    logger.warn('Failed to update processing stats', { error });
  }
}

/**
 * Get embedding processing statistics
 */
export const getEmbeddingProcessingStats = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
    cors: true
  },
  async (request) => {
    try {
      const { days = 7 } = request.data || {};

      const db = getFirestore();
      
      // Get overall statistics
      const overallStats = await EmbeddingIndexManager.getEmbeddingStats(db);
      
      // Get recent processing stats
      const statsCollection = db.collection('embedding_processing_stats');
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const recentStatsQuery = statsCollection
        .where('timestamp', '>=', cutoffDate)
        .orderBy('timestamp', 'desc')
        .limit(50);

      const recentStatsSnapshot = await recentStatsQuery.get();
      const recentStats = recentStatsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString()
      }));

      // Calculate aggregated statistics
      const aggregated = {
        total_processed: recentStats.reduce((sum, stat) => sum + (stat.processed || 0), 0),
        total_successful: recentStats.reduce((sum, stat) => sum + (stat.successful || 0), 0),
        total_failed: recentStats.reduce((sum, stat) => sum + (stat.failed || 0), 0),
        avg_success_rate: 0,
        total_processing_time: recentStats.reduce((sum, stat) => sum + (stat.processing_time || 0), 0)
      };

      if (aggregated.total_processed > 0) {
        aggregated.avg_success_rate = aggregated.total_successful / aggregated.total_processed;
      }

      return {
        overall_stats: overallStats,
        recent_processing: {
          days_covered: days,
          total_runs: recentStats.length,
          aggregated_stats: aggregated,
          recent_runs: recentStats.slice(0, 10) // Last 10 runs
        },
        cache_stats: EmbeddingCache.getStats()
      };

    } catch (error: any) {
      logger.error('Failed to get embedding processing stats', { error: error.message });
      throw new HttpsError('internal', `Failed to get stats: ${error.message}`);
    }
  }
);

/**
 * Cleanup and maintenance operations
 */
export const cleanupEmbeddings = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
    cors: true
  },
  async (request) => {
    try {
      const { operation = 'orphaned' } = request.data || {};

      const db = getFirestore();
      let result: any = {};

      switch (operation) {
        case 'orphaned':
          result = await EmbeddingIndexManager.cleanupOrphanedEmbeddings(db);
          break;
        
        case 'cache':
          EmbeddingCache.clear();
          result = { message: 'Cache cleared successfully' };
          break;
        
        case 'indexes':
          await EmbeddingIndexManager.ensureIndexes(db);
          result = { message: 'Indexes checked and ensured' };
          break;
        
        default:
          throw new HttpsError('invalid-argument', `Unknown cleanup operation: ${operation}`);
      }

      logger.info(`Cleanup operation completed: ${operation}`, result);
      return result;

    } catch (error: any) {
      logger.error('Cleanup operation failed', { error: error.message });
      throw new HttpsError('internal', `Cleanup failed: ${error.message}`);
    }
  }
);