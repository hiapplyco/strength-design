import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { Teleprompter } from "./Teleprompter";
import { useLocation } from "react-router-dom";
import VideoRecorder from "./VideoRecorder";
import { Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

export const VideoAnalysis = () => {
  const location = useLocation();
  const [movement, setMovement] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const [workoutScript, setWorkoutScript] = useState("");
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  const { toast } = useToast();
  const {
    selectedFile,
    isAnalyzing,
    setIsAnalyzing,
    handleFileSelect,
  } = useVideoProcessing();

  useEffect(() => {
    if (location.state?.workoutScript) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = location.state.workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      setWorkoutScript(plainText);
    }
  }, [location.state]);

  const handleAnalyzeVideo = async (videoUrl: string) => {
    try {
      setIsAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl,
          movement: movement || "exercise",
        }
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
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}
    >
      <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 pt-16">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
          
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Record Your Video</h2>
                    <Button
                      variant="secondary"
                      onClick={() => setShowTeleprompter(!showTeleprompter)}
                      className="flex items-center gap-2"
                    >
                      <Tv className="h-4 w-4" />
                      Teleprompter
                    </Button>
                  </div>
                  <VideoRecorder onAnalyzeVideo={handleAnalyzeVideo} />
                </div>

                {showTeleprompter && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Workout Script</h2>
                    <Teleprompter 
                      script={workoutScript || "No workout script available. Please generate a workout first."}
                      onPositionChange={setTeleprompterPosition}
                    />
                  </div>
                )}
              </div>
            </div>

            {analysisResult && (
              <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>
                <div className="text-white whitespace-pre-wrap">
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