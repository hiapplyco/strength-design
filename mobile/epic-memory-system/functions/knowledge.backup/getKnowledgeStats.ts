import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';

interface StatsRequest {
  include_details?: boolean;
  date_range?: {
    start?: string;
    end?: string;
  };
}

/**
 * Get comprehensive statistics about the knowledge base
 */
export const getKnowledgeStats = onCall(
  {
    timeoutSeconds: 30,
    memory: '512MiB',
    cors: true
  },
  async (request) => {
    try {
      logger.info('Knowledge stats requested', {
        include_details: request.data?.include_details,
        date_range: request.data?.date_range
      });

      const { include_details = false, date_range } = request.data as StatsRequest || {};

      const db = getFirestore();
      const knowledgeCollection = db.collection('knowledge');

      // Build base query
      let query = knowledgeCollection as any;
      
      if (date_range) {
        if (date_range.start) {
          query = query.where('created_at', '>=', new Date(date_range.start));
        }
        if (date_range.end) {
          query = query.where('created_at', '<=', new Date(date_range.end));
        }
      }

      // Get all documents (or within date range)
      const snapshot = await query.get();

      if (snapshot.empty) {
        return {
          total_items: 0,
          message: 'No knowledge items found'
        };
      }

      const stats = {
        total_items: snapshot.size,
        by_source: {} as Record<string, number>,
        by_content_type: {} as Record<string, number>,
        by_quality_range: {
          high: 0,      // >= 0.8
          medium: 0,    // 0.6-0.8
          low: 0        // < 0.6
        },
        average_quality_score: 0,
        tag_frequency: {} as Record<string, number>,
        processing_status: {
          enhanced: 0,
          categorized: 0,
          exercises_extracted: 0,
          summarized: 0
        },
        date_range: {
          earliest: null as string | null,
          latest: null as string | null
        },
        content_length_stats: {
          average: 0,
          min: Number.MAX_SAFE_INTEGER,
          max: 0
        }
      };

      let totalQualityScore = 0;
      let totalContentLength = 0;
      const dates: Date[] = [];

      // Analyze each document
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();

        // Source distribution
        const source = data.source || 'unknown';
        stats.by_source[source] = (stats.by_source[source] || 0) + 1;

        // Content type distribution
        const contentType = data.content_type || 'unknown';
        stats.by_content_type[contentType] = (stats.by_content_type[contentType] || 0) + 1;

        // Quality distribution
        const qualityScore = data.quality_score || 0;
        totalQualityScore += qualityScore;
        
        if (qualityScore >= 0.8) {
          stats.by_quality_range.high++;
        } else if (qualityScore >= 0.6) {
          stats.by_quality_range.medium++;
        } else {
          stats.by_quality_range.low++;
        }

        // Tag frequency
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => {
            stats.tag_frequency[tag] = (stats.tag_frequency[tag] || 0) + 1;
          });
        }

        // Processing status
        if (data.enhanced_at) stats.processing_status.enhanced++;
        if (data.ai_categories) stats.processing_status.categorized++;
        if (data.extracted_exercises) stats.processing_status.exercises_extracted++;
        if (data.ai_summary) stats.processing_status.summarized++;

        // Content length stats
        const contentLength = data.content?.length || 0;
        totalContentLength += contentLength;
        stats.content_length_stats.min = Math.min(stats.content_length_stats.min, contentLength);
        stats.content_length_stats.max = Math.max(stats.content_length_stats.max, contentLength);

        // Date tracking
        if (data.created_at) {
          const date = data.created_at.toDate ? data.created_at.toDate() : new Date(data.created_at);
          dates.push(date);
        }
      });

      // Calculate averages
      stats.average_quality_score = totalQualityScore / snapshot.size;
      stats.content_length_stats.average = totalContentLength / snapshot.size;
      
      // Fix min value if no content found
      if (stats.content_length_stats.min === Number.MAX_SAFE_INTEGER) {
        stats.content_length_stats.min = 0;
      }

      // Date range
      if (dates.length > 0) {
        dates.sort((a, b) => a.getTime() - b.getTime());
        stats.date_range.earliest = dates[0].toISOString();
        stats.date_range.latest = dates[dates.length - 1].toISOString();
      }

      // Sort tag frequency (most common first)
      const sortedTags = Object.entries(stats.tag_frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20) // Top 20 tags
        .reduce((obj, [tag, count]) => {
          obj[tag] = count;
          return obj;
        }, {} as Record<string, number>);
      
      stats.tag_frequency = sortedTags;

      let result: any = stats;

      // Add detailed breakdown if requested
      if (include_details) {
        result.detailed_breakdown = await getDetailedBreakdown(db, snapshot);
      }

      // Add system-level stats from system collection
      try {
        const systemStats = await db.collection('system').doc('knowledge_stats').get();
        if (systemStats.exists) {
          result.ingestion_history = systemStats.data();
        }
      } catch (error: any) {
        logger.warn('Could not fetch system stats', { error: error.message });
      }

      logger.info('Knowledge stats completed', {
        total_items: stats.total_items,
        processing_time: Date.now()
      });

      return result;

    } catch (error: any) {
      logger.error('Failed to get knowledge stats', { error: error.message });
      throw new HttpsError('internal', `Stats retrieval failed: ${error.message}`);
    }
  }
);

