import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanText = (text: string): string => {
  return text
    .replace(/[^\w\s.,!?;:()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(\d+)x/g, '$1 times')
    .replace(/(\d+)m/g, '$1 meters')
    .replace(/(\d+)s/g, '$1 seconds')
    .replace(/(\d+)min/g, '$1 minutes')
    .replace(/@/g, 'at')
    .replace(/%/g, 'percent')
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/=/g, 'equals')
    .trim();
};

const generateWithGemini = async (prompt: string) => {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    console.log('Starting Gemini generation with prompt:', prompt);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(prompt);
    console.log('Successfully received Gemini response');
    return result.response.text();
  } catch (error) {
    console.error('Error in generateWithGemini:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
};

const createExpertCoachPrompt = (expertise: string) => `
You are a world-renowned coach and movement specialist with over 25 years of experience in athletic development, movement optimization, and performance enhancement. Your expertise spans across multiple domains including:
- Olympic weightlifting and powerlifting
- Gymnastics and calisthenics
- Sport-specific conditioning
- Rehabilitation and injury prevention
- Movement screening and assessment
- Periodization and program design
- Mental performance coaching

Based on your extensive expertise, create a comprehensive weekly progression plan for someone wanting to master ${expertise}. Your program should reflect your deep understanding of skill acquisition and development, incorporating:

MOVEMENT ANALYSIS:
- Detailed breakdown of fundamental movement patterns specific to ${expertise}
- Identification of mobility requirements and restrictions
- Progressive complexity in movement combinations
- Technical prerequisites for advanced skills

PHYSICAL PREPARATION:
- Sport-specific warmup protocols
- Mobility and flexibility requirements
- Strength foundation development
- Power and speed development where applicable
- Energy system development tailored to ${expertise}

PROGRAMMING CONSIDERATIONS:
- Volume and intensity management
- Recovery and adaptation requirements
- Progressive overload strategies
- Deload and testing protocols
- Injury prevention measures

SKILL DEVELOPMENT:
- Movement pattern progressions
- Technical drill sequences
- Skill transfer exercises
- Common technical errors and corrections
- Success metrics and progression criteria

For each training day, provide:

1. STRATEGIC OVERVIEW:
   - Day's specific focus within weekly progression
   - Connection to overall skill development
   - Expected adaptation and progress markers
   - Integration with previous/future sessions

2. DETAILED WARMUP PROTOCOL:
   - Movement preparation sequence
   - Mobility/stability work specific to ${expertise}
   - Progressive intensity building
   - Skill-specific activation drills
   - Neural preparation elements

3. MAIN WORKOUT (WOD):
   - Clear movement standards and technique requirements
   - Loading parameters with scientific rationale
   - Work-to-rest ratios based on energy system demands
   - Intensity guidelines with RPE recommendations
   - Progression and regression options
   - Time domains with physiological justification

4. COMPREHENSIVE COACHING NOTES:
   - Technical execution priorities
   - Common faults and correction strategies
   - Performance metrics and success indicators
   - Recovery considerations and management
   - Mental preparation strategies
   - Long-term progression markers
   - Safety considerations and contraindications

5. STRENGTH DEVELOPMENT FOCUS:
   - Primary movement patterns
   - Loading schemes with scientific backing
   - Tempo and execution guidelines
   - Accessory work recommendations
   - Specific weakness addressing strategies
   - Integration with skill work

Return the response in this exact JSON format:

{
  "Sunday": {
    "description": "Active recovery and mobility focus to promote tissue repair and movement quality",
    "warmup": "Detailed mobility routine",
    "wod": "Recovery-focused movement practice",
    "notes": "Specific mobility and recovery guidelines",
    "strength": "Movement quality focus"
  },
  "Monday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Tuesday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Wednesday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Thursday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Friday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  },
  "Saturday": {
    "description": "string",
    "warmup": "string",
    "wod": "string",
    "notes": "string",
    "strength": "string"
  }
}

Ensure your response demonstrates your deep expertise in ${expertise} while maintaining sound training principles and scientific methodology.`;

const cleanJsonText = (text: string): string => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }
  
  let cleaned = jsonMatch[0];
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\\n/g, ' ');
  cleaned = cleaned.replace(/\n/g, ' ');
  return cleaned;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    const { prompt } = await req.json();
    console.log('Received prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid or missing prompt in request body');
    }

    const expertPrompt = createExpertCoachPrompt(prompt);
    console.log('Generated expert prompt:', expertPrompt);

    const textResponse = await generateWithGemini(expertPrompt);
    console.log('Processing Gemini response');

    try {
      const cleanedText = cleanJsonText(textResponse);
      console.log('Cleaned JSON text:', cleanedText);

      const workouts = JSON.parse(cleanedText);

      const requiredDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const requiredFields = ['description', 'strength', 'warmup', 'wod', 'notes'];

      const isValid = requiredDays.every(day => 
        workouts[day] && requiredFields.every(field => 
          typeof workouts[day][field] === 'string' && workouts[day][field].length > 0
        )
      );

      if (!isValid) {
        console.error('Invalid workout structure:', workouts);
        throw new Error('Generated JSON is missing required days or fields');
      }

      return new Response(JSON.stringify(workouts), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      console.error('Raw text response:', textResponse);
      throw new Error(`Invalid JSON structure: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-weekly-workouts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate or parse workouts'
      }), {
        status: error.message === 'Method not allowed' ? 405 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
