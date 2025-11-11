import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';

interface SearchRequest {
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
  offset?: number;
  sort?: 'relevance' | 'quality' | 'date' | 'popularity';
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  summary?: string;
  key_points?: string[];
  source: string;
  content_type: string;
  quality_score: number;
  tags: string[];
  url: string;
  created_at: string;
  relevance_score?: number;
}

/**
 * Search the knowledge base using various filters and ranking algorithms
 */
export const searchKnowledge = onCall(
  {
    timeoutSeconds: 30,
    memory: '512MiB',
    cors: true
  },
  async (request) => {
    try {
      logger.info('Knowledge search requested', {
        query: request.data.query,
        filters: request.data.filters
      });

      // Validate request
      if (!request.data.query || typeof request.data.query !== 'string') {
        throw new HttpsError('invalid-argument', 'Search query is required');
      }

      const searchRequest = request.data as SearchRequest;
      const {
        query,
        filters = {},
        limit = 20,
        offset = 0,
        sort = 'relevance'
      } = searchRequest;

      const db = getFirestore();
      const knowledgeCollection = db.collection('knowledge');

      // Build Firestore query with filters
      let firestoreQuery = knowledgeCollection as any;

      // Apply content type filter
      if (filters.content_type && filters.content_type.length > 0) {
        firestoreQuery = firestoreQuery.where('content_type', 'in', filters.content_type);
      }

      // Apply source filter
      if (filters.source && filters.source.length > 0) {
        firestoreQuery = firestoreQuery.where('source', 'in', filters.source);
      }

      // Apply quality score filter
      if (filters.min_quality_score) {
        firestoreQuery = firestoreQuery.where('quality_score', '>=', filters.min_quality_score);
      }

      // Apply date range filter
      if (filters.date_range) {
        if (filters.date_range.start) {
          firestoreQuery = firestoreQuery.where('created_at', '>=', new Date(filters.date_range.start));
        }
        if (filters.date_range.end) {
          firestoreQuery = firestoreQuery.where('created_at', '<=', new Date(filters.date_range.end));
        }
      }

      // Apply initial sorting (Firestore limitations require this)
      if (sort === 'date') {
        firestoreQuery = firestoreQuery.orderBy('created_at', 'desc');
      } else if (sort === 'quality') {
        firestoreQuery = firestoreQuery.orderBy('quality_score', 'desc');
      }

      // Execute query with reasonable limit for processing
      const snapshot = await firestoreQuery.limit(200).get();

      if (snapshot.empty) {
        return {
          results: [],
          total: 0,
          query,
          filters,
          processing_time: 0
        };
      }

      const startTime = Date.now();

      // Convert to search results and apply text-based filtering
      let results: SearchResult[] = [];
      
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        
        // Text-based search filtering
        if (!matchesTextSearch(data, query)) {
          return;
        }

        // Tag filtering (done in-memory due to Firestore limitations)
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => 
            data.tags && data.tags.includes(tag)
          );
          if (!hasMatchingTag) {
            return;
          }
        }

        const result: SearchResult = {
          id: doc.id,
          title: data.title,
          content: data.content,
          summary: data.summary,
          key_points: data.key_points,
          source: data.source,
          content_type: data.content_type,
          quality_score: data.quality_score,
          tags: data.tags || [],
          url: data.url,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          relevance_score: calculateRelevanceScore(data, query)
        };

        results.push(result);
      });

      // Sort results based on sort parameter
      results = sortResults(results, sort);

      // Apply pagination
      const total = results.length;
      const paginatedResults = results.slice(offset, offset + limit);

      const processingTime = Date.now() - startTime;

      logger.info('Knowledge search completed', {
        query,
        total_found: total,
        returned: paginatedResults.length,
        processing_time: processingTime
      });

      return {
        results: paginatedResults,
        total,
        query,
        filters,
        processing_time: processingTime,
        suggestions: generateSearchSuggestions(query, results)
      };

    } catch (error: any) {
      logger.error('Knowledge search failed', { error: error.message });
      throw new HttpsError('internal', `Search failed: ${error.message}`);
    }
  }
);

