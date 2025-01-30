import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function VideoAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    processedVideo?: string;
    analytics?: any;
    videoUrl?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a video smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('video', file);

      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: formData,
      });

      if (error) throw error;

      setAnalysisResult(data.result);
      toast({
        title: "Analysis Complete",
        description: "Your video has been successfully analyzed",
      });
    } catch (error) {
      console.error('Error analyzing video:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-black/90 border-2 border-destructive rounded-xl backdrop-blur-sm">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Video Analysis</h3>
        <p className="text-gray-300">
          Upload your workout video for AI-powered form analysis
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            disabled={isAnalyzing}
            className="cursor-pointer text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-destructive file:text-white hover:file:bg-destructive/90"
          />
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {analysisResult && (
          <div className="mt-6 space-y-4">
            {analysisResult.processedVideo && (
              <div className="rounded-lg overflow-hidden">
                <video 
                  src={analysisResult.processedVideo} 
                  controls 
                  className="w-full"
                  poster={analysisResult.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {analysisResult.analytics && (
              <div className="p-4 bg-white/10 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">Analysis Results:</h4>
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(analysisResult.analytics, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}