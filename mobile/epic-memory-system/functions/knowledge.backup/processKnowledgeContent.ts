import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define secrets
const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface ProcessingRequest {
  content_ids?: string[];
  processing_type: 'enhance' | 'categorize' | 'extract_exercises' | 'summarize_all';
  options?: {
    batch_size?: number;
    force_reprocess?: boolean;
  };
}

/**
 * Process existing knowledge content to enhance it with AI-generated insights
 */
export const processKnowledgeContent = onCall(
  {
    secrets: [geminiApiKey],
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: true
  },
  async (request) => {
    try {
      logger.info('Starting knowledge content processing', {
        processing_type: request.data.processing_type,
        content_count: request.data.content_ids?.length || 'all'
      });

      if (!geminiApiKey.value()) {
        throw new HttpsError('failed-precondition', 'Gemini API key not configured');
      }

      const { content_ids, processing_type, options = {} } = request.data as ProcessingRequest;
      const { batch_size = 5, force_reprocess = false } = options;

      const db = getFirestore();
      const genAI = new GoogleGenerativeAI(geminiApiKey.value()!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let query = db.collection('knowledge') as any;

      // If specific content IDs provided, filter to those
      if (content_ids && content_ids.length > 0) {
        // Firestore 'in' queries are limited to 10 items
        if (content_ids.length <= 10) {
          query = query.where('__name__', 'in', content_ids.map(id => db.collection('knowledge').doc(id)));
        } else {
          // For larger sets, we'll process in chunks
          throw new HttpsError('invalid-argument', 'Cannot process more than 10 specific items at once');
        }
      }

      // Filter out already processed content unless force_reprocess is true
      if (!force_reprocess) {
        switch (processing_type) {
          case 'enhance':
            query = query.where('enhanced_at', '==', null);
            break;
          case 'categorize':
            query = query.where('ai_categories', '==', null);
            break;
          case 'extract_exercises':
            query = query.where('extracted_exercises', '==', null);
            break;
        }
      }

      const snapshot = await query.limit(100).get();

      if (snapshot.empty) {
        return {
          success: true,
          processed: 0,
          message: 'No content found to process'
        };
      }

      const results = {
        processed: 0,
        errors: 0,
        enhanced_items: [] as any[]
      };

      // Process in batches
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batch_size) {
        const batch = docs.slice(i, i + batch_size);
        
        const batchPromises = batch.map((doc: any) => 
          processDocument(doc, processing_type, model, db)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.processed++;
            results.enhanced_items.push(result.value);
          } else {
            results.errors++;
            logger.error(`Failed to process document ${batch[index].id}`, {
              error: result.reason
            });
          }
        });

        // Rate limiting delay
        if (i + batch_size < docs.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      logger.info('Knowledge content processing completed', results);

      return {
        success: true,
        processing_type,
        ...results,
        message: `Processed ${results.processed} items with ${results.errors} errors`
      };

    } catch (error: any) {
      logger.error('Knowledge content processing failed', { error: error.message });
      throw new HttpsError('internal', `Processing failed: ${error.message}`);
    }
  }
);

async function processDocument(
  doc: any,
  processingType: string,
  model: any,
  db: FirebaseFirestore.Firestore
): Promise<any> {
  const data = doc.data();
  const updates: any = {};

  try {
    switch (processingType) {
      case 'enhance':
        const enhancement = await enhanceContent(data, model);
        Object.assign(updates, enhancement);
        updates.enhanced_at = Timestamp.now();
        break;

      case 'categorize':
        const categories = await categorizeContent(data, model);
        updates.ai_categories = categories;
        updates.categorized_at = Timestamp.now();
        break;

      case 'extract_exercises':
        const exercises = await extractExercises(data, model);
        updates.extracted_exercises = exercises;
        updates.exercises_extracted_at = Timestamp.now();
        break;

      case 'summarize_all':
        const summary = await generateComprehensiveSummary(data, model);
        updates.ai_summary = summary;
        updates.summarized_at = Timestamp.now();
        break;

      default:
        throw new Error(`Unknown processing type: ${processingType}`);
    }

    // Update document
    await db.collection('knowledge').doc(doc.id).update(updates);

    return {
      id: doc.id,
      processing_type: processingType,
      updates: Object.keys(updates)
    };

  } catch (error: any) {
    logger.error(`Failed to process document ${doc.id}`, { error: error.message });
    throw error;
  }
}

