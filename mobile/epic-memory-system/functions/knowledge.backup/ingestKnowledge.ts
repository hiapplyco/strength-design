import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Note: createHash is available globally in Firebase Functions

// Define secrets
const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface KnowledgeItem {
  id: string;
  source: 'reddit' | 'wikipedia' | 'manual';
  title: string;
  content: string;
  url: string;
  metadata: Record<string, any>;
  quality_score: number;
  content_hash: string;
  created_at: string;
  tags: string[];
  content_type: 'exercise' | 'routine' | 'nutrition' | 'discussion' | 'guide' | 'science';
  processed_at?: string;
  embedding?: number[];
  summary?: string;
  key_points?: string[];
}

interface IngestRequest {
  items: KnowledgeItem[];
  options?: {
    generate_embeddings?: boolean;
    generate_summaries?: boolean;
    batch_size?: number;
  };
}

/**
 * Ingest processed knowledge content into Firestore
 * Handles deduplication, enhancement, and indexing
 */
export const ingestKnowledge = onCall(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: true
  },
  async (request) => {
    try {
      logger.info('Starting knowledge ingestion', {
        itemCount: request.data.items?.length,
        options: request.data.options
      });

      // Validate request
      if (!request.data.items || !Array.isArray(request.data.items)) {
        throw new HttpsError('invalid-argument', 'Items array is required');
      }

      const { items, options = {} } = request.data as IngestRequest;
      const {
        generate_embeddings = false,
        generate_summaries = true,
        batch_size = 10
      } = options;

      const db = getFirestore();
      const knowledgeCollection = db.collection('knowledge');
      
      // Initialize Gemini if needed
      let genAI: GoogleGenerativeAI | null = null;
      let model: any = null;
      
      if (generate_embeddings || generate_summaries) {
        if (!geminiApiKey.value()) {
          throw new HttpsError('failed-precondition', 'Gemini API key not configured');
        }
        genAI = new GoogleGenerativeAI(geminiApiKey.value()!);
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      }

      const results = {
        processed: 0,
        duplicates: 0,
        errors: 0,
        enhanced: 0,
        batch_results: [] as any[]
      };

      // Process items in batches
      for (let i = 0; i < items.length; i += batch_size) {
        const batch = items.slice(i, i + batch_size);
        const batchResult = await processBatch(
          batch,
          knowledgeCollection,
          model,
          generate_summaries,
          generate_embeddings
        );
        
        results.processed += batchResult.processed;
        results.duplicates += batchResult.duplicates;
        results.errors += batchResult.errors;
        results.enhanced += batchResult.enhanced;
        results.batch_results.push(batchResult);

        logger.info(`Processed batch ${Math.floor(i / batch_size) + 1}`, batchResult);
        
        // Small delay between batches to avoid rate limits
        if (i + batch_size < items.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update knowledge index statistics
      await updateKnowledgeIndexStats(db, results);

      logger.info('Knowledge ingestion completed', results);

      return {
        success: true,
        ...results,
        message: `Successfully processed ${results.processed} items`
      };

    } catch (error: any) {
      logger.error('Knowledge ingestion failed', { error: error.message });
      throw new HttpsError('internal', `Ingestion failed: ${error.message}`);
    }
  }
);

async function processBatch(
  items: KnowledgeItem[],
  collection: FirebaseFirestore.CollectionReference,
  model: any,
  generateSummaries: boolean,
  generateEmbeddings: boolean
): Promise<any> {
  const batchResults = {
    processed: 0,
    duplicates: 0,
    errors: 0,
    enhanced: 0
  };

  const batch = collection.firestore.batch();

  for (const item of items) {
    try {
      // Check for duplicates
      const existingDoc = await collection.doc(item.id).get();
      if (existingDoc.exists) {
        batchResults.duplicates++;
        continue;
      }

      // Enhance content if model is available
      let enhancedItem = { ...item };
      
      if (model && (generateSummaries || generateEmbeddings)) {
        enhancedItem = await enhanceContent(item, model, generateSummaries, generateEmbeddings);
        batchResults.enhanced++;
      }

      // Prepare for Firestore
      const firestoreItem = {
        ...enhancedItem,
        processed_at: Timestamp.now(),
        created_at: Timestamp.fromDate(new Date(enhancedItem.created_at)),
        search_keywords: generateSearchKeywords(enhancedItem),
        indexed_at: Timestamp.now()
      };

      batch.set(collection.doc(item.id), firestoreItem);
      batchResults.processed++;

    } catch (error: any) {
      logger.error(`Error processing item ${item.id}`, { error: error.message });
      batchResults.errors++;
    }
  }

  // Commit batch
  if (batchResults.processed > 0) {
    await batch.commit();
  }

  return batchResults;
}

async function enhanceContent(
  item: KnowledgeItem,
  model: any,
  generateSummary: boolean,
  generateEmbedding: boolean
): Promise<KnowledgeItem> {
  const enhanced = { ...item };

  try {
    if (generateSummary) {
      enhanced.summary = await generateContentSummary(item, model);
      enhanced.key_points = await extractKeyPoints(item, model);
    }

    // Note: Gemini 2.5 Flash doesn't support embeddings directly
    // For embeddings, you'd need to use a different service like OpenAI or Vertex AI
    if (generateEmbedding) {
      logger.warn('Embedding generation not implemented for Gemini 2.5 Flash');
    }

  } catch (error: any) {
    logger.error(`Failed to enhance content for ${item.id}`, { error: error.message });
    // Return original item if enhancement fails
  }

  return enhanced;
}

async function generateContentSummary(item: KnowledgeItem, model: any): Promise<string> {
  const prompt = `
Please provide a concise summary (2-3 sentences) of this fitness content:

Title: ${item.title}
Content Type: ${item.content_type}
Source: ${item.source}

Content:
${item.content.substring(0, 2000)}...

Focus on the key fitness advice, exercises, or information that would be most useful for someone looking to improve their fitness.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    logger.error('Failed to generate summary', { error: error.message });
    throw error;
  }
}

async function extractKeyPoints(item: KnowledgeItem, model: any): Promise<string[]> {
  const prompt = `
Extract the key actionable points from this fitness content as a bullet list:

Title: ${item.title}
Content Type: ${item.content_type}

Content:
${item.content.substring(0, 2000)}...

Return only the most important and actionable points that someone could immediately apply to their fitness routine. Maximum 5 points.
Format each point as a single clear sentence without bullet symbols.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Split by lines and clean up
    const points = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 10 && !line.startsWith('-') && !line.startsWith('•'))
      .slice(0, 5);

    return points;
  } catch (error: any) {
    logger.error('Failed to extract key points', { error: error.message });
    return [];
  }
}