async function getDetailedBreakdown(
  db: FirebaseFirestore.Firestore, 
  snapshot: FirebaseFirestore.QuerySnapshot
): Promise<any> {
  const breakdown = {
    source_quality_correlation: {} as Record<string, { count: number; avg_quality: number }>,
    content_type_by_source: {} as Record<string, Record<string, number>>,
    monthly_ingestion: {} as Record<string, number>,
    top_quality_items: [] as any[],
    enhancement_coverage: {
      total_items: snapshot.size,
      enhanced_percentage: 0,
      categorized_percentage: 0,
      exercises_extracted_percentage: 0
    }
  };

  let enhancedCount = 0;
  let categorizedCount = 0;
  let exercisesExtractedCount = 0;

  // Collect high-quality items for top list
  const qualityItems: any[] = [];

  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();

    // Source-quality correlation
    const source = data.source || 'unknown';
    if (!breakdown.source_quality_correlation[source]) {
      breakdown.source_quality_correlation[source] = { count: 0, avg_quality: 0 };
    }
    breakdown.source_quality_correlation[source].count++;
    breakdown.source_quality_correlation[source].avg_quality += data.quality_score || 0;

    // Content type by source
    const contentType = data.content_type || 'unknown';
    if (!breakdown.content_type_by_source[source]) {
      breakdown.content_type_by_source[source] = {};
    }
    breakdown.content_type_by_source[source][contentType] = 
      (breakdown.content_type_by_source[source][contentType] || 0) + 1;

    // Monthly ingestion pattern
    if (data.created_at) {
      const date = data.created_at.toDate ? data.created_at.toDate() : new Date(data.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      breakdown.monthly_ingestion[monthKey] = (breakdown.monthly_ingestion[monthKey] || 0) + 1;
    }

    // Enhancement tracking
    if (data.enhanced_at) enhancedCount++;
    if (data.ai_categories) categorizedCount++;
    if (data.extracted_exercises) exercisesExtractedCount++;

    // Collect for top quality list
    if ((data.quality_score || 0) >= 0.8) {
      qualityItems.push({
        id: doc.id,
        title: data.title,
        source: data.source,
        content_type: data.content_type,
        quality_score: data.quality_score,
        tags: data.tags || []
      });
    }
  });

  // Calculate averages for source-quality correlation
  Object.keys(breakdown.source_quality_correlation).forEach(source => {
    const sourceData = breakdown.source_quality_correlation[source];
    sourceData.avg_quality = sourceData.avg_quality / sourceData.count;
  });

  // Enhancement coverage percentages
  breakdown.enhancement_coverage.enhanced_percentage = (enhancedCount / snapshot.size) * 100;
  breakdown.enhancement_coverage.categorized_percentage = (categorizedCount / snapshot.size) * 100;
  breakdown.enhancement_coverage.exercises_extracted_percentage = (exercisesExtractedCount / snapshot.size) * 100;

  // Top quality items (limit to 10)
  breakdown.top_quality_items = qualityItems
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, 10);

  return breakdown;
}