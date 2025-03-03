
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
    
    console.log('Video downloaded, size:', videoBuffer.byteLength, 'bytes');
    
    // Prepare for upload to Gemini
    const formData = new FormData();
    formData.append('file', videoBlob, 'video.mp4');

    const uploadHeaders = {
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': videoBuffer.byteLength.toString(),
      'X-Goog-Upload-Header-Content-Type': 'video/mp4',
      'Content-Type': 'application/json'
    };

    const metadata = {
      file: { display_name: 'jiu_jitsu_analysis.mp4' }
    };

    // Upload to Gemini API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const uploadResult = await fetch(uploadUrl, {
      method: 'POST',
      headers: uploadHeaders,
      body: JSON.stringify(metadata) + videoBlob // Append binary data to metadata
    });

    if (!uploadResult.ok) {
      const errorText = await uploadResult.text();
      throw new Error(`Failed to upload video to Gemini: ${uploadResult.status} ${uploadResult.statusText} - ${errorText}`);
    }

    return await uploadResult.json();
  } catch (error) {
    console.error('Error uploading video to Gemini:', error);
    throw error;
  }
}

export async function analyzeVideoWithGemini(fileUri: string, mimeType: string, prompt: string, apiKey: string) {
  try {
    console.log('Analyzing video with Gemini, URI:', fileUri);
    
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
            }
          ]
        },
        {
          role: "user",
          parts: [
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
        maxOutputTokens: 8192,
        responseMimeType: "text/plain"
      }
    };

    const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
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
    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error analyzing video with Gemini:', error);
    throw error;
  }
}
