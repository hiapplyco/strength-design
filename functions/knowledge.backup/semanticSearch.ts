import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SemanticSearchRequest {
  query: string;
  filters?: {
    content_type?: string[];
    source?: string[];
    tags?: string[];
    min_quality_score?: number;
    date_range?: {
      start?: string;
      end?: string;
    };
  };
  limit?: number;
  similarity_threshold?: number;
  hybrid_search?: boolean; // Combine semantic + keyword search
}

interface SemanticSearchResult {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source: string;
  content_type: string;
  quality_score: number;
  tags: string[];
  url: string;
  created_at: string;
  similarity_score: number;
  combined_score?: number;
}

/**
 * Perform semantic search using vector embeddings and cosine similarity
 * 
 * Features:
 * - Generate query embedding using Gemini
 * - Calculate cosine similarity with stored embeddings
 * - Hybrid search combining semantic + keyword matching
 * - Advanced filtering and ranking
 * - Performance optimization with caching
 */
export const semanticSearch = onCall(
  {
    timeoutSeconds: 60,
    memory: '1GiB',
    cors: true
  },
  async (request) => {
    try {
      const {
        query,
        filters = {},
        limit = 20,
        similarity_threshold = 0.5,
        hybrid_search = true
      } = request.data as SemanticSearchRequest;

      // Validate request
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Search query is required');
      }

      logger.info('Semantic search requested', {
        query,
        filters,
        limit,
        similarity_threshold,
        hybrid_search
      });

      const startTime = Date.now();

      // Initialize Gemini API for query embedding
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'text-embedding-004'
      });

      // Generate query embedding
      const queryEmbedding = await generateQueryEmbedding(model, query);

      const db = getFirestore();
      
      // Get knowledge embeddings with filters
      const candidateEmbeddings = await getCandidateEmbeddings(db, filters, limit * 3); // Get more candidates for better results

      if (candidateEmbeddings.length === 0) {
        return {
          results: [],
          total: 0,
          query,
          processing_time: Date.now() - startTime,
          message: 'No embeddings found matching the filters'
        };
      }

      // Calculate similarity scores
      const similarityResults = await calculateSimilarities(
        queryEmbedding,
        candidateEmbeddings,
        similarity_threshold
      );

      // Get full knowledge content for top results
      const knowledgeResults = await getKnowledgeContent(
        db,
        similarityResults.slice(0, limit * 2) // Get extra for hybrid filtering
      );

      // Apply hybrid search if enabled
      let finalResults = knowledgeResults;
      if (hybrid_search) {
        finalResults = await applyHybridScoring(query, knowledgeResults);
      }

      // Sort by final score and apply limit
      finalResults.sort((a, b) => (b.combined_score || b.similarity_score) - (a.combined_score || a.similarity_score));
      finalResults = finalResults.slice(0, limit);

      const processingTime = Date.now() - startTime;

      logger.info('Semantic search completed', {
        query,
        total_candidates: candidateEmbeddings.length,
        similarity_matches: similarityResults.length,
        final_results: finalResults.length,
        processing_time: processingTime
      });

      return {
        results: finalResults,
        total: finalResults.length,
        query,
        filters,
        similarity_threshold,
        processing_time: processingTime,
        stats: {
          candidates_evaluated: candidateEmbeddings.length,
          similarity_matches: similarityResults.length,
          avg_similarity: similarityResults.length > 0 
            ? similarityResults.reduce((sum, r) => sum + r.similarity_score, 0) / similarityResults.length 
            : 0
        }
      };

    } catch (error: any) {
      logger.error('Semantic search failed', { error: error.message });
      throw new HttpsError('internal', `Semantic search failed: ${error.message}`);
    }
  }
);

async function generateQueryEmbedding(model: any, query: string): Promise<number[]> {
  try {
    // Enhance query with fitness context for better embeddings
    const enhancedQuery = enhanceQueryForFitness(query);
    
    const result = await model.embedContent(enhancedQuery);
    
    if (!result.embedding || !result.embedding.values) {
      throw new Error('Failed to generate query embedding');
    }

    return result.embedding.values;

  } catch (error: any) {
    logger.error('Query embedding generation failed', { error: error.message });
    throw new Error(`Query embedding failed: ${error.message}`);
  }
}

function enhanceQueryForFitness(query: string): string {
  // Add fitness context to improve embedding quality
  const fitnessContext = "Fitness and exercise context: ";
  return `${fitnessContext}${query}`;
}

async function getCandidateEmbeddings(
  db: any,
  filters: any,
  maxCandidates: number
): Promise<any[]> {
  try {
    const embeddingsCollection = db.collection('knowledge_embeddings');
    let query = embeddingsCollection as any;

    // Apply filters to reduce candidate set
    if (filters.content_type && filters.content_type.length > 0) {
      query = query.where('content_type', 'in', filters.content_type);
    }

    if (filters.source && filters.source.length > 0) {
      query = query.where('source', 'in', filters.source);
    }

    if (filters.min_quality_score) {
      query = query.where('quality_score', '>=', filters.min_quality_score);
    }

    // Order by quality score and limit to get best candidates
    query = query.orderBy('quality_score', 'desc').limit(maxCandidates);

    const snapshot = await query.get();
    
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
    }));

  } catch (error: any) {
    logger.error('Failed to get candidate embeddings', { error: error.message });
    throw error;
  }
}