function matchesTextSearch(data: any, query: string): boolean {
  const queryLower = query.toLowerCase();
  const searchTerms = queryLower.split(/\s+/).filter(term => term.length > 2);

  // If no valid search terms, return true (show all)
  if (searchTerms.length === 0) {
    return true;
  }

  // Searchable fields
  const title = (data.title || '').toLowerCase();
  const content = (data.content || '').toLowerCase();
  const summary = (data.summary || '').toLowerCase();
  const tags = (data.tags || []).join(' ').toLowerCase();
  const keyPoints = (data.key_points || []).join(' ').toLowerCase();

  const searchableText = `${title} ${content} ${summary} ${tags} ${keyPoints}`;

  // Check if all search terms are present (AND logic)
  return searchTerms.every(term => searchableText.includes(term));
}

function calculateRelevanceScore(data: any, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Title matching (highest weight)
  const title = (data.title || '').toLowerCase();
  if (title.includes(queryLower)) {
    score += 100;
  } else if (title.includes(queryLower.split(' ')[0])) {
    score += 50;
  }

  // Content type relevance
  if (data.content_type === 'exercise' && queryLower.includes('exercise')) {
    score += 30;
  } else if (data.content_type === 'routine' && (queryLower.includes('routine') || queryLower.includes('workout'))) {
    score += 30;
  } else if (data.content_type === 'nutrition' && (queryLower.includes('nutrition') || queryLower.includes('diet'))) {
    score += 30;
  }

  // Tag matching
  const tags = data.tags || [];
  const queryTerms = queryLower.split(/\s+/);
  queryTerms.forEach(term => {
    if (tags.includes(term)) {
      score += 20;
    }
  });

  // Summary matching (if available)
  if (data.summary && data.summary.toLowerCase().includes(queryLower)) {
    score += 15;
  }

  // Quality score factor
  score *= data.quality_score || 0.5;

  // Source credibility factor
  if (data.source === 'wikipedia') {
    score *= 1.2;
  } else if (data.source === 'reddit') {
    const metadata = data.metadata || {};
    if (metadata.score > 50) {
      score *= 1.1;
    }
  }

  return Math.round(score);
}

function sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
  switch (sortBy) {
    case 'relevance':
      return results.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    
    case 'quality':
      return results.sort((a, b) => b.quality_score - a.quality_score);
    
    case 'date':
      return results.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    case 'popularity':
      // Sort by a combination of quality and source-specific popularity metrics
      return results.sort((a, b) => {
        const aPopularity = calculatePopularityScore(a);
        const bPopularity = calculatePopularityScore(b);
        return bPopularity - aPopularity;
      });
    
    default:
      return results;
  }
}

function calculatePopularityScore(result: SearchResult): number {
  let score = result.quality_score * 10;

  // Add source-specific popularity metrics
  if (result.source === 'reddit') {
    // Reddit posts with high scores and comments are more popular
    const metadata = (result as any).metadata || {};
    score += (metadata.score || 0) * 0.1;
    score += (metadata.num_comments || 0) * 0.2;
  } else if (result.source === 'wikipedia') {
    // Wikipedia pages are generally more authoritative
    score += 20;
  }

  return score;
}

function generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
  const suggestions = new Set<string>();
  
  // Extract common tags from results
  const tagFrequency: Record<string, number> = {};
  results.forEach(result => {
    result.tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  // Get most frequent tags as suggestions
  const sortedTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  sortedTags.forEach(tag => suggestions.add(tag));

  // Add content type suggestions
  const contentTypes = [...new Set(results.map(r => r.content_type))];
  contentTypes.forEach(type => suggestions.add(type));

  // Add query variations
  const queryLower = query.toLowerCase();
  const variations = [
    `${queryLower} routine`,
    `${queryLower} guide`,
    `${queryLower} exercise`,
    `${queryLower} nutrition`
  ];
  
  variations.forEach(variation => {
    if (variation !== query) {
      suggestions.add(variation);
    }
  });

  return Array.from(suggestions).slice(0, 8);
}