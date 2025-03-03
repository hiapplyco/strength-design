
export async function uploadVideoToGemini(videoUrl: string, apiKey: string) {
  try {
    console.log('Downloading video from URL:', videoUrl);
    
    // Download the video from the provided URL
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
    
    console.log('Video downloaded successfully, size:', videoBuffer.byteLength, 'bytes');
    
    // Prepare for upload to Gemini API
    const formData = new FormData();
    formData.append('file', videoBlob, 'video.mp4');
    
    const metadata = JSON.stringify({
      display_name: 'jiu_jitsu_analysis.mp4'
    });
    
    // Upload to Gemini API using the correct upload endpoint and format
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    
    console.log('Uploading video to Gemini API...');
    const uploadResult = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Goog-Upload-Protocol': 'multipart'
      }
    });

    if (!uploadResult.ok) {
      const errorText = await uploadResult.text();
      throw new Error(`Failed to upload video to Gemini: ${uploadResult.status} ${uploadResult.statusText} - ${errorText}`);
    }

    const uploadResponse = await uploadResult.json();
    console.log('Video upload response:', JSON.stringify(uploadResponse));
    return uploadResponse;
  } catch (error) {
    console.error('Error uploading video to Gemini:', error);
    throw error;
  }
}

export async function analyzeVideoWithGemini(fileUri: string, mimeType: string, prompt: string, apiKey: string) {
  try {
    console.log('Analyzing video with Gemini, URI:', fileUri);
    console.log('Using mime type:', mimeType);
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: fileUri,
                mimeType: mimeType
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };

    const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    console.log('Sending analysis request to Gemini...');
    const analysisResult = await fetch(analysisUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!analysisResult.ok) {
      const errorText = await analysisResult.text();
      throw new Error(`Failed to analyze video with Gemini: ${analysisResult.status} ${analysisResult.statusText} - ${errorText}`);
    }

    const response = await analysisResult.json();
    console.log('Analysis response received:', JSON.stringify(response));
    
    if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing video with Gemini:', error);
    throw error;
  }
}
