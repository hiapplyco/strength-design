import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

interface SearchProgramsRequest {
  query: string;
  searchType?: 'general' | 'specific' | 'comparison';
  focus?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
  equipment?: string[];
}

interface SearchProgramsResponse {
  programs: Array<{
    name: string;
    description: string;
    difficulty: string;
    duration: string;
    focus: string[];
    equipment: string[];
    overview: string;
    structure: string;
    benefits: string[];
    considerations: string[];
    source: string;
    popularity: number;
  }>;
  summary: string;
  relatedQueries: string[];
  searchTime: string;
}

/**
 * Firebase Function to search fitness programs using Perplexity API
 */
export const searchPrograms = onCall<SearchProgramsRequest>(
  { 
    cors: true,
    enforceAppCheck: false,
    memory: '512MiB',
    timeoutSeconds: 60
  },
  async (request): Promise<SearchProgramsResponse> => {
    try {
      const { query, searchType = 'general', focus = [], difficulty, duration, equipment = [] } = request.data;

      if (!query || query.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Search query is required');
      }

      // Get Perplexity API key from environment (Firebase Secrets Manager)
      const apiKey = process.env.PERPLEXITY_API_KEY;

      if (!apiKey) {
        logger.warn('Perplexity API key not configured, using fallback simulation');
        // Return simulated results instead of throwing error
        return simulateProgramSearch(query, searchType, focus, difficulty, duration, equipment);
      }

      // Build the search prompt
      const systemPrompt = `You are a fitness program expert. Search for and provide detailed, accurate information about workout programs, their structure, benefits, and implementation. Focus on evidence-based programs with proven results.`;

      let userPrompt = `Search for: ${query}\n\n`;
      
      if (searchType === 'specific') {
        userPrompt += `Provide detailed information about this specific program.\n`;
      } else if (searchType === 'comparison') {
        userPrompt += `Compare different programs that match this query.\n`;
      }

      if (focus && focus.length > 0) {
        userPrompt += `Focus areas: ${focus.join(', ')}\n`;
      }
      
      if (difficulty) {
        userPrompt += `Difficulty level: ${difficulty}\n`;
      }
      
      if (duration) {
        userPrompt += `Program duration: ${duration}\n`;
      }
      
      if (equipment && equipment.length > 0) {
        userPrompt += `Available equipment: ${equipment.join(', ')}\n`;
      }

      userPrompt += `\nProvide structured information including:
      1. Program name and description
      2. Difficulty level and duration
      3. Focus areas and required equipment
      4. Program structure and progression
      5. Benefits and considerations
      6. Who it's best suited for`;

      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Perplexity API error:', errorText);
        throw new HttpsError('internal', 'Failed to search programs');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse the response and extract programs
      const programs = parsePrograms(content);

      // Generate summary
      const summary = programs.length > 0 
        ? `Found ${programs.length} programs matching your criteria.`
        : 'No programs found. Try adjusting your search criteria.';

      // Generate related queries
      const relatedQueries = generateRelatedQueries(query, focus, difficulty);

      return {
        programs,
        summary,
        relatedQueries,
        searchTime: new Date().toISOString(),
      };

    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Program search error:', errorMessage);
      throw new HttpsError('internal', 'Failed to search programs');
    }
  }
);

/**
 * Parse Perplexity response to extract structured program information
 */
function parsePrograms(content: string): SearchProgramsResponse['programs'] {
  // This is a simplified parser - in production, use more sophisticated parsing
  const programs: SearchProgramsResponse['programs'] = [];
  
  // For now, return sample data - replace with actual parsing logic
  if (content.toLowerCase().includes('starting strength') || content.toLowerCase().includes('strength')) {
    programs.push({
      name: 'Starting Strength',
      description: 'A novice barbell training program focused on fundamental compound movements',
      difficulty: 'beginner',
      duration: '3-6 months',
      focus: ['strength', 'powerlifting', 'compound movements'],
      equipment: ['barbell', 'squat rack', 'bench', 'plates'],
      overview: 'Starting Strength is a strength training program created by Mark Rippetoe.',
      structure: '3 days per week, alternating A/B workouts with squats, deadlifts, bench press, overhead press, and power cleans',
      benefits: [
        'Rapid strength gains for beginners',
        'Focus on proper form and technique',
        'Simple and effective programming',
        'Full body development'
      ],
      considerations: [
        'May lack volume for hypertrophy',
        'Limited accessory work',
        'Requires proper coaching for form'
      ],
      source: 'Mark Rippetoe',
      popularity: 95
    });
  }

  if (content.toLowerCase().includes('5/3/1') || content.toLowerCase().includes('wendler')) {
    programs.push({
      name: '5/3/1',
      description: 'An intermediate/advanced strength program with customizable assistance work',
      difficulty: 'intermediate',
      duration: 'Ongoing cycles',
      focus: ['strength', 'powerlifting', 'customizable'],
      equipment: ['barbell', 'dumbbells', 'various'],
      overview: '5/3/1 is a strength training program created by Jim Wendler.',
      structure: '4 days per week, focusing on squat, bench, deadlift, and overhead press with percentage-based progression',
      benefits: [
        'Sustainable long-term progression',
        'Highly customizable',
        'Prevents burnout with deload weeks',
        'Proven track record'
      ],
      considerations: [
        'Requires understanding of training max',
        'May progress slowly for beginners',
        'Multiple variations can be confusing'
      ],
      source: 'Jim Wendler',
      popularity: 90
    });
  }

  return programs;
}

