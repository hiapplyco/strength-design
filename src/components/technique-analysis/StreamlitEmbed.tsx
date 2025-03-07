
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLinkIcon, VideoIcon, MicIcon, ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";

interface StreamlitEmbedProps {
  streamlitUrl: string;
  height?: string;
}

export const StreamlitEmbed = ({ streamlitUrl, height = "600px" }: StreamlitEmbedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [audioAvailable, setAudioAvailable] = useState(false);

  useEffect(() => {
    const checkStreamlitStatus = async () => {
      if (!streamlitUrl) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Simple HEAD request to check if the Streamlit app is accessible
        const response = await fetch(streamlitUrl, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        
        // Since we're using no-cors, we can't actually check status
        // But if this doesn't throw, the app is likely reachable
        setError(null);
      } catch (err: any) {
        console.error("Error connecting to Streamlit:", err);
        setError("Could not connect to the Streamlit application. Please check the URL.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStreamlitStatus();
  }, [streamlitUrl]);

  const handleUploadVideo = () => {
    // Simulate video upload functionality
    toast.info("To upload a video, please use the Streamlit application directly");
    setVideoUploaded(true);
    openStreamlitApp();
  };

  const handleFormAnalysis = () => {
    if (!userQuery.trim()) {
      toast.error("Please enter a question about your technique");
      return;
    }
    
    // Simulate form analysis
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setAnalysisResult(`
## SKILL LEVEL & MOVEMENT EFFICIENCY
Intermediate: Shows understanding of basic movement patterns but some energy leaks are present, especially in core stabilization.

## KEY STRENGTHS
* Good knee alignment throughout the movement
* Strong hip hinge initiation

## AREAS FOR IMPROVEMENT
* Core bracing could be more consistent
* Consider controlling the descent phase more deliberately

## DRILLS & MODIFICATIONS
* Practice with lighter weights focusing on the eccentric (lowering) phase
* Add planks to your warm-up routine to strengthen core engagement

## COACHING CUE
"Imagine pulling the floor apart with your feet to activate glutes and create better stability"

## TRAINING INSIGHT
Improving your core engagement will transfer strength more efficiently and reduce risk of lower back fatigue.
      `);
      
      // Simulate having audio available
      setAudioAvailable(true);
      
      toast.success("Form analysis complete!");
    }, 3000);
  };

  const openStreamlitApp = () => {
    window.open(streamlitUrl, '_blank', 'noopener,noreferrer');
  };

  const playAudioAnalysis = () => {
    toast.info("Audio playback is only available in the Streamlit application");
    openStreamlitApp();
  };

  return (
    <div className="w-full border border-gray-700 rounded-lg overflow-hidden bg-black/30">
      <div className="p-3 bg-black/50 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-white font-medium flex items-center">
          <VideoIcon className="mr-2 h-4 w-4" /> 
          Exercise Form Analyzer
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={openStreamlitApp} 
          className="text-xs"
        >
          Open Analyzer App <ExternalLinkIcon className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      <div className="p-4" style={{ minHeight: height }}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-12 bg-gray-800/50" />
            <Skeleton className="w-full h-40 bg-gray-800/50" />
            <Skeleton className="w-3/4 h-8 bg-gray-800/50" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={openStreamlitApp}>
              Try Opening Directly <ExternalLinkIcon className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-4 text-sm text-gray-400">
              Note: You may need to open the Streamlit application in a separate browser window 
              due to cross-origin restrictions.
            </p>
          </div>
        ) : (
          <div className="text-white">
            {analysisResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium mb-3 text-primary">Form Analysis Results</h4>
                  <div className="whitespace-pre-wrap text-sm prose prose-invert max-w-none">
                    {analysisResult}
                  </div>
                </div>
                
                {audioAvailable && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      onClick={playAudioAnalysis} 
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <MicIcon className="h-4 w-4" />
                      Listen to Analysis
                    </Button>
                  </div>
                )}
                
                <p className="text-sm text-gray-400 mt-4">
                  For the full interactive experience with video upload and audio feedback,
                  please open the Streamlit application using the button above.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center">
                  <VideoIcon className="h-12 w-12 text-gray-500 mb-3" />
                  <h3 className="text-lg font-medium mb-2">Analyze Your Exercise Form</h3>
                  <p className="text-gray-400 mb-4 max-w-md">
                    Upload a video of your exercise form and get AI-powered feedback to improve your technique
                  </p>
                  
                  <Button onClick={handleUploadVideo} className="mb-3">
                    Upload Exercise Video
                  </Button>
                  
                  <p className="text-xs text-gray-500">
                    Supports MP4, MOV, and AVI formats
                  </p>
                </div>
                
                {videoUploaded && (
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-700 rounded-lg bg-black/40">
                      <label className="block text-sm text-white/80 mb-2">
                        What aspect of your exercise form would you like analyzed?
                      </label>
                      <textarea 
                        className="w-full p-3 bg-black/70 border border-gray-700 rounded-md text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        rows={3}
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="e.g., 'Analyze my squat form', 'How's my bicep curl technique?', 'Check my plank form'"
                      />
                      
                      <div className="mt-3 flex justify-end">
                        <Button onClick={handleFormAnalysis} className="gap-1">
                          Analyze My Form <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-black/20 border-t border-gray-800">
        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          <span className="bg-black/30 px-2 py-1 rounded-full">AI-Powered Analysis</span>
          <span className="bg-black/30 px-2 py-1 rounded-full">Voice Feedback</span>
          <span className="bg-black/30 px-2 py-1 rounded-full">Form Correction</span>
          <span className="bg-black/30 px-2 py-1 rounded-full">Training Insights</span>
        </div>
      </div>
    </div>
  );
};
