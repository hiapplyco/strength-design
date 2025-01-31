import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VideoUpload } from "./VideoUpload";
import { AnalysisForm } from "./AnalysisForm";
import { useVideoProcessing } from "@/hooks/useVideoProcessing";

export const VideoAnalysis = () => {
  const [movement, setMovement] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();
  const {
    selectedFile,
    isAnalyzing,
    setIsAnalyzing,
    handleFileSelect,
  } = useVideoProcessing();

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
      
      // Upload video to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${new Date().toISOString()}-${crypto.randomUUID()}-${selectedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      console.log('Video uploaded successfully');

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      console.log('Got public URL:', publicUrl);
      
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: {
          videoUrl: publicUrl,
          movement: movement,
        }
      }).catch(error => {
        console.error('Network error:', error);
        throw new Error('Failed to connect to analysis service');
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Analysis service error');
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
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Analysis Results:</h3>
          <p className="whitespace-pre-wrap">{analysisResult}</p>
        </div>
      )}
    </Card>
  );
};