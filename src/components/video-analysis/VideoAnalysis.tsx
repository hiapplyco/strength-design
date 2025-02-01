import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VideoUpload } from "./VideoUpload";
import { AnalysisForm } from "./AnalysisForm";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";
import { Teleprompter } from "./Teleprompter";
import { useLocation } from "react-router-dom";

export const VideoAnalysis = () => {
  const location = useLocation();
  const [movement, setMovement] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const [workoutScript, setWorkoutScript] = useState("");

  const { toast } = useToast();
  const {
    selectedFile,
    isAnalyzing,
    setIsAnalyzing,
    handleFileSelect,
  } = useVideoProcessing();

  useEffect(() => {
    if (location.state?.workoutScript) {
      // Convert HTML to plain text for the teleprompter
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = location.state.workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      console.log('Setting workout script:', plainText);
      setWorkoutScript(plainText);
    }
  }, [location.state]);

  const handleAnalyzeVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!movement.trim()) {
      toast({
        title: "Movement type required",
        description: "Please specify the type of movement to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log('Starting video analysis...');
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${new Date().toISOString()}-${crypto.randomUUID()}-${selectedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      console.log('Video uploaded successfully');

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Got public URL:', publicUrl);
      
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl: publicUrl,
          movement: movement,
        }
      });

      if (error) {
        throw error;
      }

      console.log('Analysis completed successfully');
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
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Video Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <VideoUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
          
          <AnalysisForm
            movement={movement}
            setMovement={setMovement}
            onAnalyze={handleAnalyzeVideo}
            isAnalyzing={isAnalyzing}
            disabled={!selectedFile}
          />

          {analysisResult && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Analysis Results:</h3>
              <p className="whitespace-pre-wrap">{analysisResult}</p>
            </div>
          )}
        </div>

        {workoutScript && (
          <div className="bg-black/25 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
            <h3 className="text-xl font-semibold mb-4">Workout Script</h3>
            <Teleprompter 
              script={workoutScript}
              onPositionChange={setTeleprompterPosition}
            />
          </div>
        )}
      </div>
    </Card>
  );
};