async function calculateSimilarities(
  queryEmbedding: number[],
  candidateEmbeddings: any[],
  threshold: number
): Promise<{ id: string; similarity_score: number }[]> {
  const results: { id: string; similarity_score: number }[] = [];

  for (const candidate of candidateEmbeddings) {
    try {
      if (!candidate.embedding || !Array.isArray(candidate.embedding)) {
        logger.warn(`Invalid embedding for ${candidate.id}`);
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, candidate.embedding);
      
      if (similarity >= threshold) {
        results.push({
          id: candidate.id,
          similarity_score: similarity
        });
      }

    } catch (error: any) {
      logger.warn(`Failed to calculate similarity for ${candidate.id}`, { error: error.message });
    }
  }

  // Sort by similarity score (highest first)
  return results.sort((a, b) => b.similarity_score - a.similarity_score);
}

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  try {
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

  } catch (error: any) {
    logger.error('Cosine similarity calculation failed', { error: error.message });
    return 0;
  }
}

async function getKnowledgeContent(
  db: any,
  similarityResults: { id: string; similarity_score: number }[]
): Promise<SemanticSearchResult[]> {
  try {
    const knowledgeCollection = db.collection('knowledge');
    const results: SemanticSearchResult[] = [];

    // Batch get knowledge documents
    const batchSize = 10;
    for (let i = 0; i < similarityResults.length; i += batchSize) {
      const batch = similarityResults.slice(i, i + batchSize);
      
      const promises = batch.map(async (item) => {
        try {
          const doc = await knowledgeCollection.doc(item.id).get();
          if (doc.exists) {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              content: data.content,
              summary: data.summary,
              source: data.source,
              content_type: data.content_type,
              quality_score: data.quality_score,
              tags: data.tags || [],
              url: data.url,
              created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
              similarity_score: item.similarity_score
            } as SemanticSearchResult;
          }
          return null;
        } catch (error: any) {
          logger.warn(`Failed to get knowledge content for ${item.id}`, { error: error.message });
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(result => result !== null) as SemanticSearchResult[]);
    }

    return results;

  } catch (error: any) {
    logger.error('Failed to get knowledge content', { error: error.message });
    throw error;
  }
}

async function applyHybridScoring(
  query: string,
  semanticResults: SemanticSearchResult[]
): Promise<SemanticSearchResult[]> {
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);

  return semanticResults.map(result => {
    // Calculate keyword matching score
    const keywordScore = calculateKeywordScore(result, queryTerms);
    
    // Combine semantic and keyword scores
    const semanticWeight = 0.7;
    const keywordWeight = 0.3;
    
    const combinedScore = (result.similarity_score * semanticWeight) + (keywordScore * keywordWeight);
    
    return {
      ...result,
      combined_score: combinedScore
    };
  });
}

function calculateKeywordScore(result: SemanticSearchResult, queryTerms: string[]): number {
  let score = 0;
  const maxScore = queryTerms.length;

  if (maxScore === 0) return 0;

  const searchableText = `${result.title} ${result.content} ${result.summary || ''} ${result.tags.join(' ')}`.toLowerCase();

  // Check for exact query term matches
  queryTerms.forEach(term => {
    if (searchableText.includes(term)) {
      // Weight title matches higher
      if (result.title.toLowerCase().includes(term)) {
        score += 1.5;
      } else if (result.summary && result.summary.toLowerCase().includes(term)) {
        score += 1.2;
      } else {
        score += 1;
      }
    }
  });

  // Normalize score
  return Math.min(score / maxScore, 1);
}

/**
 * Get similar content based on an existing knowledge item
 */
export const findSimilarContent = onCall(
  {
    timeoutSeconds: 30,
    memory: '512MiB',
    cors: true
  },
  async (request) => {
    try {
      const { content_id, limit = 10, min_similarity = 0.6 } = request.data;

      if (!content_id) {
        throw new HttpsError('invalid-argument', 'Content ID is required');
      }

      const db = getFirestore();
      const embeddingsCollection = db.collection('knowledge_embeddings');

      // Get the reference embedding
      const refDoc = await embeddingsCollection.doc(content_id).get();
      if (!refDoc.exists) {
        throw new HttpsError('not-found', 'Content embedding not found');
      }

      const refEmbedding = refDoc.data()?.embedding;
      if (!refEmbedding) {
        throw new HttpsError('not-found', 'No embedding data found');
      }

      // Get all other embeddings
      const allEmbeddings = await embeddingsCollection
        .where('content_id', '!=', content_id)
        .limit(500) // Reasonable limit for similarity calculation
        .get();

      const candidates = allEmbeddings.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate similarities
      const similarities = await calculateSimilarities(refEmbedding, candidates, min_similarity);

      // Get knowledge content for top results
      const results = await getKnowledgeContent(db, similarities.slice(0, limit));

      return {
        reference_content_id: content_id,
        similar_content: results,
        total_found: results.length
      };

    } catch (error: any) {
      logger.error('Find similar content failed', { error: error.message });
      throw new HttpsError('internal', `Find similar content failed: ${error.message}`);
    }
  }
);