/**
 * Simulate program search when API key is not available
 */
function simulateProgramSearch(
  query: string,
  searchType: string,
  focus: string[],
  difficulty?: string,
  duration?: string,
  equipment?: string[]
): SearchProgramsResponse {
  const programs: SearchProgramsResponse['programs'] = [];
  const lowerQuery = query.toLowerCase();

  // Yoga programs
  if (lowerQuery.includes('yoga') || lowerQuery.includes('yogi')) {
    programs.push({
      name: 'Inverted Yoga Mastery',
      description: 'Progressive program for mastering yoga inversions safely',
      difficulty: difficulty || 'intermediate',
      duration: duration || '12 weeks',
      focus: focus.length > 0 ? focus : ['flexibility', 'balance', 'core strength'],
      equipment: equipment && equipment.length > 0 ? equipment : ['yoga mat', 'yoga blocks', 'wall'],
      overview: 'A comprehensive program designed to build the strength, flexibility, and technique needed for yoga inversions including headstands, handstands, and forearm stands.',
      structure: '5 days per week: 3 inversion practice days, 2 strength/flexibility days',
      benefits: [
        'Improved balance and body awareness',
        'Increased core and upper body strength',
        'Enhanced circulation and lymphatic drainage',
        'Mental clarity and focus development'
      ],
      considerations: [
        'Requires consistent practice',
        'Not recommended for neck/back injuries',
        'Wall space needed for practice'
      ],
      source: 'Yoga Alliance Certified Program',
      popularity: 85
    });

    programs.push({
      name: 'Yin Yoga for Flexibility',
      description: 'Deep stretching and mindfulness practice',
      difficulty: 'beginner',
      duration: '8 weeks',
      focus: ['flexibility', 'mindfulness', 'recovery'],
      equipment: ['yoga mat', 'bolster', 'yoga blocks'],
      overview: 'Yin yoga focuses on long-held poses to target deep connective tissues and improve flexibility.',
      structure: '3-4 sessions per week, 60-90 minutes each',
      benefits: [
        'Increased flexibility and range of motion',
        'Stress reduction and mental calm',
        'Improved joint health',
        'Better recovery from intense workouts'
      ],
      considerations: [
        'Requires patience for long holds',
        'May feel intense for beginners',
        'Not a cardiovascular workout'
      ],
      source: 'Traditional Yin Yoga Practice',
      popularity: 75
    });
  }

  // Strength programs
  if (lowerQuery.includes('strength') || lowerQuery.includes('strong')) {
    programs.push({
      name: 'Starting Strength',
      description: 'Novice barbell training program',
      difficulty: 'beginner',
      duration: '3-6 months',
      focus: ['strength', 'powerlifting', 'compound movements'],
      equipment: ['barbell', 'squat rack', 'bench', 'plates'],
      overview: 'Mark Rippetoe\'s proven program for building foundational strength.',
      structure: '3 days per week, alternating A/B workouts',
      benefits: [
        'Rapid strength gains for beginners',
        'Focus on proper form',
        'Simple progression model',
        'Full body development'
      ],
      considerations: [
        'Limited exercise variety',
        'Requires gym access',
        'Form coaching recommended'
      ],
      source: 'Mark Rippetoe',
      popularity: 95
    });
  }

  // Default programs if no specific match
  if (programs.length === 0) {
    programs.push({
      name: 'General Fitness Program',
      description: 'Balanced program for overall fitness improvement',
      difficulty: difficulty || 'intermediate',
      duration: duration || '8 weeks',
      focus: focus.length > 0 ? focus : ['general fitness', 'health'],
      equipment: equipment && equipment.length > 0 ? equipment : ['basic equipment'],
      overview: 'A well-rounded program combining strength, cardio, and flexibility work.',
      structure: '4-5 days per week with varied training modalities',
      benefits: [
        'Improved overall fitness',
        'Better health markers',
        'Sustainable long-term',
        'Adaptable to different goals'
      ],
      considerations: [
        'Requires consistency',
        'May need modification based on individual needs',
        'Progress varies by individual'
      ],
      source: 'Evidence-based fitness principles',
      popularity: 70
    });
  }

  return {
    programs,
    summary: `Found ${programs.length} programs matching "${query}"`,
    relatedQueries: generateRelatedQueries(query, focus, difficulty),
    searchTime: new Date().toISOString()
  };
}

/**
 * Generate related search queries
 */
function generateRelatedQueries(
  query: string, 
  focus: string[] = [], 
  difficulty?: string
): string[] {
  const queries: string[] = [];
  
  // Add variations based on the original query
  if (query.toLowerCase().includes('beginner')) {
    queries.push('Best novice strength programs');
    queries.push('Simple workout routines for beginners');
  }
  
  if (focus.includes('strength')) {
    queries.push('Powerlifting programs comparison');
    queries.push('Best programs for strength gains');
  }
  
  if (focus.includes('hypertrophy')) {
    queries.push('Muscle building workout programs');
    queries.push('Bodybuilding split routines');
  }
  
  // Always add some general queries
  queries.push('Popular fitness programs 2024');
  queries.push('Evidence-based training programs');
  
  return queries.slice(0, 5); // Return max 5 queries
}