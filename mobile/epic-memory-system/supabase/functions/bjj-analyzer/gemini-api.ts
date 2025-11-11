
// Enhanced video analysis with Gemini 2.0 and dynamic system prompts
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

interface AnalysisOptions {
  customFrameRate?: number;
  startOffset?: string;
  endOffset?: string;
  systemPrompt?: string;
  useTimestamps?: boolean;
}

export async function analyzeVideoWithGemini(
  videoBlob: Blob, 
  query: string, 
  apiKey: string,
  options: AnalysisOptions = {}
) {
  try {
    console.log('Starting enhanced video analysis with Gemini 2.0')
    
    // Initialize the Google Generative AI client with Gemini 2.0
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flashflash-exp' })
    
    // Convert video blob to base64 for inline data approach
    const arrayBuffer = await videoBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const base64String = btoa(String.fromCharCode(...uint8Array))
    
    console.log(`Processing video (size: ${videoBlob.size} bytes, type: ${videoBlob.type})`)
    
    // Prepare video metadata for enhanced processing
    const videoMetadata: any = {}
    
    if (options.customFrameRate) {
      videoMetadata.fps = options.customFrameRate
      console.log(`Using custom frame rate: ${options.customFrameRate} FPS`)
    }
    
    if (options.startOffset || options.endOffset) {
      if (options.startOffset) videoMetadata.start_offset = options.startOffset
      if (options.endOffset) videoMetadata.end_offset = options.endOffset
      console.log(`Video clipping: ${options.startOffset || '0'} to ${options.endOffset || 'end'}`)
    }
    
    // Dynamic system prompt - default to technique analysis if none provided
    const systemPrompt = options.systemPrompt || `You are Professor Garcia, an expert athletic technique coach with extensive experience in movement analysis and biomechanics. You specialize in providing detailed technical feedback that helps athletes improve their performance through precise, actionable insights.

Your analysis should be structured, professional, and focused on practical improvement. Always consider the athlete's safety, technique progression, and long-term development.`

    // Enhanced analysis prompt with timestamp capabilities
    const timestampInstructions = options.useTimestamps 
      ? "\n\nIMPORTANT: Use specific timestamps (MM:SS format) when referencing moments in the video. For example: 'At 0:15, notice how...', 'Between 1:30-1:45, the movement shows...'"
      : ""

    const analysisPrompt = `${systemPrompt}

Analyze this video and address the following question: ${query}

Please provide a comprehensive analysis with the following structure:

## SKILL ASSESSMENT
Categorize the practitioner's level (beginner, intermediate, advanced, elite) based on movement quality, technical precision, and understanding of fundamentals.

## KEY STRENGTHS (2-3 points)
• Identify technically sound elements
• Explain why these demonstrate good technique
• Note timing and execution quality

## CRITICAL IMPROVEMENTS (2-3 points)
• Pinpoint the highest-leverage technical corrections needed
• Explain the biomechanical principles involved
• Describe potential performance consequences if not addressed

## SPECIFIC DRILLS & PROGRESSIONS
• Prescribe 1-2 targeted exercises that address identified weaknesses
• Explain the correct sensation/feeling to develop
• Provide progression steps for skill development

## COACHING INSIGHT
One key conceptual understanding that would elevate their performance significantly.

## ACTIONABLE TAKEAWAY
A memorable principle or cue they should focus on in their next training session.

Keep your analysis under 500 words while being specific and actionable. Focus on the most impactful improvements.${timestampInstructions}`

    console.log('Sending video to Gemini 2.0 for analysis')
    
    // Enhanced generation configuration for video analysis
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: analysisPrompt },
            {
              inlineData: {
                mimeType: videoBlob.type,
                data: base64String
              }
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 3072,
        temperature: 0.3, // Lower temperature for more consistent technical analysis
        topP: 0.9,
        topK: 40,
        candidateCount: 1
      },
    })

    const response = result.response
    const analysisText = response.text()
    
    console.log('Enhanced video analysis completed successfully')
    console.log(`Analysis length: ${analysisText.length} characters`)
    
    return analysisText
  } catch (error) {
    console.error('Error in enhanced Gemini video analysis:', error)
    
    // Enhanced error handling with specific guidance
    if (error.message?.includes('INVALID_ARGUMENT')) {
      throw new Error('Video format not supported. Please use MP4, MOV, or AVI format with standard encoding.')
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Video is too large or complex. Try reducing file size or video length (max recommended: 5 minutes).')
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('API access denied. Please check your Google API key permissions for Gemini models.')
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded. Please check your usage limits or try again later.')
    } else {
      throw new Error(`Video analysis failed: ${error.message}`)
    }
  }
}

// Helper function to create system prompts for different analysis types
export function createSystemPrompt(analysisType: string): string {
  const prompts = {
    'technique': `You are Professor Garcia, an expert athletic technique coach with extensive experience in movement analysis and biomechanics. You specialize in providing detailed technical feedback that helps athletes improve their performance through precise, actionable insights.`,
    
    'form': `You are Dr. Movement, a biomechanics expert who focuses on optimal movement patterns and injury prevention. Your analysis emphasizes proper form, alignment, and efficient movement mechanics.`,
    
    'performance': `You are Coach Elite, a high-performance sports analyst who evaluates athletes for competitive improvement. You focus on power, speed, timing, and tactical execution elements that impact performance outcomes.`,
    
    'beginner': `You are Coach Mentor, specializing in teaching fundamental movement patterns to new athletes. Your feedback is encouraging, patient, and focuses on building solid foundational skills step by step.`,
    
    'injury-prevention': `You are Dr. Safety, a sports medicine specialist focused on identifying movement patterns that could lead to injury. Your analysis prioritizes safe movement mechanics and long-term athletic health.`
  }
  
  return prompts[analysisType] || prompts['technique']
}
