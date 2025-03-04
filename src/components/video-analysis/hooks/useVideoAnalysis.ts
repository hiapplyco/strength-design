
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVideoAnalysis = () => {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeVideo = async (videoUrl: string, customPrompt?: string) => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "No video URL provided for analysis.",
        variant: "destructive",
      });
      setError("No video URL provided for analysis.");
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      // First try with the bjj-analyzer endpoint (uses simpler direct upload)
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error("Failed to fetch video from storage");
      }
      
      const videoBlob = await videoResponse.blob();
      
      // Create form data for the video upload
      const formData = new FormData();
      formData.append('video', videoBlob, 'technique.mp4');
      formData.append('query', customPrompt || 'Analyze this jiu-jitsu technique');
      
      console.log('Submitting video for analysis, size:', videoBlob.size, 'type:', videoBlob.type);
      
      // Call the bjj-analyzer function directly
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/bjj-analyzer`, {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type header - browser will set it with boundary for multipart/form-data
          'Authorization': `Bearer ${supabase.supabaseKey}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.analysis) {
        throw new Error("Failed to receive valid analysis response");
      }
      
      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Your jiu-jitsu video has been analyzed successfully!",
      });
      
      return data.analysis;
    } catch (error: any) {
      console.error("Video analysis error:", error);
      const errorMessage = error.message || "Failed to analyze video. Please try again.";
      
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analyzing,
    analysis,
    error,
    analyzeVideo
  };
};
