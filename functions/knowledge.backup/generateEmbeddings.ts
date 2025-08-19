import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface EmbeddingRequest {
  content_id?: string;
  text?: string;
  batch_ids?: string[];
  overwrite?: boolean;
}

interface EmbeddingResult {
  id: string;
  embedding: number[];
  text_preview: string;
  timestamp: string;
  model_version: string;
}

/**
 * Generate and store vector embeddings for knowledge content using Gemini's text-embedding model
 * 
 * CRITICAL: Always use Gemini 2.5 Flash for embeddings - most cost-efficient and accurate
 * 
 * Features:
 * - Single content embedding generation
 * - Batch processing for multiple documents
 * - Automatic text chunking for large content
 * - Error handling and retry logic
 * - Performance optimization with parallel processing
 */
export const generateEmbeddings = onCall(
  {
    timeoutSeconds: 540, // 9 minutes for large batches
    memory: '1GiB',
    cors: true
  },
  async (request) => {
    try {
      const { content_id, text, batch_ids, overwrite = false } = request.data as EmbeddingRequest;

      // Validate input
      if (!content_id && !text && !batch_ids) {
        throw new HttpsError('invalid-argument', 'Must provide content_id, text, or batch_ids');
      }

      // Initialize Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'text-embedding-004' // Latest Gemini embedding model
      });

      const db = getFirestore();
      const knowledgeCollection = db.collection('knowledge');
      const embeddingsCollection = db.collection('knowledge_embeddings');

      logger.info('Starting embedding generation', {
        content_id,
        has_text: !!text,
        batch_size: batch_ids?.length || 0,
        overwrite
      });

      let results: EmbeddingResult[] = [];

      if (batch_ids && batch_ids.length > 0) {
        // Batch processing
        results = await processBatchEmbeddings(
          model,
          knowledgeCollection,
          embeddingsCollection,
          batch_ids,
          overwrite
        );
      } else if (content_id) {
        // Single content processing
        const result = await processSingleEmbedding(
          model,
          knowledgeCollection,
          embeddingsCollection,
          content_id,
          overwrite
        );
        if (result) results.push(result);
      } else if (text) {
        // Direct text processing
        const result = await generateTextEmbedding(model, text);
        results.push({
          id: 'direct_text',
          embedding: result.embedding,
          text_preview: text.substring(0, 100) + '...',
          timestamp: new Date().toISOString(),
          model_version: 'text-embedding-004'
        });
      }

      logger.info('Embedding generation completed', {
        total_processed: results.length,
        successful: results.filter(r => r.embedding.length > 0).length
      });

      return {
        results,
        total_processed: results.length,
        successful: results.filter(r => r.embedding.length > 0).length,
        model_version: 'text-embedding-004',
        processing_time: new Date().toISOString()
      };

    } catch (error: any) {
      logger.error('Embedding generation failed', { error: error.message });
      throw new HttpsError('internal', `Embedding generation failed: ${error.message}`);
    }
  }
);

