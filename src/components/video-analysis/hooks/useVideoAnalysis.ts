
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVideoAnalysis = () => {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const analyzeVideo = async (videoUrl: string, customPrompt?: string) => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "No video URL provided for analysis.",
        variant: "destructive",
      });
      return;
    }
    
    setAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl,
          userPrompt: customPrompt
        }
      });

      if (error) {
        throw error;
      }

      if (!data || !data.analysis) {
        throw new Error("Failed to receive analysis response");
      }
      
      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Your jiu-jitsu video has been analyzed successfully!",
      });
      
      return data.analysis;
    } catch (error: any) {
      console.error("Video analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze video. Please try again.",
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
    analyzeVideo
  };
};
