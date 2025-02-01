import { VideoAnalysis as VideoAnalysisComponent } from "@/components/video-analysis/VideoAnalysis";
import VideoRecorder from "@/components/video-analysis/VideoRecorder";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VideoAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyzeVideo = async (videoUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl,
          movement: "exercise", // You might want to make this configurable
        }
      });

      if (error) {
        throw error;
      }

      setAnalysisResult(data.result);
      toast({
        title: "Analysis Complete",
        description: "Your video has been successfully analyzed",
      });
    } catch (error) {
      console.error('Error analyzing video:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed pt-24"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}
    >
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
          <div className="max-w-4xl mx-auto space-y-8">
            <VideoRecorder onAnalyzeVideo={handleAnalyzeVideo} />
            
            {analysisResult && (
              <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
                <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
                <div className="text-gray-200 whitespace-pre-wrap">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;