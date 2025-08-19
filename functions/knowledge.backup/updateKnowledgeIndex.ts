import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

interface IndexUpdateRequest {
  operation: 'rebuild' | 'optimize' | 'cleanup' | 'reindex_tags';
  options?: {
    batch_size?: number;
    force?: boolean;
  };
}

/**
 * Update and optimize the knowledge base search index
 */
export const updateKnowledgeIndex = onCall(
  {
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: true
  },
  async (request) => {
    try {
      logger.info('Knowledge index update requested', {
        operation: request.data.operation,
        options: request.data.options
      });

      const { operation, options = {} } = request.data as IndexUpdateRequest;
      const { batch_size = 50, force = false } = options;

      const db = getFirestore();

      let result: any;

      switch (operation) {
        case 'rebuild':
          result = await rebuildSearchIndex(db, batch_size, force);
          break;
        
        case 'optimize':
          result = await optimizeIndex(db, batch_size);
          break;
        
        case 'cleanup':
          result = await cleanupIndex(db, batch_size);
          break;
        
        case 'reindex_tags':
          result = await reindexTags(db, batch_size);
          break;
        
        default:
          throw new HttpsError('invalid-argument', `Unknown operation: ${operation}`);
      }

      // Update system stats
      await updateIndexStats(db, operation, result);

      logger.info('Knowledge index update completed', { operation, result });

      return {
        success: true,
        operation,
        ...result,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      logger.error('Knowledge index update failed', { error: error.message });
      throw new HttpsError('internal', `Index update failed: ${error.message}`);
    }
  }
);

async function rebuildSearchIndex(
  db: FirebaseFirestore.Firestore, 
  batchSize: number, 
  force: boolean
): Promise<any> {
  logger.info('Rebuilding search index', { batchSize, force });

  const knowledgeCollection = db.collection('knowledge');
  let query = knowledgeCollection as any;

  // If not forcing, only rebuild items without search index
  if (!force) {
    query = query.where('search_keywords', '==', null);
  }

  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return {
      message: 'No items to reindex',
      processed: 0
    };
  }

  const results = {
    processed: 0,
    errors: 0,
    batches: 0
  };

  // Process in batches
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    
    try {
      const firestoreBatch = db.batch();
      
      batch.forEach((doc: any) => {
        const data = doc.data();
        const searchKeywords = generateSearchKeywords(data);
        const searchableText = generateSearchableText(data);
        
        firestoreBatch.update(doc.ref, {
          search_keywords: searchKeywords,
          searchable_text: searchableText,
          indexed_at: Timestamp.now()
        });
      });

      await firestoreBatch.commit();
      
      results.processed += batch.length;
      results.batches++;
      
      logger.info(`Processed batch ${results.batches}`, {
        batch_size: batch.length,
        total_processed: results.processed
      });

      // Small delay between batches
      if (i + batchSize < docs.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error: any) {
      logger.error(`Failed to process batch starting at ${i}`, { error: error.message });
      results.errors++;
    }
  }

  return results;
}

async function optimizeIndex(
  db: FirebaseFirestore.Firestore, 
  batchSize: number
): Promise<any> {
  logger.info('Optimizing search index', { batchSize });

  const results = {
    normalized_tags: 0,
    updated_quality_scores: 0,
    cleaned_keywords: 0,
    errors: 0
  };

  const knowledgeCollection = db.collection('knowledge');
  const snapshot = await knowledgeCollection.get();

  if (snapshot.empty) {
    return { message: 'No items to optimize', ...results };
  }

  // Process in batches
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    
    try {
      const firestoreBatch = db.batch();
      
      for (const doc of batch) {
        const data = doc.data();
        const updates: any = {};
        let hasUpdates = false;

        // Normalize tags (lowercase, remove duplicates)
        if (data.tags && Array.isArray(data.tags)) {
          const normalizedTags = [...new Set(
            data.tags
              .map((tag: string) => tag.toLowerCase().trim())
              .filter((tag: string) => tag.length > 0)
          )];
          
          if (JSON.stringify(normalizedTags) !== JSON.stringify(data.tags)) {
            updates.tags = normalizedTags;
            results.normalized_tags++;
            hasUpdates = true;
          }
        }

        // Recalculate quality score if needed
        const recalculatedQuality = calculateQualityScore(data);
        if (Math.abs(recalculatedQuality - (data.quality_score || 0)) > 0.1) {
          updates.quality_score = recalculatedQuality;
          results.updated_quality_scores++;
          hasUpdates = true;
        }

        // Clean up search keywords
        if (data.search_keywords) {
          const cleanedKeywords = [...new Set(
            data.search_keywords
              .filter((keyword: string) => keyword && keyword.length > 2)
              .map((keyword: string) => keyword.toLowerCase().trim())
          )];
          
          if (cleanedKeywords.length !== data.search_keywords.length) {
            updates.search_keywords = cleanedKeywords;
            results.cleaned_keywords++;
            hasUpdates = true;
          }
        }

        if (hasUpdates) {
          updates.optimized_at = Timestamp.now();
          firestoreBatch.update(doc.ref, updates);
        }
      }

      await firestoreBatch.commit();

    } catch (error: any) {
      logger.error(`Failed to optimize batch starting at ${i}`, { error: error.message });
      results.errors++;
    }
  }

  return results;
}

