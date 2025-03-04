
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

// Function to upload a video to Gemini API
export async function uploadVideoToGemini(videoUrl: string, apiKey: string) {
  try {
    console.log('Uploading video to Gemini API:', videoUrl)
    
    // Fetch the video blob from Supabase storage
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`)
    }
    
    const videoBlob = await response.blob()
    console.log('Video blob fetched, size:', videoBlob.size, 'type:', videoBlob.type)
    
    // Create form data with the video file
    const formData = new FormData()
    
    // Add file metadata as a JSON string
    const metadata = JSON.stringify({
      displayName: `video_analysis_${Date.now()}.mp4`,
      mimeType: videoBlob.type || 'video/mp4'
    })
    
    // Create the multipart request
    formData.append('metadata', new Blob([metadata], { type: 'application/json' }))
    formData.append('file', videoBlob, 'video.mp4')
    
    // Upload to Gemini's file upload endpoint
    const uploadResponse = await fetch(
      'https://generativelanguage.googleapis.com/upload/v1beta/files',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      }
    )
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      let errorMessage = `Gemini upload failed: HTTP ${uploadResponse.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = `Gemini upload failed: ${errorData?.error?.message || errorData?.message || errorText}`
      } catch (e) {
        errorMessage = `Gemini upload failed: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }
    
    const uploadResult = await uploadResponse.json()
    console.log('Video uploaded successfully to Gemini:', uploadResult)
    
    return uploadResult
  } catch (error: any) {
    console.error('Error uploading video to Gemini:', error?.message || error)
    throw new Error(`Failed to upload video to Gemini: ${error?.message || 'Unknown error'}`)
  }
}

// Function to analyze a video with Gemini
export async function analyzeVideoWithGemini(
  fileUri: string,
  mimeType: string,
  prompt: string,
  apiKey: string
) {
  try {
    console.log('Analyzing video with Gemini using URI:', fileUri)
    
    const analysisResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                },
                {
                  fileData: {
                    fileUri,
                    mimeType
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192
          }
        })
      }
    )
    
    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text()
      let errorMessage = `Gemini analysis failed: HTTP ${analysisResponse.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = `Gemini analysis failed: ${errorData?.error?.message || errorData?.message || errorText}`
      } catch (e) {
        errorMessage = `Gemini analysis failed: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }
    
    const analysisResult = await analysisResponse.json()
    
    if (!analysisResult.candidates || analysisResult.candidates.length === 0) {
      throw new Error('No analysis results returned from Gemini')
    }
    
    const analysisText = analysisResult.candidates[0]?.content?.parts[0]?.text || ''
    
    console.log('Video analysis completed successfully')
    return analysisText
  } catch (error: any) {
    console.error('Error analyzing video with Gemini:', error?.message || error)
    throw new Error(`Failed to analyze video: ${error?.message || 'Unknown error'}`)
  }
}
