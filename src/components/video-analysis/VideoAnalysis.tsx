import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function VideoAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [movement, setMovement] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis?: string;
    videoUrl?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
  };

  const handleAnalyzeVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "No video selected",
        description: "Please select a video to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!movement.trim()) {
      toast({
        title: "Movement type required",
        description: "Please specify the movement you want to analyze",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Convert file to base64
      const fileReader = new FileReader();
      fileReader.readAsDataURL(selectedFile);
      
      fileReader.onload = async () => {
        const base64Data = fileReader.result as string;
        
        const { data, error } = await supabase.functions.invoke('analyze-video', {
          body: {
            video: base64Data,
            movement: movement,
            fileName: selectedFile.name,
            fileType: selectedFile.type
          }
        });

        if (error) throw error;

        setAnalysisResult(data.result);
        toast({
          title: "Analysis Complete",
          description: "Your video has been successfully analyzed",
        });
      };

      fileReader.onerror = (error) => {
        throw new Error('Error reading file');
      };

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
        <div className="space-y-2">
          <Label htmlFor="movement" className="text-white">Movement to Analyze</Label>
          <Input
            id="movement"
            placeholder="e.g., barbell back squat, tennis serve, jiu-jitsu armbar"
            value={movement}
            onChange={(e) => setMovement(e.target.value)}
            className="bg-white/10 text-white placeholder:text-gray-400"
          />
        </div>

        <div className="relative p-6 rounded-lg bg-white/5 min-h-[80px]">
          <Input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={isAnalyzing}
            className="cursor-pointer text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-destructive file:text-white hover:file:bg-destructive/90 border-0 bg-transparent h-auto py-2"
          />
        </div>

        <Button
          onClick={handleAnalyzeVideo}
          disabled={isAnalyzing || !selectedFile}
          className="w-full"
          variant="destructive"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Video...
            </>
          ) : (
            'Analyze Video'
          )}
        </Button>

        {analysisResult && (
          <div className="mt-6 space-y-4">
            {analysisResult.videoUrl && (
              <div className="rounded-lg overflow-hidden">
                <video 
                  src={analysisResult.videoUrl} 
                  controls 
                  className="w-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {analysisResult.analysis && (
              <div className="p-4 bg-white/10 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">Analysis Results:</h4>
                <Textarea
                  value={analysisResult.analysis}
                  readOnly
                  className="min-h-[400px] bg-transparent text-gray-300 border-none resize-none focus-visible:ring-0"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}