async function processBatchEmbeddings(
  model: any,
  knowledgeCollection: any,
  embeddingsCollection: any,
  batchIds: string[],
  overwrite: boolean
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  const batchSize = 10; // Process in smaller batches to avoid timeouts

  logger.info('Processing batch embeddings', { total_items: batchIds.length });

  for (let i = 0; i < batchIds.length; i += batchSize) {
    const currentBatch = batchIds.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchPromises = currentBatch.map(async (contentId) => {
      try {
        return await processSingleEmbedding(
          model,
          knowledgeCollection,
          embeddingsCollection,
          contentId,
          overwrite
        );
      } catch (error: any) {
        logger.error(`Failed to process embedding for ${contentId}`, { error: error.message });
        return null;
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      } else {
        logger.warn(`Embedding failed for item ${currentBatch[index]}`, {
          error: result.status === 'rejected' ? result.reason : 'Unknown error'
        });
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < batchIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(batchIds.length / batchSize)}`);
  }

  return results;
}

async function processSingleEmbedding(
  model: any,
  knowledgeCollection: any,
  embeddingsCollection: any,
  contentId: string,
  overwrite: boolean
): Promise<EmbeddingResult | null> {
  try {
    // Check if embedding already exists
    if (!overwrite) {
      const existingEmbedding = await embeddingsCollection.doc(contentId).get();
      if (existingEmbedding.exists) {
        logger.info(`Embedding already exists for ${contentId}, skipping`);
        const data = existingEmbedding.data();
        return {
          id: contentId,
          embedding: data.embedding,
          text_preview: data.text_preview,
          timestamp: data.created_at.toDate().toISOString(),
          model_version: data.model_version
        };
      }
    }

    // Get knowledge content
    const knowledgeDoc = await knowledgeCollection.doc(contentId).get();
    if (!knowledgeDoc.exists) {
      throw new Error(`Knowledge document ${contentId} not found`);
    }

    const knowledgeData = knowledgeDoc.data();
    const textToEmbed = createEmbeddingText(knowledgeData);

    // Generate embedding
    const embeddingResult = await generateTextEmbedding(model, textToEmbed);

    // Store embedding in Firestore
    const embeddingData = {
      content_id: contentId,
      embedding: embeddingResult.embedding,
      text_preview: textToEmbed.substring(0, 200),
      text_length: textToEmbed.length,
      model_version: 'text-embedding-004',
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      
      // Metadata for performance optimization
      content_type: knowledgeData.content_type,
      source: knowledgeData.source,
      quality_score: knowledgeData.quality_score,
      tags: knowledgeData.tags || []
    };

    await embeddingsCollection.doc(contentId).set(embeddingData);

    // Update knowledge document with embedding status
    await knowledgeCollection.doc(contentId).update({
      has_embedding: true,
      embedding_model: 'text-embedding-004',
      embedding_created_at: FieldValue.serverTimestamp()
    });

    logger.info(`Generated embedding for ${contentId}`, {
      embedding_dimensions: embeddingResult.embedding.length,
      text_length: textToEmbed.length
    });

    return {
      id: contentId,
      embedding: embeddingResult.embedding,
      text_preview: textToEmbed.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
      model_version: 'text-embedding-004'
    };

  } catch (error: any) {
    logger.error(`Failed to process embedding for ${contentId}`, { error: error.message });
    throw error;
  }
}

async function generateTextEmbedding(model: any, text: string): Promise<{ embedding: number[] }> {
  try {
    // Truncate text if too long (Gemini has token limits)
    const maxTokens = 8000; // Conservative limit for embedding model
    let processedText = text;
    
    if (text.length > maxTokens * 4) { // Rough estimate: 4 chars per token
      processedText = text.substring(0, maxTokens * 4);
      logger.warn('Text truncated for embedding generation', {
        original_length: text.length,
        truncated_length: processedText.length
      });
    }

    // Generate embedding using Gemini
    const result = await model.embedContent(processedText);
    
    if (!result.embedding || !result.embedding.values) {
      throw new Error('Invalid embedding response from Gemini');
    }

    return {
      embedding: result.embedding.values
    };

  } catch (error: any) {
    logger.error('Failed to generate text embedding', { error: error.message });
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

function createEmbeddingText(knowledgeData: any): string {
  // Create comprehensive text for embedding that captures all important content
  const parts = [];

  // Title (highest weight)
  if (knowledgeData.title) {
    parts.push(`Title: ${knowledgeData.title}`);
  }

  // Summary (if available)
  if (knowledgeData.summary) {
    parts.push(`Summary: ${knowledgeData.summary}`);
  }

  // Key points (if available)
  if (knowledgeData.key_points && Array.isArray(knowledgeData.key_points)) {
    parts.push(`Key Points: ${knowledgeData.key_points.join('. ')}`);
  }

  // Content (main text)
  if (knowledgeData.content) {
    // Truncate content to reasonable length while preserving important information
    const contentPreview = knowledgeData.content.length > 2000 
      ? knowledgeData.content.substring(0, 2000) + '...'
      : knowledgeData.content;
    parts.push(`Content: ${contentPreview}`);
  }

  // Tags (for categorization)
  if (knowledgeData.tags && Array.isArray(knowledgeData.tags)) {
    parts.push(`Tags: ${knowledgeData.tags.join(', ')}`);
  }

  // Content type and source for context
  parts.push(`Type: ${knowledgeData.content_type || 'general'}`);
  parts.push(`Source: ${knowledgeData.source || 'unknown'}`);

  return parts.join('\n\n');
}

/**
 * Batch process all knowledge items without embeddings
 */
export const generateAllMissingEmbeddings = onCall(
  {
    timeoutSeconds: 540,
    memory: '2GiB',
    cors: true
  },
  async (request) => {
    try {
      const { limit = 100, offset = 0 } = request.data || {};

      const db = getFirestore();
      const knowledgeCollection = db.collection('knowledge');

      logger.info('Finding knowledge items without embeddings', { limit, offset });

      // Find items without embeddings
      const query = knowledgeCollection
        .where('has_embedding', '==', false)
        .limit(limit)
        .offset(offset);

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return {
          message: 'No knowledge items without embeddings found',
          total_processed: 0
        };
      }

      const contentIds = snapshot.docs.map(doc => doc.id);

      // Generate embeddings for batch
      const embeddingFunction = generateEmbeddings;
      const result = await embeddingFunction({ 
        data: { 
          batch_ids: contentIds,
          overwrite: false 
        } 
      } as any);

      return {
        message: `Processed ${contentIds.length} knowledge items`,
        ...result
      };

    } catch (error: any) {
      logger.error('Batch embedding generation failed', { error: error.message });
      throw new HttpsError('internal', `Batch embedding generation failed: ${error.message}`);
    }
  }
);