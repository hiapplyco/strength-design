const functions = require('firebase-functions');

// PRODUCTION: Search for workout programs using Perplexity API
exports.searchPrograms = functions.https.onCall(async (data, context) => {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || functions.config().perplexity?.api_key;
  const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
  
  try {
    const { query, searchType = 'general', focus = [], difficulty, duration, equipment = [] } = data;
    
    if (!query || typeof query !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Query is required');
    }

    // Check if Perplexity API key is configured
    if (!PERPLEXITY_API_KEY) {
      console.error('Perplexity API key not configured');
      // Return mock data if API key is not available
      return getMockProgramData(query);
    }

    // Build the search prompt for Perplexity
    const searchPrompt = buildProgramSearchPrompt(query, { searchType, focus, difficulty, duration, equipment });
    
    // Call Perplexity API with node-fetch v2
    const fetch = require('node-fetch');
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a fitness research expert specializing in evidence-based workout programs. Search for and analyze professional workout programs from credible sources. Focus on programs from certified trainers, published athletes, academic research, and established fitness organizations. For each program found, provide: Program Name, Creator/Author with credentials, Target Goals, Experience Level, Duration, Key Principles, and Source/Reference.`
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Perplexity API error:', response.status, errorData);
      
      // Fall back to mock data on API error
      if (response.status === 401) {
        console.error('Invalid Perplexity API key');
      } else if (response.status === 429) {
        console.error('Perplexity rate limit exceeded');
      }
      
      return getMockProgramData(query);
    }

    const apiData = await response.json();
    const content = apiData.choices?.[0]?.message?.content || '';
    
    // Parse the response into structured program data
    const programs = parseProgramResponse(content, query);
    
    return {
      programs: programs.slice(0, 8),
      summary: `Found ${programs.length} evidence-based programs for "${query}"`,
      relatedQueries: generateRelatedQueries(query),
      searchTime: new Date().toISOString(),
      source: 'perplexity'
    };
    
  } catch (error) {
    console.error('Search programs error:', error);
    // Return mock data on error
    return getMockProgramData(data.query || 'workout');
  }
});

// Helper function to build search prompt
function buildProgramSearchPrompt(query, options) {
  const { searchType, focus, difficulty, duration, equipment } = options;
  
  let prompt = `Search for evidence-based workout programs matching: "${query}"`;
  
  if (difficulty) prompt += `\nExperience Level: ${difficulty}`;
  if (focus && focus.length > 0) prompt += `\nFocus Areas: ${focus.join(', ')}`;
  if (duration) prompt += `\nProgram Duration: ${duration}`;
  if (equipment && equipment.length > 0) prompt += `\nEquipment: ${equipment.join(', ')}`;
  
  prompt += `\n\nFind complete, structured programs with clear progression and methodology. Include programs from credible sources with proven track records. Provide detailed information about each program including creator credentials, structure, and scientific backing.`;
  
  return prompt;
}

// Helper function to parse Perplexity response
function parseProgramResponse(content, query) {
  const programs = [];
  
  try {
    // Split content into sections (programs are usually separated by line breaks or numbers)
    const sections = content.split(/\n\n|\d+\./);
    
    sections.forEach(section => {
      if (section.trim().length > 50) {
        const program = extractProgramInfo(section);
        if (program.name && program.name !== 'Unknown Program') {
          programs.push(program);
        }
      }
    });
    
    // If parsing fails, create a basic program from the content
    if (programs.length === 0 && content.length > 100) {
      programs.push({
        name: `${query} Program`,
        description: content.substring(0, 200) + '...',
        difficulty: 'intermediate',
        duration: '8-12 weeks',
        focus: ['general fitness'],
        equipment: ['gym equipment'],
        overview: content,
        structure: 'See program details',
        benefits: ['Evidence-based approach'],
        source: 'Perplexity Search',
        popularity: 3
      });
    }
  } catch (error) {
    console.error('Error parsing program response:', error);
  }
  
  return programs;
}

// Helper to extract program information from text
function extractProgramInfo(text) {
  const program = {
    name: extractField(text, ['Program Name:', 'Name:', 'Program:']) || 'Fitness Program',
    description: extractField(text, ['Description:', 'Overview:', 'About:']) || text.substring(0, 150),
    difficulty: extractField(text, ['Level:', 'Experience:', 'Difficulty:']) || 'intermediate',
    duration: extractField(text, ['Duration:', 'Timeline:', 'Length:']) || '8-12 weeks',
    focus: extractList(text, ['Goals:', 'Focus:', 'Targets:']) || ['general fitness'],
    equipment: extractList(text, ['Equipment:', 'Required:', 'Needs:']) || ['gym equipment'],
    creator: extractField(text, ['Creator:', 'Author:', 'By:']) || 'Various',
    source: extractField(text, ['Source:', 'Reference:', 'From:']) || 'Research',
    structure: extractField(text, ['Structure:', 'Schedule:', 'Split:']) || '3-4 days per week',
    benefits: extractList(text, ['Benefits:', 'Advantages:', 'Pros:']) || ['Structured progression'],
    popularity: 4
  };
  
  program.overview = text.substring(0, 500);
  
  return program;
}

// Extract a field value from text
function extractField(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

// Extract a list from text
function extractList(text, patterns) {
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1].split(/[,;]/).map(item => item.trim()).filter(Boolean);
    }
  }
  return null;
}

// Generate related search queries
function generateRelatedQueries(query) {
  const base = ['strength training', 'muscle building', 'beginner workouts', 'home workouts', 'HIIT programs'];
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('strength')) {
    return ['powerlifting programs', '5/3/1 program', 'Starting Strength', 'StrongLifts 5x5', 'linear progression'];
  } else if (queryLower.includes('muscle') || queryLower.includes('hypertrophy')) {
    return ['bodybuilding programs', 'PPL routine', 'upper lower split', 'high volume training', 'German Volume Training'];
  } else if (queryLower.includes('beginner')) {
    return ['starting strength', 'stronglifts', 'full body workout', 'gym basics', 'novice programs'];
  } else if (queryLower.includes('home')) {
    return ['bodyweight training', 'calisthenics', 'minimal equipment', 'resistance bands', 'dumbbell only'];
  }
  
  return base.slice(0, 5);
}

// Mock data fallback when API is unavailable
function getMockProgramData(query) {
  const programs = [
    {
      name: 'Starting Strength',
      description: 'A proven novice barbell training program focused on the basic compound movements.',
      difficulty: 'beginner',
      duration: '3-6 months',
      focus: ['strength', 'muscle building'],
      equipment: ['barbell', 'squat rack', 'bench'],
      overview: 'Starting Strength is the simplest, most effective program for rapid strength gains. Focus on squat, deadlift, bench press, overhead press, and power clean.',
      structure: '3 days per week, alternating A/B workouts',
      benefits: ['Rapid strength gains', 'Simple progression', 'Builds foundation', 'Time efficient'],
      creator: 'Mark Rippetoe',
      source: 'Starting Strength Book',
      popularity: 5
    },
    {
      name: 'Push Pull Legs (PPL)',
      description: 'Popular bodybuilding split that groups exercises by movement pattern.',
      difficulty: 'intermediate',
      duration: 'ongoing',
      focus: ['muscle building', 'hypertrophy'],
      equipment: ['full gym'],
      overview: 'PPL divides workouts into pushing movements (chest, shoulders, triceps), pulling movements (back, biceps), and leg exercises.',
      structure: '3-6 days per week',
      benefits: ['High frequency', 'Balanced development', 'Flexible schedule', 'Great for muscle growth'],
      creator: 'Bodybuilding Community',
      source: 'Various',
      popularity: 5
    },
    {
      name: '5/3/1 Program',
      description: 'Percentage-based strength program with built-in progression and deload weeks.',
      difficulty: 'intermediate',
      duration: '4 week cycles',
      focus: ['strength', 'power'],
      equipment: ['barbell', 'plates'],
      overview: '5/3/1 uses submaximal weights with specific percentages to build strength over time. Each cycle increases training max.',
      structure: '4 days per week',
      benefits: ['Long-term progression', 'Autoregulation', 'Prevents burnout', 'Customizable'],
      creator: 'Jim Wendler',
      source: '5/3/1 Book Series',
      popularity: 5
    },
    {
      name: 'StrongLifts 5x5',
      description: 'Simple 5x5 program focusing on compound movements with progressive overload.',
      difficulty: 'beginner',
      duration: '12+ weeks',
      focus: ['strength', 'muscle building'],
      equipment: ['barbell', 'plates', 'squat rack'],
      overview: 'StrongLifts 5x5 uses two alternating workouts with five sets of five reps for main exercises.',
      structure: '3 days per week (Monday/Wednesday/Friday)',
      benefits: ['Clear progression', 'App support', 'Beginner friendly', 'Time efficient'],
      creator: 'Mehdi Hadim',
      source: 'StrongLifts.com',
      popularity: 5
    },
    {
      name: 'PHUL (Power Hypertrophy Upper Lower)',
      description: 'Four-day program combining power and hypertrophy training.',
      difficulty: 'intermediate',
      duration: '8-16 weeks',
      focus: ['muscle building', 'strength', 'power'],
      equipment: ['full gym'],
      overview: 'PHUL combines power training with hypertrophy training across four training days.',
      structure: '4 days per week - Upper Power, Lower Power, Upper Hypertrophy, Lower Hypertrophy',
      benefits: ['Balanced approach', 'Strength and size', 'Flexible exercise selection'],
      creator: 'Brandon Campbell',
      source: 'PHUL Program Guide',
      popularity: 4
    }
  ];
  
  // Filter programs based on query
  const queryLower = query.toLowerCase();
  const filtered = programs.filter(p => 
    p.name.toLowerCase().includes(queryLower) ||
    p.description.toLowerCase().includes(queryLower) ||
    p.focus.some(f => f.includes(queryLower))
  );
  
  return {
    programs: filtered.length > 0 ? filtered : programs,
    summary: `Showing ${filtered.length > 0 ? filtered.length : programs.length} popular programs (Using cached data - Set Perplexity API key for live search)`,
    relatedQueries: generateRelatedQueries(query),
    searchTime: new Date().toISOString(),
    source: 'cache'
  };
}