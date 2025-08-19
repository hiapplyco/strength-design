/**
 * Perplexity Search Service for Workout Programs
 * Searches for evidence-based workout programs from credible sources
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// System prompts for different search types
const SYSTEM_PROMPTS = {
  PROGRAM_SEARCH: `You are a fitness research expert specializing in evidence-based workout programs. Your task is to find and analyze professional workout programs from credible sources.

CREDIBILITY CRITERIA:
- Certified trainers, exercise physiologists, sports scientists
- Published athletes, coaches with proven track records
- Academic research and peer-reviewed studies
- Well-established fitness organizations (ACSM, NSCA, etc.)
- Programs with documented success and scientific backing

SEARCH FOCUS:
- Look for complete, structured workout programs (not just individual exercises)
- Prioritize programs with clear progression, periodization, and methodology
- Include both strength training and cardiovascular programs
- Consider programs for different goals: strength, hypertrophy, endurance, fat loss
- Find programs for different experience levels: beginner, intermediate, advanced

RESPONSE FORMAT:
For each program found, provide:
1. Program Name
2. Creator/Author with credentials
3. Target Goals (strength, muscle gain, fat loss, etc.)
4. Experience Level Required
5. Duration/Timeline
6. Key Principles/Methodology
7. Credibility Score (1-10) with justification
8. Brief Program Structure
9. Source/Reference

QUALITY STANDARDS:
- Only include programs with credibility score 7+
- Verify creator credentials and reputation
- Look for programs with documented results
- Prioritize evidence-based approaches over trends`,

  PROGRAM_DETAILS: `You are a fitness expert analyzing a specific workout program for implementation. Extract detailed, actionable information that can be used to create a structured workout plan.

EXTRACTION REQUIREMENTS:
1. PROGRAM STRUCTURE:
   - Weekly split (how many days, which muscles/movements each day)
   - Exercise selection and order
   - Sets, reps, and intensity guidelines
   - Rest periods between sets and exercises
   - Progression scheme (how to advance over time)

2. METHODOLOGY:
   - Training principles used (progressive overload, periodization, etc.)
   - Warm-up and cool-down protocols
   - Recovery recommendations
   - Frequency and timing guidelines

3. ADAPTATIONS:
   - Beginner modifications
   - Advanced variations
   - Equipment alternatives
   - Injury considerations

4. IMPLEMENTATION DETAILS:
   - Starting weights/intensities
   - How to track progress
   - When to deload or modify
   - Expected timeline for results

FORMAT AS STRUCTURED JSON:
{
  "programName": "string",
  "creator": "string",
  "credibilityScore": number,
  "summary": "string",
  "targetGoals": ["string"],
  "experienceLevel": "string",
  "duration": "string",
  "weeklyStructure": {
    "daysPerWeek": number,
    "schedule": ["string"]
  },
  "exercises": [
    {
      "name": "string",
      "category": "string",
      "sets": "string",
      "reps": "string",
      "intensity": "string",
      "notes": "string"
    }
  ],
  "progression": "string",
  "principles": ["string"],
  "equipment": ["string"],
  "modifications": {
    "beginner": "string",
    "advanced": "string"
  }
}`
};

class PerplexitySearchService {
  constructor() {
    this.apiKey = null;
    this.baseURL = PERPLEXITY_API_URL;
  }

  /**
   * Initialize with API key (should be set in environment or securely stored)
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Search for workout programs using Perplexity API
   * @param {string} query - Search query (e.g., "strength training program for beginners")
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of program results
   */
  async searchPrograms(query, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key not configured');
      }

      const {
        experienceLevel = 'any',
        goals = 'any',
        equipment = 'any',
        duration = 'any',
        maxResults = 5
      } = options;

      // Construct search prompt
      const searchPrompt = this.buildSearchPrompt(query, {
        experienceLevel,
        goals,
        equipment,
        duration,
        maxResults
      });

      const response = await this.makeApiCall({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPTS.PROGRAM_SEARCH
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      return this.parseSearchResults(response);
    } catch (error) {
      console.error('Error searching programs:', error);
      throw new Error(`Failed to search programs: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific program
   * @param {string} programName - Name of the program to analyze
   * @param {string} creator - Program creator/author
   * @returns {Promise<Object>} Detailed program structure
   */
  async getProgramDetails(programName, creator) {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key not configured');
      }

      const detailPrompt = `Find detailed information about the "${programName}" workout program by ${creator}. 
      
      Focus on:
      - Complete workout structure and exercises
      - Sets, reps, and progression schemes
      - Weekly schedule and timing
      - Scientific rationale and methodology
      - Implementation guidelines
      
      Provide comprehensive details that would allow someone to follow this program exactly as designed.`;

      const response = await this.makeApiCall({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPTS.PROGRAM_DETAILS
          },
          {
            role: 'user',
            content: detailPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });

      return this.parseProgramDetails(response);
    } catch (error) {
      console.error('Error getting program details:', error);
      throw new Error(`Failed to get program details: ${error.message}`);
    }
  }

  /**
   * Search for programs with specific criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Filtered program results
   */
  async searchWithCriteria(criteria) {
    const {
      goal = 'general fitness',
      experienceLevel = 'beginner',
      timeAvailable = '3-4 hours per week',
      equipment = 'basic gym equipment',
      focusAreas = []
    } = criteria;

    let query = `${goal} workout program for ${experienceLevel}`;
    
    if (timeAvailable) {
      query += ` with ${timeAvailable} time commitment`;
    }
    
    if (equipment !== 'basic gym equipment') {
      query += ` using ${equipment}`;
    }
    
    if (focusAreas.length > 0) {
      query += ` focusing on ${focusAreas.join(', ')}`;
    }

    return this.searchPrograms(query, {
      experienceLevel,
      goals: goal,
      equipment,
      maxResults: 8
    });
  }

  /**
   * Build search prompt with specific criteria
   */
  buildSearchPrompt(query, options) {
    const { experienceLevel, goals, equipment, duration, maxResults } = options;

    return `Search for evidence-based workout programs matching this query: "${query}"

SEARCH CRITERIA:
- Experience Level: ${experienceLevel}
- Goals: ${goals}
- Equipment: ${equipment}
- Duration: ${duration}
- Maximum Results: ${maxResults}

REQUIREMENTS:
1. Find programs from credible sources (certified trainers, researchers, established coaches)
2. Include complete programs, not just individual workouts
3. Prioritize programs with proven track records and scientific backing
4. Look for recent and well-documented programs
5. Include variety in training styles and methodologies

For each program, verify:
- Creator's credentials and reputation
- Program methodology and scientific basis
- Success stories and documented results
- Availability of complete program details
- Suitability for the specified criteria

Focus on finding programs that are:
- Evidence-based and scientifically sound
- Properly structured with clear progression
- Suitable for the target audience
- From reputable sources in the fitness industry
- Currently available and accessible`;
  }

  /**
   * Make API call to Perplexity with comprehensive error handling
   */
  async makeApiCall(payload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error cases
        switch (response.status) {
          case 401:
            throw new Error('Invalid API key. Please check your Perplexity API configuration.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again in a few minutes.');
          case 500:
            throw new Error('Perplexity service temporarily unavailable. Please try again later.');
          default:
            throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Perplexity API');
      }

      return data.choices[0].message.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Parse search results from API response
   */
  parseSearchResults(responseText) {
    try {
      // Look for structured data in the response
      const programs = [];
      const lines = responseText.split('\n');
      let currentProgram = {};

      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('Program Name:') || trimmed.includes('**') && trimmed.includes('Program')) {
          if (Object.keys(currentProgram).length > 0) {
            programs.push(this.validateProgram(currentProgram));
            currentProgram = {};
          }
          currentProgram.name = this.extractValue(trimmed);
        } else if (trimmed.includes('Creator:') || trimmed.includes('Author:')) {
          currentProgram.creator = this.extractValue(trimmed);
        } else if (trimmed.includes('Target Goals:') || trimmed.includes('Goals:')) {
          currentProgram.goals = this.extractValue(trimmed);
        } else if (trimmed.includes('Experience Level:') || trimmed.includes('Level:')) {
          currentProgram.experienceLevel = this.extractValue(trimmed);
        } else if (trimmed.includes('Duration:') || trimmed.includes('Timeline:')) {
          currentProgram.duration = this.extractValue(trimmed);
        } else if (trimmed.includes('Credibility Score:') || trimmed.includes('Score:')) {
          currentProgram.credibilityScore = this.extractNumber(trimmed);
        } else if (trimmed.includes('Key Principles:') || trimmed.includes('Methodology:')) {
          currentProgram.methodology = this.extractValue(trimmed);
        } else if (trimmed.includes('Brief Program Structure:') || trimmed.includes('Structure:')) {
          currentProgram.structure = this.extractValue(trimmed);
        } else if (trimmed.includes('Source:') || trimmed.includes('Reference:')) {
          currentProgram.source = this.extractValue(trimmed);
        }
      }

      // Add the last program if exists
      if (Object.keys(currentProgram).length > 0) {
        programs.push(this.validateProgram(currentProgram));
      }

      // If structured parsing failed, try to extract key information differently
      if (programs.length === 0) {
        return this.fallbackParse(responseText);
      }

      return programs.filter(program => program.credibilityScore >= 7);
    } catch (error) {
      console.error('Error parsing search results:', error);
      return [];
    }
  }

  /**
   * Parse detailed program information
   */
  parseProgramDetails(responseText) {
    try {
      // Try to parse as JSON first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to text parsing
      return this.parseDetailedText(responseText);
    } catch (error) {
      console.error('Error parsing program details:', error);
      return null;
    }
  }

  /**
   * Utility methods
   */
  extractValue(line) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      return line.substring(colonIndex + 1).trim().replace(/^\*+/, '').trim();
    }
    return line.replace(/^\*+/, '').trim();
  }

  extractNumber(line) {
    const match = line.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  validateProgram(program) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: program.name || 'Unknown Program',
      creator: program.creator || 'Unknown Creator',
      goals: program.goals || 'General Fitness',
      experienceLevel: program.experienceLevel || 'Beginner',
      duration: program.duration || 'Variable',
      credibilityScore: program.credibilityScore || 5,
      methodology: program.methodology || 'Not specified',
      structure: program.structure || 'Not specified',
      source: program.source || 'Not specified',
      searchedAt: new Date().toISOString()
    };
  }

  fallbackParse(text) {
    // Simple fallback parsing for unstructured responses
    const programs = [];
    const sections = text.split(/\n\s*\n/);

    for (const section of sections) {
      if (section.trim().length > 50) { // Minimum content threshold
        const lines = section.split('\n');
        const program = {
          name: lines[0]?.trim() || 'Unknown Program',
          creator: 'Various',
          goals: 'General Fitness',
          experienceLevel: 'All Levels',
          duration: 'Variable',
          credibilityScore: 7,
          methodology: section.trim(),
          structure: 'See methodology',
          source: 'Perplexity Search'
        };
        programs.push(this.validateProgram(program));
      }
    }

    return programs.slice(0, 5); // Limit to 5 results
  }

  parseDetailedText(text) {
    // Fallback text parsing for program details
    return {
      programName: 'Program Details',
      creator: 'Various',
      credibilityScore: 7,
      summary: text.substring(0, 500) + '...',
      targetGoals: ['General Fitness'],
      experienceLevel: 'All Levels',
      duration: 'Variable',
      weeklyStructure: {
        daysPerWeek: 3,
        schedule: ['Monday', 'Wednesday', 'Friday']
      },
      exercises: [],
      progression: 'Progressive overload',
      principles: ['Consistency', 'Progressive Overload'],
      equipment: ['Basic Gym Equipment'],
      modifications: {
        beginner: 'Start with lighter weights',
        advanced: 'Increase intensity and volume'
      }
    };
  }
}

export default new PerplexitySearchService();