function generateSearchKeywords(item: KnowledgeItem): string[] {
  const keywords = new Set<string>();

  // Add tags
  item.tags.forEach(tag => keywords.add(tag));

  // Extract keywords from title
  const titleWords = item.title.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5);
  titleWords.forEach(word => keywords.add(word));

  // Add content type
  keywords.add(item.content_type);

  // Add source
  keywords.add(item.source);

  // Extract fitness-specific terms from content
  const fitnessTerms = [
    'exercise', 'workout', 'training', 'strength', 'cardio', 'muscle',
    'weight', 'rep', 'set', 'routine', 'form', 'technique', 'nutrition',
    'protein', 'diet', 'calories', 'recovery', 'flexibility', 'endurance'
  ];

  const contentLower = item.content.toLowerCase();
  fitnessTerms.forEach(term => {
    if (contentLower.includes(term)) {
      keywords.add(term);
    }
  });

  return Array.from(keywords);
}

async function updateKnowledgeIndexStats(db: FirebaseFirestore.Firestore, results: any): Promise<void> {
  try {
    const statsRef = db.collection('system').doc('knowledge_stats');
    
    await statsRef.set({
      last_ingestion: Timestamp.now(),
      total_processed: FieldValue.increment(results.processed),
      total_duplicates: FieldValue.increment(results.duplicates),
      total_errors: FieldValue.increment(results.errors),
      total_enhanced: FieldValue.increment(results.enhanced),
      last_batch_size: results.processed
    }, { merge: true });

  } catch (error: any) {
    logger.error('Failed to update knowledge stats', { error: error.message });
  }
}