async function cleanupIndex(
  db: FirebaseFirestore.Firestore, 
  batchSize: number
): Promise<any> {
  logger.info('Cleaning up search index', { batchSize });

  const results = {
    removed_duplicates: 0,
    removed_low_quality: 0,
    removed_invalid: 0,
    errors: 0
  };

  // Find and remove duplicates based on content hash
  const duplicateHashes = await findDuplicateHashes(db);
  
  for (const hash of duplicateHashes) {
    try {
      const duplicatesQuery = db.collection('knowledge')
        .where('content_hash', '==', hash)
        .orderBy('quality_score', 'desc');
      
      const duplicatesSnapshot = await duplicatesQuery.get();
      
      if (duplicatesSnapshot.size > 1) {
        // Keep the highest quality item, remove the rest
        const docsToRemove = duplicatesSnapshot.docs.slice(1);
        
        const batch = db.batch();
        docsToRemove.forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        results.removed_duplicates += docsToRemove.length;
      }

    } catch (error: any) {
      logger.error(`Failed to remove duplicates for hash ${hash}`, { error: error.message });
      results.errors++;
    }
  }

  // Remove very low quality items (quality score < 0.3)
  try {
    const lowQualityQuery = db.collection('knowledge')
      .where('quality_score', '<', 0.3)
      .limit(100); // Safety limit

    const lowQualitySnapshot = await lowQualityQuery.get();
    
    if (!lowQualitySnapshot.empty) {
      const batch = db.batch();
      lowQualitySnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      results.removed_low_quality = lowQualitySnapshot.size;
    }

  } catch (error: any) {
    logger.error('Failed to remove low quality items', { error: error.message });
    results.errors++;
  }

  // Remove invalid items (missing required fields)
  try {
    const allItemsSnapshot = await db.collection('knowledge').get();
    const invalidItems = allItemsSnapshot.docs.filter((doc: any) => {
      const data = doc.data();
      return !data.title || !data.content || !data.source || !data.content_type;
    });

    if (invalidItems.length > 0) {
      const batch = db.batch();
      invalidItems.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      results.removed_invalid = invalidItems.length;
    }

  } catch (error: any) {
    logger.error('Failed to remove invalid items', { error: error.message });
    results.errors++;
  }

  return results;
}

async function reindexTags(
  db: FirebaseFirestore.Firestore, 
  batchSize: number
): Promise<any> {
  logger.info('Reindexing tags', { batchSize });

  // First, collect all unique tags and their frequencies
  const tagFrequency: Record<string, number> = {};
  const knowledgeSnapshot = await db.collection('knowledge').get();

  knowledgeSnapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => {
        const normalizedTag = tag.toLowerCase().trim();
        tagFrequency[normalizedTag] = (tagFrequency[normalizedTag] || 0) + 1;
      });
    }
  });

  // Store tag index
  const tagIndexRef = db.collection('system').doc('tag_index');
  await tagIndexRef.set({
    tags: tagFrequency,
    total_unique_tags: Object.keys(tagFrequency).length,
    updated_at: Timestamp.now()
  });

  // Update popular tags in each document
  const popularTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([tag]) => tag);

  const results = {
    total_unique_tags: Object.keys(tagFrequency).length,
    popular_tags_count: popularTags.length,
    documents_updated: 0,
    errors: 0
  };

  // Process documents in batches to add tag popularity scores
  const docs = knowledgeSnapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    
    try {
      const firestoreBatch = db.batch();
      
      batch.forEach((doc: any) => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          const tagPopularityScores = data.tags.map((tag: string) => ({
            tag: tag.toLowerCase().trim(),
            frequency: tagFrequency[tag.toLowerCase().trim()] || 0,
            is_popular: popularTags.includes(tag.toLowerCase().trim())
          }));

          firestoreBatch.update(doc.ref, {
            tag_analytics: tagPopularityScores,
            tags_reindexed_at: Timestamp.now()
          });
        }
      });

      await firestoreBatch.commit();
      results.documents_updated += batch.length;

    } catch (error: any) {
      logger.error(`Failed to reindex tags for batch starting at ${i}`, { error: error.message });
      results.errors++;
    }
  }

  return results;
}

