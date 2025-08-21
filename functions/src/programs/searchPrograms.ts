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
    timeoutSeconds: 60,
    secrets: ['PERPLEXITY_API_KEY']
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
        logger.error('Perplexity API key not configured');
        throw new HttpsError(
          'failed-precondition',
          'Perplexity API key is not configured. Please contact support to enable program search.'
        );
      }

      // Build the search prompt for structured results
      const systemPrompt = `You are a fitness program expert providing comprehensive, well-structured information about workout programs. 
      
      FORMAT YOUR RESPONSE WITH CLEAR SECTIONS:
      - Use "## Program Name" for each program
      - Use bullet points for lists
      - Include specific details about sets, reps, and progression
      - Cite sources when possible
      - Focus on evidence-based, proven programs`;

      let userPrompt = `Search for fitness programs: ${query}\n\n`;
      
      if (searchType === 'specific') {
        userPrompt += `Focus: Detailed information about this specific program.\n`;
      } else if (searchType === 'comparison') {
        userPrompt += `Focus: Compare different programs that match this query.\n`;
      }

      if (focus && focus.length > 0) {
        userPrompt += `Training focus: ${focus.join(', ')}\n`;
      }
      
      if (difficulty) {
        userPrompt += `Experience level: ${difficulty}\n`;
      }
      
      if (duration) {
        userPrompt += `Time commitment: ${duration}\n`;
      }
      
      if (equipment && equipment.length > 0) {
        userPrompt += `Equipment available: ${equipment.join(', ')}\n`;
      }

      userPrompt += `\nFor each program found, provide:

## [Program Name]

**Overview:** Brief description (2-3 sentences)

**Details:**
- Difficulty: [beginner/intermediate/advanced]
- Duration: [weeks/months]
- Frequency: [days per week]
- Focus: [strength/hypertrophy/powerlifting/etc]
- Equipment: [required equipment]

**Structure:**
- Specific workout split (e.g., Day 1: Squat/Bench/Row)
- Set and rep schemes
- Progression method

**Benefits:**
- Key advantages (3-4 bullet points)

**Considerations:**
- Important notes or limitations

**Best For:**
- Target audience

Include 3-5 relevant programs with detailed information.`;

      // Call Perplexity Sonar API with the latest model for best results
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro', // Using sonar-pro for best quality search results
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000, // Increased for more comprehensive results
          return_citations: true, // Get source citations
          search_recency_filter: 'year', // Focus on recent content from past year
          // Add search domain filter for fitness-related sources
          search_domain_filter: [
            'stronglifts.com',
            'startingstrength.com', 
            'bodybuilding.com',
            'exrx.net',
            't-nation.com',
            'elitefts.com',
            'jimwendler.com',
            'reddit.com/r/fitness',
            'reddit.com/r/powerlifting',
            'reddit.com/r/bodybuilding',
            'athleanx.com',
            'muscleandstrength.com'
          ]
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
  const programs: SearchProgramsResponse['programs'] = [];
  
  try {
    // Split by program headers (## Program Name pattern)
    const programSections = content.split(/##\s+/).filter(s => s.trim().length > 0);
    
    for (const section of programSections) {
      if (section.trim().length < 50) continue; // Skip short sections
      
      // Extract program name from the first line
      const lines = section.split('\n');
      const name = lines[0].trim().replace(/[*_#]/g, '');
      if (!name || name.length < 2) continue;
      
      // Parse markdown sections
      const sectionText = lines.slice(1).join('\n');
      
      // Extract overview
      const overviewMatch = sectionText.match(/\*\*Overview:\*\*\s*([^\n]+)/i);
      const overview = overviewMatch?.[1]?.trim() || '';
      
      // Extract details section
      const detailsMatch = sectionText.match(/\*\*Details:\*\*([^*]*?)(?=\*\*|$)/si);
      const detailsText = detailsMatch?.[1] || '';
      
      // Parse details
      const difficultyMatch = detailsText.match(/Difficulty:\s*([^\n]+)/i);
      const difficulty = difficultyMatch?.[1]?.trim().toLowerCase() || 'intermediate';
      
      const durationMatch = detailsText.match(/Duration:\s*([^\n]+)/i);
      const duration = durationMatch?.[1]?.trim() || '8-12 weeks';
      
      const frequencyMatch = detailsText.match(/Frequency:\s*([^\n]+)/i);
      const frequency = frequencyMatch?.[1]?.trim() || '3-4 days per week';
      
      const focusMatch = detailsText.match(/Focus:\s*([^\n]+)/i);
      const focusText = focusMatch?.[1] || 'general fitness';
      const focus = focusText.split(/[,;\/]/).map(f => f.trim().toLowerCase()).filter(f => f.length > 0);
      
      const equipmentMatch = detailsText.match(/Equipment:\s*([^\n]+)/i);
      const equipmentText = equipmentMatch?.[1] || 'gym equipment';
      const equipment = equipmentText.split(/[,;\/]/).map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
      
      // Extract structure
      const structureMatch = sectionText.match(/\*\*Structure:\*\*([^*]*?)(?=\*\*|$)/si);
      const structureText = structureMatch?.[1] || '';
      const structureLines = structureText.split('\n')
        .map(l => l.replace(/^[-•*]\s*/, '').trim())
        .filter(l => l.length > 0)
        .join('; ');
      
      // Extract benefits
      const benefitsMatch = sectionText.match(/\*\*Benefits:\*\*([^*]*?)(?=\*\*|$)/si);
      const benefitsText = benefitsMatch?.[1] || '';
      const benefits = benefitsText.split('\n')
        .map(l => l.replace(/^[-•*]\s*/, '').trim())
        .filter(l => l.length > 5 && l.length < 200)
        .slice(0, 5);
      
      // Extract considerations
      const considerationsMatch = sectionText.match(/\*\*Considerations:\*\*([^*]*?)(?=\*\*|$)/si);
      const considerationsText = considerationsMatch?.[1] || '';
      const considerations = considerationsText.split('\n')
        .map(l => l.replace(/^[-•*]\s*/, '').trim())
        .filter(l => l.length > 5 && l.length < 200)
        .slice(0, 3);
      
      // Extract best for
      const bestForMatch = sectionText.match(/\*\*Best For:\*\*\s*([^\n*]+)/i);
      const bestFor = bestForMatch?.[1]?.trim() || '';
      
      // Calculate popularity based on common program names and keywords
      const popularPrograms = /stronglifts|starting strength|5\/3\/1|push pull legs|ppl|upper lower|phul|phat|gzcl|nsuns/gi;
      const isPopular = popularPrograms.test(name);
      const popularityKeywords = /popular|recommended|proven|effective|widely|best|top/gi;
      const popularityMatches = sectionText.match(popularityKeywords);
      const popularity = Math.min(95, (isPopular ? 85 : 70) + (popularityMatches?.length || 0) * 3);
      
      // Build description combining overview and best for
      const description = overview || `${name} - ${bestFor || 'Structured workout program'}`.substring(0, 150);
      
      programs.push({
        name,
        description,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        duration: `${duration}${frequency ? ` (${frequency})` : ''}`,
        focus: focus.length > 0 ? focus : ['general fitness'],
        equipment: equipment.length > 0 ? equipment : ['gym equipment'],
        overview: overview || description,
        structure: structureLines || 'Structured progressive overload',
        benefits: benefits.length > 0 ? benefits : ['Progressive strength gains', 'Structured approach'],
        considerations: considerations.length > 0 ? considerations : ['Requires consistency and commitment'],
        source: 'Perplexity Sonar Pro',
        popularity
      });
      
      // Limit to 10 programs max
      if (programs.length >= 10) break;
    }
    
    // Fallback: If no programs parsed with ## headers, try older parsing method
    if (programs.length === 0) {
      // Try numbered list format (1. Program Name)
      const numberedSections = content.split(/\n\d+\.\s+/).filter(s => s.trim().length > 50);
      
      for (const section of numberedSections.slice(0, 5)) {
        const lines = section.split('\n');
        const firstLine = lines[0].trim();
        if (!firstLine) continue;
        
        // Extract name from first line or bold text
        const nameMatch = firstLine.match(/^([^:.\n]{3,50})|(?:\*\*|__)([^*_]+)(?:\*\*|__)/);
        const name = (nameMatch?.[1] || nameMatch?.[2])?.trim();
        if (!name) continue;
        
        programs.push({
          name,
          description: section.substring(0, 150).replace(/\n/g, ' ').trim(),
          difficulty: 'intermediate',
          duration: '8-12 weeks',
          focus: ['general fitness'],
          equipment: ['gym equipment'],
          overview: section.substring(0, 200).replace(/\n/g, ' ').trim(),
          structure: 'Progressive overload training',
          benefits: ['Structured progression', 'Evidence-based approach'],
          considerations: ['Requires consistency'],
          source: 'Perplexity Search',
          popularity: 75
        });
      }
    }
    
    // Final fallback if still no programs
    if (programs.length === 0 && content.length > 100) {
      programs.push({
        name: 'Search Results',
        description: 'Programs matching your search criteria',
        difficulty: 'intermediate',
        duration: 'Varies',
        focus: ['custom'],
        equipment: ['varies'],
        overview: content.substring(0, 200).replace(/\n/g, ' ').trim(),
        structure: 'Based on your specific goals',
        benefits: ['Tailored to your needs', 'Flexible approach'],
        considerations: ['Review programs carefully'],
        source: 'Perplexity AI',
        popularity: 70
      });
    }
  } catch (error) {
    logger.error('Error parsing programs:', error);
  }
  
  return programs;
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
