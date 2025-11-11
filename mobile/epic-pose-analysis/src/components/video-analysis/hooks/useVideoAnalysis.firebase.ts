import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const useVideoAnalysis = () => {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const functions = getFunctions();

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
      // Fetch the video from the storage URL
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error("Failed to fetch video from storage");
      }
      
      const videoBlob = await videoResponse.blob();
      
      // Convert blob to base64 for Firebase Function
      const reader = new FileReader();
      const base64Video = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(videoBlob);
      });
      
      console.log('Submitting video for analysis, size:', videoBlob.size, 'type:', videoBlob.type);
      
      // Call Firebase Function for video analysis
      const analyzeVideoFunction = httpsCallable(functions, 'analyzeVideo');
      const result = await analyzeVideoFunction({
        videoData: base64Video,
        mimeType: videoBlob.type,
        query: customPrompt || 'Analyze this jiu-jitsu technique'
      });
      
      const data = result.data as any;
      
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