async function findDuplicateHashes(db: FirebaseFirestore.Firestore): Promise<string[]> {
  // This is a simplified approach - in production you might want a more sophisticated duplicate detection
  const hashCounts: Record<string, number> = {};
  
  const snapshot = await db.collection('knowledge').get();
  
  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    if (data.content_hash) {
      hashCounts[data.content_hash] = (hashCounts[data.content_hash] || 0) + 1;
    }
  });

  return Object.entries(hashCounts)
    .filter(([, count]) => count > 1)
    .map(([hash]) => hash);
}

function generateSearchKeywords(data: any): string[] {
  const keywords = new Set<string>();

  // Add title words
  if (data.title) {
    const titleWords = data.title.toLowerCase()
      .split(/\s+/)
      .filter((word: string) => word.length > 2);
    titleWords.forEach((word: string) => keywords.add(word));
  }

  // Add tags
  if (data.tags && Array.isArray(data.tags)) {
    data.tags.forEach((tag: string) => keywords.add(tag.toLowerCase()));
  }

  // Add content type and source
  if (data.content_type) keywords.add(data.content_type);
  if (data.source) keywords.add(data.source);

  // Add AI categories if available
  if (data.ai_categories && Array.isArray(data.ai_categories)) {
    data.ai_categories.forEach((category: string) => keywords.add(category.toLowerCase()));
  }

  return Array.from(keywords);
}

function generateSearchableText(data: any): string {
  const parts = [];

  if (data.title) parts.push(data.title);
  if (data.content) parts.push(data.content.substring(0, 1000)); // Limit content length
  if (data.summary || data.ai_summary) parts.push(data.summary || data.ai_summary);
  if (data.tags) parts.push(data.tags.join(' '));
  if (data.key_takeaways) parts.push(data.key_takeaways.join(' '));

  return parts.join(' ').toLowerCase();
}

function calculateQualityScore(data: any): number {
  let score = 0.5; // Base score

  // Content length scoring
  const contentLength = data.content?.length || 0;
  if (contentLength >= 200 && contentLength <= 2000) {
    score += 0.2;
  } else if (contentLength > 2000 && contentLength <= 5000) {
    score += 0.1;
  }

  // Source credibility
  if (data.source === 'wikipedia') {
    score += 0.2;
  } else if (data.source === 'reddit') {
    const metadata = data.metadata || {};
    if (metadata.score > 50) score += 0.1;
    if (metadata.upvote_ratio > 0.8) score += 0.1;
  }

  // Enhancement bonus
  if (data.ai_summary) score += 0.1;
  if (data.key_takeaways && data.key_takeaways.length > 0) score += 0.1;
  if (data.ai_categories && data.ai_categories.length > 0) score += 0.05;

  return Math.min(score, 1.0);
}

async function updateIndexStats(
  db: FirebaseFirestore.Firestore, 
  operation: string, 
  result: any
): Promise<void> {
  try {
    const statsRef = db.collection('system').doc('index_stats');
    
    const updateData: any = {
      [`last_${operation}`]: Timestamp.now(),
      [`${operation}_count`]: FieldValue.increment(1)
    };

    // Add operation-specific stats
    if (result.processed) {
      updateData[`last_${operation}_processed`] = result.processed;
    }
    if (result.errors) {
      updateData[`last_${operation}_errors`] = result.errors;
    }

    await statsRef.set(updateData, { merge: true });

  } catch (error: any) {
    logger.error('Failed to update index stats', { error: error.message });
  }
}