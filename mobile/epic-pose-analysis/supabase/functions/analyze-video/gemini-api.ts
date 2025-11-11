
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
    
    if (videoBlob.size === 0) {
      throw new Error('Video blob is empty')
    }
    
    // Create proper metadata for the file upload
    const metadata = {
      displayName: `video_analysis_${Date.now()}.mp4`,
      mimeType: videoBlob.type || 'video/mp4'
    }
    
    // Log the request details for debugging
    console.log('Preparing upload with metadata:', JSON.stringify(metadata))
    
    // Use URLSearchParams for proper multipart form data handling
    const formData = new FormData()
    
    // Add the file data
    formData.append('file', videoBlob, 'video.mp4')
    
    // Add metadata as a separate part with the correct content type
    formData.append(
      'metadata', 
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    )
    
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
    
    const responseText = await uploadResponse.text()
    
    if (!uploadResponse.ok) {
      let errorMessage = `Gemini upload failed: HTTP ${uploadResponse.status}`
      
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = `Gemini upload failed: ${errorData?.error?.message || errorData?.message || responseText}`
      } catch (e) {
        errorMessage = `Gemini upload failed: ${responseText}`
      }
      
      console.error('Upload error details:', errorMessage)
      throw new Error(errorMessage)
    }
    
    const uploadResult = JSON.parse(responseText)
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
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
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
    
    const responseText = await analysisResponse.text()
    
    if (!analysisResponse.ok) {
      let errorMessage = `Gemini analysis failed: HTTP ${analysisResponse.status}`
      
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = `Gemini analysis failed: ${errorData?.error?.message || errorData?.message || responseText}`
      } catch (e) {
        errorMessage = `Gemini analysis failed: ${responseText}`
      }
      
      throw new Error(errorMessage)
    }
    
    const analysisResult = JSON.parse(responseText)
    
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
