
// Gemini API integration for BJJ video analysis
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

export async function analyzeVideoWithGemini(videoBlob: Blob, query: string, apiKey: string) {
  try {
    console.log('Starting video analysis with Gemini API')
    
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    // Convert video blob to base64
    const arrayBuffer = await videoBlob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Proper base64 conversion - critical for Gemini to accept the video
    const base64String = btoa(String.fromCharCode(...uint8Array))
    console.log(`Converted video to base64 string (length: ${base64String.length})`)
    
    // Create the analysis prompt
    const analysisPrompt = `You are Professor Garcia, an IBJJF Hall of Fame BJJ coach with extensive competition and teaching experience. Analyze this BJJ video and address: ${query}

    First, determine the practitioner's skill level (beginner, intermediate, advanced, elite) based on movement fluidity, technical precision, and conceptual understanding.

    Structure your analysis as follows:

    ## SKILL ASSESSMENT
    Categorize the practitioner's level with specific observations of their technical execution. Example: "Intermediate: Shows understanding of basic mechanics but struggles with weight distribution during transitions."

    ## KEY STRENGTHS (2-3)
    • Identify technically sound elements with timestamps
    • Explain why these elements demonstrate good Jiu-Jitsu

    ## CRITICAL IMPROVEMENTS (2-3)
    • Pinpoint the highest-leverage technical corrections needed with timestamps
    • Explain the biomechanical principles being violated
    • Note potential consequences in live rolling scenarios

    ## SPECIFIC DRILLS (1-2)
    • Prescribe targeted exercises that address the identified weaknesses
    • Explain the correct feeling/sensation to aim for when practicing

    ## COACHING INSIGHT
    One key conceptual understanding that would elevate their game

    ## STUDENT TAKEAWAY
    A memorable principle they should internalize (think: "Position before submission")

    Use precise BJJ terminology while remaining accessible. Balance encouragement with honest technical assessment. Keep your analysis under 400 words total.`

    console.log('Sending video to Gemini API for analysis')
    
    // Generate analysis with proper configuration
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
        maxOutputTokens: 2048,
        temperature: 0.4,
        topP: 0.95,
        topK: 40
      },
    })

    const response = result.response
    console.log('Analysis completed successfully')
    return response.text()
  } catch (error) {
    console.error('Error in Gemini video analysis:', error)
    
    // Provide more specific error messages based on known failure patterns
    if (error.message?.includes('invalid argument')) {
      throw new Error('Video format not supported by Gemini API. Please try a different format or encoding.')
    } else if (error.message?.includes('exceeds the limit')) {
      throw new Error('Video file is too large or complex for the Gemini API.')
    } else {
      throw new Error(`Gemini analysis failed: ${error.message}`)
    }
  }
}