async function enhanceContent(data: any, model: any): Promise<any> {
  const prompt = `
Analyze this fitness content and provide enhancements:

Title: ${data.title}
Content Type: ${data.content_type}
Source: ${data.source}

Content:
${data.content.substring(0, 3000)}

Please provide:
1. A concise summary (2-3 sentences)
2. 3-5 key actionable takeaways
3. Difficulty level (beginner/intermediate/advanced)
4. Target audience (who would benefit most)
5. Related topics or exercises that complement this content

Format your response as JSON:
{
  "summary": "...",
  "key_takeaways": ["...", "..."],
  "difficulty_level": "...",
  "target_audience": "...",
  "related_topics": ["...", "..."]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Try to parse JSON response
    const enhancement = JSON.parse(responseText);
    
    return {
      ai_summary: enhancement.summary,
      key_takeaways: enhancement.key_takeaways,
      difficulty_level: enhancement.difficulty_level,
      target_audience: enhancement.target_audience,
      related_topics: enhancement.related_topics
    };

  } catch (error: any) {
    logger.error('Failed to enhance content', { error: error.message });
    // Return basic enhancement if JSON parsing fails
    return {
      ai_summary: 'AI enhancement failed',
      key_takeaways: [],
      difficulty_level: 'unknown',
      target_audience: 'general',
      related_topics: []
    };
  }
}

async function categorizeContent(data: any, model: any): Promise<string[]> {
  const prompt = `
Categorize this fitness content into specific, detailed categories:

Title: ${data.title}
Content Type: ${data.content_type}

Content:
${data.content.substring(0, 2000)}

Choose the most relevant categories from this comprehensive list:
- Exercise Types: strength, cardio, flexibility, balance, plyometrics, endurance
- Body Parts: chest, back, shoulders, arms, legs, core, full-body
- Equipment: bodyweight, dumbbells, barbells, machines, resistance-bands, kettlebells
- Skill Level: beginner, intermediate, advanced
- Goals: weight-loss, muscle-building, strength, endurance, flexibility, rehabilitation
- Training Style: powerlifting, bodybuilding, calisthenics, crossfit, yoga, pilates
- Nutrition: meal-planning, supplements, hydration, macros, cutting, bulking

Return only the most relevant categories as a JSON array of strings. Maximum 6 categories.
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (jsonMatch) {
      const categories = JSON.parse(jsonMatch[0]);
      return Array.isArray(categories) ? categories : [];
    }
    
    return [];

  } catch (error: any) {
    logger.error('Failed to categorize content', { error: error.message });
    return [];
  }
}

async function extractExercises(data: any, model: any): Promise<any[]> {
  const prompt = `
Extract specific exercises mentioned in this fitness content:

Title: ${data.title}
Content:
${data.content}

For each exercise mentioned, provide:
- Exercise name
- Target muscle groups
- Equipment needed
- Brief description (if provided)
- Any specific form cues or tips mentioned

Format as JSON array:
[
  {
    "name": "Exercise Name",
    "muscle_groups": ["primary", "secondary"],
    "equipment": ["equipment1", "equipment2"],
    "description": "Brief description",
    "form_cues": ["cue1", "cue2"]
  }
]

Only include exercises that are explicitly mentioned. If no exercises are found, return an empty array.
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (jsonMatch) {
      const exercises = JSON.parse(jsonMatch[0]);
      return Array.isArray(exercises) ? exercises : [];
    }
    
    return [];

  } catch (error: any) {
    logger.error('Failed to extract exercises', { error: error.message });
    return [];
  }
}

async function generateComprehensiveSummary(data: any, model: any): Promise<string> {
  const prompt = `
Create a comprehensive summary of this fitness content that would be useful for an AI assistant helping users with fitness questions:

Title: ${data.title}
Content Type: ${data.content_type}
Source: ${data.source}
Quality Score: ${data.quality_score}

Content:
${data.content}

Provide a detailed summary that includes:
1. Main topic and purpose
2. Key information and advice
3. Target audience and applicability
4. Important warnings or considerations
5. How this relates to broader fitness concepts

Make it comprehensive but concise (200-300 words). This will be used by an AI to provide better fitness advice to users.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error: any) {
    logger.error('Failed to generate comprehensive summary', { error: error.message });
    throw error;
  }
}